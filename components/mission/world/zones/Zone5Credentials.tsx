'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RACKS } from '@/lib/mission/facility'
import { credentialGroups } from '@/content/credentials'
import { mission } from '@/lib/mission/store'
import { makeLabelTexture } from '../labels'

const SHELVES = 4
const BOXES_PER_SHELF = 5

function Rack({ index }: { index: number }) {
  const r = RACKS[index]
  const group = credentialGroups[Math.floor(index / 2)]
  const tex = useMemo(
    () => makeLabelTexture([{ text: `${group.id.toUpperCase()}_REGISTRY`, size: 24, color: '#ff7a1a' }, { text: group.title.toUpperCase(), size: 40, color: '#e9eef3', font: '700' }, { text: `${group.items.length} ITEMS`, size: 22, color: '#8a94a6' }], { w: 640, h: 224, bg: '#0d1117', pad: 28 }),
    [group],
  )
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  const boxes = useRef<THREE.InstancedMesh>(null)
  const label = useRef<THREE.MeshStandardMaterial>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  useLayoutEffect(() => {
    const m = boxes.current
    if (!m) return
    let k = 0
    for (let s = 0; s < SHELVES; s++)
      for (let b = 0; b < BOXES_PER_SHELF; b++) {
        tmp.position.set(0, 0.28 + s * 0.5, -1.0 + b * 0.5 + ((s * 7 + b * 3) % 5) * 0.01)
        tmp.scale.set(1, 0.85 + ((s + b) % 3) * 0.08, 1)
        tmp.updateMatrix()
        m.setMatrixAt(k++, tmp.matrix)
      }
    m.instanceMatrix.needsUpdate = true
  }, [tmp])
  useFrame((_, dt) => {
    const on = mission.zone === 5 && mission.beat === Math.floor(index / 2) ? 1 : 0.12
    if (label.current) label.current.emissiveIntensity += (on - label.current.emissiveIntensity) * Math.min(1, dt * 4)
  })
  const yaw = r.side === 1 ? -Math.PI / 2 : Math.PI / 2
  return (
    <group position={[r.x - r.side * 0.25, 0, r.z]} rotation={[0, yaw, 0]}>
      {/* uprights + shelves */}
      {[-1.25, 1.25].map((z) => (
        <mesh key={z} position={[0, 1.1, z]}>
          <boxGeometry args={[0.45, 2.2, 0.04]} />
          <meshStandardMaterial color="#1b222c" roughness={0.8} />
        </mesh>
      ))}
      {Array.from({ length: SHELVES + 1 }, (_, s) => (
        <mesh key={s} position={[0, 0.08 + s * 0.5, 0]}>
          <boxGeometry args={[0.45, 0.03, 2.5]} />
          <meshStandardMaterial color="#2a3340" roughness={0.8} />
        </mesh>
      ))}
      <instancedMesh ref={boxes} args={[undefined, undefined, SHELVES * BOXES_PER_SHELF]}>
        <boxGeometry args={[0.36, 0.36, 0.42]} />
        <meshStandardMaterial color="#141a22" roughness={0.9} />
      </instancedMesh>
      {/* label strip on the front edge of the top shelf */}
      <mesh position={[0.26, 2.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.6, 0.42]} />
        <meshStandardMaterial ref={label} map={tex} emissive="#ff7a1a" emissiveIntensity={0.12} roughness={0.5} />
      </mesh>
      <mesh position={[0.262, 2.05, 0]} rotation={[0, Math.PI / 2, 0]} material={face}>
        <planeGeometry args={[1.6, 0.42]} />
      </mesh>
    </group>
  )
}

export function Zone5Credentials() {
  return (
    <group>
      {RACKS.map((_, i) => (
        <Rack key={i} index={i} />
      ))}
    </group>
  )
}
