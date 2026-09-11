'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/** Dev helper: with `?capture=1`, exposes window.__captureWorld() → JPEG data URL of the current frame (used to bake the static-mode posters). */
export const capturing = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('capture') === '1'

export function PosterCapture() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (!capturing()) return
    ;(window as unknown as { __captureWorld?: () => string }).__captureWorld = () => gl.domElement.toDataURL('image/jpeg', 0.82)
  }, [gl])
  return null
}
