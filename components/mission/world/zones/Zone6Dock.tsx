'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { DOCK_PAD, SPAWN_PAD } from '@/lib/mission/facility'
import { mission } from '@/lib/mission/store'
import { PooledLight } from '../LightPool'

/** Spawn pad and the docking station: pad ring, charging post with an LED bar that fills once the robot is docked. */
export function Zone6Dock() {
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  const led = useRef<THREE.Mesh>(null)
  const ledMat = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }, dt) => {
    const docked = mission.zone === 6 && mission.beat >= 1
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * (docked ? 1.2 : 3))
    if (ring.current) ring.current.opacity = docked ? 0.9 : 0.35 + pulse * 0.3
    const fill = docked ? Math.min(1, ((mission.zoneT - 0.35) / 0.5) * 1.2) : 0.05
    if (led.current) {
      led.current.scale.y += (Math.max(0.05, fill) - led.current.scale.y) * Math.min(1, dt * 3)
      led.current.position.y = 0.4 + (led.current.scale.y * 0.8) / 2
    }
    if (ledMat.current) ledMat.current.emissiveIntensity = docked ? 1.4 : 0.4 + pulse * 0.3
  })
  return (
    <group>
      <mesh position={[SPAWN_PAD[0], 0.012, SPAWN_PAD[1]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 1.0, 48]} />
        <meshBasicMaterial color="#2a3340" transparent opacity={0.9} />
      </mesh>
      <group position={[DOCK_PAD[0], 0, DOCK_PAD[1]]}>
        <mesh position={[0, 0.012, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.9, 1.02, 48]} />
          <meshBasicMaterial ref={ring} color="#ff7a1a" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.006, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.88, 48]} />
          <meshStandardMaterial color="#141a22" roughness={0.6} />
        </mesh>
        {/* charging post against the west wall */}
        <group position={[-3.6, 0, 0]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.3, 1.4, 0.5]} />
            <meshStandardMaterial color="#141a22" roughness={0.7} />
          </mesh>
          <mesh ref={led} position={[0.16, 0.8, 0]} scale={[1, 0.05, 1]}>
            <boxGeometry args={[0.02, 0.8, 0.08]} />
            <meshStandardMaterial ref={ledMat} color="#ff7a1a" emissive="#ff7a1a" emissiveIntensity={0.6} />
          </mesh>
        </group>
        <PooledLight position={[0, 1.2, 0]} color="#ff7a1a" intensity={2} distance={6} decay={2} />
      </group>
    </group>
  )
}
