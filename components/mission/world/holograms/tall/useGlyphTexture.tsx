'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GLYPHS } from '@/components/glyphs'

/**
 * Puts a project's own animated SVG poster on the console panel.
 *
 * These are the detailed schematics from the previous site — a floorplan with zones for the Go2, a
 * fiducial field for WhyCode, a factor graph for OLIVE — and they say far more about each project
 * than anything drawn by hand for this. They colour themselves with inline attributes rather than
 * classes, so serialising the live element preserves both the artwork and whatever pose
 * framer-motion currently has it in, which is what carries the animation across.
 *
 * Rasterising rather than floating the DOM over the canvas keeps the panel inside the scene, so it
 * takes the bloom, the fog and the depth sorting like everything else.
 */

/** The glyphs are all authored on a 400×300 field. */
export const GLYPH_ASPECT = 4 / 3

export function useGlyphTexture(folder: string, W: number, H: number, enabled: boolean, fps = 12) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }, [W, H])
  const ctx = useMemo(() => canvas.getContext('2d')!, [canvas])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])

  // An offscreen host so framer-motion actually runs and there is something live to serialise.
  // It gets its own React root rather than a portal: this hook is called from inside the R3F tree,
  // whose reconciler has no idea what to do with a <div>.
  const Glyph = GLYPHS[folder]
  useEffect(() => {
    if (!enabled || !Glyph) return
    const d = document.createElement('div')
    d.style.cssText = 'position:fixed;left:-99999px;top:0;width:400px;height:300px;pointer-events:none;'
    document.body.appendChild(d)
    const root = createRoot(d)
    root.render(<Glyph />)
    setHost(d)
    return () => {
      setHost(null)
      queueMicrotask(() => {
        root.unmount()
        d.remove()
      })
    }
  }, [enabled, Glyph])

  const img = useMemo(() => new Image(), [])
  const pending = useRef(false)
  const last = useRef(-99)
  const clock = useRef(0)

  useFrame((_, dt) => {
    if (!enabled || !host) return
    clock.current += Math.min(0.05, dt || 0.016)
    if (clock.current - last.current < 1 / fps || pending.current) return
    last.current = clock.current
    const svg = host.querySelector('svg')
    if (!svg) return

    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(W))
    clone.setAttribute('height', String(H))
    clone.removeAttribute('class')
    // One glyph animates with a CSS keyframe block instead of framer-motion, and CSS inside an
    // SVG loaded as an image never advances past t=0 — which for a draw-on animation means it
    // renders empty. Pausing every animation at a negative delay samples it at the current time
    // instead, so it moves frame to frame like the others.
    const sample = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    sample.textContent = `*{animation-delay:-${clock.current.toFixed(2)}s !important;animation-play-state:paused !important}`
    clone.insertBefore(sample, clone.firstChild)

    const str = new XMLSerializer().serializeToString(clone)
    pending.current = true
    img.onload = () => {
      paint(ctx, img, W, H)
      texture.needsUpdate = true
      pending.current = false
    }
    img.onerror = () => {
      pending.current = false
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)
  })

  useEffect(() => () => texture.dispose(), [texture])

  return texture
}

/** The glyphs draw themselves in one accent; the glow matches it rather than the project colour,
 *  which otherwise cross-tints the whole poster (orange art under a lime glow reads as yellow). */
const GLOW = '#ff7a1a'

/**
 * The glyphs are hairline line-art meant to be read at arm's length; on this panel a stroke lands
 * at about a pixel and a half. So the poster gets a soft glow and one pass of dilation before the
 * sharp copy goes on top — enough to stay legible from across the hall.
 *
 * The alphas are deliberately low. Additive passes stack, the panel is emissive, and bloom runs
 * over the whole frame afterwards: at full strength the strokes clip to white and the panel reads
 * as a lamp rather than a display.
 */
function paint(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0a1119')
  bg.addColorStop(1, '#05080e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = 0.28
  ctx.shadowColor = GLOW
  ctx.shadowBlur = W * 0.012
  ctx.drawImage(img, 0, 0, W, H)
  ctx.shadowBlur = 0
  // one pass of dilation, thickening each stroke by about a pixel without blurring it
  ctx.globalAlpha = 0.2
  const d = Math.max(1, W / 900)
  for (const [ox, oy] of [[-d, 0], [d, 0], [0, -d], [0, d]]) ctx.drawImage(img, ox, oy, W, H)
  ctx.globalAlpha = 0.8
  ctx.drawImage(img, 0, 0, W, H)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}
