'use client'

import dynamic from 'next/dynamic'

/** Design study for the tall project holograms — not linked from the site. */
const TallGallery = dynamic(() => import('@/components/mission/world/holograms/tall/TallGallery').then((m) => m.TallGallery), { ssr: false })

export default function TallLabPage() {
  return <TallGallery />
}
