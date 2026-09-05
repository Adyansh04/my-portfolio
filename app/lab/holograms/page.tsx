'use client'

import dynamic from 'next/dynamic'

/** Design study for the project holograms — not linked from the site. */
const LabGallery = dynamic(() => import('@/components/mission/world/holograms/lab/LabGallery').then((m) => m.LabGallery), { ssr: false })

export default function HologramLabPage() {
  return <LabGallery />
}
