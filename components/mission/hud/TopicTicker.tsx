'use client'

import { useEffect, useRef } from 'react'
import { mission, subscribe } from '@/lib/mission/store'
import { ZONES } from '@/lib/mission/zones'
import { DRONE_PATHS, fleet } from '@/lib/mission/traffic'

const FLEET = `${fleet().length} amr · ${DRONE_PATHS.length} uav`

/** Bottom strip of (simulated) ROS telemetry that moves with the mission: frontiers fall as the map fills. */
export function TopicTicker() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(
    () =>
      subscribe(() => {
        const el = ref.current
        if (!el) return
        const m = mission
        const frontiers = Math.max(0, Math.round(11 * (1 - m.seenFraction)))
        const zonesFound = Math.min(7, m.zone + 1)
        const speed = m.robot.speed.toFixed(2)
        el.textContent = `/scan 10 Hz · /tf 100 Hz · /odom 50 Hz · frontiers ${frontiers} · zones ${zonesFound}/${ZONES.length} · v ${speed} m/s · fleet ${FLEET} · ${m.mode.toUpperCase()}`
      }),
    [],
  )
  return (
    <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-sm border border-grid/70 bg-ground/88 px-3 py-1 font-mono text-[0.6563rem] tracking-[0.12em] text-muted backdrop-blur-sm lg:block" aria-hidden>
      <span ref={ref}>/scan 10 Hz · /tf 100 Hz · /odom 50 Hz</span>
    </div>
  )
}
