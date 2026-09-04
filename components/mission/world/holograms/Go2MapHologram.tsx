'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Go2Mini } from '../robots/Go2Robot'
import { ACCENT, CYAN, Frustum, GridPlane, LabelPlate, MUTED, WHITE, useHoloClock, useHoloMaterial, useLineObject, type V3 } from './parts'

/** Zones of a small facility (local metres), filled one by one as the exploration "discovers" them. */
const ZONES: { x: number; z: number; w: number; d: number; label: string }[] = [
  { x: -0.4, z: -0.3, w: 0.5, d: 0.5, label: 'zone_1' },
  { x: 0.2, z: -0.3, w: 0.7, d: 0.5, label: 'zone_2' },
  { x: -0.4, z: 0.3, w: 0.5, d: 0.6, label: 'zone_3' },
  { x: 0.2, z: 0.3, w: 0.7, d: 0.6, label: 'zone_4' },
]
const ROUTE: V3[] = [[-0.4, 0.02, -0.3], [0.2, 0.02, -0.3], [0.5, 0.02, 0.0], [0.2, 0.02, 0.3], [-0.4, 0.02, 0.3], [-0.4, 0.02, -0.3]]
const CYCLE = 14
const RAYS = 28

/** Go2 Autonomous Inspection: LiDAR fan, frontier exploration → zone segmentation → per-zone report, on loop. */
export function Go2MapHologram() {
  const t = useHoloClock()
  const fill = useHoloMaterial(ACCENT, 0.35)
  const wallMat = useHoloMaterial(MUTED, 0.9)
  const route = useLineObject(ROUTE, WHITE, 0.6)
  const zoneRefs = useRef<(THREE.Mesh | null)[]>([])
  const labelVis = useRef<boolean[]>([false, false, false, false])
  const frontier = useHoloMaterial(WHITE, 0.9)
  const frontierRefs = useRef<(THREE.Mesh | null)[]>([])
  const robot = useRef<THREE.Group>(null)
  const fan = useLineObject(useMemo(() => Array.from({ length: RAYS * 2 }, () => [0, 0, 0] as V3), []), CYAN, 0.5, 'segments')
  const report = useRef<THREE.Group>(null)
  const walls = useMemo(() => {
    const segs: { x: number; z: number; len: number; rot: number }[] = []
    for (const z of ZONES) {
      segs.push({ x: z.x, z: z.z - z.d / 2, len: z.w, rot: 0 }, { x: z.x, z: z.z + z.d / 2, len: z.w, rot: 0 }, { x: z.x - z.w / 2, z: z.z, len: z.d, rot: Math.PI / 2 }, { x: z.x + z.w / 2, z: z.z, len: z.d, rot: Math.PI / 2 })
    }
    return segs
  }, [])
  const [zoneLabels, setZoneLabels] = useMemo(() => [ZONES.map(() => false), (v: boolean[]) => { labelVis.current = v }], [])

  useFrame(() => {
    const phase = (t.current % CYCLE) / CYCLE
    const discovered = phase * (ZONES.length + 1)
    zoneRefs.current.forEach((m, i) => {
      if (!m) return
      const k = THREE.MathUtils.clamp(discovered - i, 0, 1)
      m.visible = k > 0
      m.scale.set(k, 1, k)
    })
    frontierRefs.current.forEach((m, i) => {
      if (!m) return
      m.visible = discovered > i && discovered < i + 1.2
      m.scale.setScalar(0.8 + Math.sin(t.current * 8 + i) * 0.25)
    })
    const n = Math.floor(THREE.MathUtils.clamp(discovered / ZONES.length, 0, 1) * ROUTE.length) + 1
    route.geometry.setDrawRange(0, n)
    // robot rides the route while exploring; the LiDAR fan sweeps around it
    const u = THREE.MathUtils.clamp(discovered / ZONES.length, 0, 1) * (ROUTE.length - 1)
    const i = Math.min(ROUTE.length - 2, Math.floor(u))
    const k = u - i
    const a = ROUTE[i], b = ROUTE[i + 1]
    const px = a[0] + (b[0] - a[0]) * k, pz = a[2] + (b[2] - a[2]) * k
    if (robot.current) {
      robot.current.position.set(px, 0, pz)
      robot.current.rotation.y = Math.atan2(-(b[2] - a[2]), b[0] - a[0])
    }
    const pos = fan.geometry.attributes.position as THREE.BufferAttribute
    for (let r = 0; r < RAYS; r++) {
      const ang = t.current * 2.2 + (r / RAYS) * Math.PI * 2
      const len = 0.22 + 0.2 * Math.abs(Math.sin(ang * 3 + r))
      pos.setXYZ(r * 2, px, 0.12, pz)
      pos.setXYZ(r * 2 + 1, px + Math.cos(ang) * len, 0.12, pz + Math.sin(ang) * len)
    }
    pos.needsUpdate = true
    if (report.current) report.current.visible = phase > 0.82
    setZoneLabels(ZONES.map((_, zi) => discovered > zi + 0.6))
  })

  return (
    <group>
      <GridPlane w={1.4} h={1.4} step={0.1} opacity={0.18} />
      {walls.map((w, i) => (
        <mesh key={i} position={[w.x, 0.05, w.z]} rotation={[0, w.rot, 0]} material={wallMat}>
          <boxGeometry args={[w.len, 0.1, 0.015]} />
        </mesh>
      ))}
      {ZONES.map((z, i) => (
        <mesh key={i} ref={(m) => { zoneRefs.current[i] = m }} position={[z.x, 0.005, z.z]} rotation-x={-Math.PI / 2} material={fill}>
          <planeGeometry args={[z.w - 0.04, z.d - 0.04]} />
        </mesh>
      ))}
      {ZONES.map((z, i) => (
        <mesh key={`f${i}`} ref={(m) => { frontierRefs.current[i] = m }} position={[z.x + z.w / 2 - 0.02, 0.06, z.z]} material={frontier}>
          <boxGeometry args={[0.03, 0.05, z.d * 0.8]} />
        </mesh>
      ))}
      {ZONES.map((z, i) => (
        <ZoneLabel key={`l${i}`} index={i} zone={z} vis={labelVis} />
      ))}
      <primitive object={route} />
      <primitive object={fan} />
      <group ref={robot}>
        <Go2Mini scale={0.42} />
        <group position={[0.16, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Frustum fov={70} aspect={1.33} far={0.22} color={CYAN} opacity={0.5} />
        </group>
      </group>
      <group ref={report}>
        <LabelPlate text="REPORT · 4 ZONES · 11 OBJECTS" position={[0, 1.15, 0]} width={0.62} color={ACCENT} />
      </group>
      <LabelPlate text="frontier exploration · watershed zones" position={[0, 1.32, 0]} width={0.72} color={MUTED} />
    </group>
  )
}

function ZoneLabel({ index, zone, vis }: { index: number; zone: { x: number; z: number; label: string }; vis: React.MutableRefObject<boolean[]> }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) g.current.visible = vis.current[index]
  })
  return (
    <group ref={g}>
      <LabelPlate text={zone.label} position={[zone.x, 0.2, zone.z]} width={0.2} color={WHITE} size={44} />
    </group>
  )
}
