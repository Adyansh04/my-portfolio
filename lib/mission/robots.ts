/** Link tree emitted by scripts/models/urdf2json.py (or hand-written from MJCF). URDF frames: Z-up. */
export interface RobotJoint {
  name: string
  type: 'revolute' | 'continuous' | 'fixed' | 'prismatic' | string
  xyz: [number, number, number]
  rpy: [number, number, number]
  axis: [number, number, number]
  lower: number | null
  upper: number | null
}

export interface RobotLink {
  name: string
  parent: string | null
  joint: RobotJoint | null
  /** GLB file name inside the robot's model folder, or null for frame-only links */
  mesh: string | null
  meshXyz: [number, number, number]
  meshRpy: [number, number, number]
  meshScale: [number, number, number]
}

export interface RobotDef {
  name: string
  root: string
  links: RobotLink[]
}

/** Per-leg joint names of a quadruped, in kinematic order: abduction, hip (thigh pitch), knee. */
export type LegNames = { abd: string; hip: string; knee: string }
export type QuadrupedLegs = { FL: LegNames; FR: LegNames; RL: LegNames; RR: LegNames }

export const TRAKR_LEGS: QuadrupedLegs = {
  FL: { abd: 'FL_adduction', hip: 'FL_hip', knee: 'FL_knee' },
  FR: { abd: 'FR_adduction', hip: 'FR_hip', knee: 'FR_knee' },
  RL: { abd: 'RL_adduction', hip: 'RL_hip', knee: 'RL_knee' },
  RR: { abd: 'RR_adduction', hip: 'RR_hip', knee: 'RR_knee' },
}

export const GO2_LEGS: QuadrupedLegs = {
  FL: { abd: 'FL_hip_joint', hip: 'FL_thigh_joint', knee: 'FL_calf_joint' },
  FR: { abd: 'FR_hip_joint', hip: 'FR_thigh_joint', knee: 'FR_calf_joint' },
  RL: { abd: 'RL_hip_joint', hip: 'RL_thigh_joint', knee: 'RL_calf_joint' },
  RR: { abd: 'RR_hip_joint', hip: 'RR_thigh_joint', knee: 'RR_calf_joint' },
}

/** Go2 link tree transcribed from MuJoCo Menagerie go2.xml (BSD-3). MuJoCo frame: x forward, y left, z up. */
export const GO2_DEF: RobotDef = (() => {
  const legs: [string, number, number, boolean][] = [
    ['FL', 0.1934, 0.0465, false],
    ['FR', 0.1934, -0.0465, true],
    ['RL', -0.1934, 0.0465, false],
    ['RR', -0.1934, -0.0465, true],
  ]
  const links: RobotLink[] = [{ name: 'base', parent: null, joint: null, mesh: 'base.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] }]
  for (const [leg, x, y, mirror] of legs) {
    const hipRpy: [number, number, number] = leg === 'FR' ? [Math.PI, 0, 0] : leg === 'RL' ? [0, Math.PI, 0] : leg === 'RR' ? [0, 0, Math.PI] : [0, 0, 0]
    links.push(
      { name: `${leg}_hip`, parent: 'base', joint: { name: `${leg}_hip_joint`, type: 'revolute', xyz: [x, y, 0], rpy: [0, 0, 0], axis: [1, 0, 0], lower: -1.0472, upper: 1.0472 }, mesh: 'hip.glb', meshXyz: [0, 0, 0], meshRpy: hipRpy, meshScale: [1, 1, 1] },
      { name: `${leg}_thigh`, parent: `${leg}_hip`, joint: { name: `${leg}_thigh_joint`, type: 'revolute', xyz: [0, mirror ? -0.0955 : 0.0955, 0], rpy: [0, 0, 0], axis: [0, 1, 0], lower: -1.5708, upper: 3.4907 }, mesh: mirror ? 'thigh_mirror.glb' : 'thigh.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
      { name: `${leg}_calf`, parent: `${leg}_thigh`, joint: { name: `${leg}_calf_joint`, type: 'revolute', xyz: [0, 0, -0.213], rpy: [0, 0, 0], axis: [0, 1, 0], lower: -2.7227, upper: -0.83776 }, mesh: mirror ? 'calf_mirror.glb' : 'calf.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
      { name: `${leg}_foot`, parent: `${leg}_calf`, joint: { name: `${leg}_foot_fixed`, type: 'fixed', xyz: [0, 0, -0.213], rpy: [0, 0, 0], axis: [0, 0, 1], lower: null, upper: null }, mesh: 'foot.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
    )
  }
  return { name: 'go2', root: 'base', links }
})()

/** UR5e chain transcribed from Menagerie ur5e.xml (BSD-3). quat(1,0,1,0) = +90° about y. */
export const UR5E_DEF: RobotDef = {
  name: 'ur5e',
  root: 'base',
  links: [
    { name: 'base', parent: null, joint: null, mesh: 'base.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, Math.PI], meshScale: [1, 1, 1] },
    { name: 'shoulder_link', parent: 'base', joint: { name: 'shoulder_pan_joint', type: 'revolute', xyz: [0, 0, 0.163], rpy: [0, 0, Math.PI], axis: [0, 0, 1], lower: -6.28, upper: 6.28 }, mesh: 'shoulder.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
    { name: 'upper_arm_link', parent: 'shoulder_link', joint: { name: 'shoulder_lift_joint', type: 'revolute', xyz: [0, 0.138, 0], rpy: [0, Math.PI / 2, 0], axis: [0, 1, 0], lower: -6.28, upper: 6.28 }, mesh: 'upperarm.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
    { name: 'forearm_link', parent: 'upper_arm_link', joint: { name: 'elbow_joint', type: 'revolute', xyz: [0, -0.131, 0.425], rpy: [0, 0, 0], axis: [0, 1, 0], lower: -3.14, upper: 3.14 }, mesh: 'forearm.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
    { name: 'wrist_1_link', parent: 'forearm_link', joint: { name: 'wrist_1_joint', type: 'revolute', xyz: [0, 0, 0.392], rpy: [0, Math.PI / 2, 0], axis: [0, 1, 0], lower: -6.28, upper: 6.28 }, mesh: 'wrist1.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
    { name: 'wrist_2_link', parent: 'wrist_1_link', joint: { name: 'wrist_2_joint', type: 'revolute', xyz: [0, 0.127, 0], rpy: [0, 0, 0], axis: [0, 0, 1], lower: -6.28, upper: 6.28 }, mesh: 'wrist2.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
    { name: 'wrist_3_link', parent: 'wrist_2_link', joint: { name: 'wrist_3_joint', type: 'revolute', xyz: [0, 0, 0.1], rpy: [0, 0, 0], axis: [0, 1, 0], lower: -6.28, upper: 6.28 }, mesh: 'wrist3.glb', meshXyz: [0, 0, 0], meshRpy: [0, 0, 0], meshScale: [1, 1, 1] },
  ],
}
