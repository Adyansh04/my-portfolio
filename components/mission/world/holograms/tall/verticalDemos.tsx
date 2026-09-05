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
import { emissive, lineMat, pointsMat, useClock, useNear, H } from './tallParts'
import type { SlabDesign } from '../data/projects'

/**
 * Four answers to the same geometric problem. The hall camera looks down at 21 degrees, so a
 * horizontal surface is compressed to about a third of its true size — which is why both the slab
 * and a floor-level live scene disappeared. Everything here puts the information on vertical
 * surfaces or in volume, where that foreshortening does not apply.
 */

function Go2({ pose, scale = 0.4 }: { pose: { x: number; z: number; yaw: number }; scale?: number }) {
  return (
    <Suspense fallback={null}>
      <group scale={scale}>
        <QuadrupedRobot def={GO2_DEF} folder={asset('/models/go2')} legs={GO2_LEGS} gait={GO2_GAIT} headingOffset={0} scale={1} baseHeight={0.32} pose={pose} autoWalk materialFor={go2MaterialFor} flipAxis="z" />
      </group>
    </Suspense>
  )
}

/* ------------------------------------------------------- V1 · Cutaway Tower */

/**
 * The facility as a multi-storey cutaway. Buildings are tall by nature, the walls are vertical
 * surfaces the camera sees face-on, and the robot working floor to floor gives the motion real
 * vertical travel instead of sliding around a plan.
 */
export function CutawayTower({ design }: { design: SlabDesign }) {
  const t = useClock()
  const near = useNear()
  const FLOORS = 3
  const GAP = 0.56
  const WALL_H = 0.34
  const S = 1.5
  const pose = useRef({ x: 0, z: 0, yaw: 0 })
  const robotY = useRef<THREE.Group>(null)

  const walls = useMemo(() => {
    // cutaway: drop the runs nearest the camera so the interior is visible
    const keep = design.runs.filter(([a, b]) => (a[1] + b[1]) / 2 < 0.16)
    const geos = keep.map(([a, b]) => {
      const ax = a[0] * S, az = a[1] * S, bx = b[0] * S, bz = b[1] * S
      const len = Math.hypot(bx - ax, bz - az)
      if (len < 1e-4) return null
      const g = new THREE.BoxGeometry(len, WALL_H, 0.018)
      g.rotateY(Math.atan2(-(bz - az), bx - ax))
      g.translate((ax + bx) / 2, WALL_H / 2, (az + bz) / 2)
      return g
    }).filter(Boolean) as THREE.BufferGeometry[]
    return geos.length ? mergeGeometries(geos, false)! : null
  }, [design.runs])

  const deck = useMemo(() => {
    const g = new THREE.BoxGeometry(1.16 * S * 0.72, 0.016, 0.88 * S * 0.72)
    return g
  }, [])
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7c8794', metalness: 0.45, roughness: 0.5 }), [])
  const deckMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#252f3c', metalness: 0.5, roughness: 0.7 }), [])
  const edgeMat = useMemo(() => lineMat(design.accent, 0.85), [design.accent])
  const deckEdges = useMemo(() => new THREE.EdgesGeometry(deck), [deck])
  const colMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4c5665', metalness: 0.9, roughness: 0.3 }), [])
  const floorRefs = useRef<(THREE.Group | null)[]>([])
  const activeMat = useMemo(() => Array.from({ length: FLOORS }, () => lineMat(design.data, 0.3)), [design.data])

  useFrame(() => {
    if (!near()) return
    const now = t.current
    const cycle = 12
    const u = (now % cycle) / cycle
    const floor = Math.min(FLOORS - 1, Math.floor(u * FLOORS))
    const fu = u * FLOORS - floor

    const p = design.path
    const total = p.length
    const s = fu * total
    const i = Math.floor(s) % total
    const k = s - Math.floor(s)
    const a = p[i]
    const b = p[(i + 1) % total]
    pose.current.x = (a[0] + (b[0] - a[0]) * k) * S
    pose.current.z = (a[1] + (b[1] - a[1]) * k) * S
    pose.current.yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0])
    if (robotY.current) robotY.current.position.y = 0.1 + floor * GAP + 0.02

    floorRefs.current.forEach((g, f) => {
      if (!g) return
      activeMat[f].opacity = f === floor ? 0.85 : 0.18
    })
  })

  return (
    <group>
      {Array.from({ length: FLOORS }, (_, f) => (
        <group key={f} ref={(el) => (floorRefs.current[f] = el)} position={[0, 0.1 + f * GAP, 0]}>
          <mesh geometry={deck} material={deckMat} />
          <lineSegments geometry={deckEdges} material={activeMat[f]} />
          {walls && <mesh geometry={walls} material={wallMat} position={[0, 0.01, 0]} />}
        </group>
      ))}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} material={colMat} position={[sx * 0.58, (FLOORS - 1) * GAP / 2 + 0.1, sz * 0.44]}>
          <cylinderGeometry args={[0.016, 0.016, (FLOORS - 1) * GAP + 0.2, 8]} />
        </mesh>
      ))}
      <group ref={robotY}>
        <Go2 pose={pose.current} scale={0.36} />
      </group>
    </group>
  )
}

