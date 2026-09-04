'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'
import { missionT, routePose, START } from '@/lib/mission/path'
import { computeReveal, seenFraction } from '@/lib/mission/reveal'

/** Turns scroll position into the robot's pose every frame (position from the route, damped heading, speed). */
export function MissionDriver() {
  const reveal = useMemo(() => computeReveal(), [])
  const last = useRef({ x: START[0], z: START[1], yaw: 0, frame: 0 })

  useFrame((_, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    const pose = routePose(mission.zone, mission.beat, mission.beatT)
    const r = mission.robot

    // light positional damping so nav jumps don't teleport
    const k = 1 - Math.exp(-d * 10)
    const nx = r.x + (pose.x - r.x) * k
    const nz = r.z + (pose.z - r.z) * k
    r.speed = Math.hypot(nx - r.x, nz - r.z) / d
    r.x = nx
    r.z = nz
    r.y = 0

    if (pose.moving && (pose.dir[0] !== 0 || pose.dir[1] !== 0)) last.current.yaw = Math.atan2(-pose.dir[1], pose.dir[0])
    let dy = last.current.yaw - r.yaw
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    r.yaw += dy * (1 - Math.exp(-d * 7))

    if (last.current.frame++ % 6 === 0) mission.seenFraction = seenFraction(reveal, missionT(mission.zone, mission.beat, mission.beatT))
  })
  return null
}
