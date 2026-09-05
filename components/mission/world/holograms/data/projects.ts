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

/** Rectangular rooms → their wall runs, with a doorway left in each side wall. */
function rooms(list: [number, number, number, number][], gap = 0.05): [XZ, XZ][] {
  const out: [XZ, XZ][] = []
  for (const [x, z, w, d] of list) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, zm = (z0 + z1) / 2
    out.push([[x0, z0], [x1, z0]], [[x0, z1], [x1, z1]])
    out.push([[x0, z0], [x0, zm - gap]], [[x0, zm + gap], [x0, z1]])
    out.push([[x1, z0], [x1, zm - gap]], [[x1, zm + gap], [x1, z1]])
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

export const SLAB_DESIGNS: Record<string, SlabDesign> = {
  // an unknown facility, mapped and swept room by room
  'go2-inspection': {
    accent: ORANGE, data: CYAN,
    runs: rooms([[-0.20, -0.13, 0.30, 0.22], [0.18, -0.13, 0.38, 0.22], [-0.20, 0.15, 0.30, 0.24], [0.18, 0.15, 0.38, 0.24]]),
    path: [[-0.20, -0.13], [0.02, -0.13], [0.18, -0.13], [0.34, 0.01], [0.18, 0.15], [-0.02, 0.15], [-0.20, 0.15], [-0.34, 0.01]],
    closed: true,
    pins: [{ p: [-0.24, -0.18], h: 0.07 }, { p: [0.25, -0.19], h: 0.10 }, { p: [0.06, -0.09], h: 0.08 },
           { p: [-0.18, 0.20], h: 0.06 }, { p: [0.27, 0.20], h: 0.11 }, { p: [0.05, 0.10], h: 0.055 }],
  },
  // one incremental graph closing a 56 m loop
  olive: {
    accent: LIME, data: ORANGE,
    runs: [[[-0.42, -0.30], [0.42, -0.30]], [[-0.42, 0.30], [0.42, 0.30]]],
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
    runs: rooms([[0, 0, 0.84, 0.56]], 0.12).concat(rows(2, -0.30, 0.30, -0.12, 0.12)),
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
    runs: rooms([[0, 0, 0.84, 0.56]], 0.10).concat([
      [[-0.20, -0.28], [-0.20, -0.02]], [[0.06, 0.28], [0.06, 0.02]], [[-0.20, -0.02], [0.20, -0.02]],
    ]),
    path: [[-0.36, -0.22], [-0.06, -0.22], [-0.06, 0.10], [0.20, 0.10], [0.34, 0.22]],
    pins: [{ p: [0.0, 0.0], h: 0.22 }, { p: [-0.36, -0.22], h: 0.06 }, { p: [0.34, 0.22], h: 0.06 }],
  },
  // an omni base picking cotton down crop rows
  agrobot: {
    accent: LIME, data: ORANGE,
    runs: rows(6, -0.38, 0.38, -0.24, 0.24),
    path: [[-0.38, -0.24], [0.38, -0.24], [0.38, -0.10], [-0.38, -0.10], [-0.38, 0.05], [0.38, 0.05], [0.38, 0.19], [-0.38, 0.19]],
    pins: [{ p: [-0.20, -0.24], h: 0.09 }, { p: [0.16, -0.10], h: 0.09 }, { p: [-0.06, 0.05], h: 0.09 }, { p: [0.28, 0.19], h: 0.09 }],
  },
  // a quadrotor holding station indoors
  'drone-systems': {
    accent: SKY, data: CYAN,
    runs: rooms([[0, 0, 0.80, 0.52]], 0.14),
    path: [[-0.28, -0.16], [0.0, -0.20], [0.28, -0.10], [0.30, 0.10], [0.0, 0.20], [-0.30, 0.12]],
    closed: true,
    pins: [{ p: [0.0, 0.0], h: 0.26 }, { p: [-0.28, -0.16], h: 0.05 }, { p: [0.28, -0.10], h: 0.14 }, { p: [0.0, 0.20], h: 0.19 }],
    detail: ringRuns(0.09, 8, 0, 0),
  },
}

/** A ring approximated by chords — used for fiducial targets and rotor discs. */
function ringRuns(r: number, n: number, cx: number, cz: number): [XZ, XZ][] {
  return Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    return [[cx + Math.cos(a0) * r, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, cz + Math.sin(a1) * r]] as [XZ, XZ]
  })
}
