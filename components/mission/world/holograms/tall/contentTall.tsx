'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { emissive, glowMat, lineMat, useClock, useNear, H } from './tallParts'
import type { SlabDesign } from '../data/projects'

/**
 * Tall holograms whose geometry comes from the project's own data, not from a pretty shape. Every
 * ring is that project's real plan, every node one of its real entities, every link one of its
 * real relations — so the silhouette that reads from across the hall is *about something*.
 *
 * Data comes from data/projects.ts, which describes all ten projects as runs (structure),
 * a path (the route or circuit) and pins (the things that matter).
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function runsGeometry(runs: [number, number][][] | SlabDesign['runs'], y: number, scale = 1) {
  const pts: THREE.Vector3[] = []
  for (const [a, b] of runs) {
    pts.push(V(a[0] * scale, y, a[1] * scale), V(b[0] * scale, y, b[1] * scale))
  }
  return new THREE.BufferGeometry().setFromPoints(pts)
}

function pathGeometry(path: SlabDesign['path'], y: number, scale = 1) {
  return new THREE.BufferGeometry().setFromPoints(path.map((p) => V(p[0] * scale, y, p[1] * scale)))
}

/* ------------------------------------------------------------------ T1 · Scan Stack */

/**
 * The project's plan reconstructed as a vertical stack of scan levels, lifting into place and
 * locking one at a time. The rings are literally that project's structure — rooms for the Go2
 * sweep, the circuit for OLIVE, crop rows for AgroBot.
 */
export function ScanStack({ design }: { design: SlabDesign; projectKey?: string }) {
  const t = useClock()
  const near = useNear()
  const LEVELS = 9
  const step = (H - 0.2) / (LEVELS - 1)

  const levels = useMemo(
    () =>
      Array.from({ length: LEVELS }, (_, i) => {
        const u = i / (LEVELS - 1)
        // a slight taper reads as perspective and stops the stack looking like a barrel
        const s = 1.5 * (1 - u * 0.22)
        return { y: 0.12 + i * step, u, geo: runsGeometry(design.runs, 0, s), path: pathGeometry(design.path, 0, s) }
      }),
    [design, step],
  )
  const runMats = useMemo(() => levels.map(() => lineMat(design.accent, 0.5)), [levels, design.accent])
  const pathMats = useMemo(() => levels.map(() => lineMat(design.data, 0.7)), [levels, design.data])
  const objs = useMemo(
    () =>
      levels.map((l, i) => ({
        runs: new THREE.LineSegments(l.geo, runMats[i]),
        path: design.closed ? new THREE.LineLoop(l.path, pathMats[i]) : new THREE.Line(l.path, pathMats[i]),
      })),
    [levels, runMats, pathMats, design.closed],
  )
  const groups = useRef<(THREE.Group | null)[]>([])
  const spin = useRef<THREE.Group>(null)

  // pins become light columns rising through the whole stack
  const columns = useMemo(() => {
    const geos = design.pins.map((p) => {
      const h = (H - 0.2) * (0.55 + (p.h ?? 0.08) * 3.2)
      const g = new THREE.CylinderGeometry(0.008, 0.008, Math.min(h, H - 0.24), 6)
      g.translate(p.p[0] * 1.5, 0.12 + Math.min(h, H - 0.24) / 2, p.p[1] * 1.5)
      return g
    })
    return mergeGeometries(geos, false)!
  }, [design.pins])
  const colMat = useMemo(() => emissive(design.data, 1.1, 0.5), [design.data])

  useFrame(() => {
    if (!near()) return
    if (spin.current) spin.current.rotation.y = t.current * 0.13
    const build = (t.current * 0.22) % 2.4 // build over ~4.5 s, then hold the finished stack
    levels.forEach((l, i) => {
      const g = groups.current[i]
      if (!g) return
      const k = THREE.MathUtils.clamp((build - l.u) * 6, 0, 1)
      g.visible = k > 0.01
      g.position.y = l.y - (1 - k) * 0.16
      const settling = 1 - Math.abs(k - 0.55) * 2
      runMats[i].opacity = 0.16 + k * 0.34 + Math.max(0, settling) * 0.5
      pathMats[i].opacity = 0.12 + k * 0.5 + Math.max(0, settling) * 0.6
    })
  })

  return (
    <group ref={spin}>
      {levels.map((l, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)} position={[0, l.y, 0]}>
          <primitive object={objs[i].runs} />
          <primitive object={objs[i].path} />
        </group>
      ))}
      <mesh geometry={columns} material={colMat} />
    </group>
  )
}

/* ---------------------------------------------------------------- T2 · Node Helix */

/**
 * The project's route unrolled into a helix: each waypoint becomes a node at a height set by how
 * far along it is, so the loop that was flat on the plate becomes a tall spiral you can read the
 * order of. Structure runs link back to it as chords.
 */
