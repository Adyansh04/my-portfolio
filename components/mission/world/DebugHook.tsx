'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/** Dev only: exposes the R3F root state as window.__r3f for console/automation inspection. */
export function DebugHook() {
  const state = useThree()
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __r3f?: unknown }).__r3f = state
  }, [state])
  return null
}
