'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PLACARDS } from '@/lib/mission/facility'
import { experiences } from '@/content/experience'
import { mission } from '@/lib/mission/store'
import { asset } from '@/lib/base-path'

/** company → logo file base name in public/logos (png or svg) */
const LOGO_SLUG: Record<string, string> = {
  'Robotics Collective': 'robotics-collective',
  'Addverb Technologies': 'addverb',
  'Sakar Robotics': 'sakar-robotics',
  'Avignon University': 'avignon-university',
  'Dassault Systems': 'dassault-systemes',
  'VIIT Robotics (College Club)': 'viit',
}
/** marks drawn white-on-transparent get a dark plate instead of the default light one */
const DARK_PLATE = new Set(['robotics-collective'])
const W = 1024
const H = 512

function drawPlacard(ctx: CanvasRenderingContext2D, i: number, logo: HTMLImageElement | null) {
  const e = experiences[i]
  const darkPlate = DARK_PLATE.has(LOGO_SLUG[e.company] ?? '')
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, W, H)
  const mono = (size: number, weight = '500') => `${weight} ${size}px "IBM Plex Mono", ui-monospace, monospace`
  ctx.textBaseline = 'top'
  // logo plate (white, since most marks are designed for light grounds)
  ctx.fillStyle = darkPlate ? '#1b222c' : '#f2f4f6'
  ctx.beginPath()
  ctx.roundRect(40, 40, 300, 300, 18)
  ctx.fill()
  if (logo) {
    const pad = 30
    const iw = logo.naturalWidth || logo.width || 300
    const ih = logo.naturalHeight || logo.height || 150
    const s = Math.min((300 - pad * 2) / iw, (300 - pad * 2) / ih)
    const lw = iw * s
    const lh = ih * s
    ctx.drawImage(logo, 40 + (300 - lw) / 2, 40 + (300 - lh) / 2, lw, lh)
  } else {
    ctx.fillStyle = '#0d1117'
    ctx.font = `700 96px "Big Shoulders", Impact, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(e.company.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase(), 190, 150)
    ctx.textAlign = 'left'
  }
  ctx.fillStyle = '#ff7a1a'
  ctx.font = mono(26)
  ctx.fillText(e.period.toUpperCase(), 380, 52)
  ctx.fillStyle = '#e9eef3'
  ctx.font = `700 52px "Big Shoulders", Impact, sans-serif`
  const words = e.company.toUpperCase().split(' ')
  let line = ''
  let y = 96
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > 590 && line) {
      ctx.fillText(line, 380, y)
      y += 56
      line = w
    } else line = test
  }
  ctx.fillText(line, 380, y)
  y += 70
  ctx.fillStyle = '#c9d1db'
  ctx.font = mono(26, '600')
  ctx.fillText(e.title, 380, y)
  ctx.fillStyle = '#8a94a6'
  ctx.font = mono(22)
  ctx.fillText(e.location, 380, y + 40)
  // highlights
  e.highlights.forEach((h, k) => {
    const hx = 380 + k * 300
    ctx.fillStyle = '#8a94a6'
    ctx.font = mono(18)
    ctx.fillText(h.label.toUpperCase(), hx, 300)
    ctx.fillStyle = '#ff7a1a'
    ctx.font = mono(30, '600')
    ctx.fillText(h.metric, hx, 326)
  })
  // badges
  let bx = 40
  ctx.font = mono(20)
  e.badges.forEach((b) => {
    const tw = ctx.measureText(b).width + 28
    ctx.strokeStyle = 'rgba(138,148,166,0.6)'
    ctx.strokeRect(bx + 0.5, 400.5, tw, 40)
    ctx.fillStyle = '#c9d1db'
    ctx.fillText(b, bx + 14, 410)
    bx += tw + 12
  })
}

function Placard({ index }: { index: number }) {
  const p = PLACARDS[index]
  const e = experiences[index]
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture])
  const frame = useRef<THREE.MeshStandardMaterial>(null)

  useEffect(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawPlacard(ctx, index, null)
    texture.needsUpdate = true
    const slug = LOGO_SLUG[e.company]
    if (!slug) return
    const img = new Image()
    let tried = 0
    const exts = ['png', 'svg']
    img.onload = () => {
      drawPlacard(ctx, index, img)
      texture.needsUpdate = true
    }
    img.onerror = () => {
      tried++
      if (tried < exts.length) img.src = asset(`/logos/${slug}.${exts[tried]}`)
    }
    img.src = asset(`/logos/${slug}.${exts[0]}`)
  }, [canvas, texture, index, e.company])

  useFrame((_, dt) => {
    const on = mission.zone === 2 && mission.beat === index ? 1.3 : 0.18
    if (frame.current) frame.current.emissiveIntensity += (on - frame.current.emissiveIntensity) * Math.min(1, dt * 4)
  })

  // mounted off the wall on an arm and angled toward the approaching camera (which trails the robot, so it comes from -z)
  const yaw = p.side === 1 ? Math.atan2(-0.78, -0.62) : Math.atan2(0.78, -0.62)
  const px = p.x - p.side * 0.5
  return (
    <group position={[px, 1.6, p.z]}>
      {/* mounting arm back to the wall */}
      <mesh position={[p.side * 0.25, 0, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.05]} />
        <meshStandardMaterial color="#3b4a63" roughness={0.6} />
      </mesh>
      <group rotation={[-0.1, yaw, 0]}>
        <mesh>
          <boxGeometry args={[1.7, 0.9, 0.06]} />
          <meshStandardMaterial ref={frame} color="#141a22" emissive="#ff7a1a" emissiveIntensity={0.18} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.035]} material={face}>
          <planeGeometry args={[1.6, 0.8]} />
        </mesh>
      </group>
    </group>
  )
}

/** The experience corridor: six angled placards with company logos, one per role. */
export function Zone2Experience() {
  return (
    <group>
      {PLACARDS.map((_, i) => (
        <Placard key={i} index={i} />
      ))}
    </group>
  )
}
