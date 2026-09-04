'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

let cached: THREE.Texture | null = null
/** Soft radial falloff, generated once and shared by every shadow in the scene. */
export function shadowTexture() {
  if (cached) return cached
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(32, 32, 1, 32, 32, 31)
  g.addColorStop(0, 'rgba(0,0,0,0.85)')
  g.addColorStop(0.45, 'rgba(0,0,0,0.4)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  cached = new THREE.CanvasTexture(c)
  return cached
}

/**
 * A painted contact shadow. Real shadow maps over a 42 m facility would be either coarse or
 * expensive, and the one thing they would actually buy here is grounding: without it every robot
 * and crate looks like it is hovering a few centimetres above the floor.
 */
export function ContactShadow({ radius = 0.7, stretch = 1, opacity = 0.55, y = 0.016 }: { radius?: number; stretch?: number; opacity?: number; y?: number }) {
  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity, depthWrite: false, toneMapped: false }), [opacity])
  return (
    <mesh material={material} rotation-x={-Math.PI / 2} position-y={y} renderOrder={-3}>
      <planeGeometry args={[radius * 2 * stretch, radius * 2]} />
    </mesh>
  )
}
