import type { CSSProperties, ReactNode } from 'react'
import type { ZoneDef } from '@/lib/mission/zones'

/**
 * A zone = a tall section whose 100vh frame sticks while the world moves behind it.
 * `--zt` (0..1 zone progress), `--beat` (active beat index) and `--bt` (progress within the beat)
 * are written by MissionPage; children animate from them with CSS only.
 */
export function ZoneSection({ zone, children }: { zone: ZoneDef; children: ReactNode }) {
  const style = { height: `${zone.scrollVh}vh`, '--zt': 0, '--beat': 0, '--bt': 0, '--enter': zone.index === 0 ? 1 : 0, '--beats': zone.beats } as CSSProperties
  return (
    <section id={zone.id} data-zone={zone.index} data-state={zone.index === 0 ? 'active' : 'future'} style={style} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">{children}</div>
    </section>
  )
}
