'use client'

import { useEffect, useState } from 'react'
import { setStaticMode } from './store'

/** The decision is made before first paint by STATIC_MODE_SCRIPT (see static-mode-script.ts); this only reads it. */
export function detectStaticMode(): boolean {
  if (typeof window === 'undefined') return false
  return document.documentElement.dataset.static === 'true'
}

/** Resolves after mount (server renders the DOM-only page; the world is client-only anyway). */
export function useStaticMode(): boolean | null {
  const [mode, setMode] = useState<boolean | null>(null)
  useEffect(() => {
    const v = detectStaticMode()
    setMode(v)
    setStaticMode(v)
  }, [])
  return mode
}
