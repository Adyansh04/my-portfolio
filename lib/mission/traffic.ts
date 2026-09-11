/**
 * Ambient facility traffic: the AMR fleet, the drone patrols and the two humanoids playing catch.
 * Pure data + pure sampling functions — the components only read from here, so routes can be
 * checked (and tweaked) without touching three.js. Units: metres, seconds. Same frame as facility.ts.
 */
import type { XZ } from './facility'

/* ------------------------------------------------------------------ AMRs */

export type Action = 'pick' | 'drop'

export interface Stop {
  p: XZ
  /** seconds parked here */
  dwell?: number
  action?: Action
}

export interface RouteDef {
  id: string
  /** m/s along the straights */
  speed: number
  /** seconds to offset this unit's phase, so the fleet isn't in lockstep */
  phase: number
  /** units sharing this loop, spread evenly around it (default 1) */
  units?: number
  /** a run with no pick/drop stops: true = the unit is loaded the whole way */
  carrying?: boolean
  /** closed loop: the last stop drives back to the first */
  stops: Stop[]
}

export interface Seg {
  t0: number
  t1: number
  hold: boolean
  a: XZ
  b: XZ
  /** heading held during this segment (a hold faces where it is about to drive) */
  yaw: number
  action?: Action
  /** carrying a crate when the segment starts */
  carry: boolean
}

export interface Timeline {
  segs: Seg[]
  cycle: number
  /** polyline of the drive path, for the painted floor lane */
  lane: XZ[]
}

const dist = (a: XZ, b: XZ) => Math.hypot(b[0] - a[0], b[1] - a[1])
/** world yaw of a heading, matching the robot convention (0 = +X, +Z is "down") */
const heading = (a: XZ, b: XZ) => Math.atan2(-(b[1] - a[1]), b[0] - a[0])

export function buildTimeline(r: RouteDef): Timeline {
  const n = r.stops.length
  // carrying state is a fixed point of one lap: run the actions once to find where the lap starts
  let carry = r.carrying ?? false
  for (let pass = 0; pass < 2; pass++)
    for (const s of r.stops) {
      if (s.action === 'pick') carry = true
      else if (s.action === 'drop') carry = false
    }

  const segs: Seg[] = []
  let t = 0
  for (let i = 0; i < n; i++) {
    const s = r.stops[i]
    const next = r.stops[(i + 1) % n]
    const yaw = heading(s.p, next.p)
    if (s.dwell) {
      segs.push({ t0: t, t1: t + s.dwell, hold: true, a: s.p, b: s.p, yaw, action: s.action, carry })
      t += s.dwell
      if (s.action === 'pick') carry = true
      else if (s.action === 'drop') carry = false
    }
    const travel = dist(s.p, next.p) / r.speed
    segs.push({ t0: t, t1: t + travel, hold: false, a: s.p, b: next.p, yaw, carry })
    t += travel
  }
  return { segs, cycle: t, lane: r.stops.map((s) => s.p) }
}

export interface AmrPose {
  x: number
  z: number
  yaw: number
  /** 0 deck down / empty … 1 deck raised with a crate on it */
  load: number
  moving: boolean
  action?: Action
}

const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}
const band = (u: number, lo: number, hi: number) => smooth((u - lo) / (hi - lo))

export function samplePose(tl: Timeline, s: number): AmrPose {
  const t = ((s % tl.cycle) + tl.cycle) % tl.cycle
  let seg = tl.segs[tl.segs.length - 1]
  for (const c of tl.segs)
    if (t < c.t1) {
      seg = c
      break
    }
  const u = (t - seg.t0) / Math.max(1e-4, seg.t1 - seg.t0)
  const load = seg.hold
    ? seg.action === 'pick'
      ? band(u, 0.15, 0.6)
      : seg.action === 'drop'
        ? 1 - band(u, 0.4, 0.85)
        : seg.carry
          ? 1
          : 0
    : seg.carry
      ? 1
      : 0
  return {
    x: seg.a[0] + (seg.b[0] - seg.a[0]) * u,
    z: seg.a[1] + (seg.b[1] - seg.a[1]) * u,
    yaw: seg.yaw,
    load,
    moving: !seg.hold,
    action: seg.hold ? seg.action : undefined,
  }
}

/**
 * Five units, one per room the mission passes through. Lanes are laid out to clear the pedestals,
 * racks and podiums, and to stay off the hero robot's route — where they do cross it (the hall
 * aisle, the experience corridor) the unit yields, which is the point.
 */
