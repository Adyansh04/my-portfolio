'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, Arena, BoxLines, CYAN, GridPlane, LabelPlate, MUTED, MotionTrail, WHITE, Wheel, useHoloClock, useHoloMaterial, useLineObject, type V3 } from './parts'

const BALLS: V3[] = [[-0.4, 0.04, -0.28], [0.35, 0.04, -0.32], [0.1, 0.04, 0.3]]
const SILOS: V3[] = [[0.55, 0.12, 0.28], [0.55, 0.12, 0.0], [0.55, 0.12, -0.28]]

/** R2 (ABU Robocon): mecanum base strafing the arena, YOLO on balls and silos, LSA08 line + TF-Luna beam to the silo. */
export function MecanumHologram() {
  const t = useHoloClock()
  const body = useHoloMaterial(ACCENT, 1)
  const ballMat = useHoloMaterial(WHITE, 1)
  const siloMat = useHoloMaterial(MUTED, 1)
  const robot = useRef<THREE.Group>(null)
  const mast = useRef<THREE.Mesh>(null)
  const spins = [useRef(0), useRef(0), useRef(0), useRef(0)]
  const beam = useLineObject(useMemo(() => [[0, 0.08, 0], SILOS[1]] as V3[], []), ACCENT, 0.8, 'segments')
  const lineTrack = useLineObject(useMemo(() => [[-0.55, 0.005, -0.38], [0.3, 0.005, -0.38], [0.3, 0.005, 0.38], [-0.55, 0.005, 0.38]] as V3[], []), WHITE, 0.35, 'line')
  const boxes = useRef<THREE.Group>(null)
  const ballRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(() => {
    const u = t.current * 0.55
    const x = Math.sin(u) * 0.38
    const z = Math.sin(2 * u) * 0.22
    if (robot.current) {
      robot.current.position.set(x, 0.06, z)
      robot.current.rotation.y = 0.35 + Math.sin(u * 0.5) * 0.15 // strafes: heading barely changes
    }
    if (mast.current) mast.current.rotation.y = t.current * 4
    const vx = Math.cos(u) * 0.38, vz = Math.cos(2 * u) * 0.44
    const s = [vx - vz, vx + vz, vx + vz, vx - vz]
    spins.forEach((r, i) => (r.current += s[i] * 0.08))
    const pos = beam.geometry.attributes.position as THREE.BufferAttribute
    pos.setXYZ(0, x, 0.1, z)
    pos.needsUpdate = true
    beam.visible = Math.hypot(SILOS[1][0] - x, SILOS[1][2] - z) < 0.6
    if (boxes.current) boxes.current.visible = Math.sin(t.current * 2.2) > -0.7
    ballRefs.current.forEach((b, i) => {
      if (b) b.position.y = 0.04 + Math.abs(Math.sin(t.current * 2 + i * 1.3)) * 0.02
    })
  })

  return (
    <group>
      <GridPlane w={1.3} h={0.9} step={0.1} opacity={0.18} />
      <Arena w={1.3} d={0.9} h={0.12} color={MUTED} opacity={0.5} />
      <primitive object={lineTrack} />
      <MotionTrail target={robot} color={CYAN} length={80} />
      <group ref={robot}>
        <mesh position={[0, 0.03, 0]} material={body}>
          <boxGeometry args={[0.3, 0.08, 0.22]} />
        </mesh>
        {[[-0.12, -0.13], [0.12, -0.13], [-0.12, 0.13], [0.12, 0.13]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
            <Wheel radius={0.055} width={0.035} rollers="mecanum" spin={spins[i]} />
          </group>
        ))}
        <mesh ref={mast} position={[0, 0.12, 0]} material={body}>
          <cylinderGeometry args={[0.025, 0.03, 0.08, 12]} />
        </mesh>
        <mesh position={[0.16, 0.06, 0]} material={body}>
          <boxGeometry args={[0.02, 0.03, 0.06]} />
        </mesh>
      </group>
      {BALLS.map((b, i) => (
        <mesh key={i} ref={(m) => { ballRefs.current[i] = m }} position={b} material={ballMat}>
          <sphereGeometry args={[0.035, 10, 10]} />
        </mesh>
      ))}
      {SILOS.map((s, i) => (
        <mesh key={i} position={s} material={siloMat}>
          <cylinderGeometry args={[0.05, 0.05, 0.24, 14, 1, true]} />
        </mesh>
      ))}
      <group ref={boxes}>
        {BALLS.map((b, i) => (
          <group key={i}>
            <BoxLines size={[0.1, 0.1, 0.1]} position={b} color={CYAN} opacity={0.9} />
            <LabelPlate text={`ball 0.9${4 - i}`} position={[b[0], b[1] + 0.12, b[2]]} width={0.16} color={CYAN} />
          </group>
        ))}
        <BoxLines size={[0.14, 0.28, 0.14]} position={SILOS[1]} color={CYAN} opacity={0.9} />
        <LabelPlate text="silo 0.91" position={[SILOS[1][0], SILOS[1][1] + 0.22, SILOS[1][2]]} width={0.16} color={CYAN} />
      </group>
      <primitive object={beam} />
      <LabelPlate text="TF-Luna · LSA08 line · Micro-ROS" position={[0, 0.55, -0.45]} width={0.6} color={MUTED} />
    </group>
  )
}
