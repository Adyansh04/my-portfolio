'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { AMR_ROUTES, HALL_RACKS, RACK_BAY, STATIONS, buildTimeline } from '@/lib/mission/traffic'
import { makeLabelTexture } from '../labels'
import { shadowTexture } from '../ContactShadow'

const ACCENT = '#ff7a1a'
const CYAN = '#4fd1ff'
const LANE_W = 1.12
/** one dash per this many metres */
const DASH = 1.5

/**
 * Painted AGV lanes drawn as geometry, not a texture: thin strips stay crisp at the grazing angles
 * the camera actually sees the floor from, where a tiling texture just mips into a wide smear.
 */
function Lanes() {
  const geometry = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const strip = (a: [number, number], b: [number, number], offset: number, width: number, t0: number, t1: number) => {
      const dx = b[0] - a[0]
      const dz = b[1] - a[1]
      const len = Math.hypot(dx, dz)
      if (len < 0.01) return
      const nx = -dz / len
      const nz = dx / len
      const cx = a[0] + dx * (t0 + t1) / 2 + nx * offset
      const cz = a[1] + dz * (t0 + t1) / 2 + nz * offset
      const g = new THREE.PlaneGeometry(len * (t1 - t0), width)
      g.rotateX(-Math.PI / 2)
      g.rotateY(Math.atan2(-dz, dx))
      g.translate(cx, 0.014, cz)
      geos.push(g)
    }
    const seen = new Set<string>()
    for (const route of AMR_ROUTES) {
      const pts = buildTimeline(route).lane
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]
        const b = pts[(i + 1) % pts.length]
        // out-and-back routes retrace their own lane: paint each stretch once
        const key = [a, b]
          .map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`)
          .sort()
          .join('|')
        if (seen.has(key) || Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.05) continue
        seen.add(key)
        const len = Math.hypot(b[0] - a[0], b[1] - a[1])
        strip(a, b, LANE_W / 2, 0.06, 0, 1)
        strip(a, b, -LANE_W / 2, 0.06, 0, 1)
        for (let d = 0.25; d + 0.55 < len; d += DASH) strip(a, b, 0, 0.09, d / len, (d + 0.55) / len)
      }
    }
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }), [])
  return <mesh geometry={geometry} material={material} renderOrder={-1} />
}

/** Pallet + tote stacks the fleet works between, one per pick/drop stop. */
function Stations() {
  const pallets = useMemo(() => {
    const geos = STATIONS.map((s) => {
      const g = new THREE.BoxGeometry(1.05, 0.12, 0.85)
      g.translate(s.p[0], 0.06, s.p[1])
      return g
    })
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])

  const totes = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    STATIONS.forEach((s, i) => {
      const n = 2 + ((i * 5) % 3)
      for (let k = 0; k < n; k++) {
        const g = new THREE.BoxGeometry(0.52, 0.4, 0.44)
        g.rotateY((((i * 7 + k * 3) % 5) - 2) * 0.04)
        g.translate(s.p[0] + (((i + k) % 3) - 1) * 0.04, 0.32 + k * 0.42, s.p[1] + ((k % 2) - 0.5) * 0.05)
        geos.push(g)
      }
    })
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])

  const decals = useMemo(
    () =>
      STATIONS.map((s) => ({
        s,
        mat: new THREE.MeshBasicMaterial({
          map: makeLabelTexture([{ text: s.kind === 'in' ? 'PICK' : 'DROP', size: 26, color: s.kind === 'in' ? CYAN : ACCENT, font: '700' }], { w: 128, h: 44, align: 'center', pad: 6 }),
          transparent: true,
          opacity: 0.45,
          toneMapped: false,
          depthWrite: false,
        }),
      })),
    [],
  )

  const shadows = useMemo(() => {
    const geos = STATIONS.map((s) => {
      const g = new THREE.PlaneGeometry(2.1, 1.9)
      g.rotateX(-Math.PI / 2)
      g.translate(s.p[0], 0.013, s.p[1])
      return g
    })
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])
  const shadowMat = useMemo(() => new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }), [])

  return (
    <group>
      <mesh geometry={shadows} material={shadowMat} renderOrder={-3} />
      <mesh geometry={pallets}>
        <meshStandardMaterial color="#20272f" roughness={0.9} />
      </mesh>
      <mesh geometry={totes}>
        <meshStandardMaterial color="#4a5666" roughness={0.75} metalness={0.15} />
      </mesh>
      {decals.map(({ s, mat }, i) => (
        <mesh key={i} material={mat} position={[s.p[0], 0.016, s.p[1] + 0.7]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.58, 0.2]} />
        </mesh>
      ))}
    </group>
  )
}

/** Equipment racking down the hall walls: uprights, shelves and stored totes, merged per material. */
function HallRacking() {
  const { frame, totes } = useMemo(() => {
    const f: THREE.BufferGeometry[] = []
    const t: THREE.BufferGeometry[] = []
    const { w, d, h } = RACK_BAY
    HALL_RACKS.forEach((bay, i) => {
      const place = (g: THREE.BufferGeometry, into: THREE.BufferGeometry[]) => {
        g.rotateY(bay.yaw)
        g.translate(bay.x, 0, bay.z)
        into.push(g)
      }
      for (const sx of [-w / 2 + 0.06, w / 2 - 0.06]) {
        const g = new THREE.BoxGeometry(0.12, h, d)
        g.translate(sx, h / 2, 0)
        place(g, f)
      }
      for (let level = 0; level < 4; level++) {
        const g = new THREE.BoxGeometry(w, 0.07, d)
        g.translate(0, 0.12 + level * 0.66, 0)
        place(g, f)
        // a couple of stored totes per level, skipping some so the run isn't uniform
        for (let k = 0; k < 3; k++) {
          if ((i * 7 + level * 5 + k * 3) % 4 === 0) continue
          const b = new THREE.BoxGeometry(0.62, 0.48, d - 0.14)
          b.translate(-w / 2 + 0.5 + k * 0.72, 0.4 + level * 0.66, 0)
          place(b, t)
        }
      }
    })
    const merge = (geos: THREE.BufferGeometry[]) => {
      const m = mergeGeometries(geos, false)!
      geos.forEach((g) => g.dispose())
      return m
    }
    return { frame: merge(f), totes: merge(t) }
  }, [])
  return (
    <group>
      <mesh geometry={frame}>
        <meshStandardMaterial color="#2b3341" roughness={0.8} metalness={0.25} />
      </mesh>
      <mesh geometry={totes}>
        <meshStandardMaterial color="#1a212b" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Drone landing pads — where the patrol units came from. */
const PADS: [number, number][] = [
  [3.6, 34.0],
  [24.5, 33.0],
]
function DronePads() {
  const ring = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  return (
    <group>
      {PADS.map((p, i) => (
        <group key={i} position={[p[0], 0.015, p[1]]} rotation-x={-Math.PI / 2}>
          <mesh>
            <circleGeometry args={[0.78, 26]} />
            <meshStandardMaterial color="#161d26" roughness={0.9} />
          </mesh>
          <mesh material={ring} position={[0, 0, 0.004]}>
            <ringGeometry args={[0.6, 0.68, 26]} />
          </mesh>
          <mesh material={ring} position={[0, 0, 0.004]}>
            <ringGeometry args={[0.2, 0.24, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Roof trusses over the project hall: overhead structure so the tall shots have something above them. */
function Truss() {
  const geometry = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const push = (w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) => {
      const g = new THREE.BoxGeometry(w, h, d)
      if (ry) g.rotateY(ry)
      g.translate(x, y, z)
      geos.push(g)
    }
    for (const x of [5, 13, 21, 29]) {
      push(0.09, 0.09, 15.4, x, 4.18, 38)
      push(0.09, 0.09, 15.4, x, 4.52, 38)
      for (let z = 30.6; z < 45.6; z += 1.5) {
        push(0.05, 0.38, 0.05, x, 4.35, z)
        push(0.05, 0.05, 1.55, x, 4.35, z + 0.75, 0.24)
      }
      // lamp bar slung under the chord
      push(0.12, 0.05, 13.5, x, 4.05, 38)
    }
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])
  const lamps = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    for (const x of [5, 13, 21, 29])
      for (let z = 32; z < 45; z += 3.2) {
        const g = new THREE.PlaneGeometry(0.36, 1.9)
        g.rotateX(Math.PI / 2)
        g.translate(x, 4.01, z)
        geos.push(g)
      }
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])
  const pools = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    for (const x of [5, 13, 21, 29])
      for (let z = 32; z < 45; z += 3.2) {
        const g = new THREE.PlaneGeometry(4.4, 5.6)
        g.rotateX(-Math.PI / 2)
        g.translate(x, 0.012, z)
        geos.push(g)
      }
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])
  const poolMat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d')!
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 32)
    g.addColorStop(0, 'rgba(196,222,255,0.26)')
    g.addColorStop(0.55, 'rgba(150,180,225,0.07)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 64, 64)
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  }, [])

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#5b6675" roughness={0.55} metalness={0.5} />
      </mesh>
      <mesh geometry={lamps}>
        <meshBasicMaterial color="#a8c2e6" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh geometry={pools} material={poolMat} renderOrder={-2} />
    </group>
  )
}

/** Static facility dressing that explains the traffic: painted lanes, stations, pads, roof structure. */
export function Dressing() {
  return (
    <group>
      <Lanes />
      <HallRacking />
      <Stations />
      <DronePads />
      <Truss />
    </group>
  )
}