export const AMR_ROUTES: RouteDef[] = [
  {
    // hall: two units on one clockwise perimeter lap, half a lap apart, so the west and east halves
    // of the room always have traffic in them
    id: 'hall',
    speed: 1.2,
    phase: 0,
    units: 2,
    stops: [
      { p: [31.8, 31.6] },
      { p: [28.5, 31.6], dwell: 2.6, action: 'drop' },
      { p: [14.5, 31.6], dwell: 2.4, action: 'pick' },
      { p: [1.5, 31.6] },
      { p: [1.5, 43.6] },
      { p: [7.5, 43.6], dwell: 2.4, action: 'drop' },
      { p: [20.5, 43.6], dwell: 2.4, action: 'pick' },
      { p: [31.8, 43.6] },
    ],
  },
  {
    // experience corridor: a loaded through-run between the hall and the profile room, hugging the
    // east wall past the placards. Too narrow for stations, so it never sets its tote down here.
    id: 'corridor',
    speed: 1.35,
    phase: 6,
    carrying: true,
    stops: [
      { p: [19.0, 9.4], dwell: 2.4 },
      { p: [19.0, 28.6], dwell: 2.4 },
    ],
  },
  {
    // archive corridor: pulls a tote off the first rack row and files it on the last
    id: 'archive',
    speed: 0.95,
    phase: 11,
    stops: [
      { p: [-3.5, 14], dwell: 3.0, action: 'pick' },
      { p: [-3.5, 26], dwell: 3.0, action: 'drop' },
    ],
  },
  {
    // profile room: crosses the mid-ground of the wide shot, below the display wall
    id: 'profile',
    speed: 0.85,
    phase: 3,
    stops: [
      { p: [10.6, 6.3], dwell: 2.4, action: 'pick' },
      { p: [16.4, 6.3], dwell: 2.4, action: 'drop' },
    ],
  },
  {
    // dock: runs behind the charging pad, so the final shot has depth
    id: 'dock',
    speed: 0.7,
    phase: 8,
    stops: [
      { p: [-6.6, 1.5], dwell: 3.4, action: 'drop' },
      { p: [-1.6, 1.5], dwell: 3.4, action: 'pick' },
    ],
  },
]

export interface FleetUnit {
  /** display id painted on the flank */
  label: string
  route: RouteDef
  /** seconds into the loop this unit starts */
  phase: number
}

/** Expand the routes into individual units, numbering them and spreading multi-unit loops evenly. */
export function fleet(): FleetUnit[] {
  const out: FleetUnit[] = []
  for (const route of AMR_ROUTES) {
    const n = route.units ?? 1
    const cycle = buildTimeline(route).cycle
    for (let k = 0; k < n; k++) out.push({ label: `AMR-${String(out.length + 1).padStart(2, '0')}`, route, phase: route.phase + (k * cycle) / n })
  }
  return out
}

/** Crate stacks the fleet picks from and drops onto — one per action stop, set back off the lane. */
export const STATIONS: { p: XZ; kind: 'in' | 'out' }[] = [
  { p: [28.5, 33.2], kind: 'out' },
  { p: [14.5, 33.2], kind: 'in' },
  { p: [7.5, 44.6], kind: 'out' },
  { p: [20.5, 44.6], kind: 'in' },
  { p: [10.6, 7.35], kind: 'in' },
  { p: [16.4, 7.35], kind: 'out' },
  { p: [-6.6, 2.9], kind: 'out' },
  { p: [-1.6, 2.9], kind: 'in' },
]

/** Equipment racking lining the project hall so the long walls are not blank. One entry per bay. */
export const RACK_BAY = { w: 2.4, d: 0.55, h: 2.15 }
export const HALL_RACKS: { x: number; z: number; yaw: number }[] = (() => {
  const out: { x: number; z: number; yaw: number }[] = []
  for (let x = 2.4; x <= 32.2; x += 2.5) {
    if (Math.abs(x - 18) < 2.4) continue // corridor door
    out.push({ x, z: 30.55, yaw: 0 })
    out.push({ x, z: 45.45, yaw: Math.PI })
  }
  for (let z = 32.4; z <= 44.4; z += 2.5) out.push({ x: 33.45, z, yaw: -Math.PI / 2 })
  return out
})()

/* ---------------------------------------------------------------- drones */

