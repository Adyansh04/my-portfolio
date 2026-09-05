/**
 * The two subjects every style renders, kept as plain data so the five styles are genuinely five
 * *styles* of the same thing rather than five different scenes. Local units: roughly 1.2 x 0.9,
 * sized to sit on a project pedestal.
 */
export type XZ = [number, number]

/* ---------------------------------------------------- Go2 autonomous inspection */

export interface Room {
  id: string
  x: number
  z: number
  w: number
  d: number
  /** objects the open-vocabulary detector found in this room */
  found: number
}

export const ROOMS: Room[] = [
  { id: 'zone_1', x: -0.32, z: -0.2, w: 0.42, d: 0.32, found: 3 },
  { id: 'zone_2', x: 0.24, z: -0.2, w: 0.54, d: 0.32, found: 5 },
  { id: 'zone_3', x: -0.32, z: 0.24, w: 0.42, d: 0.36, found: 2 },
  { id: 'zone_4', x: 0.24, z: 0.24, w: 0.54, d: 0.36, found: 4 },
]

export interface Wall {
  a: XZ
  b: XZ
}

/** Room outlines minus the doorways that connect them, so the plan reads as one navigable facility. */
export const WALLS: Wall[] = (() => {
  const out: Wall[] = []
  const gap = 0.1
  for (const r of ROOMS) {
    const x0 = r.x - r.w / 2
    const x1 = r.x + r.w / 2
    const z0 = r.z - r.d / 2
    const z1 = r.z + r.d / 2
    out.push({ a: [x0, z0], b: [x1, z0] }, { a: [x0, z1], b: [x1, z1] })
    // vertical walls split around a door at mid height
    const zm = (z0 + z1) / 2
    out.push({ a: [x0, z0], b: [x0, zm - gap] }, { a: [x0, zm + gap], b: [x0, z1] })
    out.push({ a: [x1, z0], b: [x1, zm - gap] }, { a: [x1, zm + gap], b: [x1, z1] })
  }
  return out
})()

export const PATROL: XZ[] = [
  [-0.32, -0.2],
  [0.05, -0.2],
  [0.24, -0.2],
  [0.44, 0.0],
  [0.24, 0.24],
  [0.0, 0.24],
  [-0.32, 0.24],
  [-0.5, 0.02],
  [-0.32, -0.2],
]

export interface Detection {
  p: XZ
  y: number
  label: string
}

export const DETECTIONS: Detection[] = [
  { p: [-0.36, -0.26], y: 0.09, label: 'fire extinguisher' },
  { p: [0.34, -0.28], y: 0.13, label: 'pallet stack' },
  { p: [0.12, -0.14], y: 0.1, label: 'office chair' },
  { p: [-0.28, 0.3], y: 0.08, label: 'toolbox' },
  { p: [0.36, 0.3], y: 0.15, label: 'shelving unit' },
  { p: [0.1, 0.18], y: 0.07, label: 'cable drum' },
]

/* ---------------------------------------------------- OLIVE factor graph */

export type FactorKind = 'lidar' | 'imu' | 'encoder' | 'fiducial' | 'vision' | 'loop'

export const FACTOR_COLOR: Record<FactorKind, string> = {
  lidar: '#4fd1ff',
  imu: '#ff7a1a',
  encoder: '#8ce563',
  fiducial: '#a98bff',
  vision: '#f2c94c',
  loop: '#ff4d6d',
}
export const FACTOR_LABEL: Record<FactorKind, string> = {
  lidar: 'LiDAR scan-to-map',
  imu: 'IMU preintegration',
  encoder: 'wheel odometry',
  fiducial: 'WhyCode marker',
  vision: 'monocular VO',
  loop: 'loop closure',
}

export interface Keyframe {
  /** ground-truth pose on the circuit */
  p: XZ
  /** how far round the loop, 0..1 */
  u: number
  /** accumulated drift before the loop closes */
  drift: XZ
}

/**
 * A 56 m circuit, as a superellipse so it is closed by construction — walking a rounded rectangle
 * by perimeter fraction is fiddly and the first attempt left a gap on one side.
 */
export const KEYFRAMES: Keyframe[] = (() => {
  const a = 0.46
  const b = 0.3
  const n = 3.4
  const pow = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n)
  const N = 26
  return Array.from({ length: N }, (_, i) => {
    const u = i / N
    const th = u * Math.PI * 2
    const p: XZ = [a * pow(Math.cos(th)), b * pow(Math.sin(th))]
    // drift grows quadratically round the loop, then the closure snaps it out
    const g = u * u * 0.09
    return { p, u, drift: [g * 0.9, -g * 0.6] as XZ }
  })
})()

export interface Factor {
  from: number
  /** index into KEYFRAMES, or a landmark id prefixed with 'L' */
  to: number | string
  kind: FactorKind
}

export const LANDMARKS: XZ[] = [
  [-0.22, -0.16],
  [0.3, 0.02],
  [-0.12, 0.2],
]

export const FACTORS: Factor[] = (() => {
  const out: Factor[] = []
  const n = KEYFRAMES.length
  for (let i = 0; i < n - 1; i++) {
    out.push({ from: i, to: i + 1, kind: 'lidar' })
    if (i % 2 === 0) out.push({ from: i, to: i + 1, kind: 'imu' })
    if (i % 3 === 0) out.push({ from: i, to: i + 1, kind: 'encoder' })
    if (i % 5 === 2) out.push({ from: i, to: i + 2 < n ? i + 2 : n - 1, kind: 'vision' })
  }
  LANDMARKS.forEach((_, li) => {
    for (const k of [2 + li * 8, 4 + li * 8]) if (k < n) out.push({ from: k, to: `L${li}`, kind: 'fiducial' })
  })
  out.push({ from: n - 1, to: 0, kind: 'loop' })
  return out
})()
