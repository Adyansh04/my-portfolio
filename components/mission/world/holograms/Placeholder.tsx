'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useHologram } from './HologramFrame'

/** ponytail: stand-in for a project with no slab design yet; all ten currently have one. */
export function Placeholder() {
  const mesh = useRef<THREE.Mesh>(null)
  const holo = useHologram()
  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    if (mesh.current) mesh.current.rotation.y += dt * 0.3
  })
  return (
    <mesh ref={mesh} position={[0, 0.2, 0]}>
      <icosahedronGeometry args={[0.2, 1]} />
      <meshStandardMaterial color="#5a6675" metalness={0.6} roughness={0.5} wireframe />
    </mesh>
  )
}