export interface DronePath {
  id: string
  /** control points of a closed Catmull-Rom loop */
  pts: [number, number, number][]
  /** m/s along the loop */
  speed: number
  /** downward scan cone + ground spot */
  scan: boolean
}

export const DRONE_PATHS: DronePath[] = [
  {
    // hall perimeter sweep, under the wall line so it reads as an indoor inspection drone
    id: 'UAV-01',
    pts: [
      [30.5, 2.2, 32.4],
      [20, 2.35, 31.4],
      [8, 2.2, 32.6],
      [2.6, 2.45, 37],
      [7, 2.2, 44.2],
      [19, 2.4, 45],
      [30.5, 2.25, 43.4],
      [32.4, 2.4, 38],
    ],
    speed: 2.6,
    scan: true,
  },
  {
    // aisle escort: flies the length of the hall right over the hero robot, clear of the holograms
    id: 'UAV-02',
    pts: [
      [4, 3.78, 38],
      [12, 3.9, 38.35],
      [20, 3.78, 37.7],
      [30, 3.9, 38.2],
      [32.6, 3.8, 38],
      [20, 3.95, 38.3],
      [10, 3.8, 37.8],
    ],
    speed: 2.1,
    scan: true,
  },
  {
    // overwatch: a slow lap above the whole facility, seen over the wall tops
    id: 'UAV-03',
    pts: [
      [24, 5.4, 4],
      [4, 5.7, 3],
      [-4, 5.4, 16],
      [-5, 5.6, 36],
      [4, 5.4, 44],
      [26, 5.7, 44],
      [32, 5.4, 24],
      [30, 5.6, 10],
    ],
    speed: 3.4,
    scan: false,
  },
]

/* --------------------------------------------------------------- catch game */

/** Two humanoids in the south strip of the hall, throwing a ball along X. */
export const CATCH = {
  a: [9, 44.6] as XZ,
  b: [15, 44.6] as XZ,
  /** one throw every PERIOD seconds, alternating direction */
  period: 4.8,
  flight: 1.05,
  windup: 0.85,
  /** apex of the arc above the hands */
  peak: 1.72,
  hand: 1.02,
}

export interface CatchState {
  /** 0 = A throws, 1 = B throws */
  thrower: 0 | 1
  /** per side, -1 wound up behind … 0 relaxed … 1 arm extended forward */
  arm: [number, number]
  ball: [number, number, number]
  /** ball is in the air (draws the trail) */
  flying: boolean
}

/** Hand anchor of one side for a given arm phase. `toward` is +1 if the other player is at larger X. */
function hand(p: XZ, toward: number, arm: number): [number, number, number] {
  return [p[0] + toward * (0.2 + 0.34 * arm), CATCH.hand + 0.14 * arm, p[1]]
}

export function catchState(t: number): CatchState {
  const cycle = Math.floor(t / CATCH.period)
  const u = t - cycle * CATCH.period
  const thrower = (cycle % 2) as 0 | 1
  const from = thrower === 0 ? CATCH.a : CATCH.b
  const to = thrower === 0 ? CATCH.b : CATCH.a
  const dir = Math.sign(to[0] - from[0])

  // thrower: wind back, snap forward at release, relax
  const release = CATCH.windup
  const armT = u < release ? -smooth(u / release) : 1 - band(u, release, release + 0.55)
  // catcher: reaches out as the ball closes, absorbs, relaxes
  const land = release + CATCH.flight
  const armC = band(u, land - 0.45, land - 0.05) * (1 - band(u, land + 0.05, land + 0.7))

  const arm: [number, number] = thrower === 0 ? [armT, armC] : [armC, armT]
  const h0 = hand(from, dir, Math.max(0, armT))
  const h1 = hand(to, -dir, armC)

  let ball: [number, number, number]
  let flying = false
  if (u < release) {
    ball = [h0[0], h0[1] + 0.05, h0[2]]
  } else if (u < land) {
    const f = (u - release) / CATCH.flight
    ball = [h0[0] + (h1[0] - h0[0]) * f, h0[1] + (h1[1] - h0[1]) * f + Math.sin(Math.PI * f) * (CATCH.peak - CATCH.hand), h0[2] + (h1[2] - h0[2]) * f]
    flying = true
  } else {
    ball = [h1[0], h1[1] + 0.05, h1[2]]
  }
  return { thrower, arm, ball, flying }
}
