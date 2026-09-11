'use client'

import { asset } from '@/lib/base-path'
import { GO2_DEF, GO2_LEGS } from '@/lib/mission/robots'
import { GO2_GAIT } from '@/lib/mission/gait'
import { QuadrupedRobot } from './QuadrupedRobot'
import { go2MaterialFor } from './robotMaterial'

const FOLDER = asset('/models/go2')

/** Unitree Go2 walking in place (hologram scale). */
export function Go2Mini({ scale = 0.6 }: { scale?: number }) {
  return <QuadrupedRobot def={GO2_DEF} folder={FOLDER} legs={GO2_LEGS} gait={GO2_GAIT} headingOffset={0} scale={scale} baseHeight={0.32} pose={{ x: 0, z: 0, yaw: 0 }} autoWalk materialFor={go2MaterialFor} flipAxis="z" />
}
