import { useSyncExternalStore } from 'react'
import { locate } from './zones'
import { missionT, routePose } from './path'
import { computeReveal, seenFraction } from './reveal'

export type Mode = 'boot' | 'explore' | 'inspect' | 'dock'

export interface RobotPose {
  x: number
  y: number
  z: number
  yaw: number
  speed: number
}

export interface MissionState {
  /** master scroll progress 0..1 */
  t: number
  zone: number
  zoneT: number
  beat: number
  beatT: number
  mode: Mode
  robot: RobotPose
  /** camera ground position (written by the camera rig, read by the minimap) */
  camera: { x: number; z: number }
  /** fraction of the facility mapped so far (written by the world) */
  seenFraction: number
  activeTag: string | null
  staticMode: boolean
}

/**
 * Mutable singleton read directly inside the render loop (no React state per frame).
 * React components that need discrete values use `useMission(selector)`; the HUD writes
 * fast-changing numbers straight into DOM nodes via `subscribe`.
 */
export const mission: MissionState = {
  t: 0,
  zone: 0,
  zoneT: 0,
  beat: 0,
  beatT: 0,
  mode: 'boot',
  robot: { x: 4, y: 0, z: 4, yaw: 0, speed: 0 },
  camera: { x: 1.6, z: 9.4 },
  seenFraction: 0,
  activeTag: null,
  staticMode: false,
}

type Listener = () => void
const listeners = new Set<Listener>()
let scheduled = false

/** Coalesce notifications to one per animation frame. */
export function notify() {
  if (scheduled || typeof window === 'undefined') return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    listeners.forEach((l) => l())
  })
}

export function subscribe(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function setProgress(t: number) {
  const loc = locate(t)
  mission.t = t
  mission.zone = loc.zone
  mission.zoneT = loc.zoneT
  mission.beat = loc.beat
  mission.beatT = loc.beatT
  mission.mode = loc.zone === 0 ? (loc.zoneT < 0.3 ? 'boot' : 'explore') : loc.zone === 3 ? 'inspect' : loc.zone === 6 ? 'dock' : 'explore'
  if (mission.staticMode) {
    // no world running: keep the minimap, status and ticker honest straight from the route
    const pose = routePose(loc.zone, loc.beat, loc.beatT)
    mission.robot.x = pose.x
    mission.robot.z = pose.z
    if (pose.dir[0] !== 0 || pose.dir[1] !== 0) mission.robot.yaw = Math.atan2(-pose.dir[1], pose.dir[0])
    mission.robot.speed = 0
    mission.seenFraction = seenFraction(computeReveal(), missionT(loc.zone, loc.beat, loc.beatT))
  }
  notify()
}

export function setActiveTag(tag: string | null) {
  if (mission.activeTag === tag) return
  mission.activeTag = tag
  notify()
}

export function setStaticMode(v: boolean) {
  mission.staticMode = v
  notify()
}

/** Subscribe a React component to a derived primitive; re-renders only when the selected value changes. */
export function useMission<T extends string | number | boolean | null>(selector: (s: MissionState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(mission),
    () => selector(mission),
  )
}
