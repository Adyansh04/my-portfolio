'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PODIUMS } from '@/lib/mission/facility'
import { hackathons } from '@/content/hackathons'
import { mission } from '@/lib/mission/store'
import { makeLabelTexture } from '../labels'

function Podium({ index }: { index: number }) {
  const p = PODIUMS[index]
  const h = hackathons[index]
  const medal = '#ff7a1a' // neutral platforms: rank is carried by height and the label, not by colour
  const tex = useMemo(
    () => makeLabelTexture([{ text: h.rank.toUpperCase(), size: 40, color: medal, font: '700' }, { text: h.title, size: 26, color: '#e9eef3' }, { text: `${h.organizer} · ${h.date}`, size: 22, color: '#8a94a6' }], { w: 768, h: 256, bg: '#0d1117', pad: 32, align: 'center' }),
    [h, medal],
  )
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  const disc = useRef<THREE.Mesh>(null)
  const top = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }, dt) => {
    const lit = mission.zone === 4 && mission.beat >= index ? 1 : 0.1
    if (top.current) top.current.emissiveIntensity += (lit - top.current.emissiveIntensity) * Math.min(1, dt * 3)
    if (disc.current) {
      disc.current.rotation.y = clock.elapsedTime * 0.6
      disc.current.position.y = p.h + 0.55 + Math.sin(clock.elapsedTime * 1.4 + index) * 0.03
    }
  })
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, p.h / 2, 0]}>
        <boxGeometry args={[1.1, p.h, 1.1]} />
        <meshStandardMaterial color="#242c38" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, p.h + 0.01, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.0, 1.0]} />
        <meshStandardMaterial ref={top} color="#1b222c" emissive={medal} emissiveIntensity={0.1} roughness={0.5} />
      </mesh>
      {/* floating medal */}
      <mesh ref={disc} position={[0, p.h + 0.55, 0]}>
        <torusGeometry args={[0.22, 0.03, 12, 40]} />
        <meshStandardMaterial color="#e9eef3" emissive="#ff7a1a" emissiveIntensity={0.55} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* label plate on the front face (faces +z, toward the camera orbit) */}
      <mesh position={[0, p.h * 0.55, 0.56]} material={face}>
        <planeGeometry args={[1.0, 0.34]} />
      </mesh>
    </group>
  )
}

export function Zone4Hackathons() {
  return (
    <group>
      {PODIUMS.map((_, i) => (
        <Podium key={i} index={i} />
      ))}
      <pointLight position={[-4, 2.4, 38]} color="#ffd9c2" intensity={2.5} distance={7} decay={2} />
    </group>
  )
}
