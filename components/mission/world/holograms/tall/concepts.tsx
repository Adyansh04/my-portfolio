'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { ACCENT, Axis, CYAN, H, emissive, glowMat, lineMat, pointsMat, ringGeometry, useClock, useNear, useParticles } from './tallParts'

export interface ConceptProps {
  accent?: string
  data?: string
}

/* ---------------------------------------------------------------- C1 · Data Core */

/** A spindle of counter-rotating map slices with a charge climbing the axis and lighting each one. */
export function DataCore({ accent = ACCENT, data = CYAN }: ConceptProps) {
  const t = useClock()
  const near = useNear()
  const N = 11
  const rings = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const u = i / (N - 1)
        // spindle profile: wide at the waist, tapering top and bottom
        const r = 0.24 + Math.sin(u * Math.PI) * 0.42
        const [loop, spokes] = ringGeometry(r, 56, i % 2 ? 8 : 12)
        return { y: 0.12 + u * (H - 0.24), r, u, loop, spokes, dir: i % 2 ? 1 : -1 }
      }),
    [],
  )
  const mats = useMemo(() => rings.map((_, i) => lineMat(i % 3 === 0 ? data : accent, 0.7)), [rings, accent, data])
  // building THREE objects inside the JSX hands <primitive> a new object every render, and R3F
  // disposes the old one's geometry on the swap — which is how these ended up with no attributes
  const objs = useMemo(() => rings.map((r, i) => ({ loop: new THREE.LineLoop(r.loop, mats[i]), spokes: new THREE.LineSegments(r.spokes, mats[i]) })), [rings, mats])
  const groups = useRef<(THREE.Group | null)[]>([])

  useFrame(() => {
    if (!near()) return
    const charge = (t.current * 0.32) % 1
    rings.forEach((ring, i) => {
      const g = groups.current[i]
      if (!g) return
      g.rotation.y += 0.0022 * ring.dir * (1 + i * 0.16)
      // the pulse lights each slice as it passes
      const d = Math.abs(ring.u - charge)
      const hit = Math.max(0, 1 - d * 7)
      mats[i].opacity = 0.34 + hit * 0.85
      g.scale.setScalar(1 + hit * 0.06)
    })
  })

  return (
    <group>
      <Axis color={accent} />
      {rings.map((ring, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)} position={[0, ring.y, 0]}>
          <primitive object={objs[i].loop} />
          <primitive object={objs[i].spokes} />
        </group>
      ))}
      <ChargeBead color={data} t={t} />
    </group>
  )
}

function ChargeBead({ color, t }: { color: string; t: React.MutableRefObject<number> }) {
  const m = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => emissive(color, 4), [color])
  useFrame(() => {
    if (m.current) m.current.position.y = 0.12 + ((t.current * 0.32) % 1) * (H - 0.24)
  })
  return (
    <mesh ref={m} material={mat}>
      <sphereGeometry args={[0.045, 14, 12]} />
    </mesh>
  )
}

/* ------------------------------------------------------------- C2 · Constellation */

