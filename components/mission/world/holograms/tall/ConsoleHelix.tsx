'use client'

import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { GO2_DEF, GO2_LEGS } from '@/lib/mission/robots'
import { GO2_GAIT } from '@/lib/mission/gait'
import { asset } from '@/lib/base-path'
import { QuadrupedRobot } from '../../robots/QuadrupedRobot'
import { go2MaterialFor } from '../../robots/robotMaterial'
import { emissive, lineMat, useClock, useNear, H } from './tallParts'
import type { SlabDesign } from '../data/projects'
import { READOUTS, type ReadoutState } from './readouts'

/**
 * V3 + V4 as one object rather than two side by side: the robot works a helical ramp in the lower
 * half, and the console above it shows what that work is producing. They share a parameter — how
 * far the robot has climbed *is* how far along its route it is — so the trail on the screen grows
 * as it climbs and detections are listed the moment it passes them.
 *
 * The split is deliberate. The helix carries the silhouette and the motion, which is what reads at
 * 7.4 m. The console carries the detail, on an upright surface where the camera's downward angle
 * does not crush it.
 *
 * Height is not free: the top of that shot lands at about 3.5 m, so the whole piece has to live
 * between the pedestal top (0.9 m) and roughly 3.4 m. In this component's local units — scaled 1.2
 * by the frame — that is a ceiling of about 2.05, and the console top sits at 1.72.
 */

const TURNS = 2.2
const R = 0.46
const RAMP_TOP = 0.78
const PW = 1.26
const CANVAS_W = 900
const CANVAS_H = 616
const PH = PW * (CANVAS_H / CANVAS_W)
const SCREEN_Y = RAMP_TOP + 0.08 + PH / 2

/**
 * What rides the ramp. Only a few projects have a real model; rather than put a Go2 in a hologram
 * that is not about a Go2, everything else carries a machined sensor puck — honest and consistent.
 */
export type Climber = 'go2' | 'puck'

