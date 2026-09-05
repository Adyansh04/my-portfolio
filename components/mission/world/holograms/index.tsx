'use client'

import type { ComponentType } from 'react'
import { ConsoleHelix } from './tall/ConsoleHelix'
import { SLAB_DESIGNS } from './data/projects'

/**
 * Project mediaFolder → hologram content. Every project is a console-and-helix: the robot works a
 * helical ramp in the lower half and an upright console above shows what that work produced, both
 * driven by one progress value. The pair exists because of the shot — the hall camera is 7.4 m out
 * and 21 degrees down, so the helix carries silhouette and motion while the console carries detail
 * on a surface that angle cannot crush.
 */
export const HOLOGRAMS: Record<string, ComponentType> = Object.fromEntries(
  Object.keys(SLAB_DESIGNS).map((key) => [
    key,
    () => <ConsoleHelix design={SLAB_DESIGNS[key]} projectKey={key} climber={key === 'go2-inspection' ? 'go2' : 'puck'} />,
  ]),
)
