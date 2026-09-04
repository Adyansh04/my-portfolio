'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { asset } from '@/lib/base-path'
import type { RobotDef, RobotLink } from '@/lib/mission/robots'

export type JointValues = Record<string, number>
type Registry = Map<string, { group: THREE.Group; axis: THREE.Vector3 }>

/** URDF rpy = fixed-axis roll, pitch, yaw  →  three.js Euler order 'ZYX'. */
const rpy = (r: [number, number, number]) => new THREE.Euler(r[0], r[1], r[2], 'ZYX')

const DRACO = asset('/draco/')

function LinkMesh({ url, link, material }: { url: string; link: RobotLink; material: THREE.Material }) {
  const gltf = useGLTF(url, DRACO)
  const geometry = useMemo(() => {
    let g: THREE.BufferGeometry | undefined
    gltf.scene.traverse((o) => {
      if (!g && (o as THREE.Mesh).isMesh) g = (o as THREE.Mesh).geometry
    })
    if (g && !g.attributes.normal) g.computeVertexNormals()
    return g
  }, [gltf])
  if (!geometry) return null
  return <mesh geometry={geometry} material={material} position={link.meshXyz} rotation={rpy(link.meshRpy)} scale={link.meshScale} />
}

type MaterialFor = (link: RobotLink) => THREE.Material

function LinkNode({ link, byParent, folder, material, materialFor, registry }: { link: RobotLink; byParent: Map<string, RobotLink[]>; folder: string; material: THREE.Material; materialFor?: MaterialFor; registry: Registry }) {
  const j = link.joint
  const children = byParent.get(link.name) ?? []
  const axis = useMemo(() => (j ? new THREE.Vector3(...j.axis).normalize() : new THREE.Vector3(0, 0, 1)), [j])
  const register = (g: THREE.Group | null) => {
    if (!j || j.type === 'fixed') return
    if (g) registry.set(j.name, { group: g, axis })
    else registry.delete(j.name)
  }
  const body = (
    <group ref={register}>
      {link.mesh && <LinkMesh url={`${folder}/${link.mesh}`} link={link} material={materialFor ? materialFor(link) : material} />}
      {children.map((c) => (
        <LinkNode key={c.name} link={c} byParent={byParent} folder={folder} material={material} materialFor={materialFor} registry={registry} />
      ))}
    </group>
  )
  return j ? (
    <group position={j.xyz} rotation={rpy(j.rpy)}>
      {body}
    </group>
  ) : (
    body
  )
}

/**
 * Data-driven robot: nested groups from a URDF-derived link tree, one GLB per link.
 * Rendered in the URDF's own Z-up frame; wrap it in <group rotation={[-Math.PI/2,0,0]}> for Y-up scenes.
 * `joints.current[jointName]` (radians) is applied every frame.
 */
export function ArticulatedRobot({
  def,
  folder,
  joints,
  material,
  materialFor,
  probe,
}: {
  def: RobotDef
  folder: string
  joints: MutableRefObject<JointValues>
  material: THREE.Material
  /** per-link material (real-world palette); falls back to `material` */
  materialFor?: MaterialFor
  /** receives the rotating group of the named joint (e.g. the wrist) so callers can read its world transform */
  probe?: { joint: string; ref: MutableRefObject<THREE.Group | null> }
}) {
  const registry = useRef<Registry>(new Map()).current
  const byParent = useMemo(() => {
    const m = new Map<string, RobotLink[]>()
    for (const l of def.links) if (l.parent) m.set(l.parent, [...(m.get(l.parent) ?? []), l])
    return m
  }, [def])
  const root = def.links.find((l) => l.name === def.root)!

  useFrame(() => {
    const values = joints.current
    registry.forEach((entry, name) => {
      const v = values[name]
      if (v !== undefined) entry.group.quaternion.setFromAxisAngle(entry.axis, v)
    })
    if (probe) probe.ref.current = registry.get(probe.joint)?.group ?? null
  })

  return <LinkNode link={root} byParent={byParent} folder={folder} material={material} materialFor={materialFor} registry={registry} />
}

export function preloadRobot(def: RobotDef, folder: string) {
  for (const l of def.links) if (l.mesh) useGLTF.preload(`${folder}/${l.mesh}`, DRACO)
}
