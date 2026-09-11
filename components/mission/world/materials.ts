import * as THREE from 'three'
import { asset } from '@/lib/base-path'

/**
 * The facility's material library, on top of the PBR sets baked by `scripts/blender/textures.py`.
 *
 * Everything here used to be a flat colour with a constant roughness, which is why it read as
 * plastic however well it was lit: a real surface varies over centimetres, and none of these did.
 * Each set is albedo + normal + ORM (occlusion / roughness / metal packed into one texture, the
 * glTF convention, so three reads three channels from one fetch).
 *
 * ## UVs
 *
 * None of this geometry has usable UVs — it is merged boxes, and a BoxGeometry's UVs run 0..1 per
 * face, so a texture applied straight would stretch to whatever size that box happens to be.
 * `worldUV` rewrites them from world position projected on each vertex's dominant axis. That is
 * triplanar mapping, decided once on the CPU instead of three times per fragment, which works
 * exactly because this architecture is axis-aligned: the projection is always the right one and
 * there is no seam to blend away.
 */

export type SetName = 'concrete' | 'panel' | 'deck' | 'steel' | 'crate' | 'rubber'

export interface TextureSet {
  map: THREE.Texture
  normalMap: THREE.Texture
  ormMap: THREE.Texture
}

const cache = new Map<SetName, TextureSet>()
const loader = new THREE.TextureLoader()

function load(url: string, srgb: boolean) {
  const t = loader.load(asset(url))
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 8
  return t
}

export function textures(name: SetName): TextureSet {
  let set = cache.get(name)
  if (!set) {
    set = {
      map: load(`/textures/${name}_albedo.webp`, true),
      normalMap: load(`/textures/${name}_normal.webp`, false),
      ormMap: load(`/textures/${name}_orm.webp`, false),
    }
    cache.set(name, set)
  }
  return set
}

export interface SurfaceOptions {
  /** metres per texture tile */
  scale?: number
  /** explicit tile counts, for primitives whose own UVs are already 0..1 across the face
   *  (a cylinder wraps u around its circumference, so it wants a different count per axis) */
  repeat?: [number, number]
  /** multiplies the baked albedo — how the same steel becomes a rack, a rail or a plinth */
  tint?: THREE.ColorRepresentation
  roughness?: number
  metalness?: number
  normalScale?: number
  /** strength of the baked cavity occlusion */
  ao?: number
  emissive?: THREE.ColorRepresentation
  emissiveIntensity?: number
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
}

/**
 * A material from one of the baked sets. `scale` is in metres and has to agree with the `scale`
 * passed to `worldUV` on the geometry, which is why both default to the same number.
 */
export function surface(name: SetName, o: SurfaceOptions = {}) {
  const t = textures(name)
  const repeat = 1 / (o.scale ?? 2)
  // textures are shared between materials, so the repeat lives on a clone rather than the original
  const map = t.map.clone()
  const normalMap = t.normalMap.clone()
  const ormMap = t.ormMap.clone()
  for (const tex of [map, normalMap, ormMap]) {
    if (o.repeat) tex.repeat.set(o.repeat[0], o.repeat[1])
    else tex.repeat.set(repeat, repeat)
    tex.needsUpdate = true
  }
  const m = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    roughnessMap: ormMap,
    metalnessMap: ormMap,
    aoMap: ormMap,
    color: o.tint ?? '#ffffff',
    roughness: o.roughness ?? 1,
    metalness: o.metalness ?? 1,
    aoMapIntensity: o.ao ?? 1,
    emissive: o.emissive ?? '#000000',
    emissiveIntensity: o.emissiveIntensity ?? 1,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
  })
  m.normalScale.setScalar(o.normalScale ?? 1)
  // aoMap reads uv1 by default; worldUV writes the same coordinates there
  return m
}

/**
 * Rewrites a geometry's UVs from world position, projected on each vertex's dominant axis.
 * `scale` is metres per tile and must match the material's.
 */
export function worldUV(g: THREE.BufferGeometry, scale = 2, offset = new THREE.Vector3()) {
  const pos = g.attributes.position
  const nor = g.attributes.normal
  if (!pos || !nor) return g
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + offset.x
    const y = pos.getY(i) + offset.y
    const z = pos.getZ(i) + offset.z
    const ax = Math.abs(nor.getX(i))
    const ay = Math.abs(nor.getY(i))
    const az = Math.abs(nor.getZ(i))
    let u: number
    let v: number
    if (ay >= ax && ay >= az) {
      u = x
      v = z
    } else if (ax >= az) {
      u = z
      v = y
    } else {
      u = x
      v = y
    }
    uv[i * 2] = u / scale
    uv[i * 2 + 1] = v / scale
  }
  const attr = new THREE.BufferAttribute(uv, 2)
  g.setAttribute('uv', attr)
  g.setAttribute('uv1', attr)
  return g
}

/** Preload every set the world needs, so nothing pops in mid-scroll. */
export function preloadTextures() {
  ;(['concrete', 'panel', 'deck', 'steel', 'crate', 'rubber'] as SetName[]).forEach(textures)
}
