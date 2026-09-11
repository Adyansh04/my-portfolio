'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const DIR = new THREE.Vector3()

/**
 * The rig's own light. It used to be a bare point light, which lit whatever happened to be nearest
 * — including the ceiling 80 cm overhead, which blew out to white every time the camera passed
 * under a joist. A wide spot aimed down the view axis lights what is actually in frame, and the
 * small point light behind it keeps things just off-axis from falling into black.
 */
export function CameraLight() {
  const spot = useRef<THREE.SpotLight>(null)
  const fill = useRef<THREE.PointLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ camera }) => {
    camera.getWorldDirection(DIR)
    if (spot.current) {
      spot.current.position.copy(camera.position)
      // aimed a little below the view axis, like a headlight: keeps the ceiling out of the hot spot
      target.position.copy(camera.position).addScaledVector(DIR, 10).setY(camera.position.y + DIR.y * 10 - 1.6)
      target.updateMatrixWorld()
    }
    if (fill.current) fill.current.position.copy(camera.position).addScaledVector(DIR, 0.5)
  })

  return (
    <group>
      <primitive object={target} />
      <spotLight ref={spot} target={target} color="#f4f6fa" intensity={11} angle={0.85} penumbra={1} distance={36} decay={2} />
      <pointLight ref={fill} color="#dce6f5" intensity={1.8} distance={18} decay={2} />
    </group>
  )
}
