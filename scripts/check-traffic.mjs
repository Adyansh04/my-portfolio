/**
 * Geometry check for the ambient traffic: every AMR lane must stay inside the facility,
 * clear of walls, pedestals, podiums and racks, and drones must stay inside the bounds.
 * Run: npm run check:traffic
 */
import { BOUNDS, PEDESTALS, PODIUMS, RACKS, ROOMS, roomAt, wallPieces } from '../lib/mission/facility.ts'
import { AMR_ROUTES, DRONE_PATHS, HALL_RACKS, RACK_BAY, STATIONS, buildTimeline, samplePose, CATCH, fleet } from '../lib/mission/traffic.ts'
import { ROUTE, routePose, ENTRY_T } from '../lib/mission/path.ts'
import { ZONES } from '../lib/mission/zones.ts'
import { shotAt } from '../lib/mission/camera.ts'

const AMR_HALF = 0.48 // widest half-extent of a unit
// The pedestal column, which is what ground traffic can actually hit. The hologram platform
// overhangs it to 1.08 m, but that sits at 1.17 m — over the head of anything driving past.
const PED_R = 0.92
const errors = []

/** distance from point p to segment ab */
function segDist([px, pz], { a, b }) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const len2 = dx * dx + dz * dz
  const t = len2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / len2)) : 0
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t))
}

/** kept in step with PADS in components/mission/world/ambient/Dressing.tsx */
const PADS = [
  [3.6, 34.0],
  [24.5, 33.0],
]

const walls = wallPieces()
/** circular props */
const blockers = [
  ...PEDESTALS.map((p) => ({ p: [p.x, p.z], r: PED_R, what: 'pedestal' })),
  ...PODIUMS.map((p) => ({ p: [p.x, p.z], r: 0.7, what: 'podium' })),
]
/** racks are long boxes, not discs: 0.45 deep across the corridor, 2.5 long */
const boxes = [
  ...RACKS.map((r) => ({ cx: r.x - r.side * 0.25, cz: r.z, hx: 0.225, hz: 1.25, what: 'archive rack' })),
  // hall bays are axis-aligned: yaw 0/PI run along X, +-PI/2 along Z
  ...HALL_RACKS.map((b) => {
    const alongX = Math.abs(Math.sin(b.yaw)) < 0.5
    return { cx: b.x, cz: b.z, hx: (alongX ? RACK_BAY.w : RACK_BAY.d) / 2, hz: (alongX ? RACK_BAY.d : RACK_BAY.w) / 2, what: 'hall rack' }
  }),
  ...STATIONS.map((s) => ({ cx: s.p[0], cz: s.p[1], hx: 0.55, hz: 0.45, what: 'crate station' })),
]
const boxDist = (x, z, b) => Math.hypot(Math.max(0, Math.abs(x - b.cx) - b.hx), Math.max(0, Math.abs(z - b.cz) - b.hz))

for (const route of AMR_ROUTES) {
  const tl = buildTimeline(route)
  for (let s = 0; s < tl.cycle; s += 0.05) {
    const { x, z } = samplePose(tl, s)
    if (roomAt(x, z) < 0) errors.push(`${route.id} @${s.toFixed(1)}s is outside every room at ${x.toFixed(2)},${z.toFixed(2)}`)
    for (const w of walls) {
      const d = segDist([x, z], w)
      if (d < AMR_HALF + 0.125) errors.push(`${route.id} @${s.toFixed(1)}s clips a wall (${d.toFixed(2)} m) at ${x.toFixed(2)},${z.toFixed(2)}`)
    }
    for (const b of blockers) {
      const d = Math.hypot(x - b.p[0], z - b.p[1])
      if (d < AMR_HALF + b.r) errors.push(`${route.id} @${s.toFixed(1)}s clips a ${b.what} (${d.toFixed(2)} m) at ${x.toFixed(2)},${z.toFixed(2)}`)
    }
    for (const b of boxes) {
      const d = boxDist(x, z, b)
      if (d < AMR_HALF) errors.push(`${route.id} @${s.toFixed(1)}s clips a ${b.what} (${d.toFixed(2)} m) at ${x.toFixed(2)},${z.toFixed(2)}`)
    }
    for (const p of PADS) if (Math.hypot(x - p[0], z - p[1]) < AMR_HALF + 0.78) errors.push(`${route.id} @${s.toFixed(1)}s drives across a drone pad at ${x.toFixed(2)},${z.toFixed(2)}`)
  }
}

for (const d of DRONE_PATHS)
  for (const [x, y, z] of d.pts) {
    if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) errors.push(`${d.id} waypoint ${x},${z} is outside the facility bounds`)
    if (y < 1.9) errors.push(`${d.id} waypoint at y=${y} flies below head height`)
  }

