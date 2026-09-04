'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, CYAN, LabelPlate, MUTED, WHITE, smooth, useHoloClock, useHoloMaterial, useLineObject, type V3 } from './parts'

const CHUNKS = 72
const CYCLE = 11
const STACK: V3 = [-0.5, 0.25, 0]
const CENTERS: { p: V3; label: string }[] = [
  { p: [0.25, 0.7, -0.2], label: 'mortality' },
  { p: [0.45, 0.35, 0.25], label: 'phenotypes' },
  { p: [0.1, 0.3, 0.3], label: 'biomarkers' },
]

/** Sepsis Atlas: PDF pages → parent/child chunks → an embedding cloud with clusters; a query hits a chunk that stays traceable to its page. */
export function RagHologram() {
  const t = useHoloClock()
  const chunkMat = useHoloMaterial(MUTED, 1)
  const hotMat = useHoloMaterial(ACCENT, 1)
  const pageMat = useHoloMaterial(WHITE, 0.6)
  const textMat = useHoloMaterial(MUTED, 0.5)
  const queryMat = useHoloMaterial(CYAN, 1)
  const inst = useRef<THREE.InstancedMesh>(null)
  const hot = useRef<THREE.Mesh>(null)
  const query = useRef<THREE.Mesh>(null)
  const targets = useMemo(() => {
    let s = 7
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5
    return Array.from({ length: CHUNKS }, (_, i) => {
      const c = CENTERS[i % CENTERS.length].p
      return { to: [c[0] + r() * 0.3, c[1] + r() * 0.25, c[2] + r() * 0.3] as V3, delay: (i / CHUNKS) * 0.5, rot: r() * 3 }
    })
  }, [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const HOT = 17
  const link = useLineObject(useMemo(() => [STACK, targets[HOT].to] as V3[], [targets]), ACCENT, 0.8, 'segments')
  const qlink = useLineObject(useMemo(() => [[0.6, 1.0, 0.4], targets[HOT].to] as V3[], [targets]), CYAN, 0.7, 'segments')
  const quoteLabel = useRef<THREE.Group>(null)

  useFrame(() => {
    const u = (t.current % CYCLE) / CYCLE
    const m = inst.current
    if (!m) return
    for (let i = 0; i < CHUNKS; i++) {
      const tg = targets[i]
      const k = smooth((u - tg.delay) / 0.4) * (1 - smooth((u - 0.9) / 0.1))
      tmp.position.set(STACK[0] + (tg.to[0] - STACK[0]) * k, STACK[1] + 0.02 * (i % 6) + (tg.to[1] - STACK[1] - 0.02 * (i % 6)) * k, STACK[2] + (tg.to[2] - STACK[2]) * k)
      tmp.rotation.set(0, tg.rot * k, 0)
      tmp.scale.setScalar(0.6 + 0.4 * k)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
      if (i === HOT && hot.current) {
        hot.current.position.copy(tmp.position)
        hot.current.rotation.copy(tmp.rotation)
      }
    }
    m.instanceMatrix.needsUpdate = true
    const pos = link.geometry.attributes.position as THREE.BufferAttribute
    if (hot.current) pos.setXYZ(1, hot.current.position.x, hot.current.position.y, hot.current.position.z)
    pos.needsUpdate = true
    const q = qlink.geometry.attributes.position as THREE.BufferAttribute
    if (hot.current) q.setXYZ(1, hot.current.position.x, hot.current.position.y, hot.current.position.z)
    q.needsUpdate = true
    const queryOn = u > 0.55 && u < 0.9
    link.visible = queryOn
    qlink.visible = queryOn
    if (quoteLabel.current) quoteLabel.current.visible = queryOn
    if (query.current) query.current.scale.setScalar(1 + Math.sin(t.current * 6) * 0.15)
  })

  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[STACK[0], 0.02 + i * 0.03, STACK[2]]}>
          <mesh rotation-x={-Math.PI / 2} material={pageMat}>
            <planeGeometry args={[0.28, 0.36]} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <mesh key={l} position={[-0.02 + (l % 2) * 0.02, 0.002, -0.13 + l * 0.05]} rotation-x={-Math.PI / 2} material={textMat}>
              <planeGeometry args={[0.2 - (l % 3) * 0.03, 0.012]} />
            </mesh>
          ))}
        </group>
      ))}
      <LabelPlate text="PDF corpus · layout-aware chunks" position={[STACK[0], 0.32, STACK[2]]} width={0.5} color={MUTED} />
      <instancedMesh ref={inst} args={[undefined, undefined, CHUNKS]} material={chunkMat}>
        <planeGeometry args={[0.05, 0.035]} />
      </instancedMesh>
      <mesh ref={hot} material={hotMat}>
        <planeGeometry args={[0.07, 0.05]} />
      </mesh>
      {CENTERS.map((c) => (
        <LabelPlate key={c.label} text={c.label} position={[c.p[0], c.p[1] + 0.22, c.p[2]]} width={0.24} color={WHITE} />
      ))}
      <mesh ref={query} position={[0.6, 1.0, 0.4]} material={queryMat}>
        <octahedronGeometry args={[0.035, 0]} />
      </mesh>
      <LabelPlate text="query" position={[0.6, 1.1, 0.4]} width={0.16} color={CYAN} />
      <primitive object={qlink} />
      <primitive object={link} />
      <group ref={quoteLabel}>
        <LabelPlate text="quote verified against source" position={[-0.15, 0.62, 0.1]} width={0.52} color={ACCENT} />
      </group>
    </group>
  )
}
