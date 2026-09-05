'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Ambience } from '../../Ambience'
import { PostFx } from '../../PostFx'
import { ContactShadow } from '../../ContactShadow'
import { makeLabelTexture } from '../../labels'
import { Go2ScaleModel, OliveScaleModel } from './S1ScaleModel'
import { Go2PointCloud, OlivePointCloud } from './S2PointCloud'
import { Go2Blueprint, OliveBlueprint } from './S3Blueprint'
import { Go2Tomographic, OliveTomographic } from './S4Tomographic'
import { Go2Volumetric, OliveVolumetric } from './S5Volumetric'

/** Five styles × two projects, on real pedestals under the site's own lighting and bloom. */
export const STYLES = [
  { id: 's1', name: 'Scale Model', blurb: 'Machined plate, opaque miniature, glass case. An object in the room, not a projection.' },
  { id: 's2', name: 'Volumetric Capture', blurb: 'Tens of thousands of scanned returns, height-coloured, assembled by a sweeping plane.' },
  { id: 's3', name: 'Engineering Drawing', blurb: 'A plotted sheet: hatched walls, dimensions, legend, title block. Precision instead of glow.' },
  { id: 's4', name: 'Tomographic Stack', blurb: 'Cross-sections rising into place. Height reads as height, or as elapsed time.' },
  { id: 's5', name: 'Volumetric Projection', blurb: 'A real light cone, extruded volume, interference scanlines, annotation cards.' },
] as const

export const PROJECTS = [
  { id: 'go2', name: 'Go2 Autonomous Inspection' },
  { id: 'olive', name: 'OLIVE Factor Graph' },
] as const

/** each entry also carries how tall its content stands, so the focus shot frames it properly */
const CONTENT: Record<string, { C: () => ReactNode; h: number }> = {
  'go2-s1': { C: Go2ScaleModel, h: 0.3 },
  'go2-s2': { C: Go2PointCloud, h: 0.2 },
  'go2-s3': { C: Go2Blueprint, h: 0.46 },
  'go2-s4': { C: Go2Tomographic, h: 0.34 },
  'go2-s5': { C: Go2Volumetric, h: 0.38 },
  'olive-s1': { C: OliveScaleModel, h: 0.22 },
  'olive-s2': { C: OlivePointCloud, h: 0.2 },
  'olive-s3': { C: OliveBlueprint, h: 0.46 },
  'olive-s4': { C: OliveTomographic, h: 0.34 },
  'olive-s5': { C: OliveVolumetric, h: 0.4 },
}

const COL = 3.1
const ROW = 3.0
/** Go2 in the near row, OLIVE behind it — +z is toward the default camera. */
const cellAt = (si: number, pi: number): [number, number] => [(si - (STYLES.length - 1) / 2) * COL, (0.5 - pi) * ROW]

/** The project pedestal from the real world, minus its mission-store wiring. */
function Pedestal({ label, sub }: { label: string; sub: string }) {
  const plate = useMemo(() => {
    const tex = makeLabelTexture(
      [{ text: label, size: 46, color: '#e9eef3', font: '700' }, { text: sub, size: 30, color: '#8a94a6' }],
      { w: 768, h: 160, bg: 'rgba(10,15,22,0.9)', pad: 20, align: 'center' },
    )
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
  }, [label, sub])
  return (
    <group>
      <ContactShadow radius={0.95} opacity={0.6} />
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.62, 0.7, 0.9, 32]} />
        <meshStandardMaterial color="#161d26" roughness={0.72} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.905, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.5, 0.62, 44]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.55, 0.705]} material={plate}>
        <planeGeometry args={[1.0, 1.0 * (160 / 768)]} />
      </mesh>
    </group>
  )
}

function Stage() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
        <planeGeometry args={[40, 26]} />
        <meshStandardMaterial color="#1b2430" roughness={0.7} metalness={0.25} />
      </mesh>
      <gridHelper args={[40, 80, '#2f3d4f', '#232e3c']} position={[0, 0.002, 0]} />
      <mesh position={[0, 3, -7.5]}>
        <planeGeometry args={[40, 8]} />
        <meshStandardMaterial color="#212b38" roughness={0.85} metalness={0.1} />
      </mesh>
    </group>
  )
}

