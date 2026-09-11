'use client'

import { Suspense } from 'react'
import { projects } from '@/content/projects'
import { PEDESTALS } from '@/lib/mission/facility'
import { HologramFrame } from '../holograms/HologramFrame'
import { HOLOGRAMS } from '../holograms'
import { ProjectConsole } from '../holograms/tall/ProjectConsole'
import { DEFAULT_DESIGN } from '../holograms/data/projects'

/** The project hall: one pedestal per project along the aisle, one hologram each, in content order.
 *  A project without a design of its own gets the generic console, titled with its own name. */
export function Zone3Projects() {
  return (
    <group>
      {projects.map((p, i) => {
        const ped = PEDESTALS[i]
        const key = p.details.mediaFolder
        const Content = HOLOGRAMS[key]
        return (
          <HologramFrame key={p.id} x={ped.x} z={ped.z} index={i} project={p}>
            <Suspense fallback={null}>{Content ? <Content /> : <ProjectConsole design={DEFAULT_DESIGN} projectKey={key} />}</Suspense>
          </HologramFrame>
        )
      })}
    </group>
  )
}
