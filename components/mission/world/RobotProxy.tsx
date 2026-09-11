'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'
import { PooledLight } from './LightPool'

/** ponytail: primitive stand-in for Trakr until the GLB pipeline lands in P2. Forward = +X. */
export function RobotProxy() {
  const g = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const r = mission.robot
    if (!g.current) return
    g.current.position.set(r.x, 0, r.z)
    g.current.rotation.y = r.yaw
    if (body.current) body.current.position.y = 0.42 + Math.sin(clock.elapsedTime * 1.6) * 0.008
  })
  return (
    <group ref={g}>
      <mesh ref={body} position={[0, 0.42, 0]}>
        <boxGeometry args={[0.72, 0.2, 0.3]} />
        <meshStandardMaterial color="#1a2028" roughness={0.55} metalness={0.3} />
      </mesh>
      {[
        [0.26, 0.13],
        [0.26, -0.13],
        [-0.26, 0.13],
        [-0.26, -0.13],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#232b36" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0.37, 0.44, 0]}>
        <boxGeometry args={[0.03, 0.05, 0.16]} />
        <meshBasicMaterial color="#ff7a1a" />
      </mesh>
      <PooledLight position={[0, 0.9, 0]} intensity={3} distance={8} decay={2} color="#ff7a1a" />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]}>
        <ringGeometry args={[0.55, 0.62, 48]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.45} />
      </mesh>
    </group>
  )
}
