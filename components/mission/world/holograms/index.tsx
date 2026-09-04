'use client'

import type { ComponentType } from 'react'
import { Go2MapHologram } from './Go2MapHologram'
import { ArmMeshHologram } from './ArmMeshHologram'
import { FactorGraphHologram } from './FactorGraphHologram'
import { FiducialHologram } from './FiducialHologram'
import { RagHologram } from './RagHologram'
import { MecanumHologram } from './MecanumHologram'
import { KiwiHologram } from './KiwiHologram'
import { WatchtowerHologram } from './WatchtowerHologram'
import { AgroHologram } from './AgroHologram'
import { DroneHologram } from './DroneHologram'

/** Project mediaFolder → hologram content (one literal scene per project). */
export const HOLOGRAMS: Record<string, ComponentType> = {
  'go2-inspection': Go2MapHologram,
  'ai-robotics': ArmMeshHologram,
  olive: FactorGraphHologram,
  whycode: FiducialHologram,
  'sepsis-atlas': RagHologram,
  'abu-robocon': MecanumHologram,
  'kiwi-drive': KiwiHologram,
  vanguard: WatchtowerHologram,
  agrobot: AgroHologram,
  'drone-systems': DroneHologram,
}
