/**
 * The camera shot each static-mode poster should be baked from.
 *
 * Baking used to mean scrolling the page and hoping the frame you grabbed was the one you meant.
 * The shot is a pure function of (zone, zoneT, robot pose, beat), so compute it here and drive the
 * camera to it directly — reproducible, and it does not depend on the scroll driver running.
 * Run: npm run posters:shots
 */
import { shotAt } from '../lib/mission/camera.ts'
import { routePose } from '../lib/mission/path.ts'
import { ZONES } from '../lib/mission/zones.ts'

/** Two thirds through the zone's middle beat: past the travel, into the hold, copy on screen. */
const ZT = 0.55

const shots = ZONES.map((z) => {
  const beat = Math.floor(z.beats / 2)
  const beatT = (ZT * z.beats) % 1
  const rp = routePose(z.index, beat, beatT)
  const yaw = Math.atan2(rp.dir[0], rp.dir[1])
  const { pos, look } = shotAt(z.index, ZT, { x: rp.x, y: 0, z: rp.z, yaw, speed: rp.moving ? 0.8 : 0 }, beat)
  return { zone: z.index, id: z.id, cam: [...pos, ...look].map((v) => +v.toFixed(3)) }
})

console.log(JSON.stringify(shots))
