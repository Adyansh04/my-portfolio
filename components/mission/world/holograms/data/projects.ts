export type XZ = [number, number]

/**
 * Each project described as three things the holograms build from: the runs that make up its
 * structure, the path its route or circuit follows, and the pins marking what matters. Coordinates
 * are roughly ±0.46 by ±0.34.
 */
export interface SlabDesign {
  /** the project's primary colour */
  accent: string
  /** colour of the live data — pins, pulses, readouts */
  data: string
  /** structural runs: walls, rows, spokes */
  runs: [XZ, XZ][]
  /** the route or circuit travelled */
  path: XZ[]
  closed?: boolean
  pins: { p: XZ; h?: number }[]
  /** a secondary set of runs for texture (crop rows, shelving, data rows) */
  detail?: [XZ, XZ][]
}

const ORANGE = '#ff7a1a'
const CYAN = '#4fd1ff'
const LIME = '#8ce563'
const VIOLET = '#a98bff'
const ROSE = '#ff6b8a'
const AMBER = '#f5c451'
const SKY = '#6fb6ff'

/** Rectangular rooms → four solid wall runs each. Doors are not authored here; `wallRuns` cuts
 *  them wherever the route actually goes through, which is the only way the two stay in step. */
function rooms(list: [number, number, number, number][]): [XZ, XZ][] {
  const out: [XZ, XZ][] = []
  for (const [x, z, w, d] of list) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2
    out.push([[x0, z0], [x1, z0]], [[x0, z1], [x1, z1]], [[x0, z0], [x0, z1]], [[x1, z0], [x1, z1]])
  }
  return out
}

/** Evenly spaced parallel runs — crop rows, shelving bays, data rows. */
function rows(n: number, x0: number, x1: number, z0: number, z1: number, along: 'x' | 'z' = 'x'): [XZ, XZ][] {
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1)
    return along === 'x'
      ? ([[x0, z0 + (z1 - z0) * t], [x1, z0 + (z1 - z0) * t]] as [XZ, XZ])
      : ([[x0 + (x1 - x0) * t, z0], [x0 + (x1 - x0) * t, z1]] as [XZ, XZ])
  })
}

/** A closed ring as a polyline, for circuits and orbits. */
function ring(rx: number, rz: number, n = 24, cx = 0, cz = 0): XZ[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * rx, cz + Math.sin(a) * rz] as XZ
  })
}

/** For a project added without a design of its own: the orbiting-data stage (it needs nothing but
 *  colours) under a title card. Add an entry to SLAB_DESIGNS and STAGE_FOR to give it hardware. */
export const DEFAULT_DESIGN: SlabDesign = { accent: SKY, data: CYAN, runs: [], path: [], pins: [] }

