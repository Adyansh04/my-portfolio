'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { useHologram } from '../HologramFrame'

/**
 * The "terrain slab" style: the project milled into a solid anodised plate, with the parts that
 * matter routed as channels and lit from inside. Everything here is built with ExtrudeGeometry and
 * a real bevel — the chamfered edge is the whole reason this reads as machined rather than as a
 * stack of boxes, and it is what plain BoxGeometry could never give.
 */

export type XZ = [number, number]

export const SLAB = { w: 1.02, d: 0.78, h: 0.075 }

/* ------------------------------------------------------------------ materials */

/** Gunmetal and anodised blue-grey rather than raw aluminium — silver read as generic and did
 *  not sit in the facility's palette. */
export const SLAB_COLORS = {
  body: '#232b37',
  deck: '#2c3744',
  rail: '#5a6675',
  bolt: '#6d7887',
  relief: '#77828f',
  reliefTop: '#8b95a1',
}

/** Anodised, not raw aluminium: the render's bare silver read as generic and fought the world. */
export function useSlabMaterials(accent: string, data: string) {
  return useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: SLAB_COLORS.body, metalness: 0.9, roughness: 0.42 }),
      deck: new THREE.MeshStandardMaterial({ color: SLAB_COLORS.deck, metalness: 0.75, roughness: 0.55 }),
      rail: new THREE.MeshStandardMaterial({ color: SLAB_COLORS.rail, metalness: 0.6, roughness: 0.52 }),
      bolt: new THREE.MeshStandardMaterial({ color: SLAB_COLORS.bolt, metalness: 0.9, roughness: 0.42 }),
      relief: new THREE.MeshStandardMaterial({ color: SLAB_COLORS.relief, metalness: 0.55, roughness: 0.45 }),
      channel: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.85, roughness: 0.45, metalness: 0.1 }),
      data: new THREE.MeshStandardMaterial({ color: data, emissive: data, emissiveIntensity: 0.8, roughness: 0.45, metalness: 0.1 }),
      dataDim: new THREE.MeshStandardMaterial({ color: data, emissive: data, emissiveIntensity: 0.22, roughness: 0.6, metalness: 0.4 }),
    }),
    [accent, data],
  )
}

/* ------------------------------------------------------------------ geometry */

const EXTRUDE = { bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6 }

/** Extrude a shape upward in +Y with a chamfer. Shapes are authored in (x, z); z is flipped for us. */
export function extrudeUp(shape: THREE.Shape, height: number, bevel = 0.004) {
  const g = new THREE.ExtrudeGeometry(shape, { ...EXTRUDE, depth: height, bevelThickness: bevel, bevelSize: bevel })
  g.rotateX(-Math.PI / 2)
  return g
}

export function roundedRect(w: number, d: number, r: number) {
  const s = new THREE.Shape()
  const x = w / 2
  const z = d / 2
  s.moveTo(-x + r, -z)
  s.lineTo(x - r, -z)
  s.quadraticCurveTo(x, -z, x, -z + r)
  s.lineTo(x, z - r)
  s.quadraticCurveTo(x, z, x - r, z)
  s.lineTo(-x + r, z)
  s.quadraticCurveTo(-x, z, -x, z - r)
  s.lineTo(-x, -z + r)
  s.quadraticCurveTo(-x, -z, -x + r, -z)
  return s
}

/** A rectangle centred on a segment — used for wall runs and routed strips. */
function segmentShape(a: XZ, b: XZ, width: number) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const len = Math.hypot(dx, dz)
  const ang = Math.atan2(dz, dx)
  const s = new THREE.Shape()
  const hw = width / 2
  const pts: [number, number][] = [
    [-len / 2, -hw],
    [len / 2, -hw],
    [len / 2, hw],
    [-len / 2, hw],
  ]
  s.moveTo(pts[0][0], pts[0][1])
  for (const p of pts.slice(1)) s.lineTo(p[0], p[1])
  s.closePath()
  return { shape: s, ang, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as XZ }
}

/** Wall runs raised out of the deck as chamfered ridges. */
export function reliefGeometry(runs: [XZ, XZ][], height: number, thickness: number, y = 0) {
  const geos = runs.map(({ 0: a, 1: b }) => {
    const { shape, ang, mid } = segmentShape(a, b, thickness)
    const g = extrudeUp(shape, height, Math.min(0.004, thickness * 0.28))
    g.rotateY(-ang)
    g.translate(mid[0], y, -mid[1])
    return g
  })
  return mergeGeometries(geos, false)!
}

