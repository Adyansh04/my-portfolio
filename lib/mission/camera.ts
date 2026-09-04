/**
 * Camera shots per zone, interpolated by zone progress. `follow` shots trail the robot.
 * Continuity rule: the first keyframe of a zone equals (or resolves to) the last keyframe of the
 * previous zone, so a zone change is a glide, never a cut. Every shot keeps the robot in frame.
 */
import type { RobotPose } from './store'
import { PEDESTALS } from './facility'

export type Vec3 = [number, number, number]

export interface Keyframe {
  zt: number
  /** absolute position, follow the robot with an offset (world axes), or the hall rig (opposite side of the aisle from the active pedestal) */
  pos: Vec3 | { follow: Vec3 } | 'hall'
  /** absolute target, the robot (+ optional world offset), or the midpoint of the robot and the active pedestal */
  look: Vec3 | { robot: Vec3 } | 'hall'
}

const R: Vec3 = [0, 0.35, 0]
const AHEAD_Z: Vec3 = [0, 0.4, 1.4] // robot travels +z (corridor)
const BACK_Z: Vec3 = [0, 0.5, -1.6] // robot travels -z (archive)
const HALL: Vec3 = [1.0, 0.35, 0] // robot travels -x; look slightly east so it sits left of centre (DOM card is on the right)

export const SHOTS: Keyframe[][] = [
  // 0 spawn (room x 0..8, z 0..8): low and close, rising as the sweep reveals the room
  [
    { zt: 0, pos: [1.0, 1.05, 7.2], look: { robot: R } },
    { zt: 1, pos: [2.4, 3.0, 7.4], look: { robot: R } },
  ],
  // 1 profile (room x 8..20): through the partition door with the robot, wall shot with the robot in front of the screen, then to the corridor door behind it
  [
    { zt: 0, pos: [2.4, 3.0, 7.4], look: { robot: R } },
    { zt: 0.1, pos: [6.4, 2.0, 4.9], look: { robot: R } },
    { zt: 0.2, pos: [9.4, 1.9, 4.4], look: { robot: R } },
    { zt: 0.45, pos: [12.6, 2.3, 7.0], look: [13.6, 1.2, 1.0] },
    { zt: 0.7, pos: [14.2, 2.1, 6.6], look: [14, 1.3, 0.8] },
    { zt: 1, pos: [17.4, 2.4, 3.3], look: { robot: AHEAD_Z } },
  ],
  // 2 corridor (x 16..20): follow from behind-above (resolves to ≈ the previous keyframe at the boundary)
  [
    { zt: 0, pos: { follow: [0, 2.4, -3.4] }, look: { robot: AHEAD_Z } },
    { zt: 1, pos: { follow: [0, 2.3, -3.3] }, look: { robot: AHEAD_Z } },
  ],
  // 3 hall (x 0..34): trail through the door until the robot is well inside, then rise to the south side of the
  // aisle and frame robot + active pedestal together (the DOM card sits on the right, so subjects stay left of centre)
  [
    { zt: 0, pos: { follow: [0, 2.3, -3.3] }, look: { robot: AHEAD_Z } },
    { zt: 0.045, pos: { follow: [0, 2.4, -2.2] }, look: { robot: [0, 0.4, 0.8] } },
    { zt: 0.1, pos: 'hall', look: 'hall' },
    { zt: 1, pos: 'hall', look: 'hall' },
  ],
  // 4 alcove (x -8..0, z 34..42): through the door with the robot, then a slow orbit behind it facing the podiums
  [
    { zt: 0, pos: 'hall', look: 'hall' },
    { zt: 0.04, pos: { follow: [3.0, 2.2, 0.2] }, look: { robot: R } },
    { zt: 0.14, pos: [-0.6, 2.4, 41.6], look: [-3.6, 0.9, 38.6] },
    { zt: 0.55, pos: [-3.2, 2.6, 41.6], look: [-4, 0.9, 38.4] },
    { zt: 1, pos: [-6.2, 2.4, 41.3], look: [-4.6, 0.9, 38.6] },
  ],
  // 5 archive corridor (x -8..-2): tracking shot through the door span (robot travels -z)
  [
    { zt: 0, pos: { follow: [0.5, 2.2, 2.0] }, look: { robot: BACK_Z } },
    { zt: 1, pos: { follow: [0.4, 2.1, 3.0] }, look: { robot: BACK_Z } },
  ],
  // 6 dock: trail through the door, rise over the walls for the loop closure, settle to a low hero angle on the docked robot
  [
    { zt: 0, pos: { follow: [0.4, 2.1, 3.0] }, look: { robot: BACK_Z } },
    { zt: 0.12, pos: [-3.0, 4.6, 10.5], look: [-4, 0.4, 5] },
    { zt: 0.35, pos: [-1.5, 7.5, 12.5], look: [-3, 0, 4] },
    { zt: 0.6, pos: [-2.5, 4.2, 9.5], look: [-4, 0.4, 4.2] },
    { zt: 1, pos: [-7.3, 1.15, 7.4], look: [-4, 0.45, 4] },
  ],
]

const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}
const lerp3 = (a: Vec3, b: Vec3, u: number): Vec3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]

const AISLE_Z = 38
function resolvePos(k: Keyframe, robot: RobotPose, beat: number): Vec3 {
  if (k.pos === 'hall') {
    // stand across the aisle from the active pedestal, trailing the robot: the robot ends up between camera and hologram
    const p = PEDESTALS[Math.min(PEDESTALS.length - 1, Math.max(0, beat))]
    // close to the aisle and high: the same-side neighbour pedestals stay behind the camera plane
    return [robot.x + 4.2, 3.5, AISLE_Z - p.side * 2.6]
  }
  if (Array.isArray(k.pos)) return k.pos
  const o = k.pos.follow
  return [robot.x + o[0], robot.y + o[1], robot.z + o[2]]
}
function resolveLook(k: Keyframe, robot: RobotPose, beat: number): Vec3 {
  if (k.look === 'hall') {
    const p = PEDESTALS[Math.min(PEDESTALS.length - 1, Math.max(0, beat))]
    // midpoint of robot and hologram, nudged toward the camera's right so both sit left of centre
    // (south camera looks -z → +x is right; north camera looks +z → -x is right)
    return [(robot.x + p.x) / 2 - p.side * 1.1, 0.8, (robot.z + p.z) / 2]
  }
  if (Array.isArray(k.look)) return k.look
  const o = k.look.robot
  return [robot.x + o[0], robot.y + o[1], robot.z + o[2]]
}

/** Target camera position + look-at for the current zone progress (before damping). */
export function shotAt(zone: number, zt: number, robot: RobotPose, beat = 0): { pos: Vec3; look: Vec3 } {
  const keys = SHOTS[zone]
  let i = 0
  while (i < keys.length - 2 && zt > keys[i + 1].zt) i++
  const a = keys[i]
  const b = keys[Math.min(i + 1, keys.length - 1)]
  const span = b.zt - a.zt || 1
  const u = smooth((zt - a.zt) / span)
  return { pos: lerp3(resolvePos(a, robot, beat), resolvePos(b, robot, beat), u), look: lerp3(resolveLook(a, robot, beat), resolveLook(b, robot, beat), u) }
}