/* ---------------------------------------------------- V2 · Vertical Scan Volume */

/**
 * The LiDAR reconstruction with the vertical axis exaggerated, so the walls become tall curtains
 * of returns rather than a carpet. A scan plane travels horizontally through the volume, which
 * makes the motion read across the frame instead of into it.
 */
export function ScanVolume({ design }: { design: SlabDesign }) {
  const t = useClock()
  const near = useNear()
  const S = 1.45
  const TALL = 1.5

  const { geometry, base } = useMemo(() => {
    const pts: number[] = []
    const cols: number[] = []
    const c = new THREE.Color()
    for (const [a, b] of design.runs) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.max(10, Math.round(len * 420))
      for (let i = 0; i < n; i++) {
        const u = Math.random()
        const y = Math.pow(Math.random(), 0.8) * TALL
        pts.push((a[0] + (b[0] - a[0]) * u) * S + (Math.random() - 0.5) * 0.012, 0.06 + y, (a[1] + (b[1] - a[1]) * u) * S + (Math.random() - 0.5) * 0.012)
        c.set(design.accent).lerp(new THREE.Color(design.data), y / TALL)
        cols.push(c.r, c.g, c.b)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    const base = new THREE.BufferGeometry().setFromPoints(
      design.path.map((p) => new THREE.Vector3(p[0] * S, 0.07, p[1] * S)),
    )
    return { geometry: g, base }
  }, [design])

  const mat = useMemo(() => {
    const m = pointsMat('#ffffff', 0.026, 0.9)
    m.vertexColors = true
    return m
  }, [])
  const trailMat = useMemo(() => lineMat(design.data, 0.9), [design.data])
  const trail = useMemo(() => (design.closed ? new THREE.LineLoop(base, trailMat) : new THREE.Line(base, trailMat)), [base, trailMat, design.closed])
  const sweep = useRef<THREE.Mesh>(null)
  const sweepMat = useMemo(() => new THREE.MeshBasicMaterial({ color: design.data, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [design.data])

  useFrame(() => {
    if (!near()) return
    const u = (t.current * 0.16) % 1
    if (sweep.current) {
      sweep.current.position.x = -0.8 + u * 1.6
      sweepMat.opacity = 0.1 + 0.24 * Math.sin(Math.PI * u)
    }
  })

  return (
    <group>
      <points geometry={geometry} material={mat} />
      <primitive object={trail} />
      <mesh ref={sweep} material={sweepMat} rotation-y={Math.PI / 2} position={[0, 0.06 + TALL / 2, 0]}>
        <planeGeometry args={[1.5, TALL]} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------ V3 · Operator Console */

/**
 * The map put where a 2D map actually belongs: on an upright screen facing the aisle, drawn live
 * to canvas. This is what an operator genuinely sees, it reads face-on at any distance, and the
 * robot works in front of it so the scene still has depth.
 */
export function OperatorConsole({ design }: { design: SlabDesign }) {
  const t = useClock()
  const near = useNear()
  const S = 1.45
  const W = 1024
  const Hpx = 720
  const pose = useRef({ x: 0, z: 0, yaw: 0 })
  const trail = useRef<[number, number][]>([])

  const { canvas, ctx, tex } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = Hpx
    const ctx = c.getContext('2d')!
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas: c, ctx, tex }
  }, [])
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3f4a58', metalness: 0.85, roughness: 0.35 }), [])
  const last = useRef(0)

  useFrame(() => {
    if (!near()) return
    const now = t.current
    const p = design.path
    const total = p.length
    const s = (now * 0.5) % total
    const i = Math.floor(s)
    const k = s - i
    const a = p[i]
    const b = p[(i + 1) % total]
    const px = a[0] + (b[0] - a[0]) * k
    const pz = a[1] + (b[1] - a[1]) * k
    pose.current.x = px * S
    pose.current.z = pz * S
    pose.current.yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0])
    trail.current.push([px, pz])
    if (trail.current.length > 260) trail.current.shift()

    if (now - last.current < 0.1) return
    last.current = now
    const x = ctx
    x.fillStyle = '#080d14'
    x.fillRect(0, 0, W, Hpx)
    // header
    x.fillStyle = '#0e151f'
    x.fillRect(0, 0, W, 66)
    x.fillStyle = design.accent
    x.font = '700 30px "IBM Plex Mono", monospace'
    x.fillText('/map  ·  RTAB-MAP  ·  BUILDING', 26, 44)
    x.fillStyle = '#7f8b9c'
    x.font = '500 24px "IBM Plex Mono", monospace'
    x.fillText(`${(60 + (now * 4) % 40).toFixed(0)}%`, W - 96, 44)
    // grid
    x.strokeStyle = 'rgba(90,110,140,0.16)'
    x.lineWidth = 1
    for (let g = 0; g < W; g += 48) { x.beginPath(); x.moveTo(g, 66); x.lineTo(g, Hpx); x.stroke() }
    for (let g = 66; g < Hpx; g += 48) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke() }
    const MX = W / 2
    const MY = (Hpx + 66) / 2
    const SC = 620
    // walls
    x.strokeStyle = '#cfd8e3'
    x.lineWidth = 5
    for (const [a2, b2] of design.runs) {
      x.beginPath(); x.moveTo(MX + a2[0] * SC, MY + a2[1] * SC); x.lineTo(MX + b2[0] * SC, MY + b2[1] * SC); x.stroke()
    }
    // trajectory
    x.strokeStyle = design.data
    x.lineWidth = 3
    x.beginPath()
    trail.current.forEach((q, j) => (j ? x.lineTo(MX + q[0] * SC, MY + q[1] * SC) : x.moveTo(MX + q[0] * SC, MY + q[1] * SC)))
    x.stroke()
    // detections
    for (const pin of design.pins) {
      x.strokeStyle = design.accent
      x.lineWidth = 2
      x.strokeRect(MX + pin.p[0] * SC - 16, MY + pin.p[1] * SC - 16, 32, 32)
    }
    // the robot
    x.fillStyle = '#ffffff'
    x.beginPath(); x.arc(MX + px * SC, MY + pz * SC, 11, 0, 7); x.fill()
    x.strokeStyle = '#ffffff'
    x.lineWidth = 2
    x.beginPath(); x.moveTo(MX + px * SC, MY + pz * SC)
    x.lineTo(MX + px * SC + Math.cos(-pose.current.yaw) * 30, MY + pz * SC + Math.sin(-pose.current.yaw) * 30)
    x.stroke()
    tex.needsUpdate = true
  })

  const PW = 1.34
  const PH = PW * (Hpx / W)
  return (
    <group>
      <group position={[0, 0.42 + PH / 2, -0.16]}>
        <mesh material={screenMat}>
          <planeGeometry args={[PW, PH]} />
        </mesh>
        <mesh material={frameMat} position={[0, 0, -0.014]}>
          <boxGeometry args={[PW + 0.05, PH + 0.05, 0.022]} />
        </mesh>
        <mesh material={frameMat} position={[0, -PH / 2 - 0.2, 0.02]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
        </mesh>
      </group>
      <Go2 pose={pose.current} scale={0.34} />
    </group>
  )
}

