'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Ambience } from '../../Ambience'
import { PostFx } from '../../PostFx'
import { ContactShadow } from '../../ContactShadow'
import { DebugHook } from '../../DebugHook'
import { makeLabelTexture } from '../../labels'
import { TALL_FORMS } from './contentTall'
import { LiveScene } from './LiveScene'
import { VERTICAL_DEMOS } from './verticalDemos'
import { SLAB_DESIGNS, type SlabDesign } from '../slab/slabContent'

/**
 * Previews every concept from the shot it actually has to survive: the hall rig sits at
 * (+4.2, 3.5, +6.1) from the pedestal and looks at (+1.1, 0.8, +1.15) — 7.4 m out and angled down.
 * Judging these from a hero close-up is what let a flat plate through.
 */
const CAM_OFFSET = new THREE.Vector3(4.2, 3.5, 6.1)
const LOOK_OFFSET = new THREE.Vector3(1.1, 0.8, 1.15)
const SPACING = 4.4
const ROW = 5.0
const PROJECTS = [{ key: 'go2-inspection', name: 'Go2 Inspection' }] as const
const DETECTIONS: Record<string, string[]> = {
  'go2-inspection': ['fire extinguisher', 'pallet stack', 'office chair', 'toolbox', 'shelving unit', 'cable drum'],
  olive: ['WhyCode L0', 'WhyCode L1', 'WhyCode L2'],
}
const LIVE = { id: 't0', name: 'Live Scene', blurb: 'The project actually running: the real robot working a real environment, with the map and detections assembling in the column above it.', C: ({ design, projectKey }: { design: SlabDesign; projectKey: string }) => <LiveScene design={design} detections={DETECTIONS[projectKey] ?? []} /> }
const FORMS = [...VERTICAL_DEMOS, LIVE] as const
const CELLS = PROJECTS.flatMap((p, pi) => FORMS.map((f, fi) => ({ p, f, pi, fi, key: `${f.id}-${p.key}` })))

function Pedestal({ label }: { label: string }) {
  const plate = useMemo(() => {
    const tex = makeLabelTexture([{ text: label, size: 44, color: '#e9eef3', font: '700' }], { w: 640, h: 96, bg: 'rgba(10,15,22,0.9)', pad: 16, align: 'center' })
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
  }, [label])
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
        <planeGeometry args={[1.0, 1.0 * (96 / 640)]} />
      </mesh>
    </group>
  )
}

/** Enough of the hall to judge contrast honestly: dark floor, lane lines, a wall of racking. */
function HallContext() {
  const lanes = useMemo(() => {
    const g: THREE.BufferGeometry[] = []
    for (let i = -2; i <= 2; i++) {
      const p = new THREE.PlaneGeometry(60, 0.06)
      p.rotateX(-Math.PI / 2)
      p.translate(0, 0.014, i * 2.6)
      g.push(p)
    }
    return g
  }, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#222b37" roughness={0.62} metalness={0.3} />
      </mesh>
      {lanes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color="#ff7a1a" transparent opacity={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, -5.5]}>
        <boxGeometry args={[70, 2.6, 0.5]} />
        <meshStandardMaterial color="#2b3542" roughness={0.85} metalness={0.15} />
      </mesh>
    </group>
  )
}

function Rig({ focus }: { focus: number | null }) {
  const camera = useThree((s) => s.camera)
  const want = useMemo(() => {
    if (focus === null) {
      const mid = ((FORMS.length - 1) / 2) * SPACING
      return { pos: new THREE.Vector3(mid, 10, 18), look: new THREE.Vector3(mid, 1.4, -ROW / 2) }
    }
    const c = CELLS[focus]
    const base = new THREE.Vector3(c.fi * SPACING, 0, -c.pi * ROW)
    return { pos: base.clone().add(CAM_OFFSET), look: base.clone().add(LOOK_OFFSET) }
  }, [focus])
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-Math.min(0.05, dt || 0.016) * 3)
    camera.position.lerp(want.pos, k)
    camera.lookAt(want.look)
  })
  return null
}

export function TallGallery() {
  const [focus, setFocus] = useState<number | null>(0)
  useEffect(() => {
    const f = new URLSearchParams(location.search).get('focus')
    if (f !== null) setFocus(f === 'all' ? null : Number(f))
    ;(window as unknown as { __focus?: (n: number | null) => void }).__focus = setFocus
    ;(window as unknown as { __grab?: () => string }).__grab = () => (document.querySelector('canvas') as HTMLCanvasElement).toDataURL('image/jpeg', 0.9)
  }, [])

  return (
    <div className="fixed inset-0 bg-ground">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.15 }}
        camera={{ fov: 50, near: 0.1, far: 160 }}
      >
        <color attach="background" args={['#0b0f14']} />
        <fogExp2 attach="fog" args={['#101722', 0.0125]} />
        <DebugHook />
        <Ambience />
        <PostFx />
        <hemisphereLight args={['#4a6488', '#131a24', 1.2]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 18, 6]} intensity={0.85} color="#dbe7ff" />
        <HallContext />
        <Rig focus={focus} />
        {CELLS.map((c) => (
          <group key={c.key} position={[c.fi * SPACING, 0, -c.pi * ROW]}>
            <Pedestal label={`${c.f.name} · ${c.p.name}`} />
            <group position={[0, 0.905, 0]} scale={1.2}>
              <c.f.C design={SLAB_DESIGNS[c.p.key]} projectKey={c.p.key} />
            </group>
          </group>
        ))}
      </Canvas>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex flex-col gap-2 p-5">
        <div className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">Tall hologram concepts · shown from the real hall camera (7.4 m out, 3.5 m up)</div>
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          <button onClick={() => setFocus(null)} className={`rounded-sm border px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.1em] transition ${focus === null ? 'border-accent bg-accent/15 text-accent' : 'border-grid bg-ground/85 text-muted hover:text-text'}`}>ALL</button>
          {CELLS.map((c, i) => (
            <button key={c.key} onClick={() => setFocus(i)} className={`rounded-sm border px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.1em] transition ${focus === i ? 'border-accent bg-accent/15 text-accent' : 'border-grid bg-ground/85 text-muted hover:text-text'}`}>
              {c.f.id.toUpperCase()} · {c.p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none fixed left-5 bottom-5 z-10 max-w-[26rem] rounded-md border border-grid bg-ground/90 p-4 backdrop-blur-xl">
        {focus === null ? (
          <p className="text-[0.875rem] leading-relaxed text-muted">Three forms, each generated from the project's own data, shown on two different projects. Pick a cell to see it from the shot it has to survive.</p>
        ) : (
          <>
            <div className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-accent">{CELLS[focus].f.name} · {CELLS[focus].p.name}</div>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">{CELLS[focus].f.blurb}</p>
          </>
        )}
      </div>
    </div>
  )
}
