'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CrazyflieDrone } from '../robots/CrazyflieDrone'
import { ACCENT, Arena, CYAN, GridPlane, LabelPlate, MUTED, MotionTrail, WHITE, useHoloClock, useHoloMaterial, useLineObject, type V3 } from './parts'

const N = 10
const CELL = 0.11
const ROOM = 0.62 // half-size of the mini room the multiranger sees
const TAGS: V3[] = [[0.45, 0.01, 0.45], [-0.45, 0.01, 0.4], [0.4, 0.01, -0.45]]

function arucoTexture(seed: number) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#e9eef3'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = '#0b0f14'
  ctx.fillRect(8, 8, 48, 48)
  let s = seed
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      if (s & 1) {
        ctx.fillStyle = '#e9eef3'
        ctx.fillRect(16 + x * 8, 16 + y * 8, 8, 8)
      }
    }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = THREE.NearestFilter
  return t
}

/** Drone systems: Crazyflie with multiranger rays hitting the room walls while its SLAM grid grows; Tello orbiting and reading ArUco tags. */
export function DroneHologram() {
  const t = useHoloClock()
  const cellMat = useHoloMaterial(MUTED, 0.8)
  const telloMat = useHoloMaterial(ACCENT, 1)
  const cells = useRef<THREE.InstancedMesh>(null)
  const tello = useRef<THREE.Group>(null)
  const cfProxy = useRef<THREE.Group>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const rays = useLineObject(useMemo(() => Array.from({ length: 8 }, () => [0, 0, 0] as V3), []), CYAN, 0.6, 'segments')
  const hits = useRef<THREE.InstancedMesh>(null)
  const hitMat = useHoloMaterial(CYAN, 1)
  const scan = useLineObject(useMemo(() => [[0, 0, 0], [0, -0.5, 0]] as V3[], []), WHITE, 0.6, 'segments')
  const tagMats = useMemo(() => TAGS.map((_, i) => new THREE.MeshBasicMaterial({ map: arucoTexture(11 + i * 7), transparent: true, opacity: 0.95 })), [])
  const tagLabels = useRef<(THREE.Group | null)[]>([])
  const order = useMemo(() => {
    const idx = Array.from({ length: N * N }, (_, i) => i)
    return idx.sort((a, b) => Math.hypot((a % N) - N / 2 + 0.5, Math.floor(a / N) - N / 2 + 0.5) - Math.hypot((b % N) - N / 2 + 0.5, Math.floor(b / N) - N / 2 + 0.5))
  }, [])

  useFrame(() => {
    const u = (t.current % 9) / 9
    const m = cells.current
    if (m) {
      const shown = Math.floor(u * N * N)
      order.forEach((ci, rank) => {
        tmp.position.set(((ci % N) - N / 2 + 0.5) * CELL, 0.005, (Math.floor(ci / N) - N / 2 + 0.5) * CELL)
        tmp.scale.setScalar(rank < shown ? 1 : 0.001)
        tmp.updateMatrix()
        m.setMatrixAt(ci, tmp.matrix)
      })
      m.instanceMatrix.needsUpdate = true
    }
    // crazyflie drifts; the four multiranger rays end at the room walls
    const cx = Math.sin(t.current * 0.7) * 0.12, cz = Math.cos(t.current * 0.5) * 0.12, cy = 0.9 + Math.sin(t.current * 1.9) * 0.05
    const pos = rays.geometry.attributes.position as THREE.BufferAttribute
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    dirs.forEach(([dx, dz], i) => {
      const len = dx !== 0 ? (ROOM - dx * cx) : (ROOM - dz * cz)
      pos.setXYZ(i * 2, cx, cy, cz)
      pos.setXYZ(i * 2 + 1, cx + dx * len, cy, cz + dz * len)
      if (hits.current) {
        tmp.position.set(cx + dx * len, cy, cz + dz * len)
        tmp.scale.setScalar(1 + Math.sin(t.current * 8 + i) * 0.3)
        tmp.updateMatrix()
        hits.current.setMatrixAt(i, tmp.matrix)
      }
    })
    pos.needsUpdate = true
    if (hits.current) hits.current.instanceMatrix.needsUpdate = true
    if (tello.current) {
      const a = t.current * 0.8
      tello.current.position.set(Math.cos(a) * 0.5, 0.5 + Math.sin(a * 2) * 0.04, Math.sin(a) * 0.5)
      tello.current.rotation.set(0, -a, 0)
      const p = scan.geometry.attributes.position as THREE.BufferAttribute
      p.setXYZ(0, tello.current.position.x, tello.current.position.y, tello.current.position.z)
      p.setXYZ(1, tello.current.position.x * 0.9, 0.02, tello.current.position.z * 0.9)
      p.needsUpdate = true
      TAGS.forEach((tag, i) => {
        const l = tagLabels.current[i]
        if (l) l.visible = Math.hypot(tello.current!.position.x - tag[0], tello.current!.position.z - tag[2]) < 0.28
      })
    }
  })

  return (
    <group>
      <GridPlane w={N * CELL} h={N * CELL} step={CELL} opacity={0.15} />
      <Arena w={ROOM * 2} d={ROOM * 2} h={0.25} color={MUTED} opacity={0.5} />
      <instancedMesh ref={cells} args={[undefined, undefined, N * N]} material={cellMat}>
        <planeGeometry args={[CELL * 0.85, CELL * 0.85]} />
      </instancedMesh>
      <primitive object={rays} />
      <instancedMesh ref={hits} args={[undefined, undefined, 4]} material={hitMat}>
        <sphereGeometry args={[0.014, 8, 8]} />
      </instancedMesh>
      <group ref={cfProxy}>
        <CrazyflieDrone scale={2.4} height={0.9} />
      </group>
      <LabelPlate text="Crazyflie · Flow + MultiRanger · SLAM Toolbox" position={[0, 1.22, 0]} width={0.74} color={MUTED} />
      <MotionTrail target={tello} color={ACCENT} length={70} opacity={0.4} y={0.5} />
      <group ref={tello}>
        <mesh material={telloMat}>
          <boxGeometry args={[0.16, 0.02, 0.03]} />
        </mesh>
        <mesh material={telloMat} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.16, 0.02, 0.03]} />
        </mesh>
        {[[0.07, 0.07], [0.07, -0.07], [-0.07, 0.07], [-0.07, -0.07]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.015, z]} rotation-x={-Math.PI / 2} material={telloMat}>
            <ringGeometry args={[0.02, 0.035, 12]} />
          </mesh>
        ))}
      </group>
      <primitive object={scan} />
      {TAGS.map((tag, i) => (
        <group key={i}>
          <mesh position={tag} rotation-x={-Math.PI / 2} material={tagMats[i]}>
            <planeGeometry args={[0.12, 0.12]} />
          </mesh>
          <group ref={(g) => { tagLabels.current[i] = g }}>
            <LabelPlate text={`ArUco ${12 + i * 5} · in stock`} position={[tag[0], 0.16, tag[2]]} width={0.3} color={CYAN} />
          </group>
        </group>
      ))}
    </group>
  )
}
