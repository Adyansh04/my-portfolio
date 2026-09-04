'use client'

import { HudFrame } from './HudFrame'
import { MissionStatus } from './MissionStatus'
import { ZoneNav } from './ZoneNav'
import { Minimap } from './Minimap'
import { TopicTicker } from './TopicTicker'
import { ConsoleButton } from './ConsoleButton'

/** Fixed telemetry layer above the page. Only the controls take pointer events. */
export function Hud() {
  return (
    <div className="hud pointer-events-none fixed inset-0 z-30 transition-opacity duration-300" aria-label="Mission HUD">
      <HudFrame />
      <MissionStatus />
      <Minimap />
      <TopicTicker />
      <ConsoleButton />
      <ZoneNav />
    </div>
  )
}
