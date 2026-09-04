'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, BoxLines, CYAN, Frustum, GridPlane, LabelPlate, MUTED, MotionTrail, WHITE, Wheel, useHoloClock, useHoloMaterial } from './parts'

const R = 0.17

/** Kiwi drive: three omni wheels at 120°, wheel velocity vectors, EKF covariance shrinking as it fuses, CSI camera detecting an object. */
export function KiwiHologram() {
  const t = useHoloClock()
  const plate = useHoloMaterial(ACCENT, 1)
  const pcb = useHoloMaterial(WHITE, 0.9)
  const led = useHoloMaterial(CYAN, 1)
  const ellipseMat = useHoloMaterial(CYAN, 0.9)
  const objMat = useHoloMaterial(WHITE, 0.8)
  const robot = useRef<THREE.Group>(null)
  const ellipse = useRef<THREE.Mesh>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const detect = useRef<THREE.Group>(null)
  const spins = [useRef(0), useRef(0), useRef(0)]

  useFrame(() => {
    const u = t.current * 0.6
    const x = Math.cos(u) * 0.32
    const z = Math.sin(u) * 0.32
    if (robot.current) {
      robot.current.position.set(x, 0.05, z)
      robot.current.rotation.y = -u + Math.PI / 2
    }
    const vx = 0.32, vy = 0.0, w = 0.6
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3
      spins[i].current += (-Math.sin(a) * vx + Math.cos(a) * vy + R * w) * 0.12
    }
    if (ellipse.current) {
      const k = 1 - ((t.current * 0.35) % 1)
      ellipse.current.scale.set(0.6 + k * 1.6, 1, 0.5 + k * 0.9)
      ellipse.current.position.set(x, 0.01, z)
      ellipse.current.rotation.y = -u
    }
    if (ledRef.current) ledRef.current.visible = Math.sin(t.current * 9) > 0
    // the camera "sees" the object when facing it
    if (detect.current) detect.current.visible = Math.cos(u - Math.PI) > 0.55
  })

  return (
    <group>
      <GridPlane w={1.1} h={1.1} step={0.1} opacity={0.18} />
      <MotionTrail target={robot} color={CYAN} length={90} />
      <mesh ref={ellipse} rotation-x={-Math.PI / 2} material={ellipseMat}>
        <ringGeometry args={[0.16, 0.175, 40]} />
      </mesh>
      <group ref={robot}>
        <mesh material={plate}>
          <cylinderGeometry args={[R + 0.02, R + 0.02, 0.02, 3]} />
        </mesh>
        <mesh position={[0, 0.03, 0]} material={pcb}>
          <boxGeometry args={[0.07, 0.01, 0.05]} />
        </mesh>
        <mesh ref={ledRef} position={[0.025, 0.04, 0.015]} material={led}>
          <sphereGeometry args={[0.006, 6, 6]} />
        </mesh>
        <group position={[0.1, 0.06, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={plate}>
            <cylinderGeometry args={[0.018, 0.018, 0.03, 10]} />
          </mesh>
          <Frustum fov={62} aspect={1.33} far={0.35} color={CYAN} opacity={0.4} />
        </group>
        {[0, 1, 2].map((i) => {
          const a = (i * 2 * Math.PI) / 3 + Math.PI / 2
          return (
            <group key={i} position={[Math.cos(a) * R, 0, Math.sin(a) * R]} rotation={[0, -a, 0]}>
              <Wheel radius={0.045} width={0.03} rollers="omni" spin={spins[i]} />
            </group>
          )
        })}
        {[0, 1, 2].map((i) => {
          const a = (i * 2 * Math.PI) / 3 + Math.PI / 2
          return (
            <mesh key={`v${i}`} position={[Math.cos(a) * R - Math.sin(a) * 0.045, 0.06, Math.sin(a) * R + Math.cos(a) * 0.045]} rotation={[0, -a, Math.PI / 2]} material={plate}>
              <cylinderGeometry args={[0.004, 0.004, 0.09, 4]} />
            </mesh>
          )
        })}
        <mesh position={[0.08, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} material={pcb}>
          <coneGeometry args={[0.02, 0.07, 8]} />
        </mesh>
      </group>
      {/* the object the CNN keeps finding */}
      <mesh position={[-0.42, 0.05, 0]} material={objMat}>
        <cylinderGeometry args={[0.035, 0.03, 0.1, 12]} />
      </mesh>
      <group ref={detect}>
        <BoxLines size={[0.1, 0.13, 0.1]} position={[-0.42, 0.06, 0]} color={CYAN} opacity={0.9} />
        <LabelPlate text="cup 0.88 · LVIS" position={[-0.42, 0.2, 0]} width={0.26} color={CYAN} />
      </group>
      <LabelPlate text="EKF · encoders + IMU" position={[0, 0.5, -0.4]} width={0.36} color={CYAN} />
      <LabelPlate text="ESP32 · Micro-ROS · N20" position={[0, 0.62, -0.4]} width={0.4} color={MUTED} />
    </group>
  )
}
