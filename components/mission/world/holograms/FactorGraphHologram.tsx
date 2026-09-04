'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACCENT, CYAN, LabelPlate, MUTED, WHITE, smooth, useHoloClock, useHoloMaterial, useLineObject, type V3 } from './parts'

const N = 28
const LOOP_S = 9
const loopPoint = (u: number): V3 => {
  const a = u * Math.PI * 2
  const x = Math.sign(Math.cos(a)) * Math.min(0.5, Math.abs(Math.cos(a)) * 0.75)
  const z = Math.sign(Math.sin(a)) * Math.min(0.32, Math.abs(Math.sin(a)) * 0.5)
  return [x, 0.35, z]
}

/** OLIVE: keyframes + odometry edges + landmark factors; the map-frame path drifts and snaps on loop closure, the local path never jumps. */
export function FactorGraphHologram() {
  const t = useHoloClock()
  const nodeMat = useHoloMaterial(WHITE, 1)
  const landmarkMat = useHoloMaterial(ACCENT, 1)
  const covMat = useHoloMaterial(CYAN, 0.9)
  const keyframes = useMemo(() => Array.from({ length: N }, (_, i) => loopPoint(i / N)), [])
  const landmarks = useMemo<V3[]>(() => [[-0.3, 0.78, -0.2], [0.45, 0.72, 0.1], [0.0, 0.84, 0.35]], [])
  const localLine = useLineObject(keyframes, MUTED, 0.8, 'loop')
  const mapPts = useMemo(() => keyframes.map((p) => [...p] as V3), [keyframes])
  const mapLine = useLineObject(mapPts, ACCENT, 0.95, 'loop')
  const obsEdges = useLineObject(useMemo(() => landmarks.flatMap((l, li) => [0, 9, 18].map((k) => [l, keyframes[(k + li * 3) % N]] as [V3, V3]).flat()), [landmarks, keyframes]), ACCENT, 0.35, 'segments')
  const imuArcs = useLineObject(
    useMemo(() => {
      const out: V3[] = []
      for (let i = 0; i < N; i++) {
        const a = keyframes[i], b = keyframes[(i + 1) % N]
        for (let s = 0; s < 6; s++) {
          const u0 = s / 6, u1 = (s + 1) / 6
          const bump = (u: number) => Math.sin(u * Math.PI) * 0.06
          out.push([a[0] + (b[0] - a[0]) * u0, a[1] + bump(u0), a[2] + (b[2] - a[2]) * u0], [a[0] + (b[0] - a[0]) * u1, a[1] + bump(u1), a[2] + (b[2] - a[2]) * u1])
        }
      }
      return out
    }, [keyframes]),
    CYAN,
    0.45,
    'segments',
  )
  const closure = useLineObject(useMemo(() => [keyframes[0], keyframes[N - 1]], [keyframes]), WHITE, 1, 'segments')
  const nodes = useRef<THREE.InstancedMesh>(null)
  const cov = useRef<THREE.Mesh>(null)
  const closureLabel = useRef<THREE.Group>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const u = (t.current % LOOP_S) / LOOP_S
    const drift = u < 0.85 ? u * 0.12 : 0.12 * (1 - smooth((u - 0.85) / 0.1))
    const pos = mapLine.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < N; i++) {
      const d = drift * (i / N)
      pos.setXYZ(i, keyframes[i][0] + d, keyframes[i][1] + d * 0.4, keyframes[i][2] - d * 0.6)
    }
    pos.needsUpdate = true
    const drawn = Math.floor(u * N) + 1
    mapLine.geometry.setDrawRange(0, Math.min(N, drawn + 1))
    imuArcs.geometry.setDrawRange(0, Math.min(N, drawn) * 12)
    closure.visible = u > 0.85
    if (closureLabel.current) closureLabel.current.visible = u > 0.85
    const m = nodes.current
    if (m) {
      for (let i = 0; i < N; i++) {
        const on = i < drawn
        tmp.position.set(pos.getX(i), pos.getY(i), pos.getZ(i))
        tmp.scale.setScalar(on ? (i === drawn - 1 ? 1.6 : 1) : 0.001)
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }
    if (cov.current) {
      const i = Math.min(N - 1, drawn - 1)
      cov.current.position.set(pos.getX(i), pos.getY(i) + 0.005, pos.getZ(i))
      const grow = 0.6 + drift * 6
      cov.current.scale.set(grow, 1, grow * 0.6)
      cov.current.rotation.set(-Math.PI / 2, 0, (i / N) * Math.PI * 2)
    }
  })

  return (
    <group>
      <primitive object={localLine} />
      <primitive object={mapLine} />
      <primitive object={imuArcs} />
      <primitive object={obsEdges} />
      <primitive object={closure} />
      <instancedMesh ref={nodes} args={[undefined, undefined, N]} material={nodeMat}>
        <octahedronGeometry args={[0.022, 0]} />
      </instancedMesh>
      <mesh ref={cov} material={covMat}>
        <ringGeometry args={[0.05, 0.058, 32]} />
      </mesh>
      {landmarks.map((l, i) => (
        <group key={i}>
          <mesh position={l} material={landmarkMat}>
            <octahedronGeometry args={[0.045, 0]} />
          </mesh>
          <LabelPlate text={`whycode ${17 + i * 5}`} position={[l[0], l[1] + 0.11, l[2]]} width={0.26} color={ACCENT} />
        </group>
      ))}
      <group ref={closureLabel}>
        <LabelPlate text="loop closure · ICP" position={[0.55, 0.5, -0.05]} width={0.34} color={WHITE} />
      </group>
      <LabelPlate text="/olive/odometry (map)" position={[-0.05, 1.12, 0]} width={0.46} color={ACCENT} />
      <LabelPlate text="/olive/odometry_local (odom, 50 Hz)" position={[-0.05, 1.26, 0]} width={0.62} color={MUTED} />
      <LabelPlate text="IMU preintegration" position={[0.62, 0.36, 0.36]} width={0.36} color={CYAN} />
    </group>
  )
}