/** Eases the orbit target and distance toward whichever cell is focused. */
function Rig({ focus }: { focus: string | null }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree((s) => s.camera)
  const want = useMemo(() => {
    if (!focus) return { target: new THREE.Vector3(0, 0.9, 0), pos: new THREE.Vector3(0, 7.4, 11.5) }
    const [pi, si] = [PROJECTS.findIndex((p) => focus.startsWith(p.id)), STYLES.findIndex((s) => focus.endsWith(s.id))]
    const [x, z] = cellAt(Math.max(0, si), Math.max(0, pi))
    const h = 0.92 + (CONTENT[focus]?.h ?? 0.3)
    return { target: new THREE.Vector3(x, h, z), pos: new THREE.Vector3(x + 0.1, h + 1.05, z + 2.15) }
  }, [focus])
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-Math.min(0.05, dt || 0.016) * 3.2)
    camera.position.lerp(want.pos, k)
    const c = controls.current
    if (c) {
      c.target.lerp(want.target, k)
      c.update()
    }
  })
  return <OrbitControls ref={controls} enablePan makeDefault />
}

export function LabGallery() {
  const [focus, setFocus] = useState<string | null>(null)

  useEffect(() => {
    const f = new URLSearchParams(location.search).get('focus')
    if (f && CONTENT[f]) setFocus(f)
    ;(window as unknown as { __focus?: (k: string | null) => void }).__focus = setFocus
    // full-resolution grabs of the canvas alone, for putting the styles side by side
    ;(window as unknown as { __grab?: () => string }).__grab = () => (document.querySelector('canvas') as HTMLCanvasElement).toDataURL('image/jpeg', 0.9)
  }, [])

  return (
    <div className="fixed inset-0 bg-ground">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.15 }}
        camera={{ fov: 45, near: 0.1, far: 120, position: [0, 7.4, 11.5] }}
      >
        <color attach="background" args={['#0b0f14']} />
        <fogExp2 attach="fog" args={['#101722', 0.012]} />
        <Ambience />
        <PostFx />
        <hemisphereLight args={['#4a6488', '#131a24', 1.2]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[8, 12, 6]} intensity={0.85} color="#dbe7ff" />
        <directionalLight position={[-10, 8, -6]} intensity={0.3} color="#8fb4ff" />
        <Stage />
        <Rig focus={focus} />
        {PROJECTS.map((p, pi) =>
          STYLES.map((s, si) => {
            const key = `${p.id}-${s.id}`
            const Content = CONTENT[key].C
            const [x, z] = cellAt(si, pi)
            return (
              <group key={key} position={[x, 0, z]}>
                <Pedestal label={s.name} sub={p.name} />
                <group position={[0, 0.92, 0]} scale={0.92}>
                  <Suspense fallback={null}>
                    <Content />
                  </Suspense>
                </group>
              </group>
            )
          }),
        )}
      </Canvas>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex flex-col gap-2 p-5">
        <div className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">Hologram style study · 5 styles × 2 projects</div>
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          <button onClick={() => setFocus(null)} className={`rounded-sm border px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.1em] transition ${focus === null ? 'border-accent bg-accent/15 text-accent' : 'border-grid bg-ground/85 text-muted hover:text-text'}`}>
            ALL
          </button>
          {PROJECTS.map((p) =>
            STYLES.map((s) => {
              const key = `${p.id}-${s.id}`
              return (
                <button
                  key={key}
                  onClick={() => setFocus(key)}
                  className={`rounded-sm border px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.1em] transition ${focus === key ? 'border-accent bg-accent/15 text-accent' : 'border-grid bg-ground/85 text-muted hover:text-text'}`}
                >
                  {s.id.toUpperCase()} · {p.id}
                </button>
              )
            }),
          )}
        </div>
      </div>

      <div className="pointer-events-none fixed left-5 top-28 z-10">
        <div className="max-w-[24rem] rounded-md border border-grid bg-ground/90 p-4 backdrop-blur-xl">
          {focus ? (
            <>
              <div className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-accent">{STYLES.find((s) => focus.endsWith(s.id))?.name}</div>
              <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">{STYLES.find((s) => focus.endsWith(s.id))?.blurb}</p>
            </>
          ) : (
            <p className="text-[0.875rem] leading-relaxed text-muted">
              Near row: <span className="text-text">Go2 Autonomous Inspection</span>. Far row: <span className="text-text">OLIVE factor graph</span>. Same subject in every column, five different visual languages. Drag to orbit, scroll to zoom, or pick a cell above.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
