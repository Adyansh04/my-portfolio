'use client'

import { Suspense } from 'react'
import { DRONE_PATHS, fleet } from '@/lib/mission/traffic'
import { Amr } from './Amr'
import { Drone } from './Drone'
import { CatchPair } from './CatchPair'
import { Props } from './Props'
import { Dressing } from './Dressing'

/**
 * The facility carries on with its own work while the mission runs: an AMR fleet moving totes
 * between stations, drones patrolling the hall, and two humanoids playing catch in the far bay.
 * Nothing here reacts to scroll — it is all on its own clock, which is what makes the world feel
 * lived-in rather than staged. Everything culls itself by camera distance.
 */
export function AmbientLife() {
  return (
    <group>
      <Dressing />
      <Suspense fallback={null}>
        <Props />
      </Suspense>
      {fleet().map((u) => (
        <Amr key={u.label} route={u.route} label={u.label} phase={u.phase} />
      ))}
      {DRONE_PATHS.map((p) => (
        <Drone key={p.id} path={p} />
      ))}
      <Suspense fallback={null}>
        <CatchPair />
      </Suspense>
    </group>
  )
}
