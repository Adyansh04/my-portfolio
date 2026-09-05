'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, CYAN, PointField, Tag, heightColor, useLabClock } from './labParts'
import { DETECTIONS, KEYFRAMES, LANDMARKS, PATROL, ROOMS, WALLS } from './subjects'

/**
 * Style 2 — Volumetric Capture. The subject is not modelled, it is *scanned*: tens of thousands of
 * returns coloured by height, with a reconstruction plane sweeping up and the points just under it
 * flaring as they land. This is the same visual language as the facility's own LiDAR reveal, so a
 * project hologram reads as data the robot captured rather than an illustration someone drew.
 */

const CEIL = 0.34

function useSweep(period = 7) {
  const t = useLabClock()
  const reveal = useRef(0)
  const sweeping = useRef(1)
  useFrame(() => {
    const u = (t.current % period) / period
    // sweep up over the first 45%, then hold the finished cloud with the flare switched off
    reveal.current = u < 0.45 ? (u / 0.45) * CEIL : CEIL
    sweeping.current = u < 0.48 ? 1 : 0
  })
  return { reveal, sweeping, t }
}

/** Scatter n points and pack them into the position/colour buffers a PointField wants. */
function build(n: number, gen: (i: number) => [number, number, number, number]) {
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const [x, y, z, tint] = gen(i)
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    const c = heightColor(tint)
    col[i * 3] = c[0]
    col[i * 3 + 1] = c[1]
    col[i * 3 + 2] = c[2]
  }
  return { pos, col }
}

export function Go2PointCloud() {
  const { reveal, sweeping, t } = useSweep()
  const scanY = useRef<THREE.Mesh>(null)

  const cloud = useMemo(() => {
    const pts: [number, number, number, number][] = []
    // walls: dense returns up the full height, denser near corners
    for (const w of WALLS) {
      const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])
      const n = Math.max(8, Math.round(len * 230))
      for (let i = 0; i < n; i++) {
        const u = Math.random()
        const y = Math.pow(Math.random(), 0.85) * CEIL
        pts.push([w.a[0] + (w.b[0] - w.a[0]) * u + (Math.random() - 0.5) * 0.006, y, w.a[1] + (w.b[1] - w.a[1]) * u + (Math.random() - 0.5) * 0.006, y / CEIL])
      }
    }
    // floor: sparse ground returns inside each room
    for (const r of ROOMS)
      for (let i = 0; i < 760; i++) pts.push([r.x + (Math.random() - 0.5) * r.w, Math.random() * 0.004, r.z + (Math.random() - 0.5) * r.d, 0.02])
    // detected objects: a denser blob where the open-vocabulary detector fired
    for (const d of DETECTIONS)
      for (let i = 0; i < 560; i++) {
        const a = Math.random() * Math.PI * 2
        const rr = Math.pow(Math.random(), 0.5) * 0.035
        const y = Math.random() * d.y
        pts.push([d.p[0] + Math.cos(a) * rr, y, d.p[1] + Math.sin(a) * rr, 0.45 + (y / d.y) * 0.5])
      }
    return build(pts.length, (i) => pts[i])
  }, [])

  useFrame(() => {
    if (scanY.current) {
      scanY.current.position.y = reveal.current
      const m = scanY.current.material as THREE.MeshBasicMaterial
      m.opacity = reveal.current < CEIL - 0.001 ? 0.55 : 0
    }
  })

  return (
    <group>
      <PointField positions={cloud.pos} colors={cloud.col} reveal={reveal} sweeping={sweeping} size={0.009} />
      {/* the reconstruction plane doing the sweeping */}
      <mesh ref={scanY} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.56, 0.62, 48]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {DETECTIONS.slice(0, 3).map((d, i) => (
        <Tag key={i} text={d.label} position={[d.p[0], d.y + 0.05, d.p[1]]} width={0.2} size={30} color={CYAN} bg="rgba(6,10,16,0.75)" />
      ))}
      <Tag text={`${(cloud.pos.length / 3 / 1000).toFixed(1)}k returns · ${ROOMS.length} zones`} position={[0, -0.05, 0.42]} width={0.34} size={30} color={ACCENT} bg="rgba(0,0,0,0)" />
      <PatrolTrace t={t} />
    </group>
  )
}

