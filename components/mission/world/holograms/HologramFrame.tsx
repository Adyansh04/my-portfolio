'use client'

import { createContext, useContext, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'
import type { Project } from '@/content/types'
import { makeLabelTexture } from '../labels'
import { ContactShadow } from '../ContactShadow'

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
    if (content.current) content.current.rotation.y += d * 0.12
  })

  return (
    <group ref={group} position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.9, 28]} />
        <meshStandardMaterial color="#141a22" roughness={0.75} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.905, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.44, 0.56, 40]} />
        <meshBasicMaterial ref={ringMat} color="#ff7a1a" transparent opacity={0.5} />
      </mesh>
      <pointLight ref={light} position={[0, 1.3, 0]} color="#ffc9a0" intensity={1} distance={3.2} decay={1.8} />
      {/* the pedestal sits on the floor (shadow) and spills a little accent onto it (pool) */}
      <ContactShadow radius={0.82} opacity={0.62} />
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} material={glow}>
        <circleGeometry args={[1.15, 40]} />
      </mesh>
      {/* label plate faces the aisle (pedestals north of the aisle face +z, south ones face -z) */}
      <mesh position={[0, 0.55, z < 38 ? 0.63 : -0.63]} rotation={[0, z < 38 ? 0 : Math.PI, 0]} material={plate}>
        <planeGeometry args={[1.0, 0.25]} />
      </mesh>
      <group ref={content} position={[0, 0.905, 0]} scale={1.2}>
        <HologramCtx.Provider value={ctx}>
          {children}
        </HologramCtx.Provider>
      </group>
    </group>
  )
}
