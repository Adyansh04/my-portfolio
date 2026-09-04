'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'
import type { QuadrupedLegs, RobotDef, RobotLink } from '@/lib/mission/robots'
import { trot, type GaitParams } from '@/lib/mission/gait'
import { ArticulatedRobot, type JointValues } from './ArticulatedRobot'
import { makeRobotMaterial } from './robotMaterial'

interface Props {
  def: RobotDef
  folder: string
  legs: QuadrupedLegs
  gait: GaitParams
  /** yaw (rad) that turns the URDF's forward axis (after Z-up→Y-up) onto world +X */
  headingOffset: number
  /** visual scale of the whole robot */
  scale?: number
  /** base height above ground at scale 1 (m) */
  baseHeight: number
  /** drive from the mission store (hero robot) or from a fixed pose (hologram) */
  pose?: { x: number; z: number; yaw: number }
  /** hologram mode: constant slow walk regardless of scroll */
  autoWalk?: boolean
  /** real-world palette per link */
  materialFor?: (link: RobotLink) => THREE.Material
  /** greet at spawn and celebrate at the dock: wave a front leg, then backflip (hero robot only) */
  tricks?: boolean
  /** local axis of the body group that a backflip rotates around ('x' for Y-forward URDFs like Trakr, 'z' for X-forward like Go2) */
  flipAxis?: 'x' | 'z'
}

const smoothstep = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}
/** trick timeline (seconds): idle → wave → idle → flip → idle, looping while the robot is parked */
const TRICK_CYCLE = 12
const WAVE = [1.8, 5.0]
const FLIP = [6.8, 8.3]

/** A walking quadruped: ArticulatedRobot + procedural trot driven by distance travelled. */
export function QuadrupedRobot({ def, folder, legs, gait, headingOffset, scale = 1, baseHeight, pose, autoWalk = false, materialFor, tricks = false, flipAxis = 'x' }: Props) {
  const outer = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const joints = useRef<JointValues>({})
  const material = useMemo(() => makeRobotMaterial(), [])
  const state = useRef({ phase: 0, blend: 0, idle: 0, trick: 0, parked: 0 })

  useFrame((_, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    const s = state.current
    const r = pose ?? mission.robot
    const speed = autoWalk ? 0.6 : (pose ? 0 : mission.robot.speed)
    const target = speed > 0.05 ? 1 : 0
    s.blend += (target - s.blend) * (1 - Math.exp(-d * 6))
    s.phase += (2 * Math.PI * speed * d) / gait.stride
    s.idle += d
    const set = trot(gait, s.phase, s.blend, s.idle)
    const v = joints.current
    ;(['FL', 'FR', 'RL', 'RR'] as const).forEach((leg) => {
      const n = legs[leg]
      const a = set[leg]
      v[n.abd] = a.abd
      v[n.hip] = a.hip
      v[n.knee] = a.knee
    })
    let lift = 0
    let pitch = 0
    let roll = 0
    if (tricks) {
      // parked = standing still at the spawn pad (zone 0, beat 0) or on the dock (zone 6, beat ≥ 1)
      const parkedNow = s.blend < 0.08 && ((mission.zone === 0 && mission.beat === 0) || (mission.zone === 6 && mission.beat >= 1))
      s.parked += ((parkedNow ? 1 : 0) - s.parked) * (1 - Math.exp(-d * 5))
      s.trick = parkedNow ? (s.trick + d) % TRICK_CYCLE : 0
      const t = s.trick
      // --- wave: front-left leg up, shank waving; body leans back a touch
      const wIn = smoothstep((t - WAVE[0]) / 0.5) * (1 - smoothstep((t - WAVE[1] + 0.5) / 0.5)) * s.parked
      if (wIn > 0) {
        const n = legs.FL
        v[n.hip] = v[n.hip] * (1 - wIn) + (gait.hip0 + gait.hipSign * 1.15) * wIn
        v[n.knee] = v[n.knee] * (1 - wIn) + (gait.knee0 + gait.kneeSign * (0.95 + 0.35 * Math.sin(t * 13))) * wIn
        v[n.abd] = v[n.abd] * (1 - wIn) + gait.abdAmp * 3 * wIn
        pitch += 0.1 * wIn
        roll += 0.05 * wIn
        lift += -0.01 * wIn
      }
      // --- backflip: tuck, jump, one full rotation about the lateral axis, land
      const fu = (t - FLIP[0]) / (FLIP[1] - FLIP[0])
      if (fu > 0 && fu < 1 && s.parked > 0.5) {
        const tuck = smoothstep(fu / 0.18) * (1 - smoothstep((fu - 0.8) / 0.2))
        ;(['FL', 'FR', 'RL', 'RR'] as const).forEach((leg) => {
          const n = legs[leg]
          v[n.hip] = v[n.hip] * (1 - tuck) + (gait.hip0 + gait.hipSign * 0.7) * tuck
          v[n.knee] = v[n.knee] * (1 - tuck) + (gait.knee0 + gait.kneeSign * 1.35) * tuck
        })
        pitch += Math.PI * 2 * smoothstep((fu - 0.08) / 0.84)
        lift += 0.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, (fu - 0.05) / 0.9)))
      }
      // landing squat
      const lu = (t - FLIP[1]) / 0.35
      if (lu > 0 && lu < 1) lift += -0.035 * Math.sin(Math.PI * lu)
    }
    if (outer.current) {
      outer.current.position.set(r.x, 0, r.z)
      outer.current.rotation.y = r.yaw + headingOffset
    }
    if (body.current) {
      body.current.position.y = (baseHeight + Math.sin(s.phase * 2) * gait.bob * s.blend + lift) * scale
      body.current.rotation.set(0, 0, 0)
      if (flipAxis === 'x') body.current.rotation.set(pitch, 0, roll)
      else body.current.rotation.set(roll, 0, pitch)
    }
  })

  return (
    <group ref={outer}>
      <group ref={body} scale={scale}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <ArticulatedRobot def={def} folder={folder} joints={joints} material={material} materialFor={materialFor} />
        </group>
      </group>
    </group>
  )
}
