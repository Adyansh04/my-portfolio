'use client'

import { useEffect, useRef } from 'react'
import { BOUNDS, CELL, ROOMS, cellCenter, roomAt, wallPieces } from '@/lib/mission/facility'
import { computeReveal } from '@/lib/mission/reveal'
import { missionT } from '@/lib/mission/path'
import { mission, useMission } from '@/lib/mission/store'
import { ZONES } from '@/lib/mission/zones'

const W = 176
const H = 192
const s = Math.min(W / (BOUNDS.maxX - BOUNDS.minX), H / (BOUNDS.maxZ - BOUNDS.minZ))
const ox = (W - s * (BOUNDS.maxX - BOUNDS.minX)) / 2
const oz = (H - s * (BOUNDS.maxZ - BOUNDS.minZ)) / 2
const X = (x: number) => ox + (x - BOUNDS.minX) * s
const Z = (z: number) => oz + (z - BOUNDS.minZ) * s

/** Nav2-style minimap: the map as far as it has been scanned, the robot, the camera, and zone labels. Click a room to go there. */
export function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null)
  // the hero's copy lives bottom-left; park the map bottom-right there, bottom-left everywhere else
  const onHero = useMission((s) => s.zone) === 0

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    // the canvas is laid out in rem so it grows with the interface; keep the backing buffer in step
    // and draw in fixed W x H units so all the map maths below stays unchanged
    let px = 0
    const fit = () => {
      const k = (c.clientWidth / W) * dpr
      if (Math.abs(k - px) < 0.001) return
      px = k
      c.width = Math.round(W * k)
      c.height = Math.round(H * k)
      ctx.setTransform(k, 0, 0, k, 0, 0)
    }
    fit()
    const data = computeReveal()
    const walls = wallPieces()
    // room index per cell for per-zone mapped fractions
    const roomOf = new Int8Array(data.seenAt.length)
    for (let i = 0; i < roomOf.length; i++) {
      const [x, z] = cellCenter(i)
      roomOf[i] = roomAt(x, z)
    }
    const roomTotals = ROOMS.map((r) => roomOf.reduce((n, v) => n + (v === r.zone ? 1 : 0), 0))

    let raf = 0
    let last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 50) return
      last = now
      fit()
      const t = missionT(mission.zone, mission.beat, mission.beatT)
      ctx.clearRect(0, 0, W, H)
      const roomSeen = new Array(ROOMS.length).fill(0)
      ctx.fillStyle = '#1b222c'
      for (let i = 0; i < data.seenAt.length; i++) {
        if (!data.inRoom[i] || data.seenAt[i] > t) continue
        roomSeen[roomOf[i]]++
        const [x, z] = cellCenter(i)
        ctx.fillRect(X(x - CELL / 2), Z(z - CELL / 2), CELL * s + 0.3, CELL * s + 0.3)
      }
      ctx.strokeStyle = '#3a4656'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const w of walls) {
        ctx.moveTo(X(w.a[0]), Z(w.a[1]))
        ctx.lineTo(X(w.b[0]), Z(w.b[1]))
      }
      ctx.stroke()
      ctx.font = '500 7px "IBM Plex Mono", ui-monospace, monospace'
      ctx.textBaseline = 'top'
      ROOMS.forEach((r, i) => {
        if (roomSeen[i] / (roomTotals[i] || 1) < 0.3) return
        ctx.fillStyle = r.zone === mission.zone ? '#ff7a1a' : 'rgba(233,238,243,.65)'
        ctx.fillText(r.label, X(r.x0) + 3, Z(r.z0) + 3)
      })
      // camera
      const cam = mission.camera
      ctx.strokeStyle = 'rgba(233,238,243,.6)'
      ctx.beginPath()
      ctx.arc(X(cam.x), Z(cam.z), 2.5, 0, Math.PI * 2)
      ctx.stroke()
      // robot + heading
      const r = mission.robot
      ctx.fillStyle = '#ff7a1a'
      ctx.beginPath()
      ctx.arc(X(r.x), Z(r.z), 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ff7a1a'
      ctx.beginPath()
      ctx.moveTo(X(r.x), Z(r.z))
      ctx.lineTo(X(r.x + Math.cos(r.yaw) * 1.4), Z(r.z - Math.sin(r.yaw) * 1.4))
      ctx.stroke()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const k = rect.width / W
    const x = ((e.clientX - rect.left) / k - ox) / s + BOUNDS.minX
    const z = ((e.clientY - rect.top) / k - oz) / s + BOUNDS.minZ
    const zone = roomAt(x, z)
    if (zone >= 0) document.getElementById(ZONES[zone].id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <canvas
      ref={ref}
      style={{ width: `${W / 16}rem`, height: `${H / 16}rem`, left: onHero ? 'auto' : '2rem', right: onHero ? '2rem' : 'auto' }}
      onClick={onClick}
      role="img"
      aria-label="Facility minimap"
      className="pointer-events-auto absolute bottom-8 hidden cursor-pointer rounded-md border border-grid bg-ground/90 transition-opacity sm:block"
    />
  )
}