/** A routed channel: a shallow inlay following a polyline, lit from inside. */
export function channelGeometry(path: XZ[], width: number, depth: number, y = 0, closed = false) {
  const geos: THREE.BufferGeometry[] = []
  const n = closed ? path.length : path.length - 1
  for (let i = 0; i < n; i++) {
    const a = path[i]
    const b = path[(i + 1) % path.length]
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-4) continue
    const { shape, ang, mid } = segmentShape(a, b, width)
    const g = extrudeUp(shape, depth, 0.0015)
    g.rotateY(-ang)
    g.translate(mid[0], y, -mid[1])
    geos.push(g)
    // A rounded cap at every vertex so corners do not show a notch. ExtrudeGeometry is
    // non-indexed and CylinderGeometry is indexed; mergeGeometries returns null on a mix.
    const c = new THREE.CylinderGeometry(width / 2, width / 2, depth, 10).toNonIndexed()
    c.translate(b[0], y + depth / 2, -b[1])
    geos.push(c)
  }
  return mergeGeometries(geos, false)!
}

/** Countersunk fasteners round the plate edge. */
export function boltGeometry(spots: XZ[], r = 0.013, h = 0.012, y = 0) {
  const geos = spots.map((p) => {
    const g = new THREE.CylinderGeometry(r, r * 1.1, h, 12)
    g.translate(p[0], y + h / 2, -p[1])
    return g
  })
  return mergeGeometries(geos, false)!
}

/* ------------------------------------------------------------------ animation */

const near = () => true

/** Pulses that run along a routed channel — the slab has to *do* something, not just sit there. */
export function ChannelPulse({ path, color, count = 3, speed = 0.16, y = 0.012, size = 0.016, closed = true }: { path: XZ[]; color: string; count?: number; speed?: number; y?: number; size?: number; closed?: boolean }) {
  const holo = useHologram()
  const mesh = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color }), [color])
  const { pts, cum, total } = useMemo(() => {
    const p = closed ? [...path, path[0]] : path
    const cum = [0]
    for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]))
    return { pts: p, cum, total: cum[cum.length - 1] }
  }, [path, closed])
  const t = useRef(Math.random() * 10)

  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    t.current += Math.min(0.05, dt || 0.016)
    const m = mesh.current
    if (!m) return
    for (let k = 0; k < count; k++) {
      const s = ((t.current * speed + k / count) % 1) * total
      let i = 1
      while (i < cum.length - 1 && cum[i] < s) i++
      const u = (s - cum[i - 1]) / Math.max(1e-5, cum[i] - cum[i - 1])
      const a = pts[i - 1]
      const b = pts[i]
      tmp.position.set(a[0] + (b[0] - a[0]) * u, y, -(a[1] + (b[1] - a[1]) * u))
      const fade = 0.6 + 0.4 * Math.sin(t.current * 4 + k)
      tmp.scale.setScalar(fade)
      tmp.updateMatrix()
      m.setMatrixAt(k, tmp.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={mat}>
      <sphereGeometry args={[size, 10, 8]} />
    </instancedMesh>
  )
}

/** Marker pins whose heads breathe, so the readout looks live. */
export function Pins({ spots, color, height = 0.09, y = 0 }: { spots: { p: XZ; h?: number }[]; color: string; height?: number; y?: number }) {
  const holo = useHologram()
  const heads = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const stems = useMemo(() => {
    const geos = spots.map((s) => {
      const h = s.h ?? height
      const g = new THREE.CylinderGeometry(0.0032, 0.0032, h, 8)
      g.translate(s.p[0], y + h / 2, -s.p[1])
      return g
    })
    return mergeGeometries(geos, false)!
  }, [spots, height, y])
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8b94a2', metalness: 1, roughness: 0.32 }), [])
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.4 }), [color])
  const t = useRef(0)

  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    t.current += Math.min(0.05, dt || 0.016)
    const m = heads.current
    if (!m) return
    spots.forEach((s, i) => {
      const h = s.h ?? height
      tmp.position.set(s.p[0], y + h, -s.p[1])
      tmp.scale.setScalar(0.85 + 0.25 * Math.sin(t.current * 2.4 + i * 1.3))
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh geometry={stems} material={stemMat} />
      <instancedMesh ref={heads} args={[undefined, undefined, spots.length]} material={headMat}>
        <sphereGeometry args={[0.011, 12, 10]} />
      </instancedMesh>
    </group>
  )
}

/** A machine-tool light bar tracking across the plate, as if the part were still being cut. */
export function ScanBar({ color, w = SLAB.w, d = SLAB.d, y = 0.004, period = 6 }: { color: string; w?: number; d?: number; y?: number; period?: number }) {
  const holo = useHologram()
  const g = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }), [color])
  const t = useRef(Math.random() * 6)
  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    t.current += Math.min(0.05, dt || 0.016)
    const u = (t.current % period) / period
    const sweep = u < 0.5 ? u * 2 : 2 - u * 2
    if (g.current) {
      g.current.position.x = -w / 2 + sweep * w
      mat.opacity = 0.06 + 0.18 * Math.sin(Math.PI * sweep)
    }
  })
  return (
    <mesh ref={g} material={mat} position={[0, y, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[0.035, d * 0.96]} />
    </mesh>
  )
}
