'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DOOR_WIDTH, ROOMS, WALL_HEIGHT, WALL_THICKNESS, WALLS, wallPieces } from '@/lib/mission/facility'

const T = WALL_THICKNESS

/**
 * Panel surface, done in the shader rather than with a texture: the seams between panels are a real
 * height field, so the normal is bent along them and each panel catches light on its own. Flat
 * shading was what made the facility read as a set of black boxes.
 */
function panelMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: '#3b4658', roughness: 0.62, metalness: 0.28 })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uAccent = { value: new THREE.Color('#ff7a1a') }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')

    const helpers = /* glsl */ `
      varying vec3 vWorldPos;
      uniform vec3 uAccent;
      float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      // panel id and the groove height field around its edges (0 on the panel face, 1 in the seam)
      vec2 panelId(vec3 p) { return vec2(floor((p.x + p.z) / 1.2), floor(p.y / 0.65)); }
      float groove(vec3 p) {
        float u = abs(fract((p.x + p.z) / 1.2) - 0.5);
        float v = abs(fract(p.y / 0.65) - 0.5);
        return (1.0 - smoothstep(0.0, 0.05, u)) + (1.0 - smoothstep(0.0, 0.09, v));
      }`
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>' + helpers)
      // bend the normal along the seams (Mikkelsen's bump mapping for unparametrised surfaces)
      .replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
        {
          float h = groove(vWorldPos);
          vec3 dpx = dFdx(vWorldPos), dpy = dFdy(vWorldPos);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
          normal = normalize(abs(det) * normal - grad * 0.09);
        }`,
      )
      // every panel is a slightly different sheet of metal
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor *= 0.82 + 0.34 * hash21(panelId(vWorldPos));`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float wear = hash21(panelId(vWorldPos) + 3.7);
        // light spills down the wall from above and pools darker at the skirting
        float lift = mix(0.74, 1.16, smoothstep(0.0, 2.4, vWorldPos.y));
        diffuseColor.rgb *= lift * (0.92 + 0.16 * wear) * (1.0 - 0.22 * groove(vWorldPos));`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float strip = smoothstep(0.035, 0.0, abs(vWorldPos.y - 2.3));
        float skirt = smoothstep(0.03, 0.0, abs(vWorldPos.y - 0.08));
        totalEmissiveRadiance += uAccent * (strip * 0.5 + skirt * 0.22);`,
      )
  }
  m.customProgramCacheKey = () => 'facility-wall-v2'
  return m
}

/**
 * Fascia closing the strip between the wall tops (2.6 m) and the ceiling (3.2 m). Without it you
 * see the sky through a 60 cm slot all the way round, which reads as a hole rather than a room.
 * The project hall carries no ceiling, so its walls go up to meet the roof truss instead.
 */
const CEIL_Y = 3.2
const HALL_Y = 4.75
const hall = ROOMS[3]
const inHall = (x: number, z: number) => x >= hall.x0 - 0.3 && x <= hall.x1 + 0.3 && z >= hall.z0 - 0.3 && z <= hall.z1 + 0.3

function fasciaGeometry() {
  const geos = wallPieces().map((p) => {
    const dx = p.b[0] - p.a[0]
    const dz = p.b[1] - p.a[1]
    const len = Math.hypot(dx, dz)
    const cx = (p.a[0] + p.b[0]) / 2
    const cz = (p.a[1] + p.b[1]) / 2
    const top = inHall(cx, cz) ? HALL_Y : CEIL_Y
    const h = top - WALL_HEIGHT
    const g = new THREE.BoxGeometry(len + WALL_THICKNESS, h, WALL_THICKNESS)
    g.rotateY(Math.atan2(-dz, dx))
    g.translate(cx, WALL_HEIGHT + h / 2, cz)
    return g
  })
  const m = mergeGeometries(geos, false)!
  geos.forEach((g) => g.dispose())
  return m
}

/** Skirting, cap rail, pilasters and door frames — the extruded edges that give the walls a silhouette. */
function trimGeometry() {
  const geos: THREE.BufferGeometry[] = []
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, ry: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    if (ry) g.rotateY(ry)
    g.translate(x, y, z)
    geos.push(g)
  }

  for (const p of wallPieces()) {
    const dx = p.b[0] - p.a[0]
    const dz = p.b[1] - p.a[1]
    const len = Math.hypot(dx, dz)
    if (len < 0.2) continue
    const ry = Math.atan2(-dz, dx)
    const cx = (p.a[0] + p.b[0]) / 2
    const cz = (p.a[1] + p.b[1]) / 2
    box(len + T, 0.16, T + 0.11, cx, 0.08, cz, ry) // skirting
    box(len + T, 0.13, T + 0.09, cx, WALL_HEIGHT - 0.065, cz, ry) // cap rail
    // pilasters every ~3.6 m, inset from the ends so corners stay clean
    const bays = Math.max(0, Math.floor((len - 1.2) / 3.6))
    for (let i = 0; i < bays; i++) {
      const t = (i + 1) / (bays + 1)
      box(0.2, WALL_HEIGHT - 0.3, T + 0.1, p.a[0] + dx * t, WALL_HEIGHT / 2 - 0.05, p.a[1] + dz * t, ry)
    }
  }

  // door frames: two jambs and a lintel around every gap
  for (const w of WALLS) {
    if (!w.doors) continue
    const horizontal = w.a[1] === w.b[1]
    const ry = horizontal ? 0 : Math.PI / 2
    for (const d of w.doors) {
      const at = (o: number): [number, number] => (horizontal ? [d + o, w.a[1]] : [w.a[0], d + o])
      for (const side of [-1, 1]) {
        const [jx, jz] = at((side * (DOOR_WIDTH + 0.16)) / 2)
        box(0.16, 2.3, T + 0.16, jx, 1.15, jz, ry)
      }
      const [lx, lz] = at(0)
      box(DOOR_WIDTH + 0.32, 0.18, T + 0.16, lx, 2.39, lz, ry)
    }
  }

  const m = mergeGeometries(geos, false)!
  geos.forEach((g) => g.dispose())
  return m
}

/** Solid wall pieces (doors already cut out) merged into one mesh, plus the trim that dresses them. */
export function Walls() {
  const { geometry, edges, trim, fascia } = useMemo(() => {
    const geos = wallPieces().map((p) => {
      const dx = p.b[0] - p.a[0]
      const dz = p.b[1] - p.a[1]
      const len = Math.hypot(dx, dz)
      const g = new THREE.BoxGeometry(len + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS)
      g.rotateY(Math.atan2(-dz, dx))
      g.translate((p.a[0] + p.b[0]) / 2, WALL_HEIGHT / 2, (p.a[1] + p.b[1]) / 2)
      return g
    })
    const geometry = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return { geometry, edges: new THREE.EdgesGeometry(geometry, 20), trim: trimGeometry(), fascia: fasciaGeometry() }
  }, [])

  const material = useMemo(panelMaterial, [])

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={fascia}>
        <meshStandardMaterial color="#2b3542" roughness={0.85} metalness={0.15} />
      </mesh>
      <mesh geometry={trim}>
        <meshStandardMaterial color="#59657a" roughness={0.44} metalness={0.55} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#63748f" transparent opacity={0.35} />
      </lineSegments>
    </group>
  )
}
