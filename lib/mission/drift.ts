import { mission } from './store'

/**
 * Odometry drift of the scanned map (floor cells + point cloud), in metres.
 * Grows quietly through zones 4–5, then snaps back to zero at the start of the dock zone:
 * the loop closure. Walls never move — they are the ground truth the map is corrected against.
 */
export const DRIFT_VECTOR: [number, number, number] = [0.38, 0, -0.22]

const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}

export function driftAmount(): number {
  const { zone, zoneT, beat, beatT } = mission
  if (zone < 4) return 0
  if (zone === 4) return smooth(zoneT) * 0.45
  if (zone === 5) return 0.45 + smooth(zoneT) * 0.55
  if (zone === 6 && beat === 0) return 1 - smooth(beatT / 0.35)
  return 0
}

/** True while the correction is happening (for the HUD line). */
export function loopClosing(): boolean {
  return mission.zone === 6 && mission.beat === 0 && mission.beatT < 0.5
}
