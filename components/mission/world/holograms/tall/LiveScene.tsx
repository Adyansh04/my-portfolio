'use client'

import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { GO2_DEF, GO2_LEGS } from '@/lib/mission/robots'
import { GO2_GAIT } from '@/lib/mission/gait'
import { asset } from '@/lib/base-path'
import { QuadrupedRobot } from '../../robots/QuadrupedRobot'
import { go2MaterialFor } from '../../robots/robotMaterial'
import { makeLabelTexture } from '../../labels'
import { emissive, lineMat, useClock, useNear, H } from './tallParts'
import type { SlabDesign } from '../slab/slabContent'

/**
 * The project actually happening, staged vertically: the real robot working a real environment at
 * the base, and the data it produces assembling in the column above it. Abstract forms read at
 * distance but say nothing — a spiral of nodes could be any project. This one is unmistakably a
 * quadruped inspecting a facility, and it still fills the height.
 */

const SCENE = 1.55 // scene scale: the robot has to be big enough to recognise from 7.4 m
const BASE_TOP = 0.34

export function LiveScene({ design, detections }: { design: SlabDesign; detections: string[] }) {
  const t = useClock()
  const near = useNear()
  const pose = useRef({ x: 0, z: 0, yaw: 0 })

  /* ---- the environment the robot is working in ---- */
  const walls = useMemo(() => {
    const geos = design.runs.map(([a, b]) => {
      const ax = a[0] * SCENE, az = a[1] * SCENE, bx = b[0] * SCENE, bz = b[1] * SCENE
      const len = Math.hypot(bx - ax, bz - az)
      if (len < 1e-4) return null
      const g = new THREE.BoxGeometry(len, 0.16, 0.02)
      g.rotateY(Math.atan2(-(bz - az), bx - ax))
      g.translate((ax + bx) / 2, 0.08, (az + bz) / 2)
      return g
    }).filter(Boolean) as THREE.BufferGeometry[]
    return mergeGeometries(geos, false)!
  }, [design.runs])
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b7684', metalness: 0.5, roughness: 0.5 }), [])
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1b2530', metalness: 0.4, roughness: 0.75 }), [])

  /* ---- the LiDAR fan it is scanning with ---- */
  const RAYS = 40
  const fanGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RAYS * 6), 3))
    return g
  }, [])
  const fanMat = useMemo(() => lineMat(design.data, 0.35), [design.data])
  const fanObj = useMemo(() => new THREE.LineSegments(fanGeo, fanMat), [fanGeo, fanMat])

  /* ---- the map assembling above the scene ---- */
  const LAYERS = 7
  const layerGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (const [a, b] of design.runs) pts.push(new THREE.Vector3(a[0] * SCENE, 0, a[1] * SCENE), new THREE.Vector3(b[0] * SCENE, 0, b[1] * SCENE))
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [design.runs])
  const layerMats = useMemo(() => Array.from({ length: LAYERS }, () => lineMat(design.accent, 0.4)), [design.accent])
  const layerObjs = useMemo(() => layerMats.map((m) => new THREE.LineSegments(layerGeo, m)), [layerGeo, layerMats])
  const layerRefs = useRef<(THREE.Group | null)[]>([])

  /* ---- detection cards rising out of the scene ---- */
  const cards = useMemo(
    () =>
      design.pins.slice(0, detections.length).map((p, i) => {
        const tex = makeLabelTexture(
          [{ text: detections[i] ?? 'object', size: 40, color: '#e9eef3', font: '700' }, { text: `conf 0.${88 + (i % 9)}`, size: 30, color: design.data }],
          { w: 512, h: 150, bg: 'rgba(8,12,18,0.86)', pad: 16 },
        )
        return { p: p.p, mat: new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }), phase: i / Math.max(1, detections.length) }
      }),
    [design.pins, design.data, detections],
  )
  const cardRefs = useRef<(THREE.Group | null)[]>([])

  const ringMat = useMemo(() => lineMat(design.accent, 0.6), [design.accent])
  const ringObj = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62))
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat)
  }, [ringMat])
  const ring = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!near()) return
    const now = t.current

    // walk the route the project actually follows
    const p = design.path
    const total = design.closed ? p.length : p.length - 1
    const s = (now * 0.55) % total
    const i = Math.floor(s)
    const u = s - i
    const a = p[i]
    const b = p[(i + 1) % p.length]
    const x = (a[0] + (b[0] - a[0]) * u) * SCENE
    const z = (a[1] + (b[1] - a[1]) * u) * SCENE
    pose.current.x = x
    pose.current.z = z
    pose.current.yaw = Math.atan2(-((b[1] - a[1])), b[0] - a[0])

    // sweep the scan fan from wherever it is standing
    const arr = fanGeo.attributes.position.array as Float32Array
    const sweep = now * 2.2
    for (let r = 0; r < RAYS; r++) {
      const ang = sweep + (r / RAYS) * Math.PI * 2
      const reach = 0.30 + 0.16 * Math.abs(Math.sin(r * 1.7 + now))
      arr[r * 6] = x
      arr[r * 6 + 1] = 0.07
      arr[r * 6 + 2] = z
      arr[r * 6 + 3] = x + Math.cos(ang) * reach
      arr[r * 6 + 4] = 0.07
      arr[r * 6 + 5] = z + Math.sin(ang) * reach
    }
    fanGeo.attributes.position.needsUpdate = true

    // the map builds upward out of what it has scanned, then holds
    const build = (now * 0.16) % 1.9
    layerRefs.current.forEach((g, k) => {
      if (!g) return
      const lu = k / (LAYERS - 1)
      const kk = THREE.MathUtils.clamp((build - lu) * 5, 0, 1)
      g.visible = kk > 0.01
      g.position.y = BASE_TOP + 0.06 + lu * (H - BASE_TOP - 0.3) - (1 - kk) * 0.12
      layerMats[k].opacity = 0.12 + kk * 0.45
      g.scale.setScalar(0.55 + kk * 0.45)
    })

    // detections rise out of the scene as they are found
    cardRefs.current.forEach((g, k) => {
      if (!g) return
      const c = cards[k]
      const cu = ((now * 0.11 + c.phase) % 1)
      g.visible = cu > 0.04
      g.position.set(c.p[0] * SCENE, 0.16 + cu * (H - 0.5), c.p[1] * SCENE)
      const m = c.mat
      m.opacity = Math.min(1, Math.sin(Math.PI * cu) * 2.2)
    })

    if (ring.current) {
      ring.current.rotation.y = -now * 0.25
      ring.current.position.y = BASE_TOP + 0.02 + Math.sin(now * 0.5) * 0.03
    }
  })

  return (
    <group>
      {/* the working environment */}
      <mesh material={floorMat} rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <planeGeometry args={[1.5, 1.15]} />
      </mesh>
      <mesh geometry={walls} material={wallMat} />
      <primitive object={fanObj} />
      {/* useGLTF suspends; without a boundary here the whole canvas unmounts */}
      <Suspense fallback={null}>
        <group scale={0.42}>
          <QuadrupedRobot
            def={GO2_DEF}
            folder={asset('/models/go2')}
            legs={GO2_LEGS}
            gait={GO2_GAIT}
            headingOffset={0}
            scale={1}
            baseHeight={0.32}
            pose={pose.current}
            autoWalk
            materialFor={go2MaterialFor}
            flipAxis="z"
          />
        </group>
      </Suspense>

      {/* the data it produces, stacking up the column */}
      <group ref={ring}>
        <primitive object={ringObj} />
      </group>
      {layerObjs.map((o, i) => (
        <group key={i} ref={(el) => (layerRefs.current[i] = el)}>
          <primitive object={o} />
        </group>
      ))}
      {cards.map((c, i) => (
        <group key={i} ref={(el) => (cardRefs.current[i] = el)}>
          <mesh material={c.mat}>
            <planeGeometry args={[0.34, 0.34 * (150 / 512)]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
