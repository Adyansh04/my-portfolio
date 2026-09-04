'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { asset } from '@/lib/base-path'
import { crazyflieMaterial } from './robotMaterial'
import { useHologram } from '../holograms/HologramFrame'

const URL = asset('/models/crazyflie/body.glb')
const DRACO = asset('/draco/')

/** Bitcraze Crazyflie 2 hovering with a little drift. Real size 0.1 m; scaled up for legibility. */
export function CrazyflieDrone({ scale = 3, height = 0.9, position = [0, 0, 0] as [number, number, number] }) {
  const gltf = useGLTF(URL, DRACO)
  const material = useMemo(() => crazyflieMaterial(), [])
  const geometry = useMemo(() => {
    let g: THREE.BufferGeometry | undefined
    gltf.scene.traverse((o) => {
      if (!g && (o as THREE.Mesh).isMesh) g = (o as THREE.Mesh).geometry
    })
    return g
  }, [gltf])
  const group = useRef<THREE.Group>(null)
  const clock = useRef(Math.random() * 10)
  const holo = useHologram()

  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    clock.current += Math.min(0.05, dt || 0.016)
    const t = clock.current
    if (!group.current) return
    group.current.position.set(position[0] + Math.sin(t * 0.7) * 0.12, position[1] + height + Math.sin(t * 1.9) * 0.05, position[2] + Math.cos(t * 0.5) * 0.12)
    group.current.rotation.set(Math.sin(t * 1.3) * 0.08, t * 0.2, Math.cos(t * 1.1) * 0.08)
  })

  if (!geometry) return null
  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} scale={scale} rotation={[-Math.PI / 2, 0, 0]} />
      <pointLight color="#ff7a1a" intensity={0.6} distance={2} />
    </group>
  )
}
