'use client'

import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * Image-based lighting for every standard material in the scene. Without an environment map a
 * MeshStandardMaterial has nothing to reflect, so metal reads as flat paint and every box looks
 * like a box.
 *
 * This used to be three's RoomEnvironment, which is a photographic studio: even, white, and from
 * every direction at once. Everything metal in the facility reflected the same neutral grey, which
 * is a large part of why the world looked like untextured plastic. What replaces it is the
 * facility's *own* lighting, built as a box of emitters and convolved to a cubemap: cool strips
 * overhead, the warm accent bands that run the walls at 2.3 m, a dim floor bounce, and dark
 * everywhere else. Metal now has a direction to it — cold from above, amber along the flanks —
 * and edges pick up a warm rim that no amount of material tweaking was going to produce.
 */
function facilityEnvironment() {
  const env = new THREE.Scene()
  const panel = (w: number, h: number, d: number, color: string, intensity: number, pos: [number, number, number], rot?: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    )
    m.position.set(...pos)
    if (rot) m.rotation.set(...rot)
    env.add(m)
    return m
  }
  // the room itself: near-black, so nothing washes out
  panel(22, 12, 22, '#0a0e14', 1, [0, 0, 0])
  // cool strip lights in the ceiling, in two runs
  for (const z of [-4, 0, 4]) {
    panel(16, 0.4, 1.2, '#cfe2ff', 6.5, [0, 5.6, z])
  }
  // the warm accent bands that run the walls, and the skirting glow under them
  for (const [x, z, ry] of [[-9.5, 0, Math.PI / 2], [9.5, 0, Math.PI / 2], [0, -9.5, 0], [0, 9.5, 0]] as const) {
    panel(18, 0.3, 0.1, '#ff8a2a', 2.6, [x, 1.6, z], [0, ry, 0])
    panel(18, 0.9, 0.1, '#ff7a1a', 0.35, [x, -1.4, z], [0, ry, 0])
  }
  // floor bounce — cold and weak, the way a sealed concrete slab returns light
  panel(20, 0.1, 20, '#2b3a4c', 1.1, [0, -5.4, 0])
  return env
}
export function Ambience({ intensity = 0.85 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = facilityEnvironment()
    const target = pmrem.fromScene(env, 0.02)
    scene.environment = target.texture
    scene.environmentIntensity = intensity
    pmrem.dispose()
    env.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
      }
    })
    return () => {
      scene.environment = null
      target.dispose()
    }
  }, [gl, scene, intensity])
  return null
}
