'use client'

import dynamic from 'next/dynamic'
import { useStaticMode } from '@/lib/mission/static-mode'
import { StaticWorld } from './StaticWorld'

// Client-only: WebGL never renders on the server; the DOM content is fully readable without it.
const WorldScene = dynamic(() => import('./world/WorldScene').then((m) => m.WorldScene), { ssr: false })

export function WorldCanvas() {
  const isStatic = useStaticMode()
  if (isStatic === null) return <div className="fixed inset-0 z-0 bg-ground" aria-hidden />
  if (isStatic) return <StaticWorld />
  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <WorldScene />
    </div>
  )
}