export const SLAB_DESIGNS: Record<string, SlabDesign> = {
  // an unknown facility, mapped and swept room by room
  // Two bays off a corridor. Fewer, larger rooms than the poster's seven: the robot has to be big
  // enough to recognise from the aisle, and it has to fit through its own doors.
  'go2-inspection': {
    accent: ORANGE, data: CYAN,
    runs: rooms([[-0.22, -0.09, 0.32, 0.28], [0.22, -0.09, 0.32, 0.28], [0, 0.17, 0.80, 0.18]]),
    path: [[-0.22, -0.09], [-0.22, 0.17], [0.22, 0.17], [0.22, -0.09]],
    closed: true,
    pins: [{ p: [-0.32, -0.19], h: 0.07 }, { p: [-0.10, -0.18], h: 0.10 }, { p: [0.13, -0.19], h: 0.08 },
           { p: [0.33, -0.17], h: 0.06 }, { p: [-0.33, 0.22], h: 0.11 }, { p: [0.33, 0.22], h: 0.055 }],
  },
  // one incremental graph closing a 56 m loop
  olive: {
    accent: LIME, data: ORANGE,
    runs: [[[-0.38, -0.28], [0.38, -0.28]], [[-0.38, 0.28], [0.38, 0.28]]],
    path: ring(0.36, 0.23, 28),
    closed: true,
    pins: ring(0.36, 0.23, 9).map((p) => ({ p, h: 0.05 })).concat([{ p: [-0.18, -0.12], h: 0.13 }, { p: [0.24, 0.02], h: 0.13 }, { p: [-0.10, 0.16], h: 0.13 }]),
    detail: rows(5, -0.30, 0.30, -0.16, 0.16),
  },
  // a manipulator picking out of clutter under a depth camera
  'ai-robotics': {
    accent: ORANGE, data: VIOLET,
    runs: rooms([[0.16, 0.0, 0.34, 0.34]]).concat([[[-0.42, -0.20], [-0.10, -0.20]], [[-0.42, 0.20], [-0.10, 0.20]], [[-0.42, -0.20], [-0.42, 0.20]]]),
    path: [[-0.26, 0.0], [-0.10, -0.12], [0.06, -0.06], [0.16, 0.06], [0.06, 0.16], [-0.10, 0.10]],
    pins: [{ p: [0.16, 0.0], h: 0.16 }, { p: [-0.26, 0.0], h: 0.09 }, { p: [0.06, -0.06], h: 0.07 }, { p: [0.06, 0.16], h: 0.07 }],
    detail: rows(4, 0.02, 0.30, -0.13, 0.13),
  },
  // concentric-ring fiducials seen from a moving camera
  whycode: {
    accent: VIOLET, data: CYAN,
    runs: [...ringRuns(0.13, 6, -0.24, -0.10), ...ringRuns(0.13, 6, 0.02, 0.08), ...ringRuns(0.13, 6, 0.28, -0.06)],
    path: [[-0.42, 0.24], [-0.24, 0.10], [0.02, 0.22], [0.28, 0.08], [0.42, 0.20]],
    pins: [{ p: [-0.24, -0.10], h: 0.10 }, { p: [0.02, 0.08], h: 0.10 }, { p: [0.28, -0.06], h: 0.10 }],
  },
  // a retrieval graph over clinical records
  'sepsis-atlas': {
    accent: ROSE, data: CYAN,
    runs: rows(7, -0.40, 0.06, -0.26, 0.26),
    path: [[-0.40, -0.26], [0.10, -0.17], [0.26, 0.0], [0.10, 0.17], [-0.40, 0.26]],
    pins: [{ p: [0.26, 0.0], h: 0.15 }, { p: [0.10, -0.17], h: 0.08 }, { p: [0.10, 0.17], h: 0.08 }],
    detail: rows(5, 0.16, 0.42, -0.20, 0.20, 'z'),
  },
  // a mecanum robot running a competition field
  'abu-robocon': {
    accent: ORANGE, data: AMBER,
    runs: rooms([[0, 0, 0.80, 0.52]]).concat(rows(2, -0.30, 0.30, -0.12, 0.12)),
    path: [[-0.32, -0.20], [0.0, -0.20], [0.30, -0.08], [0.30, 0.10], [0.0, 0.20], [-0.32, 0.10], [-0.32, -0.08]],
    closed: true,
    pins: [{ p: [-0.32, -0.20], h: 0.08 }, { p: [0.30, -0.08], h: 0.10 }, { p: [0.0, 0.20], h: 0.09 }],
  },
  // three omni wheels at 120 degrees
  'kiwi-drive': {
    accent: AMBER, data: CYAN,
    runs: [0, 1, 2].flatMap((i) => {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2
      return [[[0, 0], [Math.cos(a) * 0.26, Math.sin(a) * 0.18]] as [XZ, XZ]]
    }),
    path: ring(0.30, 0.21, 24),
    closed: true,
    pins: [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2
      return { p: [Math.cos(a) * 0.28, Math.sin(a) * 0.20] as XZ, h: 0.10 }
    }),
    detail: ringRuns(0.10, 10, 0, 0),
  },
  // an overhead camera guiding a robot through a scored arena
  vanguard: {
    accent: CYAN, data: ORANGE,
    runs: rooms([[0, 0, 0.80, 0.52]]).concat([
      [[-0.20, -0.28], [-0.20, -0.02]], [[0.06, 0.28], [0.06, 0.02]], [[-0.20, -0.02], [0.20, -0.02]],
    ]),
    path: [[-0.36, -0.22], [-0.06, -0.22], [-0.06, 0.10], [0.20, 0.10], [0.34, 0.22]],
    pins: [{ p: [0.0, 0.0], h: 0.22 }, { p: [-0.36, -0.22], h: 0.06 }, { p: [0.34, 0.22], h: 0.06 }],
  },
  // an omni base picking cotton down crop rows
  // Four crop rows, and the base works the furrows between them — headland turns happen past the
  // ends of the rows, which is what makes the loop close without driving through the crop.
  agrobot: {
    accent: LIME, data: ORANGE,
    runs: rows(4, -0.30, 0.30, -0.26, 0.26),
    path: [[-0.38, -0.1733], [0.38, -0.1733], [0.38, 0], [-0.38, 0], [-0.38, 0.1733], [0.38, 0.1733]],
    // bolls sit on the rows, within reach of the furrow alongside
    pins: [{ p: [-0.20, -0.26], h: 0.09 }, { p: [0.12, -0.0867], h: 0.09 }, { p: [-0.08, -0.0867], h: 0.09 },
           { p: [0.24, 0.0867], h: 0.09 }, { p: [-0.26, 0.0867], h: 0.09 }, { p: [0.06, 0.26], h: 0.09 }],
  },
  // a quadrotor holding station indoors
  'drone-systems': {
    accent: SKY, data: CYAN,
    runs: rooms([[0, 0, 0.80, 0.52]]),
    path: [[-0.28, -0.16], [0.0, -0.20], [0.28, -0.10], [0.30, 0.10], [0.0, 0.20], [-0.30, 0.12]],
    closed: true,
    pins: [{ p: [0.0, 0.0], h: 0.26 }, { p: [-0.28, -0.16], h: 0.05 }, { p: [0.28, -0.10], h: 0.14 }, { p: [0.0, 0.20], h: 0.19 }],
    detail: ringRuns(0.09, 8, 0, 0),
  },
}

