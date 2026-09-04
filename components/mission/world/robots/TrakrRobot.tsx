'use client'

import trakrJson from '@/public/models/trakr/robot.json'
import { asset } from '@/lib/base-path'
import { TRAKR_LEGS, type RobotDef } from '@/lib/mission/robots'
import { TRAKR_GAIT } from '@/lib/mission/gait'
import { QuadrupedRobot } from './QuadrupedRobot'
import { preloadRobot } from './ArticulatedRobot'
import { trakrMaterialFor } from './robotMaterial'

/** Addverb Trakr, the hero robot. Real size ≈ 0.5 m; drawn at 1.6× so it reads against 2.6 m walls. */
export const TRAKR_DEF = trakrJson as RobotDef
export const TRAKR_SCALE = 1.6
const FOLDER = asset('/models/trakr')

preloadRobot(TRAKR_DEF, FOLDER)

export function TrakrRobot() {
  // URDF forward is +Y → after Z-up→Y-up it points to -Z; -π/2 turns that onto world +X
  return <QuadrupedRobot def={TRAKR_DEF} folder={FOLDER} legs={TRAKR_LEGS} gait={TRAKR_GAIT} headingOffset={-Math.PI / 2} scale={TRAKR_SCALE} baseHeight={0.255} materialFor={trakrMaterialFor} tricks flipAxis="x" />
}
