'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mission } from '@/lib/mission/store'

/**
 * What each podium projects.
 *
 * A ring spinning over a box says "award" and nothing else. These say what was actually won: the
 * Hex board being searched, the Snake arena the bots played, the grasp pipeline that took the
 * technical prize. Same reasoning as the project holograms in the hall — a trophy that shows the
 * work beats a trophy that shows a trophy.
 *
 * Everything is drawn as additive lines and small emissive solids. That is not a stylistic choice:
 * these sit 3-4 m from the camera at about 0.8 m across, so silhouette and motion carry them and
 * fine surface detail would be invisible. Additive geometry also takes the bloom, which is what
 * makes them read as projected light rather than painted plastic.
 */

const ACCENT = '#ff7a1a'
const CYAN = '#4fd1ff'
const LIME = '#8ce563'

/** Local clock that only runs when the zone is close enough to be looked at. */
function useHoloClock() {
  const t = useRef(0)
  useFrame((_, dt) => {
    if (mission.zone < 3 || mission.zone > 5) return
    t.current += Math.min(0.05, dt || 0.016)
  })
  return t
}

function lineMat(color: string, opacity = 0.9) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
}

function emissive(color: string, strength = 2) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: strength, roughness: 0.4, metalness: 0.1 })
}

/* ------------------------------------------------------------------ 1st: Hex */

