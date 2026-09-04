'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { makeHologramMaterial } from './hologramMaterial'
import { useHologram } from './HologramFrame'

/** ponytail: stand-in until the project's own hologram exists. */
export function Placeholder() {
  const mat = useMemo(() => makeHologramMaterial(), [])
  const mesh = useRef<THREE.Mesh>(null)
  const holo = useHologram()
  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    mat.uniforms.uTime.value += dt
    if (holo) mat.uniforms.uActive.value = holo.active.current
    if (mesh.current) mesh.current.rotation.x += dt * 0.3
  })
  return (
    <mesh ref={mesh} position={[0, 0.7, 0]} material={mat}>
      <icosahedronGeometry args={[0.42, 1]} />
    </mesh>
  )
}
