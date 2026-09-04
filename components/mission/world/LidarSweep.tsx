'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'
import { sweepFrag, sweepVert } from './shaders/sweep'

const RADIUS = 9

/** The rotating LiDAR beam on the floor around the robot. Off once docked. */
export function LidarSweep() {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uAngle: { value: 0 }, uAccent: { value: new THREE.Color('#ff7a1a') }, uOn: { value: 1 } },
        vertexShader: sweepVert,
        fragmentShader: sweepFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useFrame((_, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    material.uniforms.uAngle.value += d * 1.6
    const on = mission.mode === 'dock' && mission.beat >= 1 ? 0 : 1
    material.uniforms.uOn.value += (on - material.uniforms.uOn.value) * (1 - Math.exp(-d * 3))
    if (mesh.current) mesh.current.position.set(mission.robot.x, 0.03, mission.robot.z)
  })
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} material={material} frustumCulled={false}>
      <planeGeometry args={[RADIUS * 2, RADIUS * 2]} />
    </mesh>
  )
}
