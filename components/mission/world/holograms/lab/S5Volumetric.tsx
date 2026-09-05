'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { ACCENT, Callout, CYAN, LIME, ProjectorCone, Tag, WHITE, smooth, useLabClock, useProjectionMaterial } from './labParts'
import { DETECTIONS, FACTORS, FACTOR_COLOR, FACTOR_LABEL, KEYFRAMES, LANDMARKS, PATROL, ROOMS, WALLS } from './subjects'

/**
 * Style 5 — Volumetric Projection. The familiar sci-fi hologram, but built like one: a real light
 * cone out of the pedestal, extruded volume with interference scanlines and a colour fringe at
 * grazing angles, a mains flicker, annotation cards on leader lines, and a pool of light where the
 * beam lands. Everything the old holograms suggested with thin lines, given actual volume.
 */

const WALL_H = 0.26

/** A light beam between two points with a pulse running along it. */
function Beam({ a, b, color, phase = 0, width = 0.006 }: { a: [number, number, number]; b: [number, number, number]; color: string; phase?: number; width?: number }) {
  const t = useLabClock()
  const pulse = useRef<THREE.Mesh>(null)
  const from = useMemo(() => new THREE.Vector3(...a), [a])
  const to = useMemo(() => new THREE.Vector3(...b), [b])
  const len = from.distanceTo(to)
  const mid = useMemo(() => from.clone().lerp(to, 0.5), [from, to])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()), [from, to])
  useFrame(() => {
    if (!pulse.current) return
    const u = ((t.current * 0.5 + phase) % 1)
    pulse.current.position.copy(from).lerp(to, u)
    const m = pulse.current.material as THREE.MeshBasicMaterial
    m.opacity = Math.sin(u * Math.PI) * 0.9
  })
  return (
    <group>
      <mesh position={mid} quaternion={quat}>
        <cylinderGeometry args={[width, width, len, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[width * 2.4, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function Go2Volumetric() {
  const t = useLabClock()
  const volume = useProjectionMaterial(ACCENT, 0.6)
  const floorMat = useProjectionMaterial(CYAN, 0.3)
  const robot = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)

  const walls = useMemo(() => {
    const geos = WALLS.map((w) => {
      const dx = w.b[0] - w.a[0]
      const dz = w.b[1] - w.a[1]
      const len = Math.hypot(dx, dz)
      const g = new THREE.BoxGeometry(len, WALL_H, 0.012)
      g.rotateY(Math.atan2(-dz, dx))
      g.translate((w.a[0] + w.b[0]) / 2, WALL_H / 2, (w.a[1] + w.b[1]) / 2)
      return g
    })
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [])

  useFrame(() => {
    const total = PATROL.length - 1
    const s = (t.current * 0.5) % total
    const i = Math.floor(s)
    const u = s - i
    const a = PATROL[i]
    const b = PATROL[i + 1]
    if (robot.current) {
      robot.current.position.set(a[0] + (b[0] - a[0]) * u, 0.05, a[1] + (b[1] - a[1]) * u)
      robot.current.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0])
    }
    // a report pulse rings out each time a zone is finished
    const rp = (t.current % 4) / 4
    if (ring.current) {
      ring.current.scale.setScalar(0.1 + rp * 1.5)
      const m = ring.current.material as THREE.MeshBasicMaterial
      m.opacity = (1 - rp) * 0.5
    }
  })

  return (
    <group>
      <ProjectorCone radius={0.66} height={0.62} color={ACCENT} />
      <mesh geometry={walls} material={volume} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} material={floorMat}>
        <planeGeometry args={[1.12, 0.86]} />
      </mesh>
      {ROOMS.map((r) => (
        <mesh key={r.id} position={[r.x, 0.006, r.z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[r.w - 0.03, r.d - 0.03]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      {/* patrol beam */}
      {PATROL.slice(0, -1).map((p, i) => (
        <Beam key={i} a={[p[0], 0.02, p[1]]} b={[PATROL[i + 1][0], 0.02, PATROL[i + 1][1]]} color={ACCENT} phase={i / PATROL.length} width={0.004} />
      ))}
      <group ref={robot}>
        <mesh>
          <boxGeometry args={[0.075, 0.035, 0.045]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.035, 0]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
        </mesh>
        <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, -0.045, 0]}>
          <ringGeometry args={[0.06, 0.075, 32]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      {DETECTIONS.map((d, i) => (
        <group key={i}>
          <mesh position={[d.p[0], d.y / 2, d.p[1]]}>
            <boxGeometry args={[0.05, d.y, 0.05]} />
            <meshBasicMaterial color={CYAN} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <lineSegments position={[d.p[0], d.y / 2, d.p[1]]}>
            <edgesGeometry args={[new THREE.BoxGeometry(0.05, d.y, 0.05)]} />
            <lineBasicMaterial color={CYAN} transparent opacity={0.8} />
          </lineSegments>
        </group>
      ))}
      <Callout at={[DETECTIONS[1].p[0], DETECTIONS[1].y, DETECTIONS[1].p[1]]} to={[0.62, 0.4, -0.1]} text="pallet stack" sub="YOLOE · 0.91" />
      <Callout at={[ROOMS[2].x, 0.2, ROOMS[2].z]} to={[-0.68, 0.46, 0.24]} text="zone_3" sub="2 objects · swept" color={ACCENT} />
      <Tag text="MCP · “inspect zone 3”" position={[0, 0.56, 0]} width={0.36} size={32} color={LIME} bg="rgba(6,10,16,0.72)" />
    </group>
  )
}

/** The five modalities as stacked layers over the trajectory, so the graph has height to read. */
const LAYERS: { kind: 'lidar' | 'imu' | 'encoder' | 'vision'; y: number }[] = [
  { kind: 'encoder', y: 0.14 },
  { kind: 'imu', y: 0.24 },
  { kind: 'vision', y: 0.34 },
  { kind: 'lidar', y: 0.44 },
]

export function OliveVolumetric() {
  const t = useLabClock()
  const nodes = useRef<THREE.InstancedMesh>(null)
  const flash = useRef<THREE.Mesh>(null)
  const ghost = useRef<THREE.Line>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const at = (id: number | string): [number, number] => (typeof id === 'number' ? KEYFRAMES[id].p : LANDMARKS[+String(id).slice(1)])

  /** one edge set per layer, plus the hairlines tying every keyframe through the whole stack */
  const layers = useMemo(
    () =>
      LAYERS.map((L) => ({
        ...L,
        edges: FACTORS.filter((f) => f.kind === L.kind).map((f, i) => {
          const a = at(f.from)
          const b = at(f.to)
          return { key: i, a: [a[0], L.y, a[1]] as [number, number, number], b: [b[0], L.y, b[1]] as [number, number, number], phase: i * 0.17 }
        }),
      })),
    [],
  )

  const spines = useMemo(() => {
    const pts: THREE.Vector3[] = []
    KEYFRAMES.forEach((k) => {
      pts.push(new THREE.Vector3(k.p[0], 0.02, k.p[1]), new THREE.Vector3(k.p[0], 0.46, k.p[1]))
    })
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  const trajectory = useMemo(() => new THREE.BufferGeometry().setFromPoints(KEYFRAMES.concat(KEYFRAMES[0]).map((k) => new THREE.Vector3(k.p[0], 0.02, k.p[1]))), [])
  const ghostMat = useMemo(() => new THREE.LineBasicMaterial({ color: FACTOR_COLOR.loop, transparent: true, opacity: 0.7 }), [])
  const ghostLine = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(KEYFRAMES.concat(KEYFRAMES[0]).map((k) => new THREE.Vector3(k.p[0] + k.drift[0], 0.02, k.p[1] + k.drift[1])))
    return new THREE.Line(g, ghostMat)
  }, [ghostMat])

  useFrame(() => {
    const m = nodes.current
    if (m) {
      for (let i = 0; i < KEYFRAMES.length; i++) {
        const k = KEYFRAMES[i]
        tmp.position.set(k.p[0], 0.02, k.p[1])
        tmp.scale.setScalar(1 + Math.sin(t.current * 3 + i * 0.6) * 0.16)
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }
    // the drifted estimate collapses onto the truth when the closure fires
    const u = (t.current % 6) / 6
    const k = u < 0.6 ? 1 : Math.max(0, 1 - (u - 0.6) / 0.14)
    if (ghost.current) ghost.current.scale.set(1 + 0.1 * k, 1, 1 + 0.1 * k)
    ghostMat.opacity = 0.7 * k
    if (flash.current) {
      const f = u > 0.6 ? smooth(1 - (u - 0.6) / 0.3) : 0
      flash.current.scale.setScalar(0.3 + (1 - f) * 1.7)
      ;(flash.current.material as THREE.MeshBasicMaterial).opacity = f * 0.75
    }
  })

  return (
    <group>
      <ProjectorCone radius={0.6} height={0.52} color={ACCENT} />
      {/* ground truth trajectory and the drifted estimate that snaps onto it */}
      <lineLoop geometry={trajectory}>
        <lineBasicMaterial color={WHITE} transparent opacity={0.85} />
      </lineLoop>
      <primitive object={ghostLine} ref={ghost} />
      <lineSegments geometry={spines}>
        <lineBasicMaterial color={CYAN} transparent opacity={0.14} />
      </lineSegments>
      {layers.map((L) => (
        <group key={L.kind}>
          <mesh rotation-x={-Math.PI / 2} position={[0, L.y - 0.004, 0]}>
            <ringGeometry args={[0.53, 0.55, 60]} />
            <meshBasicMaterial color={FACTOR_COLOR[L.kind]} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {L.edges.map((e) => (
            <Beam key={e.key} a={e.a} b={e.b} color={FACTOR_COLOR[L.kind]} phase={e.phase} width={0.004} />
          ))}
          <Tag text={FACTOR_LABEL[L.kind]} position={[0.78, L.y, 0]} width={0.3} size={30} color={FACTOR_COLOR[L.kind]} bg="rgba(6,10,16,0.72)" />
        </group>
      ))}
      <instancedMesh ref={nodes} args={[undefined, undefined, KEYFRAMES.length]}>
        <sphereGeometry args={[0.017, 12, 10]} />
        <meshBasicMaterial color={WHITE} toneMapped={false} />
      </instancedMesh>
      {LANDMARKS.map((l, i) => (
        <group key={i} position={[l[0], 0, l[1]]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.5, 6]} />
            <meshBasicMaterial color={FACTOR_COLOR.fiducial} transparent opacity={0.45} toneMapped={false} />
          </mesh>
          {[0.16, 0.3].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.026, 0.036, 28]} />
              <meshBasicMaterial color={FACTOR_COLOR.fiducial} transparent opacity={0.9} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the loop-closure factor arcs over the top of the whole stack */}
      <Beam a={[KEYFRAMES[KEYFRAMES.length - 1].p[0], 0.54, KEYFRAMES[KEYFRAMES.length - 1].p[1]]} b={[KEYFRAMES[0].p[0], 0.54, KEYFRAMES[0].p[1]]} color={FACTOR_COLOR.loop} width={0.009} />
      <mesh ref={flash} rotation-x={-Math.PI / 2} position={[KEYFRAMES[0].p[0], 0.03, KEYFRAMES[0].p[1]]}>
        <ringGeometry args={[0.09, 0.115, 40]} />
        <meshBasicMaterial color={FACTOR_COLOR.loop} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Callout at={[LANDMARKS[0][0], 0.3, LANDMARKS[0][1]]} to={[-0.76, 0.56, 0.1]} text={FACTOR_LABEL.fiducial} sub="L0 · range + bearing" color={FACTOR_COLOR.fiducial} />
      <Tag text="drift → loop closed · 2.0 cm RMSE" position={[0, 0.68, 0]} width={0.42} size={32} color={LIME} bg="rgba(6,10,16,0.72)" />
    </group>
  )
}
