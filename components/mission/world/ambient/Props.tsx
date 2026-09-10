'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { asset } from '@/lib/base-path'
import { PROPS, type PropKind } from '@/lib/mission/props'

/**
 * The modelled prop kit, placed.
 *
 * `scripts/blender/props.py` exports all seven as named objects in one GLB, so this is one fetch
 * and then one InstancedMesh per kind — a hundred-odd fittings for seven draw calls. They are
 * static, so the matrices are written once on mount and never touched again.
 *
 * Emissive parts (the luminaire lenses, the dock's charge rails) come through the GLB already
 * marked emissive; they are lifted here because glTF emission is authored for a photographic
 * exposure and this scene is graded darker than that.
 */
const URL = asset('/models/props/kit.glb')
const DRACO = asset('/draco/')

/** how far a prop can be from the camera before it stops being worth drawing */
const CULL: Record<PropKind, number> = {
  highbay: 46,
  bollard: 30,
  cabinet: 34,
  extinguisher: 22,
  cabletray: 28,
  railing: 32,
  dock: 30,
}

export function Props() {
  const gltf = useGLTF(URL, DRACO)

  /**
   * Each prop is several materials — painted steel, dark plastic, a lit lens — and glTF splits a
   * multi-material mesh into one primitive per material. So a kind is a *list* of parts, and each
   * part gets its own InstancedMesh sharing the same matrices. Taking only the first primitive is
   * how the first version drew a bollard with no post.
   */
  const kinds = useMemo(() => {
    const byKind = new Map<PropKind, { geometry: THREE.BufferGeometry; material: THREE.Material }[]>()
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      // three names a multi-primitive mesh's children after the mesh datablock with an index
      // suffix, and nests them under a group named after the node; either can carry the kind
      const kind = (m.name || m.parent?.name || '').replace(/[._]\d+$/, '') as PropKind
      if (!PROPS.some((p) => p.kind === kind)) return
      const material = (Array.isArray(m.material) ? m.material[0] : m.material).clone() as THREE.MeshStandardMaterial
      // glTF emission is authored for a photographic exposure; this scene is graded well under one
      if (material.emissive && material.emissive.getHex() !== 0) material.emissiveIntensity = 2.6
      // Blender's viewport is brighter than this grade and the warm bounce lifts bare steel into
      // beige, so the painted and machined finishes come down to sit with the rest of the facility
      if (material.name === 'steel') {
        material.color.multiplyScalar(0.52)
        material.roughness = 0.48
      }
      if (material.name === 'dark') material.color.multiplyScalar(0.8)
      if (material.name === 'paint') material.color.multiplyScalar(0.78)
      byKind.set(kind, [...(byKind.get(kind) ?? []), { geometry: m.geometry, material }])
    })
    return [...byKind.entries()].map(([kind, parts]) => ({
      kind,
      parts,
      count: PROPS.filter((p) => p.kind === kind).length,
    }))
  }, [gltf])

  return (
    <group>
      {kinds.map((k) => (
        <PropSet key={k.kind} {...k} />
      ))}
    </group>
  )
}

function PropSet({ kind, parts, count }: { kind: PropKind; parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[]; count: number }) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([])
  const centre = useMemo(() => {
    const places = PROPS.filter((p) => p.kind === kind)
    const c = new THREE.Vector3()
    places.forEach((p) => c.add(new THREE.Vector3(p.x, 0, p.z)))
    return c.divideScalar(Math.max(1, places.length))
  }, [kind])

  const set = useMemo(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)
    return PROPS.filter((p) => p.kind === kind).map((p) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw ?? 0)
      return m.clone().compose(new THREE.Vector3(p.x, p.y ?? 0, p.z), q, s)
    })
  }, [kind])

  useFrame(({ camera }) => {
    // static scenery: the matrices are written once and never touched again
    const near = camera.position.distanceTo(centre) < CULL[kind] + 26
    for (const im of refs.current) {
      if (!im) continue
      if (!im.userData.placed) {
        set.forEach((mat, i) => im.setMatrixAt(i, mat))
        im.instanceMatrix.needsUpdate = true
        im.computeBoundingSphere()
        im.userData.placed = true
      }
      im.visible = near
    }
  })

  return (
    <group>
      {parts.map((p, i) => (
        <instancedMesh
          key={i}
          ref={(el) => { refs.current[i] = el }}
          args={[p.geometry, p.material, count]}
          frustumCulled
        />
      ))}
    </group>
  )
}

useGLTF.preload(URL, DRACO)
