'use client'

import { Suspense } from 'react'
import { projects } from '@/content/projects'
import { PEDESTALS } from '@/lib/mission/facility'
import { HologramFrame } from '../holograms/HologramFrame'
import { HOLOGRAMS } from '../holograms'
import { Placeholder } from '../holograms/Placeholder'

/** The project hall: ten pedestals along the aisle, one hologram per project, in content order. */
export function Zone3Projects() {
  return (
    <group>
      {projects.map((p, i) => {
        const ped = PEDESTALS[i]
        const Content = HOLOGRAMS[p.details.mediaFolder] ?? Placeholder
        return (
          <HologramFrame key={p.id} x={ped.x} z={ped.z} index={i} project={p}>
            <Suspense fallback={null}>
              <Content />
            </Suspense>
          </HologramFrame>
        )
      })}
    </group>
  )
}
