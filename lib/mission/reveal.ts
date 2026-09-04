/**
 * LiDAR "seen-at" map. The robot's route is sampled densely; at each sample a 360° fan of rays is cast
 * against the walls. Every floor cell a ray crosses gets seenAt = min(seenAt, t); every wall hit becomes
 * point-cloud returns at four heights. Shaders compare aSeenAt < uT so the map appears exactly where and
 * when the robot scanned it — doors let rays spill into the next room.
 */
import { BOUNDS, CELL, GRID_COLS, GRID_ROWS, cellCenter, roomAt, wallPieces, type WallPiece } from './facility'
import { sampleRoute } from './path'

export const RANGE = 12
const RAYS = 120
const ELEV = [0.2, 0.62, 1.05, 1.5, 1.95, 2.38]
const FLOOR_RETURNS = 2 // per seen cell, so every scanned room shows the same dotted floor
const STEP = CELL * 0.45

export interface RevealData {
  /** per cell: first-seen mission progress, or 2 when never seen */
  seenAt: Float32Array
  inRoom: Uint8Array
  roomCells: number
  /** cells seen by the end of the mission (denominator for mapped %) */
  finalCells: number
  route: { x: number; z: number; t: number }[]
  points: { position: Float32Array; seenAt: Float32Array; rand: Float32Array; count: number }
  /** milliseconds spent computing (for the perf log) */
  ms: number
}

let cache: RevealData | null = null

/** Distance along ray (px,pz)+(dx,dz)·t to a wall piece, or Infinity. */
function rayWall(px: number, pz: number, dx: number, dz: number, w: WallPiece): number {
  const ax = w.a[0], az = w.a[1]
  const ex = w.b[0] - ax, ez = w.b[1] - az
  const den = dx * ez - dz * ex
  if (Math.abs(den) < 1e-9) return Infinity
  const t = ((ax - px) * ez - (az - pz) * ex) / den
  const u = ((ax - px) * dz - (az - pz) * dx) / den
  return t > 0 && u >= 0 && u <= 1 ? t : Infinity
}

// deterministic pseudo-random so the cloud is identical on every load
let seed = 1337
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}

export function computeReveal(): RevealData {
  if (cache) return cache
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0
  const n = GRID_COLS * GRID_ROWS
  const seenAt = new Float32Array(n).fill(2)
  const inRoom = new Uint8Array(n)
  let roomCells = 0
  for (let i = 0; i < n; i++) {
    const [x, z] = cellCenter(i)
    if (roomAt(x, z) >= 0) {
      inRoom[i] = 1
      roomCells++
    }
  }
  const walls = wallPieces()
  const route = sampleRoute(12)
  const maxPoints = route.length * RAYS * ELEV.length + n * FLOOR_RETURNS
  const pos = new Float32Array(maxPoints * 3)
  const pSeen = new Float32Array(maxPoints)
  const pRand = new Float32Array(maxPoints)
  let count = 0

  route.forEach((s, k) => {
    const jitter = (k % 9) * (Math.PI * 2) / (RAYS * 9) // de-band the fan between samples
    for (let r = 0; r < RAYS; r++) {
      const ang = (r / RAYS) * Math.PI * 2 + jitter
      const dx = Math.cos(ang)
      const dz = Math.sin(ang)
      let hit = Infinity
      for (const w of walls) {
        const d = rayWall(s.x, s.z, dx, dz, w)
        if (d < hit) hit = d
      }
      const dist = Math.min(hit, RANGE)
      // floor cells along the beam
      for (let d = 0; d <= dist; d += STEP) {
        const cx = Math.floor((s.x + dx * d - BOUNDS.minX) / CELL)
        const cz = Math.floor((s.z + dz * d - BOUNDS.minZ) / CELL)
        if (cx < 0 || cz < 0 || cx >= GRID_COLS || cz >= GRID_ROWS) break
        const i = cz * GRID_COLS + cx
        if (inRoom[i] && seenAt[i] > s.t) seenAt[i] = s.t
      }
      // wall returns
      if (hit <= RANGE) {
        const hx = s.x + dx * hit
        const hz = s.z + dz * hit
        for (const e of ELEV) {
          const j = count * 3
          pos[j] = hx + (rnd() - 0.5) * 0.05
          pos[j + 1] = e + (rnd() - 0.5) * 0.35
          pos[j + 2] = hz + (rnd() - 0.5) * 0.05
          pSeen[count] = s.t
          pRand[count] = rnd()
          count++
        }
      }
    }
  })

  // floor returns: a couple of dim hits per scanned cell, stamped with the cell's seen-at
  for (let i = 0; i < n; i++) {
    if (!inRoom[i] || seenAt[i] > 1) continue
    const [cx, cz] = cellCenter(i)
    for (let k = 0; k < FLOOR_RETURNS; k++) {
      const j = count * 3
      pos[j] = cx + (rnd() - 0.5) * CELL
      pos[j + 1] = 0.02 + rnd() * 0.03
      pos[j + 2] = cz + (rnd() - 0.5) * CELL
      pSeen[count] = seenAt[i]
      pRand[count] = rnd() * 0.5
      count++
    }
  }
  let finalCells = 0
  for (let i = 0; i < n; i++) if (inRoom[i] && seenAt[i] <= 1) finalCells++
  const ms = typeof performance !== 'undefined' ? performance.now() - t0 : 0
  if (typeof window !== 'undefined') (window as unknown as { __reveal?: object }).__reveal = { points: count, cells: finalCells, ms: Math.round(ms) }
  cache = {
    seenAt,
    inRoom,
    roomCells,
    finalCells,
    route,
    points: { position: pos.subarray(0, count * 3), seenAt: pSeen.subarray(0, count), rand: pRand.subarray(0, count), count },
    ms,
  }
  return cache
}

/** Fraction of the final map seen at mission progress t (1 at the dock by construction). */
export function seenFraction(data: RevealData, t: number): number {
  let seen = 0
  for (let i = 0; i < data.seenAt.length; i++) if (data.inRoom[i] && data.seenAt[i] <= t) seen++
  return data.finalCells ? Math.min(1, seen / data.finalCells) : 0
}
