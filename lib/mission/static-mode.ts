'use client'

import { useEffect, useState } from 'react'
import { setStaticMode } from './store'

/**
 * Static mode = no WebGL world, sections flow normally, every beat visible.
 * Chosen for reduced-motion users, phones/narrow viewports, or `?mode=static` (testing).
 * `?mode=world` forces the world on (e.g. to test a phone layout with 3D).
 */
export function detectStaticMode(): boolean {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(window.location.search).get('mode')
  if (q === 'static') return true
  if (q === 'world') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  if (window.innerWidth < 768) return true
  return false
}

/** Resolves after mount (server renders the DOM-only page; the world is client-only anyway). */
export function useStaticMode(): boolean | null {
  const [mode, setMode] = useState<boolean | null>(null)
  useEffect(() => {
    const v = detectStaticMode()
    setMode(v)
    setStaticMode(v)
    document.documentElement.dataset.static = v ? 'true' : 'false'
  }, [])
  return mode
}