export function ConsoleHelix({ design, projectKey, climber = 'puck' }: { design: SlabDesign; projectKey: string; climber?: Climber }) {
  const t = useClock()
  const near = useNear()
  const pose = useRef({ x: 0, z: 0, yaw: 0 })
  const lift = useRef<THREE.Group>(null)
  const found = useRef<number[]>([])
  const trail = useRef<[number, number][]>([])

  /* ---------------- the ramp ---------------- */
  const ramp = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const N = 108
    for (let i = 0; i < N; i++) {
      const u = i / N
      const a = u * Math.PI * 2 * TURNS
      const g = new THREE.BoxGeometry(0.2, 0.013, 0.08)
      g.rotateY(-a)
      g.translate(Math.cos(a) * R, 0.05 + u * RAMP_TOP, Math.sin(a) * R)
      geos.push(g)
    }
    return mergeGeometries(geos, false)!
  }, [])
  const rampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8b95a2', metalness: 0.55, roughness: 0.42 }), [])
  const railMat = useMemo(() => lineMat(design.accent, 0.85), [design.accent])
  const railGlow = useMemo(() => lineMat(design.accent, 0.35), [design.accent])
  const rail = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 220; i++) {
      const u = i / 220
      const a = u * Math.PI * 2 * TURNS
      pts.push(new THREE.Vector3(Math.cos(a) * (R + 0.105), 0.088 + u * RAMP_TOP, Math.sin(a) * (R + 0.105)))
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), railMat)
  }, [railMat])

  /* ---------------- mast + struts ---------------- */
  const structure = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const mast = new THREE.CylinderGeometry(0.026, 0.034, SCREEN_Y + PH / 2, 12)
    mast.translate(0, (SCREEN_Y + PH / 2) / 2, 0)
    geos.push(mast)
    for (const sx of [-1, 1]) {
      const s = new THREE.CylinderGeometry(0.009, 0.009, 0.42, 8)
      s.rotateZ(sx * 0.95)
      s.translate(sx * 0.17, SCREEN_Y - PH / 2 + 0.02, 0.02)
      geos.push(s)
    }
    return mergeGeometries(geos, false)!
  }, [])
  const steelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#49535f', metalness: 0.9, roughness: 0.32 }), [])
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3b4551', metalness: 0.85, roughness: 0.36 }), [])

  /* ---------------- the live screen ---------------- */
  const { ctx, tex } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = CANVAS_W
    c.height = CANVAS_H
    const ctx = c.getContext('2d')!
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return { ctx, tex }
  }, [])
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  const bezelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: design.accent, emissive: design.accent, emissiveIntensity: 0.55, roughness: 0.5 }), [design.accent])

  /* ---------------- the data link up the mast ---------------- */
  const beads = useRef<THREE.InstancedMesh>(null)
  const beadMat = useMemo(() => emissive(design.data, 3.2), [design.data])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const lastDraw = useRef(0)
  const worldPos = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    if (!near()) return
    const now = t.current
    const u = (now * 0.055) % 1 // one full climb = one full traversal of the route

    // the robot on the ramp
    const a = u * Math.PI * 2 * TURNS
    pose.current.x = Math.cos(a) * R
    pose.current.z = Math.sin(a) * R
    pose.current.yaw = -a + Math.PI / 2
    if (lift.current) lift.current.position.y = 0.062 + u * RAMP_TOP

    // the same progress, expressed on the route the screen is showing
    const p = design.path
    const s = u * p.length
    const i = Math.floor(s) % p.length
    const k = s - Math.floor(s)
    const pa = p[i]
    const pb = p[(i + 1) % p.length]
    const rx = pa[0] + (pb[0] - pa[0]) * k
    const rz = pa[1] + (pb[1] - pa[1]) * k
    const heading = Math.atan2(pb[1] - pa[1], pb[0] - pa[0])
    if (u < 0.01) {
      trail.current = []
      found.current = []
    }
    trail.current.push([rx, rz])
    if (trail.current.length > 400) trail.current.shift()
    // log a detection the moment the robot gets near it
    design.pins.forEach((pin, pi) => {
      if (found.current.includes(pi)) return
      if (Math.hypot(pin.p[0] - rx, pin.p[1] - rz) < 0.11) found.current.push(pi)
    })

    // beads carrying that reading up the mast to the screen
    const m = beads.current
    if (m) {
      for (let b = 0; b < 4; b++) {
        const bu = (now * 0.5 + b / 4) % 1
        tmp.position.set(0, 0.06 + bu * (SCREEN_Y - PH / 2 - 0.06), 0)
        tmp.scale.setScalar(0.6 + 0.5 * Math.sin(Math.PI * bu))
        tmp.updateMatrix()
        m.setMatrixAt(b, tmp.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }

    // ten of these redrawing a canvas every frame costs real frame time; the far ones barely move
    // on screen, so they can update far less often
    if (lift.current) lift.current.getWorldPosition(worldPos)
    const dist = camera.position.distanceTo(worldPos)
    if (dist > 17) return
    const interval = dist < 9 ? 0.09 : 0.4
    if (now - lastDraw.current < interval) return
    lastDraw.current = now
    const state: ReadoutState = { t: now, u, trail: trail.current, found: found.current, robot: [rx, rz], heading }
    ;(READOUTS[projectKey] ?? READOUTS['go2-inspection'])(ctx, CANVAS_W, CANVAS_H, design, state)
    tex.needsUpdate = true
  })

  return (
    <group>
      {/* lower half: the work */}
      <mesh geometry={ramp} material={rampMat} />
      <primitive object={rail} />
      <group ref={lift}>
        {climber === 'go2' ? (
          <Suspense fallback={null}>
            <group scale={0.36}>
              <QuadrupedRobot def={GO2_DEF} folder={asset('/models/go2')} legs={GO2_LEGS} gait={GO2_GAIT} headingOffset={0} scale={1} baseHeight={0.32} pose={pose.current} autoWalk materialFor={go2MaterialFor} flipAxis="z" />
            </group>
          </Suspense>
        ) : (
          <Puck pose={pose.current} color={design.data} t={t} />
        )}
      </group>

      {/* the link between them */}
      <mesh geometry={structure} material={steelMat} />
      <instancedMesh ref={beads} args={[undefined, undefined, 4]} material={beadMat}>
        <sphereGeometry args={[0.019, 10, 8]} />
      </instancedMesh>

      {/* upper half: the readout, upright and near the camera's eye line */}
      <group position={[0, SCREEN_Y, 0]}>
        <mesh material={screenMat} position={[0, 0, 0.012]}>
          <planeGeometry args={[PW, PH]} />
        </mesh>
        <mesh material={frameMat}>
          <boxGeometry args={[PW + 0.05, PH + 0.05, 0.024]} />
        </mesh>
        {/* a lit edge so the panel reads as a display from across the hall */}
        <mesh material={bezelMat} position={[0, -PH / 2 - 0.018, 0.012]}>
          <boxGeometry args={[PW + 0.05, 0.008, 0.006]} />
        </mesh>
        <mesh material={bezelMat} position={[0, PH / 2 + 0.018, 0.012]}>
          <boxGeometry args={[PW + 0.05, 0.008, 0.006]} />
        </mesh>
      </group>
    </group>
  )
}

/** A machined sensor unit for the projects with no model of their own: a chamfered body, a lit
 *  band, and a scanner ring that spins as it climbs. */
function Puck({ pose, color, t }: { pose: { x: number; z: number; yaw: number }; color: string; t: React.MutableRefObject<number> }) {
  const g = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const shell = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9aa4b1', metalness: 0.75, roughness: 0.35 }), [])
  const band = useMemo(() => emissive(color, 2.4), [color])
  useFrame(() => {
    if (g.current) {
      g.current.position.set(pose.x, 0.03, pose.z)
      g.current.rotation.y = pose.yaw
    }
    if (ring.current) ring.current.rotation.y = t.current * 3
  })
  return (
    <group ref={g}>
      <mesh material={shell}>
        <cylinderGeometry args={[0.055, 0.065, 0.05, 16]} />
      </mesh>
      <mesh material={band} position={[0, 0.032, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 0.014, 16]} />
      </mesh>
      <mesh ref={ring} material={band} position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.07, 0.085, 20, 1, 0, 1.4]} />
      </mesh>
    </group>
  )
}