for (const [name, p] of [['catch A', CATCH.a], ['catch B', CATCH.b]]) {
  if (roomAt(p[0], p[1]) < 0) errors.push(`${name} stands outside every room`)
  for (const b of blockers) if (Math.hypot(p[0] - b.p[0], p[1] - b.p[1]) < 0.45 + b.r) errors.push(`${name} overlaps a ${b.what}`)
  for (const b of boxes) if (boxDist(p[0], p[1], b) < 0.45) errors.push(`${name} overlaps a ${b.what}`)
}

// every pick/drop stop needs something to work with: a crate station, or a rack in the archive
const servable = [...STATIONS.map((s) => s.p), ...RACKS.map((r) => [r.x - r.side * 0.25, r.z])]
for (const route of AMR_ROUTES)
  for (const st of route.stops)
    if (st.action && !servable.some((p) => Math.hypot(p[0] - st.p[0], p[1] - st.p[1]) < 2.2)) errors.push(`${route.id} ${st.action}s at ${st.p} with nothing to work with within 2.2 m`)
for (const s of STATIONS)
  if (!AMR_ROUTES.some((r) => r.stops.some((st) => st.action && Math.hypot(s.p[0] - st.p[0], s.p[1] - st.p[1]) < 2.2))) errors.push(`station at ${s.p} is not served by any route`)

// the hero robot walks its own route through all of this: nothing we add may stand in its way
const HERO_HALF = 0.5
for (let zone = 0; zone < ROUTE.length; zone++)
  for (let beat = 0; beat < ROUTE[zone].length; beat++)
    for (let u = 0; u <= 1; u += 0.01) {
      const { x, z } = routePose(zone, beat, u)
      for (const b of boxes) {
        const d = boxDist(x, z, b)
        if (d < HERO_HALF) errors.push(`hero route zone ${zone} beat ${beat} runs into a ${b.what} (${d.toFixed(2)} m) at ${x.toFixed(2)},${z.toFixed(2)}`)
      }
      for (const p of PADS) if (Math.hypot(x - p[0], z - p[1]) < HERO_HALF + 0.78) errors.push(`hero route zone ${zone} beat ${beat} crosses a drone pad at ${x.toFixed(2)},${z.toFixed(2)}`)
      for (const [name, p] of [['catch A', CATCH.a], ['catch B', CATCH.b]]) if (Math.hypot(x - p[0], z - p[1]) < HERO_HALF + 0.45) errors.push(`hero route zone ${zone} beat ${beat} walks into ${name}`)
    }

// A zone's copy is held back until ENTRY_T (see lib/mission/path.ts). By then the shot must
// actually be framing that room, or the copy still arrives before the viewer does.
const pad = (x, z, zone, p) => {
  const r = ROOMS[zone]
  return x >= r.x0 - p && x <= r.x1 + p && z >= r.z0 - p && z <= r.z1 + p
}
for (let zone = 1; zone < ZONES.length; zone++) {
  const beats = ZONES[zone].beats
  const zt = ENTRY_T[zone]
  const beat = Math.min(beats - 1, Math.floor(zt * beats))
  const p = routePose(zone, beat, zt * beats - beat)
  const shot = shotAt(zone, zt, { x: p.x, y: 0, z: p.z, yaw: 0, speed: 0 }, beat)
  if (!pad(p.x, p.z, zone, 0.6)) errors.push(`zone ${zone} copy appears at zoneT ${zt.toFixed(3)} but the robot is still outside the room at ${p.x.toFixed(1)},${p.z.toFixed(1)}`)
  if (!pad(shot.look[0], shot.look[2], zone, 0.6)) errors.push(`zone ${zone} copy appears at zoneT ${zt.toFixed(3)} but the shot is still aimed outside the room at ${shot.look[0].toFixed(1)},${shot.look[2].toFixed(1)}`)
  if (!pad(shot.pos[0], shot.pos[2], zone, 4)) errors.push(`zone ${zone} copy appears at zoneT ${zt.toFixed(3)} but the camera is ${'far'} outside the room at ${shot.pos[0].toFixed(1)},${shot.pos[2].toFixed(1)}`)
}

const lanes = fleet().length
if (errors.length) {
  console.error(errors.slice(0, 20).join('\n'))
  console.error(`\n${errors.length} traffic problems`)
  process.exit(1)
}
console.log(`traffic OK — ${lanes} AMR units on ${AMR_ROUTES.length} routes, ${DRONE_PATHS.length} drone loops, ${STATIONS.length} stations, all clear of walls and props`)
console.log(`zone copy waits for arrival at zoneT ${ENTRY_T.map((v) => v.toFixed(3)).join(', ')}`)
