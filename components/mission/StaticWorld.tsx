'use client'

import { useMission } from '@/lib/mission/store'
import { asset } from '@/lib/base-path'
import { ZONES } from '@/lib/mission/zones'

/**
 * Poster per zone instead of the live world; crossfades as the reader moves between sections.
 * Only the current zone and its neighbours carry an image, so a phone fetches three posters up
 * front instead of all seven. On a phone the landscape poster is cropped to a portrait screen and
 * magnified about 2x, which turned the in-world signs into sharp ghost text behind the cards, so
 * there it is blurred into plain atmosphere.
 */
export function StaticWorld() {
  const zone = useMission((s) => s.zone)
  return (
    <div className="fixed inset-0 z-0 bg-ground" aria-hidden>
      {ZONES.map((z) => (
        <div
          key={z.id}
          className="absolute inset-0 bg-cover bg-center blur-[6px] transition-opacity duration-700 md:blur-none"
          style={{
            backgroundImage: Math.abs(z.index - zone) <= 1 ? `url(${asset(`/posters/zone-${z.index}.jpg`)})` : undefined,
            opacity: z.index === zone ? 0.55 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-ground/40 via-transparent to-ground/70" />
    </div>
  )
}
