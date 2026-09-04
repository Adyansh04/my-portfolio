'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import r1Json from '@/public/models/r1/robot.json'
import { asset } from '@/lib/base-path'
import type { RobotDef } from '@/lib/mission/robots'
import { mission } from '@/lib/mission/store'
import { ContactShadow } from '../ContactShadow'
import { ArticulatedRobot, type JointValues } from './ArticulatedRobot'
import { makeRobotMaterial, r1MaterialFor } from './robotMaterial'

const DEF = r1Json as RobotDef
const FOLDER = asset('/models/r1')
/** pelvis height at the URDF zero pose: leg chain sums to 0.674 m + foot */
const PELVIS = 0.71

interface Props {
  position: [number, number, number]
  /** world yaw the robot faces (rad, 0 = +X) */
  facing: number
}

/**
 * Unitree R1 standing by its placard: breathes, waves with the left arm when the hero robot is close,
 * and turns its head to follow it — the teleoperation / HRI work at Robotics Collective, literally.
 */
export function R1Humanoid({ position, facing }: Props) {
  const joints = useRef<JointValues>({})
  const material = useMemo(() => makeRobotMaterial('#dfe3e8'), [])
  const clock = useRef(0)
  const wave = useRef(0)
  const head = useRef(0)
  const outer = useRef<THREE.Group>(null)

  useFrame(({ camera }, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    if (Math.hypot(camera.position.x - position[0], camera.position.z - position[2]) > 26) return
    clock.current += d
    const t = clock.current
    const r = mission.robot
    const dx = r.x - position[0]
    const dz = r.z - position[2]
    const dist = Math.hypot(dx, dz)
    // direction to the hero robot in R1's own frame (forward = facing, left = facing + 90°)
    const fwd = dx * Math.cos(facing) - dz * Math.sin(facing)
    const left = -(dx * Math.sin(facing) + dz * Math.cos(facing))
    const targetHead = dist < 9 ? THREE.MathUtils.clamp(Math.atan2(left, fwd), -1.2, 1.2) : 0
    head.current += (targetHead - head.current) * (1 - Math.exp(-d * 3))
    wave.current += ((dist < 7 ? 1 : 0) - wave.current) * (1 - Math.exp(-d * 2.5))
    const breathe = Math.sin(t * 1.3) * 0.02
    const w = wave.current
    const v = joints.current
    v.head_yaw_joint = head.current
    v.head_pitch_joint = 0.05 + breathe * 0.5
    v.waist_roll_joint = breathe * 0.4
    v.left_shoulder_pitch_joint = -0.35 * w + breathe
    v.left_shoulder_roll_joint = 0.25 + 1.45 * w
    v.left_shoulder_yaw_joint = Math.sin(t * 6) * 0.25 * w
    v.left_elbow_joint = 0.35 + 0.9 * w
    v.right_shoulder_pitch_joint = 0.1 + breathe
    v.right_shoulder_roll_joint = -0.2
    v.right_elbow_joint = 0.35
    v.left_hip_pitch_joint = -0.08 + breathe * 0.5
    v.right_hip_pitch_joint = -0.08 + breathe * 0.5
    v.left_knee_joint = 0.18
    v.right_knee_joint = 0.18
    v.left_ankle_pitch_joint = -0.1
    v.right_ankle_pitch_joint = -0.1
    if (outer.current) outer.current.position.y = position[1] + PELVIS + breathe * 0.3
  })

  return (
    <group ref={outer} position={[position[0], position[1] + PELVIS, position[2]]} rotation={[0, facing, 0]}>
      <ContactShadow radius={0.34} stretch={1.1} opacity={0.5} y={-PELVIS + 0.016} />
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <ArticulatedRobot def={DEF} folder={FOLDER} joints={joints} material={material} materialFor={r1MaterialFor} />
      </group>
    </group>
  )
}