/** The pose graph the scan was taken from, drawn as a thin bright trace through the cloud. */
function PatrolTrace({ t }: { t: React.MutableRefObject<number> }) {
  const dot = useRef<THREE.Mesh>(null)
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(PATROL.map((p) => new THREE.Vector3(p[0], 0.012, p[1])))
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.8 }))
  }, [])
  useFrame(() => {
    const total = PATROL.length - 1
    const s = (t.current * 0.6) % total
    const i = Math.floor(s)
    const u = s - i
    const a = PATROL[i]
    const b = PATROL[i + 1]
    dot.current?.position.set(a[0] + (b[0] - a[0]) * u, 0.03, a[1] + (b[1] - a[1]) * u)
  })
  return (
    <group>
      <primitive object={line} />
      <mesh ref={dot}>
        <sphereGeometry args={[0.016, 12, 10]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function OlivePointCloud() {
  const { reveal, sweeping, t } = useSweep(8)
  const ghost = useRef<THREE.Points>(null)

  const cloud = useMemo(() => {
    const pts: [number, number, number, number][] = []
    // the corridor the circuit runs through, scanned as a tube of returns
    const n = KEYFRAMES.length
    for (let i = 0; i < n; i++) {
      const a = KEYFRAMES[i].p
      const b = KEYFRAMES[(i + 1) % n].p
      for (let k = 0; k < 340; k++) {
        const u = Math.random()
        const px = a[0] + (b[0] - a[0]) * u
        const pz = a[1] + (b[1] - a[1]) * u
        const ang = Math.random() * Math.PI * 2
        const rr = 0.09 + Math.random() * 0.02
        const y = Math.abs(Math.sin(ang)) * 0.3
        pts.push([px + Math.cos(ang) * rr, y, pz + Math.sin(ang) * rr * 0.35, y / 0.3])
      }
    }
    for (const l of LANDMARKS) for (let k = 0; k < 400; k++) {
      const a = Math.random() * Math.PI * 2
      const rr = Math.pow(Math.random(), 0.4) * 0.03
      pts.push([l[0] + Math.cos(a) * rr, 0.1 + Math.sin(a) * rr, l[1], 0.85])
    }
    return build(pts.length, (i) => pts[i])
  }, [])

  // a second, drifted copy of the same cloud that snaps onto the first when the loop closes
  const ghostGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(cloud.pos.slice(), 3))
    return g
  }, [cloud])

  useFrame(() => {
    const u = (t.current % 8) / 8
    const closing = u > 0.62
    const k = closing ? Math.max(0, 1 - (u - 0.62) / 0.12) : 1
    if (ghost.current) {
      ghost.current.position.set(0.055 * k, 0, -0.038 * k)
      ghost.current.rotation.y = 0.09 * k
      const m = ghost.current.material as THREE.PointsMaterial
      m.opacity = 0.35 * k
    }
  })

  return (
    <group>
      <points ref={ghost} geometry={ghostGeo}>
        <pointsMaterial color="#ff4d6d" size={0.008} transparent opacity={0.35} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <PointField positions={cloud.pos} colors={cloud.col} reveal={reveal} sweeping={sweeping} size={0.008} />
      {KEYFRAMES.filter((_, i) => i % 3 === 0).map((k, i) => (
        <mesh key={i} position={[k.p[0], 0.015, k.p[1]]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
      ))}
      <Tag text="drifted estimate → loop closed" position={[0, 0.38, 0]} width={0.36} size={30} color="#ff8fa3" bg="rgba(6,10,16,0.7)" />
      <Tag text={`${(cloud.pos.length / 3 / 1000).toFixed(1)}k returns · 2.0 cm RMSE`} position={[0, -0.05, 0.42]} width={0.36} size={30} color={CYAN} bg="rgba(0,0,0,0)" />
    </group>
  )
}
