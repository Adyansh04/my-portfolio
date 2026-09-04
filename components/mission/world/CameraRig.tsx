'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'
import { shotAt } from '@/lib/mission/camera'

const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()

/** Samples the zone's shot for the current progress and eases the camera toward it. */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const cur = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false })

  useFrame((_, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    const { pos, look } = shotAt(mission.zone, mission.zoneT, mission.robot, mission.beat)
    const c = cur.current
    if (!c.init) {
      c.pos.set(pos[0], pos[1], pos[2])
      c.look.set(look[0], look[1], look[2])
      c.init = true
    }
    // position glides (slow), the look-at snaps faster so the robot never leaves the frame
    c.pos.lerp(tmpA.set(pos[0], pos[1], pos[2]), 1 - Math.exp(-d * 2.6))
    c.look.lerp(tmpB.set(look[0], look[1], look[2]), 1 - Math.exp(-d * 5.5))
    camera.position.copy(c.pos)
    camera.lookAt(c.look)
    mission.camera.x = c.pos.x
    mission.camera.z = c.pos.z
  })
  return null
}
