'use client'

import type { ComponentType } from 'react'
import { SLAB_HOLOGRAMS } from './slab/SlabHologram'

/**
 * Project mediaFolder → hologram content. Every project is now a milled plate (the "terrain slab"
 * style): the subject raised out of an anodised deck as chamfered relief, its route routed as a lit
 * channel, with pulses and a tool light doing the moving. The earlier line-art scenes are gone.
 */
export const HOLOGRAMS: Record<string, ComponentType> = SLAB_HOLOGRAMS
