'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** Warm fill light that rides with the camera so whatever is in frame always reads. */
export function CameraLight() {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position)
  })
  return <pointLight ref={ref} color="#f4f6fa" intensity={6} distance={30} decay={2} />
}
