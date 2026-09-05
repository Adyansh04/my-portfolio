'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, CYAN, LIME, Tag, WHITE, smooth, useLabClock } from './labParts'
import { DETECTIONS, FACTORS, FACTOR_COLOR, KEYFRAMES, LANDMARKS, ROOMS, WALLS } from './subjects'

/**
 * Style 4 — Tomographic Stack. The subject arrives as a stack of cross-sections that rise into
 * place, the way a CT reconstruction or a printer builds a part. Each plate is a real section, so
 * the shape is read by assembling it rather than by looking at a finished model, and the leading
 * plate glows as it lands. The vertical axis carries meaning: height for the facility, elapsed
 * time for the factor graph.
 */

const PLATES = 10
const GAP = 0.052

function useAssembly(period = 9) {
  const t = useLabClock()
  const progress = useRef(0)
  useFrame(() => {
    const u = (t.current % period) / period
    // rise over the first 55%, hold, then drop back
    progress.current = u < 0.55 ? smooth(u / 0.55) * PLATES : u > 0.88 ? smooth(1 - (u - 0.88) / 0.12) * PLATES : PLATES
  })
  return { progress, t }
}

/** One section plate: a glass sheet carrying line work, which slides up into its slot. */
function Plate({ index, progress, children, tint = CYAN }: { index: number; progress: React.MutableRefObject<number>; children: React.ReactNode; tint?: string }) {
  const g = useRef<THREE.Group>(null)
  const sheet = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const k = THREE.MathUtils.clamp(progress.current - index, 0, 1)
    const e = smooth(k)
    if (g.current) {
      g.current.visible = k > 0.001
      g.current.position.y = 0.02 + index * GAP * e
      g.current.scale.setScalar(0.6 + 0.4 * e)
    }
    if (sheet.current) {
      const m = sheet.current.material as THREE.MeshBasicMaterial
      // the plate that is landing right now flares
      m.opacity = 0.05 + (1 - Math.abs(k - 0.5) * 2) * 0.16 * (k < 1 ? 1 : 0) + (k >= 1 ? 0.03 : 0)
    }
  })
  return (
    <group ref={g}>
      {/* a hairline rim, not a filled sheet: ten stacked translucent planes just read as one slab */}
      <mesh ref={sheet} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.001, 0.002, 4]} />
        <meshBasicMaterial color={tint} transparent opacity={0} depthWrite={false} />
      </mesh>
      <lineSegments rotation-x={-Math.PI / 2}>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.16, 0.86)]} />
        <lineBasicMaterial color={tint} transparent opacity={0.16} />
      </lineSegments>
      {children}
    </group>
  )
}

function loopGeometry(pts: [number, number][]) {
  return new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p[0], 0, p[1])))
}

export function Go2Tomographic() {
  const { progress } = useAssembly()

  /** Section through the facility at height h: walls always, objects only while they are still tall. */
  const plates = useMemo(
    () =>
      Array.from({ length: PLATES }, (_, i) => {
  const h = (i / (PLATES - 1)) * 0.3
        const walls = new THREE.BufferGeometry().setFromPoints(
          WALLS.flatMap((w) => [new THREE.Vector3(w.a[0], 0, w.a[1]), new THREE.Vector3(w.b[0], 0, w.b[1])]),
        )
        const objects = DETECTIONS.filter((d) => d.y >= h)
        return { h, walls, objects, floor: i === 0 }
      }),
    [],
  )

  return (
    <group>
      {plates.map((p, i) => (
        <Plate key={i} index={i} progress={progress}>
          {p.floor &&
            ROOMS.map((r) => (
              <mesh key={r.id} position={[r.x, 0.001, r.z]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[r.w - 0.02, r.d - 0.02]} />
                <meshBasicMaterial color={ACCENT} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            ))}
          <lineSegments geometry={p.walls}>
            <lineBasicMaterial color={i === 0 ? WHITE : CYAN} transparent opacity={i === 0 ? 0.95 : 0.62 - (i / PLATES) * 0.3} />
          </lineSegments>
          {p.objects.map((d, k) => (
            <mesh key={k} position={[d.p[0], 0.001, d.p[1]]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.022, 0.028, 18]} />
              <meshBasicMaterial color={ACCENT} transparent opacity={0.85} toneMapped={false} />
            </mesh>
          ))}
        </Plate>
      ))}
      {/* the finished volume gets its labels once the stack is up */}
      {ROOMS.map((r) => (
        <Tag key={r.id} text={r.id} position={[r.x, 0.6, r.z]} width={0.15} size={30} color={CYAN} bg="rgba(6,10,16,0.7)" />
      ))}
      <Tag text={`${PLATES} sections · 0 → 3.0 m`} position={[0, -0.05, 0.44]} width={0.32} size={30} color={WHITE} bg="rgba(0,0,0,0)" />
    </group>
  )
}

