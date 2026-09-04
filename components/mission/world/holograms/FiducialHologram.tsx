'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, Beam, CYAN, Frustum, LabelPlate, MUTED, WHITE, fiducialTexture, smooth, useHoloClock, useHoloMaterial, useLineObject, type V3 } from './parts'

const MARKERS: { pos: V3; rot: number; id: number; spin: number }[] = [
  { pos: [-0.42, 0.42, -0.25], rot: 0.5, id: 0b101101011010, spin: 0.25 },
  { pos: [0.05, 0.55, -0.42], rot: 0.1, id: 0b110010110101, spin: -0.18 },
  { pos: [0.45, 0.38, -0.2], rot: -0.6, id: 0b011101100110, spin: 0.32 },
]
const CAM: V3 = [0, 0.72, 0.55]

/** WhyCode: three fiducials, a camera tracking them with 6-DOF axes, and the CPU bar dropping from 180 % to 15 %. */
export function FiducialHologram() {
  const t = useHoloClock()
  const textures = useMemo(() => MARKERS.map((m) => fiducialTexture(m.id)), [])
  const axes = useLineObject(
    useMemo(() => MARKERS.flatMap((m) => [m.pos, [m.pos[0] + 0.12, m.pos[1], m.pos[2]], m.pos, [m.pos[0], m.pos[1] + 0.12, m.pos[2]], m.pos, [m.pos[0], m.pos[1], m.pos[2] + 0.12]] as V3[]), []),
    WHITE,
    0.7,
    'segments',
  )
  const barAfter = useRef<THREE.Mesh>(null)
  const beforeMat = useHoloMaterial(MUTED, 0.9)
  const afterMat = useHoloMaterial(ACCENT, 1)
  const camMat = useHoloMaterial(WHITE, 0.9)
  const markerMats = useMemo(() => textures.map((tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, side: THREE.DoubleSide })), [textures])
  const markerRefs = useRef<(THREE.Mesh | null)[]>([])
  const cpuLabel = useRef(0)

  useFrame(() => {
    const u = (t.current % 6) / 6
    const k = smooth((u - 0.25) / 0.5)
    const hAfter = 0.54 - k * (0.54 - 0.045)
    if (barAfter.current) {
      barAfter.current.scale.y = hAfter
      barAfter.current.position.y = hAfter / 2
    }
    cpuLabel.current = k
    markerRefs.current.forEach((m, i) => {
      if (m) m.rotation.y = MARKERS[i].rot + Math.sin(t.current * MARKERS[i].spin) * 0.35
    })
  })

  return (
    <group>
      {MARKERS.map((m, i) => (
        <group key={i}>
          <mesh ref={(el) => { markerRefs.current[i] = el }} position={m.pos} rotation={[0, m.rot, 0]} material={markerMats[i]}>
            <circleGeometry args={[0.13, 32]} />
          </mesh>
          <LabelPlate text={`ID ${(m.id & 63) + 4} · 6-DOF`} position={[m.pos[0], m.pos[1] + 0.2, m.pos[2]]} width={0.26} color={CYAN} />
          <Beam from={CAM} to={m.pos} color={CYAN} speed={0.7 + i * 0.15} />
        </group>
      ))}
      <primitive object={axes} />
      {/* camera body + frustum */}
      <group position={CAM} rotation={[-0.25, 0, 0]}>
        <mesh position={[0, 0, 0.05]} material={camMat}>
          <boxGeometry args={[0.1, 0.06, 0.08]} />
        </mesh>
        <mesh position={[0, 0, -0.005]} rotation={[Math.PI / 2, 0, 0]} material={camMat}>
          <cylinderGeometry args={[0.02, 0.024, 0.03, 16]} />
        </mesh>
        <Frustum fov={60} aspect={1.33} far={0.5} color={WHITE} opacity={0.6} />
      </group>
      <LabelPlate text="640×480 · AVX-512 · hysteresis IDs" position={[0, 1.02, 0.5]} width={0.62} color={MUTED} />
      {/* CPU bars: legacy vs optimised */}
      <group position={[0.55, 0, 0.35]}>
        <mesh position={[-0.06, 0.27, 0]} material={beforeMat}>
          <boxGeometry args={[0.06, 0.54, 0.06]} />
        </mesh>
        <mesh ref={barAfter} position={[0.06, 0.27, 0]} material={afterMat}>
          <boxGeometry args={[0.06, 1, 0.06]} />
        </mesh>
        <LabelPlate text="CPU 180%" position={[-0.06, 0.62, 0]} width={0.2} color={MUTED} />
        <LabelPlate text="→ 15%" position={[0.08, 0.62, 0]} width={0.16} color={ACCENT} />
      </group>
    </group>
  )
}
