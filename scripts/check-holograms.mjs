/**
 * Geometry check for the project holograms: anything that drives or walks along a design's `path`
 * must clear the runs that get built as solid geometry around it.
 *
 * This exists because it went wrong twice. The Go2's route moved between rooms in z while the
 * doorways had been authored into the x walls, so it walked through them; the AgroBot drove along
 * and across its own crop rows. Both were only visible once you looked closely at one hologram.
 * Run: npm run check:holograms
 */
import { SLAB_DESIGNS, TRAFFIC, wallRuns, routeClearance } from '../components/mission/world/holograms/data/projects.ts'

const errors = []
const lines = []

for (const [key, t] of Object.entries(TRAFFIC)) {
  const d = SLAB_DESIGNS[key]
  if (!d) {
    errors.push(`${key}: TRAFFIC names a design that does not exist`)
    continue
  }
  const runs = wallRuns(key, d)
  const need = t.half + t.runHalf
  const got = routeClearance(d, runs)
  const what = t.doors ? 'walls (doors cut from the route)' : 'solid rows'
  if (got < need) {
    errors.push(`${key}: route clears its ${what} by only ${got.toFixed(4)}, needs ${need.toFixed(4)} — the robot drives through them`)
  } else {
    lines.push(`  ${key.padEnd(16)} clearance ${got.toFixed(3)} (needs ${need.toFixed(3)})  ${runs.length} runs of ${d.runs.length}  ${what}`)
  }
  // a door that swallows the whole wall means the "building" has silently vanished
  if (t.doors && runs.length < d.runs.length / 2) {
    errors.push(`${key}: cutting doorways left ${runs.length} of ${d.runs.length} wall runs — the route is too close to everything`)
  }
  // an open path teleports on wrap unless the stage ping-pongs it; closed loops are safer
  if (!d.closed) lines.push(`  ${key.padEnd(16)} open path — the stage must ping-pong it, not wrap`)
}

// every design's structure has to fit the platform it is drawn on (design radius 0.5)
for (const [key, d] of Object.entries(SLAB_DESIGNS)) {
  const pts = [...d.runs.flat(), ...d.path, ...d.pins.map((p) => p.p)]
  const r = Math.max(...pts.map(([x, z]) => Math.hypot(x, z)))
  if (r > 0.5) errors.push(`${key}: geometry reaches ${r.toFixed(3)} from centre, past the 0.5 platform edge`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`\n${errors.length} hologram problems`)
  process.exit(1)
}
console.log('holograms OK — every route clears its own structure')
console.log(lines.join('\n'))
