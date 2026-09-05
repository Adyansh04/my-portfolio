'use client'

import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useHologram } from '../HologramFrame'

/**
 * Building blocks for the tall holograms. The brief is set by the shot: the hall camera sits 7.4 m
 * away at 3.5 m and looks down at 0.8 m, so a project reads by silhouette, light and
 * whole-object motion. Fine detail is invisible at that distance — a flat plate on the pedestal
 * foreshortened to nothing, which is what sent the last design back.
 */

export const ACCENT = '#ff7a1a'
export const CYAN = '#4fd1ff'
export type V3 = [number, number, number]

/** Content-local units; the frame scales by 1.2, so 1.0 here is 1.2 m in the world. */
export const H = 1.9

export function useClock(speed = 1): MutableRefObject<number> {
  const holo = useHologram()
  const t = useRef(Math.random() * 20)
  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    t.current += Math.min(0.05, dt || 0.016) * speed
  })
  return t
}

/** True while the camera is close enough for the piece to be worth animating. */
export function useNear() {
  const holo = useHologram()
  return () => !holo || holo.near.current
}

/**
 * The same proximity as a React state rather than a ref, for the things that have to mount and
 * unmount rather than just skip a frame — the offscreen glyph hosts, mainly, since ten live
 * framer-motion trees on the main thread is not free.
 */
export function useNearState() {
  const holo = useHologram()
  const [near, setNear] = useState(!holo)
  useFrame(() => {
    const n = !holo || holo.near.current
    if (n !== near) setNear(n)
  })
  return near
}

export function emissive(color: string, strength = 1.0, opacity = 1) {
  const m = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: strength,
    roughness: 0.45,
    metalness: 0.1,
  })
  if (opacity < 1) {
    m.transparent = true
    m.opacity = opacity
  }
  return m
}

/** Additive line material — the workhorse for filaments and rings seen from across the hall. */
export function lineMat(color: string, opacity = 0.8) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
}

export function glowMat(color: string, opacity = 0.5) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
}

/** A closed ring as a line loop, optionally with radial spokes. */
export function ringGeometry(radius: number, segments = 64, spokes = 0) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
  }
  const geos = [new THREE.BufferGeometry().setFromPoints(pts)]
  if (spokes > 0) {
    const sp: THREE.Vector3[] = []
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2
      sp.push(new THREE.Vector3(Math.cos(a) * radius * 0.25, 0, Math.sin(a) * radius * 0.25))
      sp.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    geos.push(new THREE.BufferGeometry().setFromPoints(sp))
  }
  return geos
}

/** A vertical shaft of light: a thin emissive core inside a soft additive sleeve. */
export function Axis({ height = H, color = ACCENT, radius = 0.012 }: { height?: number; color?: string; radius?: number }) {
  const core = useMemo(() => emissive(color, 3.0), [color])
  const halo = useMemo(() => glowMat(color, 0.10), [color])
  return (
    <group>
      <mesh material={core} position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 10]} />
      </mesh>
      <mesh material={halo} position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 7, radius * 5, height, 16, 1, true]} />
      </mesh>
    </group>
  )
}

/** Points that fade in and out as they travel — the base for vortices and rising data. */
export function useParticles(count: number) {
  return useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) seed[i] = Math.random()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geometry: g, pos, seed }
  }, [count])
}

const sprite = (() => {
  let t: THREE.Texture | null = null
  return () => {
    if (t) return t
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const x = c.getContext('2d')!
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 32, 32)
    t = new THREE.CanvasTexture(c)
    return t
  }
})()

export function pointsMat(color: string, size = 0.03, opacity = 0.9) {
  return new THREE.PointsMaterial({
    color,
    size,
    map: sprite(),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
}

/** Nodes as one instanced mesh — cheap enough to put a hundred of them in every project. */
export function useNodes(count: number) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  return { ref, tmp }
}