/** Nodes suspended through a tall volume, linked by filaments, with satellites on inclined orbits. */
export function Constellation({ accent = ACCENT, data = CYAN }: ConceptProps) {
  const t = useClock()
  const near = useNear()
  const spin = useRef<THREE.Group>(null)
  const orbits = useRef<(THREE.Group | null)[]>([])

  const { nodes, links } = useMemo(() => {
    const nodes: THREE.Vector3[] = []
    const n = 26
    for (let i = 0; i < n; i++) {
      // golden-angle spiral through an elongated volume, so it fills the height evenly
      const u = (i + 0.5) / n
      const y = 0.14 + u * (H - 0.28)
      const a = i * 2.399
      const r = 0.2 + Math.sin(u * Math.PI) * 0.4 * (0.55 + 0.45 * Math.sin(i * 1.7))
      nodes.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r))
    }
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++)
        if (nodes[i].distanceTo(nodes[j]) < 0.42) pts.push(nodes[i], nodes[j])
    return { nodes, links: new THREE.BufferGeometry().setFromPoints(pts) }
  }, [])

  const nodeMesh = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const nodeMat = useMemo(() => emissive(data, 2.4), [data])
  const linkMat = useMemo(() => lineMat(accent, 0.34), [accent])
  const linkObj = useMemo(() => new THREE.LineSegments(links, linkMat), [links, linkMat])
  const orbitObjs = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const [loop] = ringGeometry(0.56 - i * 0.06, 72)
        const c = i === 1 ? data : accent
        return { line: new THREE.LineLoop(loop, lineMat(c, 0.5)), mat: emissive(c, 3), r: 0.56 - i * 0.06, tilt: [0.35, -0.62, 1.15][i] }
      }),
    [accent, data],
  )

  useFrame(() => {
    if (!near()) return
    if (spin.current) spin.current.rotation.y = t.current * 0.16
    const m = nodeMesh.current
    if (m) {
      nodes.forEach((p, i) => {
        tmp.position.copy(p)
        tmp.scale.setScalar(0.7 + 0.45 * Math.abs(Math.sin(t.current * 1.6 + i)))
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      })
      m.instanceMatrix.needsUpdate = true
    }
    orbits.current.forEach((g, i) => {
      if (g) g.rotation.y = t.current * (0.5 + i * 0.28) * (i % 2 ? -1 : 1)
    })
  })

  return (
    <group>
      <group ref={spin}>
        <primitive object={linkObj} />
        <instancedMesh ref={nodeMesh} args={[undefined, undefined, nodes.length]} material={nodeMat}>
          <sphereGeometry args={[0.03, 10, 8]} />
        </instancedMesh>
      </group>
      {orbitObjs.map((o, i) => (
        <group key={i} ref={(el) => (orbits.current[i] = el)} position={[0, H * 0.5, 0]} rotation={[o.tilt, 0, i * 0.5]}>
          <primitive object={o.line} />
          <mesh material={o.mat} position={[o.r, 0, 0]}>
            <sphereGeometry args={[0.032, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------ C3 · Growth Column */

/** A trunk that branches upward, each tip a subsystem, with light flowing out to the leaves. */
export function GrowthColumn({ accent = ACCENT, data = CYAN }: ConceptProps) {
  const t = useClock()
  const near = useNear()

  const { geo, tips } = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const tips: THREE.Vector3[] = []
    const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, depth: number, spread: number) => {
      const to = from.clone().addScaledVector(dir, len)
      pts.push(from.clone(), to.clone())
      if (depth === 0) {
        tips.push(to.clone())
        return
      }
      const branches = depth > 2 ? 2 : 3
      for (let i = 0; i < branches; i++) {
        const a = (i / branches) * Math.PI * 2 + depth * 1.1
        const d = dir
          .clone()
          .add(new THREE.Vector3(Math.cos(a) * spread, 0.34, Math.sin(a) * spread))
          .normalize()
        grow(to, d, len * 0.66, depth - 1, spread * 1.15)
      }
    }
    grow(new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 1, 0), 0.66, 3, 0.72)
    // tubes, not lines: a 1 px branch is invisible from across the hall
    const tubes: THREE.BufferGeometry[] = []
    for (let i = 0; i < pts.length; i += 2) {
      const a = pts[i]
      const b = pts[i + 1]
      const len = a.distanceTo(b)
      const g = new THREE.CylinderGeometry(0.018 * (1 - i / pts.length * 0.6) + 0.006, 0.018 * (1 - i / pts.length * 0.6) + 0.004, len, 7)
      g.translate(0, len / 2, 0)
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
      g.applyQuaternion(q)
      g.translate(a.x, a.y, a.z)
      tubes.push(g)
    }
    return { geo: mergeGeometries(tubes, false)!, tips }
  }, [])

  const branchMat = useMemo(() => emissive(accent, 1.3), [accent])
  const tipMat = useMemo(() => emissive(data, 2.6), [data])
  const mesh = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const sway = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!near()) return
    if (sway.current) {
      sway.current.rotation.z = Math.sin(t.current * 0.6) * 0.022
      sway.current.rotation.y = t.current * 0.09
    }
    const m = mesh.current
    if (!m) return
    tips.forEach((p, i) => {
      tmp.position.copy(p)
      tmp.scale.setScalar(0.6 + 0.6 * Math.abs(Math.sin(t.current * 2 + i * 0.9)))
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    branchMat.emissiveIntensity = 1.1 + 0.5 * Math.sin(t.current * 1.4)
  })

  return (
    <group ref={sway}>
      <mesh geometry={geo} material={branchMat} />
      <instancedMesh ref={mesh} args={[undefined, undefined, tips.length]} material={tipMat}>
        <sphereGeometry args={[0.055, 12, 10]} />
      </instancedMesh>
    </group>
  )
}

/* ------------------------------------------------------------------- C4 · Vortex */

/** A column of particles spiralling upward, pinching at the waist and dispersing at the top. */
export function Vortex({ accent = ACCENT, data = CYAN }: ConceptProps) {
  const t = useClock()
  const near = useNear()
  const COUNT = 2200
  const { geometry, pos, seed } = useParticles(COUNT)
  const mat = useMemo(() => pointsMat(accent, 0.055, 0.8), [accent])
  const inner = useMemo(() => pointsMat(data, 0.045, 0.75), [data])
  const { geometry: g2, pos: p2, seed: s2 } = useParticles(900)

  useFrame(() => {
    if (!near()) return
    const fill = (p: Float32Array, sd: Float32Array, n: number, radius: number, speed: number, twist: number) => {
      for (let i = 0; i < n; i++) {
        const u = (sd[i] + t.current * speed) % 1
        const y = 0.04 + u * (H - 0.08)
        const swell = Math.sin(u * Math.PI)
        const r = radius * (0.22 + swell * 0.85)
        const a = sd[i] * Math.PI * 2 + u * twist + t.current * 0.6
        p[i * 3] = Math.cos(a) * r
        p[i * 3 + 1] = y
        p[i * 3 + 2] = Math.sin(a) * r
      }
    }
    fill(pos, seed, COUNT, 0.66, 0.055, 7.5)
    fill(p2, s2, 900, 0.30, -0.09, -5.0)
    geometry.attributes.position.needsUpdate = true
    g2.attributes.position.needsUpdate = true
  })

  return (
    <group>
      <points geometry={geometry} material={mat} />
      <points geometry={g2} material={inner} />
      <Axis color={data} radius={0.008} />
    </group>
  )
}

/* -------------------------------------------------------- C5 · Fractured Monolith */

/** A tall slab broken into drifting fragments, light bleeding from the seams. */
export function FracturedMonolith({ accent = ACCENT, data = CYAN }: ConceptProps) {
  const t = useClock()
  const near = useNear()
  const SLABS = 6
  const shards = useMemo(
    () =>
      Array.from({ length: SLABS }, (_, i) => {
        const u = i / (SLABS - 1)
        return {
          y: 0.16 + u * (H - 0.34),
          w: 0.52 + Math.sin(u * Math.PI) * 0.30,
          d: 0.30 + Math.sin(u * Math.PI + 1) * 0.16,
          h: 0.14 + Math.random() * 0.06,
          phase: i * 1.3,
          dir: i % 2 ? 1 : -1,
        }
      }),
    [],
  )
  const shell = useMemo(() => new THREE.MeshStandardMaterial({ color: '#39424f', metalness: 0.85, roughness: 0.36 }), [])
  const seam = useMemo(() => glowMat(accent, 0.55), [accent])
  const edge = useMemo(() => lineMat(data, 0.75), [data])
  const refs = useRef<(THREE.Group | null)[]>([])
  const boxes = useMemo(() => shards.map((s) => {
    const b = new THREE.BoxGeometry(s.w, s.h, s.d)
    return { box: b, edges: new THREE.EdgesGeometry(b) }
  }), [shards])

  useFrame(() => {
    if (!near()) return
    shards.forEach((s, i) => {
      const g = refs.current[i]
      if (!g) return
      g.rotation.y = t.current * 0.12 * s.dir + s.phase
      g.position.y = s.y + Math.sin(t.current * 0.8 + s.phase) * 0.022
      g.position.x = Math.sin(t.current * 0.5 + s.phase) * 0.018
    })
  })

  return (
    <group>
      {shards.map((s, i) => {
        return (
          <group key={i} ref={(el) => (refs.current[i] = el)} position={[0, s.y, 0]}>
            <mesh geometry={boxes[i].box} material={shell} />
            <lineSegments geometry={boxes[i].edges} material={edge} />
            {/* the seam light under each fragment */}
            <mesh material={seam} position={[0, -s.h / 2 - 0.012, 0]} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[s.w * 0.92, s.d * 0.92]} />
            </mesh>
          </group>
        )
      })}
      <Axis color={accent} radius={0.007} />
    </group>
  )
}

