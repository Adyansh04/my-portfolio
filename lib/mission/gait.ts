/**
 * Procedural trot for a quadruped: diagonal pairs (FL+RR, FR+RL) half a cycle apart.
 * Everything is a small offset around the robot's own standing pose, so the same code
 * drives Trakr (zero pose = stance) and Go2 (stance thigh 0.8, calf -1.5).
 */
export interface GaitParams {
  /** standing angles */
  abd0: number
  hip0: number
  knee0: number
  /** swing amplitudes (rad) */
  hipAmp: number
  kneeAmp: number
  abdAmp: number
  /** +1/-1: which way the hip swings forward and the knee folds up for this URDF */
  hipSign: 1 | -1
  kneeSign: 1 | -1
  /** metres per full cycle */
  stride: number
  /** vertical bob amplitude (m) */
  bob: number
}

// FK check (scripts, 2026-09-03): Trakr toe moves forward for NEGATIVE hip angles and lifts for NEGATIVE knee angles
export const TRAKR_GAIT: GaitParams = { abd0: 0, hip0: 0, knee0: 0, hipAmp: 0.32, kneeAmp: 0.42, abdAmp: 0.03, hipSign: -1, kneeSign: -1, stride: 0.3, bob: 0.008 }
// Go2: same convention — thigh +0.3 moves the foot back, calf -0.3 lifts it
export const GO2_GAIT: GaitParams = { abd0: 0, hip0: 0.8, knee0: -1.5, hipAmp: 0.28, kneeAmp: 0.55, abdAmp: 0.04, hipSign: -1, kneeSign: -1, stride: 0.36, bob: 0.012 }

export interface LegAngles {
  abd: number
  hip: number
  knee: number
}
export type LegSet = { FL: LegAngles; FR: LegAngles; RL: LegAngles; RR: LegAngles }

/**
 * @param phase   gait phase in radians (advances with distance travelled)
 * @param blend   0 = standing still, 1 = full stride (fades the swing in/out smoothly)
 * @param idle    seconds, for the breathing motion while standing
 */
export function trot(p: GaitParams, phase: number, blend: number, idle: number): LegSet {
  const breathe = Math.sin(idle * 1.4) * 0.012 * (1 - blend)
  const leg = (ph: number, side: 1 | -1): LegAngles => {
    const s = Math.sin(ph)
    const swing = Math.max(0, Math.sin(ph + 0.35)) // lift only during the swing half
    return {
      abd: p.abd0 + side * p.abdAmp * Math.sin(ph / 2) * blend,
      hip: p.hip0 + p.hipSign * (p.hipAmp * s * blend + breathe),
      knee: p.knee0 + p.kneeSign * (p.kneeAmp * swing * blend - breathe * 0.5),
    }
  }
  return {
    FL: leg(phase, 1),
    RR: leg(phase, -1),
    FR: leg(phase + Math.PI, -1),
    RL: leg(phase + Math.PI, 1),
  }
}
