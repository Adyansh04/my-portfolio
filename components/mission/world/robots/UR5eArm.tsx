'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { asset } from '@/lib/base-path'
import { UR5E_DEF } from '@/lib/mission/robots'
import { ArticulatedRobot, type JointValues } from './ArticulatedRobot'
import { makeRobotMaterial, ur5eMaterialFor } from './robotMaterial'
import { useHologram } from '../holograms/HologramFrame'

const FOLDER = asset('/models/ur5e')
const NAMES = ['shoulder_pan_joint', 'shoulder_lift_joint', 'elbow_joint', 'wrist_1_joint', 'wrist_2_joint', 'wrist_3_joint']
/** Pick-and-place keyframes solved by inverse kinematics (scripts, 2026-09-03) so the tool really lands on the cube and the drop point. */
export const ARM_POSES: number[][] = [
  [2.839, -1.715, 1.801, -1.657, -1.571, 0.0], // home
  [2.655, -0.87, 1.271, -1.972, -1.571, 0.0], // pre-pick
  [2.655, -0.74, 1.35, -2.18, -1.571, 0.0], // pick
  [2.655, -0.92, 1.194, -1.845, -1.571, 0.0], // lift
  [-2.814, -0.827, 1.034, -1.778, -1.571, 0.0], // pre-place
  [-2.814, -0.665, 1.2, -2.106, -1.571, 0.0], // place
  [-2.814, -0.827, 1.034, -1.778, -1.571, 0.0], // retreat
]
export const ARM_SEG = 1.3
export const ARM_HOLD = 0.4
const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}
/** shortest signed arc from a to b */
const arc = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

export interface ArmPhase {
  segment: number
  u: number
  /** tool centre point in the parent group's frame */
  tcp: THREE.Vector3
}

/** Universal Robots UR5e cycling through a pick-and-place; reports the segment, progress and tool position each frame. */
export function UR5eArm({ scale = 1, onPhase, clock }: { scale?: number; onPhase?: (p: ArmPhase) => void; clock?: MutableRefObject<number> }) {
  const joints = useRef<JointValues>({})
  const material = useMemo(() => makeRobotMaterial(), [])
  const local = useRef(0)
  const wrist = useRef<THREE.Group | null>(null)
  const outer = useRef<THREE.Group>(null)
  const holo = useHologram()
  const phase = useMemo<ArmPhase>(() => ({ segment: 0, u: 0, tcp: new THREE.Vector3() }), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    const d = Math.min(0.05, dt || 0.016)
    local.current += d
    const t = clock ? clock.current : local.current
    const total = ARM_POSES.length * (ARM_SEG + ARM_HOLD)
    const tt = t % total
    const seg = Math.floor(tt / (ARM_SEG + ARM_HOLD))
    const u = smooth(Math.min(1, (tt - seg * (ARM_SEG + ARM_HOLD)) / ARM_SEG))
    const a = ARM_POSES[seg]
    const b = ARM_POSES[(seg + 1) % ARM_POSES.length]
    NAMES.forEach((n, i) => (joints.current[n] = a[i] + arc(a[i], b[i]) * u))
    if (wrist.current && outer.current?.parent) {
      // flange sits 0.1 m along the wrist's local +y (MJCF attachment site)
      wrist.current.updateWorldMatrix(true, false)
      tmp.set(0, 0.1, 0)
      wrist.current.localToWorld(tmp)
      outer.current.parent.worldToLocal(tmp)
      phase.tcp.copy(tmp)
    }
    phase.segment = seg
    phase.u = u
    onPhase?.(phase)
  })

  return (
    <group ref={outer} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <ArticulatedRobot def={UR5E_DEF} folder={FOLDER} joints={joints} material={material} materialFor={ur5eMaterialFor} probe={{ joint: 'wrist_3_joint', ref: wrist }} />
    </group>
  )
}
