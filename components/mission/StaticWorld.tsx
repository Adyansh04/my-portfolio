'use client'

import { useMission } from '@/lib/mission/store'
import { asset } from '@/lib/base-path'
import { ZONES } from '@/lib/mission/zones'

/** Poster per zone instead of the live world; crossfades as the reader moves between sections. */
export function StaticWorld() {
  const zone = useMission((s) => s.zone)
  return (
    <div className="fixed inset-0 z-0 bg-ground" aria-hidden>
      {ZONES.map((z) => (
        <div
          key={z.id}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${asset(`/posters/zone-${z.index}.jpg`)})`, opacity: z.index === zone ? 0.55 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-ground/40 via-transparent to-ground/70" />
    </div>
  )
}