export function OliveTomographic() {
  const { progress } = useAssembly(10)
  // <line> in JSX resolves to the SVG element, so the closure edge is built as a plain object
  const closureMat = useMemo(() => new THREE.LineBasicMaterial({ color: FACTOR_COLOR.loop, transparent: true, opacity: 0 }), [])
  const at = (id: number | string): [number, number] => (typeof id === 'number' ? KEYFRAMES[id].p : LANDMARKS[+String(id).slice(1)])

  /** Each plate is a slab of elapsed time: the keyframes and factors added during that window. */
  const plates = useMemo(() => {
    const per = Math.ceil(KEYFRAMES.length / PLATES)
    return Array.from({ length: PLATES }, (_, i) => {
      const lo = i * per
      const hi = Math.min(KEYFRAMES.length, lo + per + 1)
      const nodes = KEYFRAMES.slice(lo, hi)
      const byKind = new Map<string, THREE.Vector3[]>()
      for (const f of FACTORS) {
        if (typeof f.from !== 'number' || f.from < lo || f.from >= hi) continue
        if (f.kind === 'loop') continue
        const a = at(f.from)
        const b = at(f.to)
        const list = byKind.get(f.kind) ?? []
        list.push(new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(b[0], 0, b[1]))
        byKind.set(f.kind, list)
      }
      const edges = [...byKind.entries()].map(([kind, pts]) => ({ kind, geometry: new THREE.BufferGeometry().setFromPoints(pts) }))
      return { nodes, edges, lo }
    })
  }, [])

  const closure = useMemo(() => {
    const a = KEYFRAMES[KEYFRAMES.length - 1].p
    const b = KEYFRAMES[0].p
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], 0.02 + (PLATES - 1) * GAP, a[1]), new THREE.Vector3(b[0], 0.02, b[1])])
    return new THREE.Line(g, closureMat)
  }, [closureMat])

  useFrame(() => {
    const done = progress.current >= PLATES - 0.2
    closure.visible = done
    closureMat.opacity = done ? 0.9 : 0
  })

  return (
    <group>
      {plates.map((p, i) => (
        <Plate key={i} index={i} progress={progress} tint={ACCENT}>
          {p.edges.map((e) => (
            <lineSegments key={e.kind} geometry={e.geometry}>
              <lineBasicMaterial color={FACTOR_COLOR[e.kind as keyof typeof FACTOR_COLOR]} transparent opacity={0.75} />
            </lineSegments>
          ))}
          {p.nodes.map((k, j) => (
            <mesh key={j} position={[k.p[0], 0.002, k.p[1]]}>
              <sphereGeometry args={[0.011, 10, 8]} />
              <meshBasicMaterial color={WHITE} toneMapped={false} />
            </mesh>
          ))}
          {i % 4 === 0 && <Tag text={`t+${(p.lo * 2.2).toFixed(0)}s`} position={[-0.62, 0.01, 0]} width={0.14} size={28} color={ACCENT} bg="rgba(0,0,0,0)" />}
        </Plate>
      ))}
      <primitive object={closure} />
      {LANDMARKS.map((l, i) => (
        <mesh key={i} position={[l[0], 0.02 + ((PLATES - 1) * GAP) / 2, l[1]]}>
          <cylinderGeometry args={[0.006, 0.006, (PLATES - 1) * GAP, 6]} />
          <meshBasicMaterial color={FACTOR_COLOR.fiducial} transparent opacity={0.4} />
        </mesh>
      ))}
      <Tag text="loop closure links t+0 to t+57s" position={[0, 0.66, 0]} width={0.4} size={30} color={LIME} bg="rgba(6,10,16,0.7)" />
      <Tag text="vertical axis = elapsed time" position={[0, -0.05, 0.44]} width={0.34} size={30} color={WHITE} bg="rgba(0,0,0,0)" />
    </group>
  )
}