/**
 * The stages that drive something along `path` through geometry it could hit. Kept here rather
 * than in the stage so `scripts/check-holograms.mjs` and the renderer read the same numbers —
 * a hologram whose robot walks through its own walls is exactly the bug this table prevents.
 * All values are in design units (the ±0.46 space above).
 */
export interface Traffic {
  /** half-width of the vehicle across its direction of travel */
  half: number
  /** half-thickness of the runs it has to clear */
  runHalf: number
  /** true: the runs are walls and a door is cut wherever the route crosses one.
   *  false: the runs are crop rows or shelving — solid, and the route goes around. */
  doors: boolean
}
export const TRAFFIC: Record<string, Traffic> = {
  'go2-inspection': { half: 0.048, runHalf: 0.006, doors: true },
  agrobot: { half: 0.05, runHalf: 0.014, doors: false },
  'drone-systems': { half: 0.05, runHalf: 0.006, doors: false },
}

/** Distance from a point to a segment. */
function segDist(p: XZ, a: XZ, b: XZ): number {
  const dx = b[0] - a[0], dz = b[1] - a[1]
  const l2 = dx * dx + dz * dz
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2)) : 0
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dz * t))
}

/** Every point on the route, sampled fine enough that a doorway cannot be missed. */
function samples(path: XZ[], closed: boolean, step = 0.004): XZ[] {
  const out: XZ[] = []
  const n = closed ? path.length : path.length - 1
  for (let i = 0; i < n; i++) {
    const a = path[i], b = path[(i + 1) % path.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const k = Math.max(1, Math.ceil(len / step))
    for (let j = 0; j <= k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k])
  }
  return out
}

/**
 * The wall runs as actually built. Every stretch of wall that comes within `clear` of the route is
 * removed, which leaves a doorway exactly where the robot needs one and nowhere else. Authoring
 * the openings by hand is what let the Go2 walk through its own walls: the route moved between
 * rooms in z, and the doors had been cut in the x walls.
 */
export function wallRuns(key: string, d: SlabDesign): [XZ, XZ][] {
  const t = TRAFFIC[key]
  if (!t || !t.doors) return d.runs
  const clear = t.half + t.runHalf + 0.028
  const pts = samples(d.path, !!d.closed)
  const out: [XZ, XZ][] = []
  for (const [a, b] of d.runs) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (len < 1e-6) continue
    const n = Math.max(1, Math.ceil(len / 0.004))
    let start: number | null = 0
    for (let i = 0; i <= n; i++) {
      const u = i / n
      const q: XZ = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
      const blocked = pts.some((p) => Math.hypot(p[0] - q[0], p[1] - q[1]) < clear)
      if (blocked) {
        if (start !== null && u - start > 0.02) out.push([lerp(a, b, start), lerp(a, b, u - 1 / n)])
        start = null
      } else if (start === null) start = u
    }
    if (start !== null && 1 - start > 0.02) out.push([lerp(a, b, start), b])
  }
  return out
}
const lerp = (a: XZ, b: XZ, u: number): XZ => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]

/** Smallest gap between the route and any run, for the check script. */
export function routeClearance(d: SlabDesign, runs: [XZ, XZ][]): number {
  let min = Infinity
  for (const p of samples(d.path, !!d.closed, 0.002)) for (const [a, b] of runs) min = Math.min(min, segDist(p, a, b))
  return min
}

/** A ring approximated by chords — used for fiducial targets and rotor discs. */
function ringRuns(r: number, n: number, cx: number, cz: number): [XZ, XZ][] {
  return Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    return [[cx + Math.cos(a0) * r, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, cz + Math.sin(a1) * r]] as [XZ, XZ]
  })
}
