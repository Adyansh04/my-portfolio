'use client'

import { useCallback, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { UR5eArm, type ArmPhase } from '../robots/UR5eArm'
import { ACCENT, BoxLines, CYAN, Frustum, GridPlane, LabelPlate, MUTED, WHITE, useHoloMaterial } from './parts'

const COLS = 12
const ROWS = 8
const CELL = 0.075
const PICK = new THREE.Vector3(0.32, 0.055, 0.18)
const PLACE = new THREE.Vector3(0.05, 0.055, -0.3)

/** AI+Robotics hackathon: depth camera → NvBlox TSDF voxels on the table, FoundationPose box on the target, mesh subtraction, real pick-and-place. */
export function ArmMeshHologram() {
  const voxels = useRef<THREE.InstancedMesh>(null)
  const cube = useRef<THREE.Mesh>(null)
  const box = useRef<THREE.Group>(null)
  const label = useRef<THREE.Group>(null)
  const voxelMat = useHoloMaterial(MUTED, 0.9)
  const tableMat = useHoloMaterial(WHITE, 0.35)
  const targetMat = useHoloMaterial(CYAN, 1)
  const subtract = useRef(0)
  const heights = useMemo(() => Array.from({ length: COLS * ROWS }, (_, i) => 0.02 + 0.03 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.3))), [])
  const tmp = useMemo(() => new THREE.Object3D(), [])

  const onPhase = useCallback((p: ArmPhase) => {
    const grasping = p.segment >= 1 && p.segment <= 4
    subtract.current += ((grasping ? 1 : 0) - subtract.current) * 0.08
    const carried = p.segment >= 2 && p.segment <= 4
    if (!cube.current) return
    if (carried) cube.current.position.set(p.tcp.x, Math.max(0.055, p.tcp.y - 0.06), p.tcp.z)
    else if (p.segment >= 5) cube.current.position.copy(PLACE)
    else if (p.segment === 0 && p.u < 0.5) cube.current.position.lerp(PICK, 0.1)
    else cube.current.position.copy(PICK)
    if (box.current) {
      box.current.position.copy(cube.current.position)
      box.current.visible = p.segment <= 4
    }
    if (label.current) {
      label.current.position.set(cube.current.position.x, cube.current.position.y + 0.16, cube.current.position.z)
      label.current.visible = p.segment <= 4
    }
  }, [])

  useFrame(() => {
    const m = voxels.current
    if (!m) return
    for (let i = 0; i < COLS * ROWS; i++) {
      const x = ((i % COLS) - COLS / 2 + 0.5) * CELL + 0.1
      const z = (Math.floor(i / COLS) - ROWS / 2 + 0.5) * CELL
      const inside = Math.abs(x - PICK.x) < 0.11 && Math.abs(z - PICK.z) < 0.11
      const s = inside ? 1 - subtract.current : 1
      tmp.position.set(x, heights[i] / 2, z)
      tmp.scale.set(s, (s * heights[i]) / CELL, s)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={[-0.15, 0, 0]}>
      {/* table + TSDF voxels + wire overlay */}
      <mesh position={[0.1, -0.01, 0]} material={tableMat}>
        <boxGeometry args={[COLS * CELL + 0.1, 0.02, ROWS * CELL + 0.1]} />
      </mesh>
      <instancedMesh ref={voxels} args={[undefined, undefined, COLS * ROWS]} material={voxelMat}>
        <boxGeometry args={[CELL * 0.9, CELL, CELL * 0.9]} />
      </instancedMesh>
      <group position={[0.1, 0.055, 0]}>
        <GridPlane w={COLS * CELL} h={ROWS * CELL} step={CELL} color={MUTED} opacity={0.35} />
      </group>
      {/* depth camera above the table */}
      <group position={[0.2, 0.95, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <Frustum fov={58} aspect={1.5} far={0.9} color={CYAN} opacity={0.35} />
      </group>
      <LabelPlate text="NvBlox TSDF mesh" position={[0.42, 0.42, 0.42]} width={0.36} color={MUTED} />
      <mesh ref={cube} position={PICK} material={targetMat}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
      <group ref={box}>
        <BoxLines size={[0.15, 0.15, 0.15]} color={CYAN} opacity={0.9} />
      </group>
      <group ref={label}>
        <LabelPlate text="FoundationPose · 6D · 0.98" position={[0, 0, 0]} width={0.42} color={CYAN} />
      </group>
      <BoxLines size={[0.16, 0.01, 0.16]} position={[PLACE.x, 0.005, PLACE.z]} color={ACCENT} opacity={0.7} />
      <LabelPlate text="place" position={[PLACE.x, 0.1, PLACE.z]} width={0.14} color={ACCENT} />
      <group position={[-0.25, 0, 0]}>
        <UR5eArm scale={0.8} onPhase={onPhase} />
      </group>
    </group>
  )
}
