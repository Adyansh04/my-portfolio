'use client'

import { useEffect, useRef } from 'react'
import { mission, subscribe, useMission } from '@/lib/mission/store'
import { ZONES } from '@/lib/mission/zones'
import { loopClosing } from '@/lib/mission/drift'

const MODE_LABEL = { boot: 'MODE BOOT', explore: 'MODE EXPLORE', inspect: 'MODE INSPECT', dock: 'MODE DOCK' } as const

function clock(t: number) {
  const s = Math.round(t * 600) // a ten-minute mission
  return `T+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function MissionStatus() {
  const zone = useMission((s) => s.zone)
  const mode = useMission((s) => s.mode)
  const mappedRef = useRef<HTMLSpanElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const loopRef = useRef<HTMLDivElement>(null)

  // fast-changing numbers go straight to the DOM
  useEffect(
    () =>
      subscribe(() => {
        if (mappedRef.current) mappedRef.current.textContent = `${String(Math.round(mission.seenFraction * 100)).padStart(2, ' ')}%`
        if (clockRef.current) clockRef.current.textContent = clock(mission.t)
        if (loopRef.current) loopRef.current.style.opacity = loopClosing() ? '1' : mission.zone === 6 ? '0.55' : '0'
      }),
    [],
  )

  const z = ZONES[zone]
  return (
    <div className="absolute left-8 top-7 hidden select-none font-mono text-[0.6875rem] leading-5 tracking-[0.12em] text-muted sm:block">
      <div className="text-accent">{MODE_LABEL[mode]}</div>
      <div>
        <span className="text-text">{z.label}</span> · {z.title.toUpperCase()}
      </div>
      <div className="tabular">
        mapped <span ref={mappedRef} className="text-text"> 0%</span> · <span ref={clockRef}>T+00:00</span>
        <span className="ml-2 rounded-sm border border-grid px-1 text-[0.5625rem] text-muted" title="Telemetry is simulated from scroll position">
          SIM
        </span>
      </div>
      <div ref={loopRef} className="text-accent transition-opacity duration-300" style={{ opacity: 0 }}>
        loop closure · 1 constraint · correction 0.41 m
      </div>
    </div>
  )
}
