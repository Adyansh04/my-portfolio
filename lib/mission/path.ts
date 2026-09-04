/**
 * The robot's route through the facility, one leg per content beat.
 * Within a beat the robot travels for the first MOVE fraction and holds for the rest,
 * so every beat has a still moment where the DOM content lands.
 */
import { ZONES } from './zones'
import type { XZ } from './facility'

export const MOVE = 0.55

export interface Leg {
  to: XZ
  via?: XZ[]
}

export const START: XZ = [4, 4]

/** ROUTE[zone][beat] */
export const ROUTE: Leg[][] = [
  // 0 spawn: boot, then two small steps toward the door
  [{ to: [4, 4] }, { to: [5.4, 4] }, { to: [7, 4] }],
  // 1 profile: through the partition door, face the display wall, drift to the corridor door
  [{ to: [11, 4.2], via: [[8, 4]] }, { to: [14, 3.2] }, { to: [17.6, 6.6] }],
  // 2 experience corridor: one placard per beat, nudged toward the placard's wall
  Array.from({ length: 6 }, (_, i) => ({ to: [i === 0 ? 17.9 : i % 2 === 0 ? 18.8 : 17.2, 10.5 + i * 3.3] as XZ, via: i === 0 ? ([[18, 8.6]] as XZ[]) : undefined })),
  // 3 projects hall: enter, then the zig-zag aisle (robot nudges toward each pedestal's side)
  Array.from({ length: 10 }, (_, i) => ({
    to: [30 - i * 3, i % 2 === 0 ? 36.8 : 39.2] as XZ,
    via: i === 0 ? ([[18, 29.2], [18.5, 31.6], [24, 35.5]] as XZ[]) : undefined,
  })),
  // 4 hackathons alcove
  [{ to: [-1.6, 39.7], via: [[1.2, 38], [-0.6, 38.6]] }, { to: [-4, 39.9] }, { to: [-6.3, 39.6] }],
  // 5 credentials archive: three rack stops heading north
  [{ to: [-5, 26], via: [[-7.2, 38.6], [-7.0, 36.6], [-5.2, 34.8], [-5, 33]] }, { to: [-5, 20] }, { to: [-5, 14] }],
  // 6 dock: through the door, onto the pad, hold
  [{ to: [-4.6, 6.4], via: [[-5, 9.6]] }, { to: [-4, 4] }, { to: [-4, 4] }],
]

const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}

function legStart(zone: number, beat: number): XZ {
  if (beat > 0) return ROUTE[zone][beat - 1].to
  if (zone > 0) {
    const prev = ROUTE[zone - 1]
    return prev[prev.length - 1].to
  }
  return START
}

function polyline(zone: number, beat: number): XZ[] {
  const leg = ROUTE[zone][beat]
  return [legStart(zone, beat), ...(leg.via ?? []), leg.to]
}

function pointAt(points: XZ[], f: number): { p: XZ; dir: XZ } {
  const lens: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    lens.push(l)
    total += l
  }
  if (total === 0) return { p: points[points.length - 1], dir: [0, 0] }
  let d = Math.min(1, Math.max(0, f)) * total
  for (let i = 1; i < points.length; i++) {
    const l = lens[i - 1]
    if (d <= l || i === points.length - 1) {
      const u = l === 0 ? 1 : d / l
      const a = points[i - 1]
      const b = points[i]
      return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], dir: [(b[0] - a[0]) / (l || 1), (b[1] - a[1]) / (l || 1)] }
    }
    d -= l
  }
  return { p: points[points.length - 1], dir: [0, 0] }
}

export interface RoutePose {
  x: number
  z: number
  /** unit travel direction (zero while holding) */
  dir: XZ
  /** 0..1 how much of this beat's leg has been travelled */
  legT: number
  moving: boolean
}

/** Robot ground pose for a zone-local position. */
export function routePose(zone: number, beat: number, beatT: number): RoutePose {
  const pts = polyline(zone, beat)
  const legT = smooth(beatT / MOVE)
  const { p, dir } = pointAt(pts, legT)
  const moving = beatT < MOVE && pts.length > 1 && !(pts.length === 2 && pts[0][0] === pts[1][0] && pts[0][1] === pts[1][1])
  return { x: p[0], z: p[1], dir: moving ? dir : [0, 0], legT, moving }
}

/** Densely sample the whole mission (for the reveal precompute and the minimap route). */
export function sampleRoute(samplesPerBeat = 24): { x: number; z: number; t: number }[] {
  const out: { x: number; z: number; t: number }[] = []
  const totalBeats = ZONES.reduce((s, z) => s + z.beats, 0)
  let k = 0
  ZONES.forEach((zd, zone) => {
    for (let b = 0; b < zd.beats; b++) {
      for (let s = 0; s < samplesPerBeat; s++) {
        const beatT = s / samplesPerBeat
        const pose = routePose(zone, b, beatT)
        out.push({ x: pose.x, z: pose.z, t: (k + beatT) / totalBeats })
      }
      k++
    }
  })
  return out
}

/** Global mission progress (0..1) for a zone-local position, beat-weighted so the reveal matches the route sampling. */
export function missionT(zone: number, beat: number, beatT: number): number {
  const totalBeats = ZONES.reduce((s, z) => s + z.beats, 0)
  const before = ZONES.slice(0, zone).reduce((s, z) => s + z.beats, 0)
  return (before + beat + Math.min(1, beatT)) / totalBeats
}
