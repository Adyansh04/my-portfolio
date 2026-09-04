'use client'

import { useEffect } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useThree } from '@react-three/fiber'

/**
 * Image-based lighting for every standard material in the scene. Without an environment map a
 * MeshStandardMaterial has nothing to reflect, so metal reads as flat paint and every box looks
 * like a box — this is what makes the robots, racking and wall panels catch light along their edges.
 * RoomEnvironment is generated in code, so it costs no assets.
 */
export function Ambience({ intensity = 0.3 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = target.texture
    scene.environmentIntensity = intensity
    pmrem.dispose()
    return () => {
      scene.environment = null
      target.dispose()
    }
  }, [gl, scene, intensity])
  return null
}
