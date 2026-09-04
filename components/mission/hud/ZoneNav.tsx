'use client'

import { useMission } from '@/lib/mission/store'
import { ZONES } from '@/lib/mission/zones'

export function ZoneNav() {
  const active = useMission((s) => s.zone)
  return (
    <nav aria-label="Zones" className="pointer-events-auto absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
      {ZONES.map((z) => {
        const isActive = z.index === active
        return (
          <button
            key={z.id}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            aria-label={`${z.label} ${z.title}`}
            onClick={() => document.getElementById(z.id)?.scrollIntoView({ behavior: 'smooth' })}
            className="group flex items-center justify-end gap-3 py-1"
          >
            <span className="max-w-0 overflow-hidden whitespace-nowrap font-mono text-[10px] tracking-[0.14em] text-muted opacity-0 transition-all duration-300 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:opacity-100">
              {z.label} · {z.title.toUpperCase()}
            </span>
            <span
              className={`block h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                isActive ? 'scale-125 bg-accent shadow-[0_0_10px_var(--accent)]' : 'bg-grid group-hover:bg-muted'
              }`}
            />
          </button>
        )
      })}
    </nav>
  )
}
