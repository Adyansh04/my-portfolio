/**
 * Where the modelled prop kit stands.
 *
 * Textures gave the facility surfaces; this gives it contents. Everything here is authored against
 * a wall or under a roof rather than out in the open, because that is where services and safety
 * gear actually live — and because the middle of every room already belongs to the fleet.
 *
 * `RADIUS` is what `check:traffic` treats as solid. Anything mounted above head height is absent
 * from it on purpose: an AMR drives under a cable tray.
 */
export type PropKind = 'highbay' | 'bollard' | 'cabinet' | 'extinguisher' | 'cabletray' | 'railing' | 'dock'

export interface Placement {
  kind: PropKind
  x: number
  z: number
  /** metres off the floor; wall and ceiling fittings set their own */
  y?: number
  /** radians about +Y */
  yaw?: number
}

/** Footprint of the props that stand on the floor. Omitted = mounted clear of traffic. */
export const RADIUS: Partial<Record<PropKind, number>> = {
  bollard: 0.2,
  cabinet: 0.5,
  dock: 0.45,
  railing: 1.1,
}

const R = Math.PI / 2

export const PROPS: Placement[] = [
  // ---- spawn (x 0..8, z 0..8) : the robot wakes up in a services corner
  { kind: 'cabinet', x: 0.55, z: 2.4, yaw: R },
  { kind: 'cabinet', x: 0.55, z: 3.5, yaw: R },
  { kind: 'extinguisher', x: 0.28, z: 5.2, y: 1.05, yaw: R },
  { kind: 'cabletray', x: 0.45, z: 6.4, y: 2.35, yaw: 0 },
  { kind: 'bollard', x: 7.55, z: 0.55 },
  { kind: 'highbay', x: 4, z: 4, y: 2.95 },

  // ---- profile (x 8..20, z 0..8)
  { kind: 'cabinet', x: 19.4, z: 6.4, yaw: -R },
  { kind: 'extinguisher', x: 8.3, z: 6.6, y: 1.05, yaw: -R },
  { kind: 'cabletray', x: 19.5, z: 3.0, y: 2.35, yaw: 0 },
  { kind: 'railing', x: 12.0, z: 0.55, yaw: 0 },
  { kind: 'highbay', x: 11, z: 4, y: 2.95 },
  { kind: 'highbay', x: 17, z: 4, y: 2.95 },

  // ---- experience corridor (x 16..20, z 8..30) : services run its length
  { kind: 'cabletray', x: 19.55, z: 12.0, y: 2.35, yaw: 0 },
  { kind: 'cabletray', x: 19.55, z: 14.0, y: 2.35, yaw: 0 },
  { kind: 'cabletray', x: 19.55, z: 22.0, y: 2.35, yaw: 0 },
  { kind: 'cabletray', x: 19.55, z: 24.0, y: 2.35, yaw: 0 },
  { kind: 'extinguisher', x: 16.3, z: 19.0, y: 1.05, yaw: -R },
  { kind: 'bollard', x: 19.72, z: 9.2 },
  { kind: 'bollard', x: 19.72, z: 28.8 },

  // ---- archive (x -8..-2, z 8..34)
  { kind: 'cabinet', x: -7.4, z: 11.0, yaw: R },
  { kind: 'extinguisher', x: -7.7, z: 20.0, y: 1.05, yaw: R },
  { kind: 'cabletray', x: -7.5, z: 26.0, y: 2.35, yaw: 0 },

  // ---- the hall (x 0..34, z 30..46) : high bays on the truss, docks and bollards at the ends
  ...[4, 10, 16, 22, 28].flatMap((x) => [
    { kind: 'highbay' as const, x, z: 34.2, y: 4.0 },
    { kind: 'highbay' as const, x, z: 41.8, y: 4.0 },
  ]),
  { kind: 'dock', x: 1.4, z: 30.5, yaw: 0 },
  { kind: 'dock', x: 2.6, z: 30.5, yaw: 0 },
  { kind: 'dock', x: 32.6, z: 44.8, yaw: Math.PI },
  { kind: 'cabinet', x: 33.4, z: 31.1, yaw: -R },
  { kind: 'cabinet', x: 0.6, z: 44.9, yaw: R },
  { kind: 'extinguisher', x: 0.3, z: 36.0, y: 1.05, yaw: R },
  { kind: 'extinguisher', x: 33.7, z: 40.0, y: 1.05, yaw: -R },
  { kind: 'bollard', x: 0.5, z: 32.6 },
  { kind: 'bollard', x: 33.5, z: 43.4 },

  // ---- hackathons (x -8..0, z 34..42)
  { kind: 'cabinet', x: -7.4, z: 35.2, yaw: R },
  { kind: 'railing', x: -5.4, z: 41.5, yaw: R },
  { kind: 'railing', x: -3.2, z: 41.5, yaw: R },
  { kind: 'highbay', x: -4, z: 38, y: 2.95 },
  { kind: 'extinguisher', x: -7.7, z: 40.5, y: 1.05, yaw: R },

  // ---- dock (x -8..0, z 0..8)
  { kind: 'cabinet', x: -7.4, z: 5.6, yaw: R },
  { kind: 'cabletray', x: -7.5, z: 2.4, y: 2.35, yaw: 0 },
  { kind: 'highbay', x: -4, z: 4, y: 2.95 },
  { kind: 'bollard', x: -1.0, z: 0.5 },
]
