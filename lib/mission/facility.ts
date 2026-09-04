/**
 * The facility the robot explores. Everything spatial derives from this file:
 * 3D walls, minimap outline, reveal ray-casting, zone bounds, set-dressing anchors.
 * Units: metres. World X → right, world Z → "down" on the minimap. Y is up (three.js).
 */
export type XZ = [number, number]

export interface WallSegment {
  a: XZ
  b: XZ
  /** door gaps: coordinate along the wall's axis (x for horizontal walls, z for vertical) */
  doors?: number[]
}

export const WALL_HEIGHT = 2.6
export const WALL_THICKNESS = 0.25
export const DOOR_WIDTH = 1.8
export const CELL = 0.5
/** world bounds of the floor grid */
export const BOUNDS = { minX: -8, maxX: 34, minZ: 0, maxZ: 46 }
export const GRID_COLS = Math.round((BOUNDS.maxX - BOUNDS.minX) / CELL) // 84
export const GRID_ROWS = Math.round((BOUNDS.maxZ - BOUNDS.minZ) / CELL) // 92

export interface ZoneRect {
  zone: number
  id: string
  label: string
  x0: number
  x1: number
  z0: number
  z1: number
}

export const ROOMS: ZoneRect[] = [
  { zone: 0, id: 'hero', label: 'zone_0 SPAWN', x0: 0, x1: 8, z0: 0, z1: 8 },
  { zone: 1, id: 'profile', label: 'zone_1 PROFILE', x0: 8, x1: 20, z0: 0, z1: 8 },
  { zone: 2, id: 'experience', label: 'zone_2 EXPERIENCE', x0: 16, x1: 20, z0: 8, z1: 30 },
  { zone: 3, id: 'projects', label: 'zone_3 PROJECTS', x0: 0, x1: 34, z0: 30, z1: 46 },
  { zone: 4, id: 'hackathons', label: 'zone_4 HACKATHONS', x0: -8, x1: 0, z0: 34, z1: 42 },
  { zone: 5, id: 'credentials', label: 'zone_5 CREDENTIALS', x0: -8, x1: -2, z0: 8, z1: 34 },
  { zone: 6, id: 'contact', label: 'zone_6 DOCK', x0: -8, x1: 0, z0: 0, z1: 8 },
]

export const WALLS: WallSegment[] = [
  // spawn + profile block
  { a: [0, 0], b: [20, 0] }, // north
  { a: [0, 8], b: [8, 8] }, // spawn south
  { a: [8, 8], b: [20, 8], doors: [18] }, // profile south → corridor
  { a: [0, 0], b: [0, 8], doors: [4] }, // spawn west → dock (loop-closure door)
  { a: [8, 0], b: [8, 8], doors: [4] }, // spawn | profile partition
  { a: [20, 0], b: [20, 8] }, // profile east
  // experience corridor
  { a: [16, 8], b: [16, 30] },
  { a: [20, 8], b: [20, 30] },
  // projects hall
  { a: [0, 30], b: [34, 30], doors: [18] }, // north (corridor entry)
  { a: [34, 30], b: [34, 46] },
  { a: [0, 46], b: [34, 46] },
  { a: [0, 30], b: [0, 46], doors: [38] }, // west → alcove
  // hackathons alcove
  { a: [-8, 34], b: [0, 34], doors: [-5] }, // north → archive corridor
  { a: [-8, 42], b: [0, 42] },
  { a: [-8, 34], b: [-8, 42] },
  // credentials archive corridor
  { a: [-8, 8], b: [-8, 34] },
  { a: [-2, 8], b: [-2, 34] },
  // dock
  { a: [-8, 0], b: [0, 0] },
  { a: [-8, 8], b: [0, 8], doors: [-5] }, // south → archive
  { a: [-8, 0], b: [-8, 8] },
]

/** Split walls at their doors → solid pieces only (for geometry + ray casting). */
export interface WallPiece {
  a: XZ
  b: XZ
}
export function wallPieces(): WallPiece[] {
  const out: WallPiece[] = []
  for (const w of WALLS) {
    const horizontal = w.a[1] === w.b[1]
    const lo = horizontal ? Math.min(w.a[0], w.b[0]) : Math.min(w.a[1], w.b[1])
    const hi = horizontal ? Math.max(w.a[0], w.b[0]) : Math.max(w.a[1], w.b[1])
    const fixed = horizontal ? w.a[1] : w.a[0]
    const cuts = [...(w.doors ?? [])].sort((p, q) => p - q)
    let cursor = lo
    for (const d of cuts) {
      const d0 = d - DOOR_WIDTH / 2
      const d1 = d + DOOR_WIDTH / 2
      if (d0 > cursor) out.push(horizontal ? { a: [cursor, fixed], b: [d0, fixed] } : { a: [fixed, cursor], b: [fixed, d0] })
      cursor = d1
    }
    if (hi > cursor) out.push(horizontal ? { a: [cursor, fixed], b: [hi, fixed] } : { a: [fixed, cursor], b: [fixed, hi] })
  }
  return out
}

/* ---------- set-dressing anchors ---------- */
/** 10 pedestals in the hall, zig-zag along the aisle (z = 38). Index = project order. */
export const PEDESTALS: { x: number; z: number; side: -1 | 1 }[] = Array.from({ length: 10 }, (_, i) => ({
  x: 30 - i * 3,
  z: i % 2 === 0 ? 34.5 : 41.5,
  side: i % 2 === 0 ? -1 : 1, // -1 = north side of the aisle
}))
/** 6 placards in the corridor, alternating east / west walls. Index = experience order. */
export const PLACARDS: { x: number; z: number; side: -1 | 1 }[] = Array.from({ length: 6 }, (_, i) => ({
  x: i % 2 === 0 ? 19.85 : 16.15,
  z: 10.5 + i * 3.3,
  side: i % 2 === 0 ? 1 : -1, // 1 = east wall
}))
/** 3 podiums in the alcove: 1st, 2nd, best-technical */
export const PODIUMS: { x: number; z: number; h: number }[] = [
  { x: -5.5, z: 38, h: 0.9 },
  { x: -4, z: 38, h: 0.7 },
  { x: -2.5, z: 38, h: 0.55 },
]
/** 3 archive racks per wall in the credentials corridor */
export const RACKS: { x: number; z: number; side: -1 | 1 }[] = [14, 20, 26].flatMap((z) => [
  { x: -7.8, z, side: -1 },
  { x: -2.2, z, side: 1 },
])
export const DISPLAY_WALL = { x0: 10, x1: 18, z: 0.15, y0: 0.6, y1: 2.4 }
export const SPAWN_PAD: XZ = [4, 4]
export const DOCK_PAD: XZ = [-4, 4]

export const cellIndex = (x: number, z: number) => {
  const cx = Math.floor((x - BOUNDS.minX) / CELL)
  const cz = Math.floor((z - BOUNDS.minZ) / CELL)
  if (cx < 0 || cz < 0 || cx >= GRID_COLS || cz >= GRID_ROWS) return -1
  return cz * GRID_COLS + cx
}
export const cellCenter = (i: number): XZ => [BOUNDS.minX + (i % GRID_COLS) * CELL + CELL / 2, BOUNDS.minZ + Math.floor(i / GRID_COLS) * CELL + CELL / 2]

/** Which room a world point is in, or -1 (walls / void). */
export function roomAt(x: number, z: number): number {
  for (const r of ROOMS) if (x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1) return r.zone
  return -1
}