export function NodeHelix({ design }: { design: SlabDesign; projectKey?: string }) {
  const t = useClock()
  const near = useNear()

  const { nodes, chords, spiral } = useMemo(() => {
    const p = design.path
    const n = p.length
    const nodes = p.map((pt, i) => {
      const u = i / n
      return V(pt[0] * 1.45, 0.14 + u * (H - 0.3), pt[1] * 1.45)
    })
    const spiral = new THREE.BufferGeometry().setFromPoints(nodes)
    // structure runs become chords, lifted to the height of the nearest waypoint
    const cp: THREE.Vector3[] = []
    const nearestY = (x: number, z: number) => {
      let best = nodes[0]
      let bd = 1e9
      for (const nd of nodes) {
        const d = (nd.x - x * 1.45) ** 2 + (nd.z - z * 1.45) ** 2
        if (d < bd) { bd = d; best = nd }
      }
      return best.y
    }
    for (const [a, b] of design.runs) {
      cp.push(V(a[0] * 1.45, nearestY(a[0], a[1]), a[1] * 1.45), V(b[0] * 1.45, nearestY(b[0], b[1]), b[1] * 1.45))
    }
    return { nodes, chords: new THREE.BufferGeometry().setFromPoints(cp), spiral }
  }, [design])

  const spiralMat = useMemo(() => lineMat(design.accent, 0.85), [design.accent])
  const chordMat = useMemo(() => lineMat(design.data, 0.3), [design.data])
  const spiralObj = useMemo(() => new THREE.Line(spiral, spiralMat), [spiral, spiralMat])
  const chordObj = useMemo(() => new THREE.LineSegments(chords, chordMat), [chords, chordMat])
  const nodeMat = useMemo(() => emissive(design.data, 2.2), [design.data])
  const mesh = useRef<THREE.InstancedMesh>(null)
  const bead = useRef<THREE.Mesh>(null)
  const beadMat = useMemo(() => emissive(design.accent, 4), [design.accent])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const spin = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!near()) return
    if (spin.current) spin.current.rotation.y = t.current * 0.15
    const m = mesh.current
    if (m) {
      nodes.forEach((p, i) => {
        tmp.position.copy(p)
        tmp.scale.setScalar(0.7 + 0.5 * Math.abs(Math.sin(t.current * 2 + i * 0.7)))
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      })
      m.instanceMatrix.needsUpdate = true
    }
    // a bead walks the route in order, which is what the helix is for
    if (bead.current) {
      const s = (t.current * 0.35) % 1
      const f = s * (nodes.length - 1)
      const i = Math.floor(f)
      bead.current.position.copy(nodes[i]).lerp(nodes[Math.min(i + 1, nodes.length - 1)], f - i)
    }
  })

  return (
    <group ref={spin}>
      <primitive object={chordObj} />
      <primitive object={spiralObj} />
      <instancedMesh ref={mesh} args={[undefined, undefined, nodes.length]} material={nodeMat}>
        <sphereGeometry args={[0.032, 10, 8]} />
      </instancedMesh>
      <mesh ref={bead} material={beadMat}>
        <sphereGeometry args={[0.05, 14, 12]} />
      </mesh>
    </group>
  )
}

/* --------------------------------------------------------------- T3 · Survey Mast */

/**
 * A sensor mast with the project's plan hovering under it, lifting as coverage grows while the
 * head sweeps a cone across it — the literal act of surveying, rather than a shape that suggests it.
 */
export function SurveyMast({ design }: { design: SlabDesign; projectKey?: string }) {
  const t = useClock()
  const near = useNear()
  const mastMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a5563', metalness: 0.9, roughness: 0.32 }), [])
  const coneMat = useMemo(() => glowMat(design.accent, 0.10), [design.accent])
  const runMat = useMemo(() => lineMat(design.accent, 0.75), [design.accent])
  const pathMat = useMemo(() => lineMat(design.data, 0.9), [design.data])
  const runObj = useMemo(() => new THREE.LineSegments(runsGeometry(design.runs, 0, 1.55), runMat), [design.runs, runMat])
  const pathObj = useMemo(() => {
    const g = pathGeometry(design.path, 0.012, 1.55)
    return design.closed ? new THREE.LineLoop(g, pathMat) : new THREE.Line(g, pathMat)
  }, [design.path, design.closed, pathMat])
  const plan = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const pinMat = useMemo(() => emissive(design.data, 2.2), [design.data])
  const pins = useMemo(() => {
    const geos = design.pins.map((p) => {
      const h = (p.h ?? 0.08) * 2.2
      const g = new THREE.CylinderGeometry(0.008, 0.008, h, 6)
      g.translate(p.p[0] * 1.55, h / 2, p.p[1] * 1.55)
      return g
    })
    return mergeGeometries(geos, false)!
  }, [design.pins])

  useFrame(() => {
    if (!near()) return
    if (head.current) head.current.rotation.y = t.current * 1.1
    if (plan.current) {
      const u = (t.current * 0.16) % 1
      plan.current.position.y = 0.16 + u * (H - 0.62)
      const o = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, u * 1.15))
      runMat.opacity = 0.3 + o * 0.5
      pathMat.opacity = 0.4 + o * 0.6
    }
  })

  return (
    <group>
      <mesh material={mastMat} position={[0, (H - 0.1) / 2, 0]}>
        <cylinderGeometry args={[0.026, 0.034, H - 0.1, 12]} />
      </mesh>
      <group ref={head} position={[0, H - 0.12, 0]}>
        <mesh material={mastMat}>
          <cylinderGeometry args={[0.10, 0.13, 0.13, 18]} />
        </mesh>
        <mesh material={emissive(design.accent, 3)} position={[0.10, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 14]} />
        </mesh>
        <mesh material={coneMat} position={[0.34, -0.52, 0]} rotation={[0, 0, -0.58]}>
          <coneGeometry args={[0.2, 1.15, 20, 1, true]} />
        </mesh>
      </group>
      <group ref={plan}>
        <primitive object={runObj} />
        <primitive object={pathObj} />
        <mesh geometry={pins} material={pinMat} />
      </group>
    </group>
  )
}

export const TALL_FORMS = [
  { id: 't1', name: 'Scan Stack', blurb: "The project's own plan rebuilt as a stack of scan levels, locking into place one at a time.", C: ScanStack },
  { id: 't2', name: 'Node Helix', blurb: 'The route unrolled into a spiral so its order is readable, with structure linking back as chords.', C: NodeHelix },
  { id: 't3', name: 'Survey Mast', blurb: 'A sensor head sweeping a cone over the plan while it lifts — the act of surveying, not a metaphor.', C: SurveyMast },
] as const
