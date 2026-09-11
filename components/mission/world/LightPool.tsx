'use client'

import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeElements } from '@react-three/fiber'

/**
 * Every point light in the world goes through here.
 *
 * three.js bakes the number of visible lights into every lit shader, so each time one appears or
 * disappears (a hologram culled past 42 m, a stage mounting, the loading proxy leaving) every lit
 * material recompiles. The first scroll through the world met five different counts and froze for
 * up to 1.2 s at each. So a `PooledLight` is only a marker: a hidden PointLight, which keeps refs
 * and intensity animation working as before. `LightPool` owns a fixed set of real lights and hands
 * them to the markers nearest the camera every frame, so the count never changes. As a bonus each
 * lit pixel now loops over 4 point lights instead of 25. Four covers the hologram in front of the
 * camera and its neighbour (a lamp over each pedestal, one on each stage), and what lies further
 * off is lit by its own emissive trim anyway.
 */
const SLOTS = 4
/** metres: a light dims to nothing over this span before it loses its slot, so hand-overs never pop */
const BAND = 3
const markers = new Set<THREE.PointLight>()

export function PooledLight({ ref, ...props }: Omit<ThreeElements['pointLight'], 'ref'> & { ref?: Ref<THREE.PointLight> }) {
  const own = useRef<THREE.PointLight>(null!)
  useImperativeHandle(ref, () => own.current, [])
  useEffect(() => {
    const light = own.current
    markers.add(light)
    return () => void markers.delete(light)
  }, [])
  return <pointLight ref={own} {...props} visible={false} />
}

const shown = (o: THREE.Object3D) => {
  for (let p = o.parent; p; p = p.parent) if (!p.visible) return false
  return true
}

/** Mount once, at the scene root: the slots are positioned in world space. */
export function LightPool() {
  const slots = useMemo(() => Array.from({ length: SLOTS }, () => new THREE.PointLight(0xffffff, 0)), [])
  useFrame(({ camera }) => {
    const ranked: { light: THREE.PointLight; at: THREE.Vector3; score: number }[] = []
    for (const light of markers) {
      if (!shown(light)) continue
      const at = light.getWorldPosition((light.userData.at ??= new THREE.Vector3()))
      // distance from the camera to the edge of the light's reach, not to its centre
      ranked.push({ light, at, score: camera.position.distanceTo(at) - light.distance })
    }
    ranked.sort((a, b) => a.score - b.score)
    const cut = ranked[SLOTS]?.score ?? Infinity
    slots.forEach((slot, i) => {
      const r = ranked[i]
      if (!r) return void (slot.intensity = 0)
      slot.position.copy(r.at)
      slot.color.copy(r.light.color)
      slot.distance = r.light.distance
      slot.decay = r.light.decay
      slot.intensity = r.light.intensity * Math.min(1, (cut - r.score) / BAND)
    })
  })
  return (
    <>
      {slots.map((light, i) => (
        <primitive key={i} object={light} />
      ))}
    </>
  )
}
