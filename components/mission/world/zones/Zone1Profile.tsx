'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { DISPLAY_WALL, WALL_THICKNESS } from '@/lib/mission/facility'
import { site } from '@/content/site'
import { education } from '@/content/education'
import { techStack } from '@/content/tech-stack'
import { mission } from '@/lib/mission/store'
import { PooledLight } from '../LightPool'

const W = 2048
const H = 460
const FPS = 15

/** Draws one frame of the profile screen: identity + education on the left, the tech-stack matrix lighting up on the right. */
function drawScreen(ctx: CanvasRenderingContext2D, t: number, boot: number) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, W, H)
  // faint grid
  ctx.strokeStyle = 'rgba(58,74,99,0.25)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(W, y + 0.5)
    ctx.stroke()
  }
  const mono = (size: number, weight = '500') => `${weight} ${size}px "IBM Plex Mono", ui-monospace, monospace`
  ctx.textBaseline = 'top'
  // header
  ctx.fillStyle = '#ff7a1a'
  ctx.font = mono(22)
  ctx.fillText('ZONE 01 · PROFILE · BACKGROUND & EXPERTISE', 56, 34)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#8a94a6'
  ctx.fillText(`T+${String(Math.floor((t * 7) / 60) % 60).padStart(2, '0')}:${String(Math.floor(t * 7) % 60).padStart(2, '0')}  ·  DISPLAY ONLINE`, W - 56, 34)
  ctx.textAlign = 'left'
  // name types in during boot
  const name = site.name.toUpperCase()
  const shown = Math.max(0, Math.min(name.length, Math.floor(boot * 1.4 * name.length)))
  ctx.fillStyle = '#e9eef3'
  ctx.font = `700 78px "Big Shoulders", Impact, sans-serif`
  ctx.fillText(name.slice(0, shown) + (shown < name.length && Math.floor(t * 3) % 2 === 0 ? '_' : ''), 56, 76)
  ctx.fillStyle = '#8a94a6'
  ctx.font = mono(26)
  if (boot > 0.6) ctx.fillText(site.role.toUpperCase(), 58, 166)
  // education rows slide in
  education.forEach((e, i) => {
    const k = Math.max(0, Math.min(1, (boot - 0.75 - i * 0.12) * 4))
    if (k <= 0) return
    const x = 56 - (1 - k) * 60
    ctx.globalAlpha = k
    ctx.fillStyle = '#ff7a1a'
    ctx.font = mono(20)
    ctx.fillText(e.years, x, 226 + i * 64)
    ctx.fillStyle = '#e9eef3'
    ctx.font = mono(24, '600')
    ctx.fillText(e.school, x, 250 + i * 64)
    ctx.fillStyle = '#8a94a6'
    ctx.font = mono(18)
    ctx.fillText(e.degree, x + 520, 254 + i * 64)
    ctx.globalAlpha = 1
  })
  // tech-stack matrix (right half): chips light in a travelling wave
  const cols = 4
  const cx0 = 1140
  const cy0 = 96
  const cw = 208
  const ch = 44
  ctx.fillStyle = '#8a94a6'
  ctx.font = mono(18)
  ctx.fillText(`TECH STACK · ${techStack.length} ITEMS`, cx0, 66)
  techStack.forEach((item, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const x = cx0 + c * (cw + 10)
    const y = cy0 + r * (ch + 8)
    const appear = Math.max(0, Math.min(1, (boot - 0.3 - i * 0.02) * 5))
    if (appear <= 0) return
    const wave = 0.5 + 0.5 * Math.sin(t * 1.6 - i * 0.42)
    const on = wave > 0.72
    ctx.globalAlpha = appear
    ctx.fillStyle = on ? 'rgba(255,122,26,0.22)' : 'rgba(58,74,99,0.28)'
    ctx.fillRect(x, y, cw, ch)
    ctx.strokeStyle = on ? '#ff7a1a' : 'rgba(138,148,166,0.5)'
    ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1)
    ctx.fillStyle = on ? '#ffb27a' : '#c9d1db'
    ctx.font = mono(17, on ? '600' : '500')
    ctx.fillText(item, x + 12, y + 13)
    ctx.globalAlpha = 1
  })
  // scanning line across the whole screen
  const sx = ((t * 180) % (W + 300)) - 150
  const g = ctx.createLinearGradient(sx - 120, 0, sx, 0)
  g.addColorStop(0, 'rgba(255,122,26,0)')
  g.addColorStop(1, 'rgba(255,122,26,0.16)')
  ctx.fillStyle = g
  ctx.fillRect(sx - 120, 0, 120, H)
  ctx.fillStyle = 'rgba(255,122,26,0.5)'
  ctx.fillRect(sx, 0, 2, H)
  // footer
  ctx.fillStyle = '#8a94a6'
  ctx.font = mono(16)
  ctx.fillText(`${site.mission}`, 56, H - 40)
}

/** The profile wall: an animated control-room screen carrying the same facts the DOM shows. */
export function Zone1Profile() {
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
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture])
  const glow = useRef<THREE.PointLight>(null)
  const clock = useRef({ t: 0, acc: 1, boot: 0 })

  useFrame(({ camera }, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    const cx = (DISPLAY_WALL.x0 + DISPLAY_WALL.x1) / 2
    const near = Math.hypot(camera.position.x - cx, camera.position.z - DISPLAY_WALL.z) < 22
    const s = clock.current
    if (!near) return
    s.t += d
    s.acc += d
    // boot sequence plays when the visitor enters zone 1, stays complete afterwards
    const wantBoot = mission.zone >= 1 || mission.zoneT > 0.6
    s.boot = Math.min(1.6, s.boot + (wantBoot ? d * 0.55 : 0))
    if (s.acc >= 1 / FPS) {
      s.acc = 0
      const ctx = canvas.getContext('2d')
      if (ctx) {
        drawScreen(ctx, s.t, s.boot)
        texture.needsUpdate = true
      }
    }
    const on = mission.zone === 1 ? 1 : 0.4
    if (glow.current) glow.current.intensity += (on * 7 - glow.current.intensity) * 0.05
  })

  const cx = (DISPLAY_WALL.x0 + DISPLAY_WALL.x1) / 2
  const cy = (DISPLAY_WALL.y0 + DISPLAY_WALL.y1) / 2
  const z = DISPLAY_WALL.z + WALL_THICKNESS / 2 + 0.03
  const w = DISPLAY_WALL.x1 - DISPLAY_WALL.x0
  const h = DISPLAY_WALL.y1 - DISPLAY_WALL.y0
  return (
    <group>
      <mesh position={[cx, cy, z]} material={mat}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[cx, cy, z - 0.02]}>
        <planeGeometry args={[w + 0.14, h + 0.14]} />
        <meshStandardMaterial color="#1b222c" roughness={0.6} emissive="#ff7a1a" emissiveIntensity={0.08} />
      </mesh>
      <PooledLight ref={glow} position={[cx, 1.7, z + 1.8]} color="#cfe3ff" intensity={2} distance={10} decay={2} />
    </group>
  )
}
