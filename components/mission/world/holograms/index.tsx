'use client'

import type { ComponentType } from 'react'
import { ProjectConsole } from './tall/ProjectConsole'
import { SLAB_DESIGNS } from './data/projects'

/**
 * Project mediaFolder → hologram content. Each one is its own hardware working below a panel
 * carrying that project's SVG poster: the Go2 walking a facility, the UR5e picking off a bench,
 * an overhead camera tracking a rover, a Crazyflie flying a room. The pair exists because of the
 * shot — the hall camera is 7.4 m out and 21 degrees down, so the lower half carries silhouette
 * and motion while the panel carries detail on a surface that angle cannot crush.
 */
export const HOLOGRAMS: Record<string, ComponentType> = Object.fromEntries(
  Object.keys(SLAB_DESIGNS).map((key) => [key, () => <ProjectConsole design={SLAB_DESIGNS[key]} projectKey={key} />]),
)
