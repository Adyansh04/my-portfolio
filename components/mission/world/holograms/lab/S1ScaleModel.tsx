'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { GO2_DEF, GO2_LEGS } from '@/lib/mission/robots'
import { GO2_GAIT } from '@/lib/mission/gait'
import { asset } from '@/lib/base-path'
import { QuadrupedRobot } from '../../robots/QuadrupedRobot'
import { go2MaterialFor } from '../../robots/robotMaterial'
import { ACCENT, CYAN, GlassCase, LIME, MachinedBase, Tag, VIOLET, useLabClock } from './labParts'
import { DETECTIONS, FACTORS, FACTOR_COLOR, KEYFRAMES, LANDMARKS, PATROL, ROOMS, WALLS } from './subjects'

/**
 * Style 1 — Scale Model. No hologram at all: a machined display plate with a physically shaded
 * miniature on it under a glass case. Everything is opaque and lit, so it reads as an object in
 * the room rather than a projection, and the pedestal becomes a museum vitrine.
 */

const WALL_H = 0.13

function Vitrine({ children, w = 1.28, d = 0.94 }: { children: React.ReactNode; w?: number; d?: number }) {
  return (
    <group>
      <MachinedBase w={w} d={d} />
      <group position={[0, 0.078, 0]}>{children}</group>
      <GlassCase w={w - 0.06} d={d - 0.06} h={0.52} />
      {/* two practicals inside the case so the model has its own light */}
      <pointLight position={[-0.3, 0.42, -0.24]} color="#ffe9d0" intensity={0.5} distance={1.4} decay={2} />
      <pointLight position={[0.34, 0.38, 0.26]} color="#cfe2ff" intensity={0.4} distance={1.4} decay={2} />
    </group>
  )
}

export function Go2ScaleModel() {
  const t = useLabClock(0.35)
  const pose = useRef({ x: PATROL[0][0], z: PATROL[0][1], yaw: 0 })

  const walls = useMemo(() => {
    const geos = WALLS.map((w) => {
      const dx = w.b[0] - w.a[0]
      const dz = w.b[1] - w.a[1]
      const len = Math.hypot(dx, dz)
      const g = new THREE.BoxGeometry(len + 0.016, WALL_H, 0.016)
      g.rotateY(Math.atan2(-dz, dx))
      g.translate((w.a[0] + w.b[0]) / 2, WALL_H / 2, (w.a[1] + w.b[1]) / 2)
      return g
    })
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])

  const groove = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    for (let i = 0; i < PATROL.length - 1; i++) {
      const a = PATROL[i]
      const b = PATROL[i + 1]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const g = new THREE.BoxGeometry(len, 0.004, 0.012)
      g.rotateY(Math.atan2(-(b[1] - a[1]), b[0] - a[0]))
      g.translate((a[0] + b[0]) / 2, 0.004, (a[1] + b[1]) / 2)
      geos.push(g)
    }
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])

  useFrame(() => {
    // walk the patrol as a physical model on a track
    const total = PATROL.length - 1
    const s = (t.current % total)
    const i = Math.floor(s)
    const u = s - i
    const a = PATROL[i]
    const b = PATROL[i + 1]
    pose.current.x = a[0] + (b[0] - a[0]) * u
    pose.current.z = a[1] + (b[1] - a[1]) * u
    pose.current.yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0])
  })

  return (
    <Vitrine>
      {/* room floors, colour-coded the way the segmenter labels them */}
      {ROOMS.map((r, i) => (
        <mesh key={r.id} position={[r.x, 0.003, r.z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[r.w - 0.02, r.d - 0.02]} />
          <meshStandardMaterial color={['#2b3a4d', '#33455a', '#2f3f52', '#374a60'][i]} roughness={0.85} metalness={0.1} />
        </mesh>
      ))}
      <mesh geometry={walls}>
        <meshStandardMaterial color="#e6e9ee" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh geometry={groove}>
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.4} roughness={0.4} />
      </mesh>
      {DETECTIONS.map((d, i) => (
        <group key={i} position={[d.p[0], 0, d.p[1]]}>
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.11, 6]} />
            <meshStandardMaterial color="#aab3bf" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.115, 0]}>
            <sphereGeometry args={[0.011, 12, 10]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.1} roughness={0.35} />
          </mesh>
          {i % 2 === 0 && <Tag text={d.label} position={[0.07, 0.135, 0]} width={0.17} size={30} color="#dfe6ef" />}
        </group>
      ))}
      {ROOMS.map((r) => (
        <Tag key={r.id} text={`${r.id} · ${r.found}`} position={[r.x, 0.006, r.z + r.d / 2 - 0.05]} rotation={[-Math.PI / 2, 0, 0]} width={0.17} size={30} color="#9fb4cc" bg="rgba(0,0,0,0)" />
      ))}
      <group scale={0.34}>
        <QuadrupedRobot def={GO2_DEF} folder={asset('/models/go2')} legs={GO2_LEGS} gait={GO2_GAIT} headingOffset={0} scale={1} baseHeight={0.32} pose={pose.current} autoWalk materialFor={go2MaterialFor} flipAxis="z" />
      </group>
    </Vitrine>
  )
}

