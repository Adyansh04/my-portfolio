'use client'

import { createContext, useContext, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'
import type { Project } from '@/content/types'
import { makeLabelTexture } from '../labels'
import { ContactShadow } from '../ContactShadow'
import { surface } from '../materials'

interface HologramCtxValue {
  /** camera close enough for the content to animate */
  near: MutableRefObject<boolean>
  /** 0.25 dimmed (tag filter miss) … 1 highlighted (active beat / tag match) */
  active: MutableRefObject<number>
  /** shared clock for content shaders */
  time: MutableRefObject<number>
}
const HologramCtx = createContext<HologramCtxValue | null>(null)
export const useHologram = () => useContext(HologramCtx)

interface Props {
  x: number
  z: number
  index: number
  project: Project
  children: ReactNode
}

/** Pedestal, ring and label shared by all ten project plates. The plate sits in a slow turntable. */
export function HologramFrame({ x, z, index, project, children }: Props) {
  const group = useRef<THREE.Group>(null)
  const content = useRef<THREE.Group>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const near = useRef(false)
  const active = useRef(0.6)
  const time = useRef(0)
  const ctx = useMemo(() => ({ near, active, time }), [])
  // label plate on the aisle-facing side: project code + title, drawn once
  const plate = useMemo(() => {
    const tex = makeLabelTexture(
      [
        { text: `PRJ-${String(project.id).padStart(3, '0')} · ${project.venue.toUpperCase()} · ${project.year}`, size: 22, color: '#ff7a1a' },
        { text: project.title.length > 34 ? project.title.slice(0, 33) + '…' : project.title, size: 34, color: '#e9eef3', font: '700' },
        { text: project.tags.slice(0, 4).join(' · '), size: 20, color: '#8a94a6' },
      ],
      { w: 768, h: 192, bg: '#0d1117', pad: 22 },
    )
    return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
  }, [project])
  // a cylinder's own UVs wrap u around the circumference, so the tile counts differ per axis
  const plinthMat = useMemo(() => surface('concrete', { repeat: [5, 0.9], tint: '#2a323e', roughness: 1.0, metalness: 0.05, normalScale: 0.8 }), [])
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }), [])

  useFrame(({ camera }, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    time.current += d
    const dist = Math.hypot(camera.position.x - x, camera.position.z - z)
    near.current = dist < 22
    if (group.current) group.current.visible = dist < 42
    if (!near.current) return
    const tag = mission.activeTag
    const match = tag ? (project.tags.includes(tag) ? 1 : 0.22) : 0.6
    const isBeat = mission.zone === 3 && mission.beat === index ? 1 : 0
    const target = Math.max(match, isBeat)
    active.current += (target - active.current) * (1 - Math.exp(-d * 4))
    if (ringMat.current) ringMat.current.opacity = 0.35 + 0.65 * active.current
    if (light.current) light.current.intensity = 0.6 + 2.2 * active.current
  })

  return (
    <group ref={group} position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]} material={plinthMat}>
        <cylinderGeometry args={[0.78, 0.86, 0.9, 32]} />
      </mesh>
      <mesh position={[0, 0.905, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.66, 0.8, 48]} />
        <meshBasicMaterial ref={ringMat} color="#ff7a1a" transparent opacity={0.5} />
      </mesh>
      {/* Above the content, not inside it. At 1.3 m this sat 13 cm off the stage deck, buried in
          the hardware, and blew a specular starburst through the bloom on whatever it touched. */}
      <pointLight ref={light} position={[0, 2.05, 0]} color="#ffc9a0" intensity={1} distance={3.4} decay={1.8} />
      {/* the pedestal sits on the floor (shadow) and spills a little accent onto it (pool) */}
      <ContactShadow radius={1.08} opacity={0.62} />
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} material={glow}>
        <circleGeometry args={[1.55, 44]} />
      </mesh>
      {/* label plate faces the aisle (pedestals north of the aisle face +z, south ones face -z) */}
      <mesh position={[0, 0.55, z < 38 ? 0.87 : -0.87]} rotation={[0, z < 38 ? 0 : Math.PI, 0]} material={plate}>
        <planeGeometry args={[1.28, 0.32]} />
      </mesh>
      <group ref={content} position={[0, 0.905, 0]} rotation={[0, z < 38 ? 0 : Math.PI, 0]} scale={1.2}>
        <HologramCtx.Provider value={ctx}>
          {children}
        </HologramCtx.Provider>
      </group>
    </group>
  )
}
