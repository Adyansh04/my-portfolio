'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, BoxLines, CYAN, Frustum, GridPlane, LabelPlate, MUTED, MotionTrail, WHITE, Wheel, smooth, useHoloClock, useHoloMaterial, type V3 } from './parts'

const ROWS = [-0.42, 0.0, 0.42]
const PLANTS: V3[] = ROWS.flatMap((x) => [-0.32, 0.0, 0.32].map((z) => [x, 0, z] as V3))
const CYCLE = 10

/** AgroBot: X-drive base with a 3-DOF arm working crop rows; YOLO on the cotton bolls; Cartographer SLAM trail. */
export function AgroHologram() {
  const t = useHoloClock()
  const body = useHoloMaterial(ACCENT, 1)
  const stemMat = useHoloMaterial(MUTED, 0.9)
  const bollMat = useHoloMaterial(WHITE, 1)
  const j1 = useRef<THREE.Group>(null)
  const j2 = useRef<THREE.Group>(null)
  const j3 = useRef<THREE.Group>(null)
  const gripL = useRef<THREE.Mesh>(null)
  const gripR = useRef<THREE.Mesh>(null)
  const robot = useRef<THREE.Group>(null)
  const spins = useMemo(() => [0, 1, 2, 3].map(() => ({ current: 0 })), [])
  const boxes = useRef<THREE.Group>(null)
  const picked = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const u = (t.current % CYCLE) / CYCLE
    const target = PLANTS[Math.floor(t.current / CYCLE) % PLANTS.length]
    const drive = smooth(u / 0.3)
    if (robot.current) {
      const sx = -0.1, sz = 0.0
      robot.current.position.set(sx + (target[0] * 0.62 - sx) * drive, 0.05, sz + (target[2] * 0.62 - sz) * drive)
      robot.current.rotation.y = Math.atan2(-(target[2] - robot.current.position.z), target[0] - robot.current.position.x)
    }
    spins.forEach((s, i) => (s.current += drive < 0.999 ? 0.15 * (i % 2 ? 1 : -1) : 0))
    const reach = smooth((u - 0.35) / 0.25) * (1 - smooth((u - 0.8) / 0.15))
    const close = smooth((u - 0.55) / 0.08) * (1 - smooth((u - 0.85) / 0.1))
    if (j1.current) j1.current.rotation.y = -0.2 + 0.2 * Math.sin(u * 6)
    if (j2.current) j2.current.rotation.z = -0.3 - 0.9 * reach
    if (j3.current) j3.current.rotation.z = 0.8 + 0.6 * reach
    if (gripL.current) gripL.current.position.z = 0.02 - 0.012 * close
    if (gripR.current) gripR.current.position.z = -0.02 + 0.012 * close
    if (boxes.current) boxes.current.visible = Math.sin(t.current * 2.5) > -0.75
    if (picked.current) picked.current.visible = close > 0.5
  })

  return (
    <group>
      <GridPlane w={1.3} h={1.0} step={0.1} opacity={0.15} />
      {ROWS.map((x) => (
        <mesh key={x} position={[x, 0.004, 0]} rotation-x={-Math.PI / 2} material={stemMat}>
          <planeGeometry args={[0.08, 1.0]} />
        </mesh>
      ))}
      {PLANTS.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.16, 0]} material={stemMat}>
            <cylinderGeometry args={[0.008, 0.012, 0.32, 6]} />
          </mesh>
          <mesh position={[0, 0.32, 0]} material={bollMat}>
            <sphereGeometry args={[0.035, 10, 10]} />
          </mesh>
          <mesh position={[0.04, 0.22, 0.02]} material={bollMat}>
            <sphereGeometry args={[0.025, 8, 8]} />
          </mesh>
          <mesh position={[-0.03, 0.12, -0.02]} rotation={[0, 0, 0.6]} material={stemMat}>
            <planeGeometry args={[0.06, 0.03]} />
          </mesh>
        </group>
      ))}
      <group ref={boxes}>
        {PLANTS.map((p, i) => (
          <group key={i}>
            <BoxLines size={[0.11, 0.11, 0.11]} position={[p[0], 0.32, p[2]]} color={CYAN} opacity={0.9} />
            {i % 3 === 1 && <LabelPlate text={`boll 0.9${(i * 7) % 10}`} position={[p[0], 0.46, p[2]]} width={0.16} color={CYAN} />}
          </group>
        ))}
      </group>
      <MotionTrail target={robot} color={ACCENT} length={80} opacity={0.4} />
      <group ref={robot}>
        <mesh position={[0, 0.03, 0]} material={body}>
          <boxGeometry args={[0.26, 0.07, 0.26]} />
        </mesh>
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz], i) => (
          <group key={i} position={[sx * 0.15, 0, sz * 0.15]} rotation={[0, (sx * sz > 0 ? 1 : -1) * Math.PI / 4, 0]}>
            <Wheel radius={0.045} width={0.03} rollers="omni" spin={spins[i]} />
          </group>
        ))}
        <group position={[0.06, 0.09, 0]}>
          <Frustum fov={60} aspect={1.33} far={0.35} color={CYAN} opacity={0.4} />
        </group>
        <group ref={j1} position={[-0.05, 0.07, 0]}>
          <mesh position={[0, 0.03, 0]} material={body}>
            <cylinderGeometry args={[0.03, 0.03, 0.06, 10]} />
          </mesh>
          <group ref={j2} position={[0, 0.06, 0]}>
            <mesh position={[0.09, 0, 0]} material={body}>
              <boxGeometry args={[0.18, 0.025, 0.025]} />
            </mesh>
            <group ref={j3} position={[0.18, 0, 0]}>
              <mesh position={[0.075, 0, 0]} material={body}>
                <boxGeometry args={[0.15, 0.02, 0.02]} />
              </mesh>
              <mesh ref={gripL} position={[0.16, 0, 0.02]} material={body}>
                <boxGeometry args={[0.03, 0.012, 0.008]} />
              </mesh>
              <mesh ref={gripR} position={[0.16, 0, -0.02]} material={body}>
                <boxGeometry args={[0.03, 0.012, 0.008]} />
              </mesh>
              <mesh ref={picked} position={[0.17, 0, 0]} material={bollMat}>
                <sphereGeometry args={[0.02, 8, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
      <LabelPlate text="Cartographer SLAM · YOLO bolls · action servers" position={[0, 0.72, -0.5]} width={0.78} color={MUTED} />
    </group>
  )
}
