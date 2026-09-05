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
import type { SlabDesign } from '../slab/slabContent'

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
const CANVAS_W = 1024
const CANVAS_H = 700
const PH = PW * (CANVAS_H / CANVAS_W)
const SCREEN_Y = RAMP_TOP + 0.08 + PH / 2

export function ConsoleHelix({ design, detections }: { design: SlabDesign; detections: string[] }) {
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

  useFrame(() => {
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

    if (now - lastDraw.current < 0.09) return
    lastDraw.current = now
    drawScreen(ctx, design, detections, trail.current, found.current, rx, rz, heading, u)
    tex.needsUpdate = true
  })

  return (
    <group>
      {/* lower half: the work */}
      <mesh geometry={ramp} material={rampMat} />
      <primitive object={rail} />
      <group ref={lift}>
        <Suspense fallback={null}>
          <group scale={0.36}>
            <QuadrupedRobot def={GO2_DEF} folder={asset('/models/go2')} legs={GO2_LEGS} gait={GO2_GAIT} headingOffset={0} scale={1} baseHeight={0.32} pose={pose.current} autoWalk materialFor={go2MaterialFor} flipAxis="z" />
          </group>
        </Suspense>
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

/** The console contents. Drawn to canvas so the type stays crisp at any distance. */
function drawScreen(
  x: CanvasRenderingContext2D,
  design: SlabDesign,
  labels: string[],
  trail: [number, number][],
  found: number[],
  rx: number,
  rz: number,
  heading: number,
  progress: number,
) {
  const W = CANVAS_W
  const Hc = CANVAS_H
  x.fillStyle = '#070c13'
  x.fillRect(0, 0, W, Hc)

  // header
  x.fillStyle = '#0d141d'
  x.fillRect(0, 0, W, 62)
  x.fillStyle = design.accent
  x.font = '700 27px "IBM Plex Mono", ui-monospace, monospace'
  x.fillText('/map · RTAB-MAP SLAM', 24, 40)
  x.fillStyle = '#8892a2'
  x.font = '500 21px "IBM Plex Mono", ui-monospace, monospace'
  x.fillText(`coverage ${(progress * 100).toFixed(0)}%`, W - 232, 40)
  x.fillStyle = 'rgba(120,140,165,0.25)'
  x.fillRect(W - 236, 48, 212, 5)
  x.fillStyle = design.accent
  x.fillRect(W - 236, 48, 212 * progress, 5)

  const PANEL = 300
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (Hc + 62) / 2
  const SC = 560

  // occupancy grid
  x.strokeStyle = 'rgba(90,110,140,0.14)'
  x.lineWidth = 1
  for (let g = 0; g < MW; g += 42) { x.beginPath(); x.moveTo(g, 62); x.lineTo(g, Hc); x.stroke() }
  for (let g = 62; g < Hc; g += 42) { x.beginPath(); x.moveTo(0, g); x.lineTo(MW, g); x.stroke() }

  // walls
  x.strokeStyle = '#d3dce7'
  x.lineWidth = 6
  x.lineCap = 'round'
  for (const [a, b] of design.runs) {
    x.beginPath()
    x.moveTo(MX + a[0] * SC, MY + a[1] * SC)
    x.lineTo(MX + b[0] * SC, MY + b[1] * SC)
    x.stroke()
  }
  x.lineCap = 'butt'

  // travelled trajectory
  x.strokeStyle = design.data
  x.lineWidth = 3
  x.beginPath()
  trail.forEach((q, i) => (i ? x.lineTo(MX + q[0] * SC, MY + q[1] * SC) : x.moveTo(MX + q[0] * SC, MY + q[1] * SC)))
  x.stroke()

  // detections, boxed once found
  design.pins.forEach((pin, i) => {
    const px = MX + pin.p[0] * SC
    const py = MY + pin.p[1] * SC
    const hit = found.includes(i)
    x.strokeStyle = hit ? design.accent : 'rgba(140,155,175,0.3)'
    x.lineWidth = hit ? 3 : 1.5
    x.strokeRect(px - 17, py - 17, 34, 34)
    if (hit) {
      x.fillStyle = design.accent
      x.font = '700 16px "IBM Plex Mono", ui-monospace, monospace'
      x.fillText(String(i + 1), px + 22, py - 20)
    }
  })

  // the robot
  x.fillStyle = '#ffffff'
  x.beginPath()
  x.arc(MX + rx * SC, MY + rz * SC, 10, 0, 7)
  x.fill()
  x.strokeStyle = '#ffffff'
  x.lineWidth = 3
  x.beginPath()
  x.moveTo(MX + rx * SC, MY + rz * SC)
  x.lineTo(MX + rx * SC + Math.cos(heading) * 32, MY + rz * SC + Math.sin(heading) * 32)
  x.stroke()

  // findings panel — fills in as it goes
  x.fillStyle = '#0a1119'
  x.fillRect(MW, 62, PANEL, Hc - 62)
  x.strokeStyle = 'rgba(120,140,165,0.3)'
  x.beginPath(); x.moveTo(MW, 62); x.lineTo(MW, Hc); x.stroke()
  x.fillStyle = '#7f8b9c'
  x.font = '700 18px "IBM Plex Mono", ui-monospace, monospace'
  x.fillText('DETECTED', MW + 22, 100)
  x.font = '500 19px "IBM Plex Mono", ui-monospace, monospace'
  found.forEach((idx, row) => {
    const y = 140 + row * 40
    x.fillStyle = design.accent
    x.fillText(String(idx + 1), MW + 22, y)
    x.fillStyle = '#c6d0dc'
    x.fillText((labels[idx] ?? 'object').slice(0, 18), MW + 52, y)
  })
  if (!found.length) {
    x.fillStyle = 'rgba(140,155,175,0.5)'
    x.fillText('scanning…', MW + 22, 140)
  }
}