export function OliveScaleModel() {
  const t = useLabClock(0.5)
  const cart = useRef<THREE.Group>(null)

  const strands = useMemo(() => {
    const byKind = new Map<string, THREE.BufferGeometry[]>()
    const at = (id: number | string): [number, number] => (typeof id === 'number' ? KEYFRAMES[id].p : LANDMARKS[+String(id).slice(1)])
    for (const f of FACTORS) {
      const a = at(f.from)
      const b = at(f.to)
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (len < 1e-4) continue
      const lift = f.kind === 'loop' ? 0.1 : f.kind === 'fiducial' ? 0.06 : 0.02 + ['lidar', 'imu', 'encoder', 'vision'].indexOf(f.kind) * 0.008
      const g = new THREE.CylinderGeometry(f.kind === 'loop' ? 0.005 : 0.0028, f.kind === 'loop' ? 0.005 : 0.0028, len, 6)
      g.rotateZ(Math.PI / 2)
      g.rotateY(Math.atan2(-(b[1] - a[1]), b[0] - a[0]))
      g.translate((a[0] + b[0]) / 2, lift, (a[1] + b[1]) / 2)
      const list = byKind.get(f.kind) ?? []
      list.push(g)
      byKind.set(f.kind, list)
    }
    return [...byKind.entries()].map(([kind, geos]) => {
      const m = mergeGeometries(geos, false)!
      geos.forEach((g) => g.dispose())
      return { kind, geometry: m }
    })
  }, [])

  useFrame(() => {
    const i = Math.floor((t.current * 2) % KEYFRAMES.length)
    const k = KEYFRAMES[i]
    if (cart.current) cart.current.position.set(k.p[0], 0.028, k.p[1])
  })

  return (
    <Vitrine>
      {/* the circuit routed into the plate */}
      {KEYFRAMES.map((k, i) => (
        <mesh key={i} position={[k.p[0], 0.02, k.p[1]]}>
          <sphereGeometry args={[0.014, 14, 12]} />
          <meshStandardMaterial color="#dfe4ea" metalness={0.95} roughness={0.22} />
        </mesh>
      ))}
      {strands.map((s) => (
        <mesh key={s.kind} geometry={s.geometry}>
          <meshStandardMaterial
            color={FACTOR_COLOR[s.kind as keyof typeof FACTOR_COLOR]}
            emissive={FACTOR_COLOR[s.kind as keyof typeof FACTOR_COLOR]}
            emissiveIntensity={s.kind === 'loop' ? 1.6 : 0.5}
            metalness={0.6}
            roughness={0.35}
          />
        </mesh>
      ))}
      {LANDMARKS.map((p, i) => (
        <group key={i} position={[p[0], 0.005, p[1]]}>
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.032, 24]} />
            <meshStandardMaterial color="#f2f4f7" roughness={0.6} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
            <ringGeometry args={[0.014, 0.023, 24]} />
            <meshStandardMaterial color="#11151b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.002, 0.002, 0.1, 5]} />
            <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
      <group ref={cart}>
        <mesh>
          <boxGeometry args={[0.07, 0.028, 0.05]} />
          <meshStandardMaterial color="#c6ccd4" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.024, 0]}>
          <cylinderGeometry args={[0.011, 0.013, 0.018, 14]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.3} />
        </mesh>
      </group>
      <Tag text="2.0 cm RMSE · 56 m × 3" position={[0, 0.005, 0.4]} rotation={[-Math.PI / 2, 0, 0]} width={0.32} size={30} color={LIME} bg="rgba(0,0,0,0)" />
    </Vitrine>
  )
}