/* ------------------------------------------------------------------- C6 · Beacon */

/** A scanner head at the top sweeping a light cone down over rings of data climbing the shaft. */
export function Beacon({ accent = ACCENT, data = CYAN }: ConceptProps) {
  const t = useClock()
  const near = useNear()
  const head = useRef<THREE.Group>(null)
  const cone = useMemo(() => glowMat(accent, 0.12), [accent])
  const bandMat = useMemo(() => lineMat(data, 0.8), [data])
  const bands = useRef<(THREE.Group | null)[]>([])
  const BANDS = 7
  const ringObjs = useMemo(
    () =>
      Array.from({ length: BANDS }, (_, i) => {
        const [loop, spokes] = ringGeometry(0.30 + (i % 3) * 0.09, 48, 6)
        return { loop: new THREE.LineLoop(loop, bandMat), spokes: new THREE.LineSegments(spokes, bandMat) }
      }),
    [bandMat],
  )
  const shellMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a5563', metalness: 0.9, roughness: 0.3 }), [])
  const lensMat = useMemo(() => emissive(accent, 3), [accent])

  useFrame(() => {
    if (!near()) return
    if (head.current) head.current.rotation.y = t.current * 0.85
    bands.current.forEach((g, i) => {
      if (!g) return
      const u = ((t.current * 0.13 + i / BANDS) % 1)
      g.position.y = 0.08 + u * (H - 0.5)
      g.rotation.y = t.current * (0.3 + i * 0.1)
      g.scale.setScalar(0.7 + Math.sin(u * Math.PI) * 0.5)
    })
  })

  return (
    <group>
      <Axis color={data} height={H - 0.28} radius={0.014} />
      {ringObjs.map((o, i) => (
        <group key={i} ref={(el) => (bands.current[i] = el)}>
          <primitive object={o.loop} />
          <primitive object={o.spokes} />
        </group>
      ))}
      <group ref={head} position={[0, H - 0.2, 0]}>
        <mesh material={shellMat}>
          <cylinderGeometry args={[0.13, 0.16, 0.16, 20]} />
        </mesh>
        <mesh material={lensMat} position={[0.13, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
        </mesh>
        {/* the sweep it throws down the shaft */}
        <mesh material={cone} position={[0.42, -0.62, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.22, 1.3, 20, 1, true]} />
        </mesh>
      </group>
    </group>
  )
}

export const TALL_CONCEPTS = [
  { id: 'c1', name: 'Data Core', blurb: 'A spindle of counter-rotating map slices; a charge climbs the axis and lights each one as it passes.', C: DataCore },
  { id: 'c2', name: 'Constellation', blurb: 'Nodes suspended through the volume, linked by filaments, with satellites on inclined orbits.', C: Constellation },
  { id: 'c3', name: 'Growth Column', blurb: 'A trunk branching upward, every tip a subsystem, light flowing out to the leaves.', C: GrowthColumn },
  { id: 'c4', name: 'Vortex', blurb: 'A column of particles spiralling up, pinched at the waist, dispersing at the top.', C: Vortex },
  { id: 'c5', name: 'Fractured Monolith', blurb: 'A tall slab broken into drifting fragments with light bleeding from the seams.', C: FracturedMonolith },
  { id: 'c6', name: 'Beacon', blurb: 'A scanner head sweeping a cone down the shaft while rings of data climb it.', C: Beacon },
] as const