/* --------------------------------------------------------- V4 · Ascent Helix */

/** The mission as a climb: the robot walks a helical ramp, one turn per zone, markers blooming off it. */
export function AscentHelix({ design }: { design: SlabDesign }) {
  const t = useClock()
  const near = useNear()
  const TURNS = 2.6
  const R = 0.52
  const TOP = H - 0.2
  const pose = useRef({ x: 0, z: 0, yaw: 0 })
  const lift = useRef<THREE.Group>(null)

  const ramp = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const N = 120
    for (let i = 0; i < N; i++) {
      const u = i / N
      const a = u * Math.PI * 2 * TURNS
      const y = 0.06 + u * TOP
      const g = new THREE.BoxGeometry(0.19, 0.014, 0.075)
      g.rotateY(-a)
      g.translate(Math.cos(a) * R, y, Math.sin(a) * R)
      geos.push(g)
    }
    return mergeGeometries(geos, false)!
  }, [])
  const rampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#77828f', metalness: 0.6, roughness: 0.45 }), [])
  const railMat = useMemo(() => lineMat(design.accent, 0.8), [design.accent])
  const rail = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 200; i++) {
      const u = i / 200
      const a = u * Math.PI * 2 * TURNS
      pts.push(new THREE.Vector3(Math.cos(a) * (R + 0.1), 0.1 + u * TOP, Math.sin(a) * (R + 0.1)))
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), railMat)
  }, [railMat])
  const markerMat = useMemo(() => emissive(design.data, 2.2), [design.data])
  const markers = useMemo(
    () =>
      design.pins.slice(0, 5).map((p, i) => {
        const u = (i + 0.5) / 5
        const a = u * Math.PI * 2 * TURNS
        return new THREE.Vector3(Math.cos(a) * (R + 0.2), 0.1 + u * TOP, Math.sin(a) * (R + 0.2))
      }),
    [design.pins],
  )
  const mkRefs = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!near()) return
    const u = (t.current * 0.075) % 1
    const a = u * Math.PI * 2 * TURNS
    pose.current.x = Math.cos(a) * R
    pose.current.z = Math.sin(a) * R
    pose.current.yaw = -a + Math.PI / 2
    if (lift.current) lift.current.position.y = 0.075 + u * TOP
    const m = mkRefs.current
    if (m) {
      markers.forEach((p, i) => {
        tmp.position.copy(p)
        tmp.scale.setScalar(0.7 + 0.5 * Math.abs(Math.sin(t.current * 2 + i)))
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      })
      m.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <mesh geometry={ramp} material={rampMat} />
      <primitive object={rail} />
      <instancedMesh ref={mkRefs} args={[undefined, undefined, markers.length]} material={markerMat}>
        <sphereGeometry args={[0.042, 12, 10]} />
      </instancedMesh>
      <group ref={lift}>
        <Go2 pose={pose.current} scale={0.32} />
      </group>
    </group>
  )
}

export const VERTICAL_DEMOS = [
  { id: 'v1', name: 'Cutaway Tower', blurb: 'The facility as a multi-storey cutaway. Walls are vertical surfaces the camera sees face-on, and the robot works floor to floor.', C: CutawayTower },
  { id: 'v2', name: 'Scan Volume', blurb: 'The LiDAR reconstruction with the vertical axis exaggerated, so walls become tall curtains of returns. A scan plane travels across the frame.', C: ScanVolume },
  { id: 'v3', name: 'Operator Console', blurb: 'The map on an upright screen where a 2D map belongs — face-on, readable at any distance — with the robot working in front of it.', C: OperatorConsole },
  { id: 'v4', name: 'Ascent Helix', blurb: 'The mission as a climb: the robot walks a helical ramp, one turn per zone, markers blooming off it.', C: AscentHelix },
] as const
