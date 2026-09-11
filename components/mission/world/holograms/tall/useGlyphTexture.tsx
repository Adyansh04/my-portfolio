'use client'

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GLYPHS } from '@/components/glyphs'
import { projects } from '@/content/projects'
import type { Project } from '@/content/types'

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
 *
 * ## Why only one of these runs at a time
 *
 * The first version gave every hologram within 22 m its own live glyph and cost the hall 45 fps:
 * ten SVG trees of a couple of hundred elements each, every one of them having its inline styles
 * rewritten 60 times a second, is style, layout and paint work the browser does before three.js
 * gets a look in. Measured: 0 hosts 60 fps, 5 hosts 45, 7 hosts 15, 10 hosts 11.
 *
 * So a live host is a scarce resource. The nearest hologram holds one — that is the one being
 * looked at, and the only one whose animation anyone can resolve. One more is loaned to whichever
 * panel has never been painted, so nothing further down the aisle is ever blank. Everything else
 * keeps the last frame it drew, which at 15 m is indistinguishable from a live one.
 */

/** Beyond this a panel keeps whatever it last painted. */
const LIVE_RANGE = 26
/** How many glyph trees may animate at once: the one in shot, plus one being primed. */
const CAP = 2
const FPS = 10
/** Glyphs play an entrance animation on mount; painting before it finishes captures a half-drawn
 *  poster, which is exactly what made a freshly-approached panel look sparse. A primed panel keeps
 *  its *last* frame, so priming has to run past the longest entrance — about two seconds. */
const SETTLE = 1.5
const PRIME_FRAMES = 12

interface Entry {
  dist: number
  want: boolean
  primed: boolean
}
const entries = new Map<number, Entry>()
let nextId = 1

/** Nearest in range, plus the nearest that has never painted. */
function grant(): Set<number> {
  const out = new Set<number>()
  const live = [...entries.entries()].filter(([, e]) => e.want).sort((a, b) => a[1].dist - b[1].dist)
  if (live.length) out.add(live[0][0])
  for (const [id, e] of live) {
    if (out.size >= CAP) break
    if (!e.primed && !out.has(id)) out.add(id)
  }
  return out
}

/** The glyphs are all authored on a 400×300 field. */
export const GLYPH_ASPECT = 4 / 3

export function useGlyphTexture(folder: string, anchor: RefObject<THREE.Object3D | null>, W: number, H: number) {
  const id = useMemo(() => nextId++, [])
  const entry = useMemo<Entry>(() => ({ dist: Infinity, want: false, primed: false }), [])
  useEffect(() => {
    entries.set(id, entry)
    return () => {
      entries.delete(id)
    }
  }, [id, entry])

  const [hasHost, setHasHost] = useState(false)
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const holds = useRef(false)

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

  // An offscreen host so framer-motion actually runs and there is something live to serialise. It
  // gets its own React root rather than a portal: this hook is called from inside the R3F tree,
  // whose reconciler has no idea what to do with a <div>. `content-visibility` keeps the browser
  // from laying out and painting a tree that only exists to be read.
  const Glyph = GLYPHS[folder]
  useEffect(() => {
    if (Glyph) return
    const p = projects.find((x) => x.details.mediaFolder === folder)
    if (!p) return
    void document.fonts.ready.then(() => {
      titleCard(ctx, p, W, H)
      texture.needsUpdate = true
    })
  }, [Glyph, folder, ctx, texture, W, H])
  const mountedAt = useRef(0)
  const clock = useRef(0)
  useEffect(() => {
    if (!hasHost || !Glyph) return
    const d = document.createElement('div')
    d.style.cssText = 'position:fixed;left:-99999px;top:0;width:400px;height:300px;pointer-events:none;content-visibility:hidden;contain:strict;'
    document.body.appendChild(d)
    const root = createRoot(d)
    root.render(<Glyph />)
    mountedAt.current = clock.current
    setHost(d)
    return () => {
      setHost(null)
      queueMicrotask(() => {
        root.unmount()
        d.remove()
      })
    }
  }, [hasHost, Glyph])

  const img = useMemo(() => new Image(), [])
  const pending = useRef(false)
  const last = useRef(-99)
  const lastGrant = useRef(-99)
  const painted = useRef(0)
  const pos = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }, dt) => {
    clock.current += Math.min(0.05, dt || 0.016)

    const a = anchor.current
    if (a) {
      a.getWorldPosition(pos)
      entry.dist = pos.distanceTo(camera.position)
    }
    // a title card is static: it never needs a live host, and must not sit in the priming queue
    entry.want = !!Glyph && entry.dist < LIVE_RANGE

    // arbitration is cheap but pointless every frame, and flapping would remount glyph trees
    if (clock.current - lastGrant.current > 0.3) {
      lastGrant.current = clock.current
      const want = grant().has(id)
      if (want !== holds.current) {
        holds.current = want
        setHasHost(want)
      }
    }

    if (!host || pending.current) return
    if (clock.current - mountedAt.current < SETTLE) return
    if (clock.current - last.current < 1 / FPS) return
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
      if (++painted.current >= PRIME_FRAMES) entry.primed = true
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

/** A project added without line-art yet: its code, title and tags on the same panel ground, so a
 *  new entry never puts a blank screen in the hall. */
function titleCard(ctx: CanvasRenderingContext2D, p: Project, W: number, H: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0a1119')
  bg.addColorStop(1, '#05080e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const x = W * 0.08
  ctx.textBaseline = 'top'
  ctx.fillStyle = GLOW
  ctx.font = `500 ${Math.round(H * 0.05)}px "IBM Plex Mono", ui-monospace, monospace`
  ctx.fillText(`PRJ-${String(p.id).padStart(3, '0')} · ${p.year}`, x, H * 0.12)
  ctx.fillStyle = '#e9eef3'
  const size = Math.round(H * 0.11)
  ctx.font = `700 ${size}px "Big Shoulders", Impact, sans-serif`
  let y = H * 0.24
  let line = ''
  for (const w of p.title.toUpperCase().split(' ')) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width > W - 2 * x && line) {
      ctx.fillText(line, x, y)
      y += size * 1.05
      line = w
    } else line = next
  }
  ctx.fillText(line, x, y)
  ctx.fillStyle = '#8a94a6'
  ctx.font = `400 ${Math.round(H * 0.042)}px "IBM Plex Mono", ui-monospace, monospace`
  ctx.fillText(p.tags.slice(0, 4).join(' · '), x, H * 0.82)
}