/** Game AI Hackathon — a Hex board, searched then solved. */
export function HexSearch() {
  const t = useHoloClock()
  const R = 2
  const S = 0.085

  const cells = useMemo(() => {
    const out: { x: number; z: number; d: number }[] = []
    for (let q = -R; q <= R; q++) {
      for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) {
        const x = 1.5 * q * S
        const z = Math.sqrt(3) * (r + q / 2) * S
        out.push({ x, z, d: 0 })
      }
    }
    // search order: outward from the left edge, which is how the frontier actually grows
    const min = Math.min(...out.map((c) => c.x))
    out.forEach((c) => (c.d = (c.x - min) / (S * 3 * R) + Math.abs(c.z) * 0.35))
    return out.sort((a, b) => a.d - b.d)
  }, [])

  /** the winning connection, left edge to right edge */
  const solution = useMemo(() => {
    const picked: number[] = []
    const columns = new Map<number, number[]>()
    cells.forEach((c, i) => {
      const k = Math.round(c.x / (1.5 * S))
      columns.set(k, [...(columns.get(k) ?? []), i])
    })
    let z = -S
    for (const k of [...columns.keys()].sort((a, b) => a - b)) {
      const col = columns.get(k)!
      const best = col.reduce((a, b) => (Math.abs(cells[a].z - z) < Math.abs(cells[b].z - z) ? a : b))
      picked.push(best)
      z = cells[best].z + (Math.sin(k * 2.3) * S) / 2
    }
    return picked
  }, [cells])

  const tiles = useRef<THREE.InstancedMesh>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const tileMat = useMemo(() => emissive(CYAN, 1.1), [])
  const board = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (const c of cells) {
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const b = ((i + 1) / 6) * Math.PI * 2
        if (i === 6) break
        pts.push(new THREE.Vector3(c.x + Math.cos(a) * S * 0.92, 0, c.z + Math.sin(a) * S * 0.92))
        pts.push(new THREE.Vector3(c.x + Math.cos(b) * S * 0.92, 0, c.z + Math.sin(b) * S * 0.92))
      }
    }
    return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(ACCENT, 0.45))
  }, [cells])

  const colors = useMemo(() => new Float32Array(cells.length * 3), [cells.length])
  const solved = useMemo(() => new Set(solution), [solution])
  const c1 = useMemo(() => new THREE.Color(CYAN), [])
  const c2 = useMemo(() => new THREE.Color(ACCENT), [])

  useFrame(() => {
    const m = tiles.current
    if (!m) return
    // 6 s to search the board, 2 s holding the solved path, then again
    const u = (t.current % 8) / 8
    const searched = Math.min(1, u / 0.72) * cells.length
    const showing = u > 0.72
    cells.forEach((c, i) => {
      const on = i < searched
      const win = showing && solved.has(i)
      const s = win ? 1 : on ? 0.72 : 0.16
      tmp.position.set(c.x, win ? 0.018 : 0, c.z)
      tmp.scale.set(s, win ? 1.6 : 0.5, s)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
      const col = win ? c2 : c1
      colors[i * 3] = col.r * (on ? 1 : 0.35)
      colors[i * 3 + 1] = col.g * (on ? 1 : 0.35)
      colors[i * 3 + 2] = col.b * (on ? 1 : 0.35)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <group rotation={[0.32, 0, 0]}>
      <primitive object={board} />
      <instancedMesh ref={tiles} args={[undefined, tileMat, cells.length]} position={[0, 0.006, 0]}>
        <cylinderGeometry args={[S * 0.78, S * 0.78, 0.012, 6]} />
        <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
      </instancedMesh>
    </group>
  )
}

/* ------------------------------------------------------------------ 2nd: Snake */

/** Itestra Hackathon — two bots playing a Snake variant on a shared grid. */
export function SnakeArena() {
  const t = useHoloClock()
  const N = 9
  const S = 0.052
  const half = ((N - 1) / 2) * S

  const grid = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < N; i++) {
      const k = -half + i * S
      pts.push(new THREE.Vector3(k, 0, -half), new THREE.Vector3(k, 0, half))
      pts.push(new THREE.Vector3(-half, 0, k), new THREE.Vector3(half, 0, k))
    }
    return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(ACCENT, 0.5))
  }, [half])

  /** Each bot walks a fixed tour of the grid; the two tours are offset so they weave. */
  const tour = useMemo(() => {
    const path: [number, number][] = []
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) path.push([r % 2 ? N - 1 - c : c, r])
    return path
  }, [])

  const bodies = useRef<(THREE.InstancedMesh | null)[]>([])
  // additive bloom turns a bright emissive into a blob at this size; the snakes read better
  // as solid bodies with a lit edge than as light sources
  const mats = useMemo(() => [emissive(CYAN, 1.15), emissive(LIME, 1.0)], [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const pellet = useRef<THREE.Mesh>(null)
  const pelletMat = useMemo(() => emissive(ACCENT, 2.2), [])
  const LEN = 9

  useFrame(() => {
    const step = t.current * 2.6
    bodies.current.forEach((m, b) => {
      if (!m) return
      const lead = Math.floor(step) + b * 37
      const grow = 4 + Math.floor((Math.sin(t.current * 0.35 + b * 2.1) * 0.5 + 0.5) * (LEN - 4))
      for (let i = 0; i < LEN; i++) {
        const idx = ((lead - i) % tour.length + tour.length) % tour.length
        const [c, r] = tour[idx]
        const on = i < grow
        tmp.position.set(-half + c * S, 0, -half + r * S)
        tmp.scale.setScalar(on ? S * (0.9 - i * 0.03) : 0)
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    })
    if (pellet.current) {
      const k = Math.floor(t.current * 0.8) * 53
      const [c, r] = tour[(k * 7) % tour.length]
      pellet.current.position.set(-half + c * S, 0.012 + Math.sin(t.current * 5) * 0.006, -half + r * S)
    }
  })

  return (
    <group rotation={[0.34, 0, 0]}>
      <primitive object={grid} />
      {[0, 1].map((b) => (
        <instancedMesh key={b} ref={(el) => { bodies.current[b] = el }} args={[undefined, mats[b], LEN]} position={[0, 0.012, 0]}>
          <boxGeometry args={[1, 0.7, 1]} />
        </instancedMesh>
      ))}
      <mesh ref={pellet} material={pelletMat}>
        <octahedronGeometry args={[0.024, 0]} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ 3rd: grasp */

/** AI+Robotics — the sim-to-real grasp that took the technical prize: perceive, plan, pick. */
export function GraspPipeline() {
  const t = useHoloClock()

  /** the part being picked, as a point cloud that fills in while the scan plane passes it */
  const cloud = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.085, 2)
    const pos = g.attributes.position
    const pts = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      pts[i * 3] = pos.getX(i)
      pts[i * 3 + 1] = pos.getY(i) + 0.09
      pts[i * 3 + 2] = pos.getZ(i)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    g.dispose()
    return geo
  }, [])
  const cloudMat = useMemo(() => new THREE.PointsMaterial({ color: CYAN, size: 0.011, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  const wire = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.085, 1)
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 1), lineMat(ACCENT, 0.4))
    e.position.y = 0.09
    g.dispose()
    return e
  }, [])

  const scan = useRef<THREE.Line>(null)
  const scanObj = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15))
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat(CYAN, 0.75))
  }, [])

  const gripper = useRef<THREE.Group>(null)
  const fingers = useRef<(THREE.Mesh | null)[]>([])
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9c3d2', metalness: 0.85, roughness: 0.3 }), [])
  const arcMat = useMemo(() => lineMat(ACCENT, 0.55), [])
  const arc = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 30; i++) {
      const k = i / 30
      pts.push(new THREE.Vector3(THREE.MathUtils.lerp(0, 0.22, k), 0.09 + Math.sin(k * Math.PI) * 0.13, 0))
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat)
  }, [arcMat])
  const part = useRef<THREE.Mesh>(null)
  const partMat = useMemo(() => emissive(LIME, 1.6), [])

  useFrame(() => {
    // 3 s scanning, 3 s approach and grasp, 2 s transfer
    const u = (t.current % 8) / 8
    if (scan.current) {
      const s = u < 0.38 ? u / 0.38 : 1
      scan.current.position.y = 0.02 + s * 0.16
      scan.current.visible = u < 0.42
    }
    if (gripper.current) {
      const approach = THREE.MathUtils.clamp((u - 0.36) / 0.2, 0, 1)
      const lift = THREE.MathUtils.clamp((u - 0.62) / 0.3, 0, 1)
      gripper.current.position.set(lift * 0.22, 0.30 - approach * 0.19 + Math.sin(lift * Math.PI) * 0.13 + lift * 0.0, 0)
      const close = THREE.MathUtils.clamp((u - 0.53) / 0.08, 0, 1)
      fingers.current.forEach((f, i) => f && (f.position.x = (i ? 1 : -1) * (0.055 - close * 0.028)))
    }
    if (part.current) {
      const lift = THREE.MathUtils.clamp((u - 0.62) / 0.3, 0, 1)
      part.current.position.set(lift * 0.22, 0.09 + Math.sin(lift * Math.PI) * 0.13, 0)
      part.current.visible = u > 0.58
    }
  })

  return (
    <group>
      <points geometry={cloud} material={cloudMat} />
      <primitive object={wire} />
      <primitive object={scanObj} ref={scan} />
      <primitive object={arc} />
      <mesh ref={part} material={partMat}>
        <icosahedronGeometry args={[0.05, 0]} />
      </mesh>
      <group ref={gripper}>
        <mesh material={steel}>
          <boxGeometry args={[0.09, 0.04, 0.05]} />
        </mesh>
        {[0, 1].map((i) => (
          <mesh key={i} ref={(el) => { fingers.current[i] = el }} material={steel} position={[(i ? 1 : -1) * 0.055, -0.05, 0]}>
            <boxGeometry args={[0.016, 0.07, 0.035]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export const TROPHIES = [HexSearch, SnakeArena, GraspPipeline]
