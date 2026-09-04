'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, CYAN, Frustum, GridPlane, LabelPlate, MUTED, MotionTrail, WHITE, smooth, useHoloClock, useHoloMaterial, useLineObject, type V3 } from './parts'

const G = 6
const S = 0.18
const node = (i: number, j: number): V3 => [(i - (G - 1) / 2) * S, 0.02, (j - (G - 1) / 2) * S]
const PATH: [number, number][] = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [2, 5], [1, 5], [0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0]]
const EVENTS: [number, number][] = [[2, 0], [4, 2], [4, 4], [2, 5], [0, 3]]
const DANGER: [number, number][] = [[1, 2], [3, 3], [1, 4]]
const CYCLE = 12

/** Vanguard (eYRC): the overhead Watchtower camera classifies events, A* routes the bot around danger zones, QGIS tracks it live. */
export function WatchtowerHologram() {
  const t = useHoloClock()
  const botMat = useHoloMaterial(ACCENT, 1)
  const eventMat = useHoloMaterial(WHITE, 1)
  const classified = useHoloMaterial(CYAN, 1)
  const dangerMat = useHoloMaterial(MUTED, 0.7)
  const dotMat = useHoloMaterial(MUTED, 1)
  const bot = useRef<THREE.Group>(null)
  const events = useRef<(THREE.Mesh | null)[]>([])
  const labels = useRef<(THREE.Group | null)[]>([])
  const pathPts = useMemo(() => PATH.map(([i, j]) => node(i, j)), [])
  const path = useLineObject(pathPts, ACCENT, 0.9)
  const nodes = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const scan = useRef<THREE.Mesh>(null)
  const scanMat = useHoloMaterial(CYAN, 0.35)

  useFrame(() => {
    const u = (t.current % CYCLE) / CYCLE
    const classify = smooth(u / 0.25)
    events.current.forEach((m, k) => {
      if (!m) return
      const on = classify > (k + 1) / EVENTS.length
      m.material = on ? classified : eventMat
      m.rotation.y = t.current * (on ? 0.4 : 2.5)
      const l = labels.current[k]
      if (l) l.visible = on
    })
    const drive = smooth((u - 0.25) / 0.7)
    const n = Math.max(1, Math.floor(drive * pathPts.length) + 1)
    path.geometry.setDrawRange(0, n)
    if (bot.current) {
      const f = drive * (pathPts.length - 1)
      const i = Math.min(pathPts.length - 2, Math.floor(f))
      const k = f - i
      const a = pathPts[i], b = pathPts[i + 1]
      bot.current.position.set(a[0] + (b[0] - a[0]) * k, 0.05, a[2] + (b[2] - a[2]) * k)
      bot.current.rotation.y = Math.atan2(-(b[2] - a[2]), b[0] - a[0])
    }
    if (scan.current) {
      scan.current.position.z = -0.55 + (u * 4 % 1) * 1.1
      scan.current.visible = u < 0.25
    }
    const m = nodes.current
    if (m) {
      for (let i = 0; i < G * G; i++) {
        const p = node(i % G, Math.floor(i / G))
        tmp.position.set(p[0], 0.015, p[2])
        tmp.scale.setScalar(1)
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <GridPlane w={(G - 1) * S + 0.2} h={(G - 1) * S + 0.2} step={S} opacity={0.35} />
      <instancedMesh ref={nodes} args={[undefined, undefined, G * G]} material={dotMat}>
        <sphereGeometry args={[0.008, 6, 6]} />
      </instancedMesh>
      <group position={[0, 1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Frustum fov={54} aspect={1} far={1.2} color={WHITE} opacity={0.35} />
      </group>
      <LabelPlate text="Watchtower · overhead camera" position={[0, 1.38, 0]} width={0.52} color={WHITE} />
      {/* classification scan sweeping the arena */}
      <mesh ref={scan} position={[0, 0.01, -0.55]} rotation-x={-Math.PI / 2} material={scanMat}>
        <planeGeometry args={[(G - 1) * S + 0.2, 0.04]} />
      </mesh>
      {EVENTS.map(([i, j], k) => (
        <group key={k}>
          <mesh ref={(m) => { events.current[k] = m }} position={[node(i, j)[0], 0.07, node(i, j)[2]]} material={eventMat}>
            <tetrahedronGeometry args={[0.05, 0]} />
          </mesh>
          <group ref={(g) => { labels.current[k] = g }}>
            <LabelPlate text={`event ${k + 1} · priority ${k + 1}`} position={[node(i, j)[0], 0.2, node(i, j)[2]]} width={0.3} color={CYAN} />
          </group>
        </group>
      ))}
      {DANGER.map(([i, j], k) => (
        <mesh key={k} position={[node(i, j)[0], 0.005, node(i, j)[2]]} rotation-x={-Math.PI / 2} material={dangerMat}>
          <planeGeometry args={[S * 0.85, S * 0.85]} />
        </mesh>
      ))}
      <primitive object={path} />
      <MotionTrail target={bot} color={ACCENT} length={70} opacity={0.35} />
      <group ref={bot}>
        <mesh material={botMat}>
          <boxGeometry args={[0.09, 0.05, 0.07]} />
        </mesh>
        <mesh position={[0.05, 0, 0]} material={botMat}>
          <boxGeometry args={[0.02, 0.02, 0.05]} />
        </mesh>
      </group>
      <LabelPlate text="A* over CNN events · QGIS live" position={[0, 0.5, 0.62]} width={0.56} color={MUTED} />
    </group>
  )
}
