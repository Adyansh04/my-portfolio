'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { WALL_HEIGHT, WALL_THICKNESS, wallPieces } from '@/lib/mission/facility'

/**
 * Solid wall pieces (doors already cut out) merged into one mesh. The surface is procedural in the
 * shader: panel seams every 1.2 m along the wall and 0.65 m up, and a lit guide strip at 2.3 m.
 */
export function Walls() {
  const { geometry, edges } = useMemo(() => {
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
    return { geometry, edges: new THREE.EdgesGeometry(geometry, 20) }
  }, [])

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#2a3340', roughness: 0.82, metalness: 0.12 })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uAccent = { value: new THREE.Color('#ff7a1a') }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uAccent;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float sx = abs(fract((vWorldPos.x + vWorldPos.z) / 1.2) - 0.5);
          float sy = abs(fract(vWorldPos.y / 0.65) - 0.5);
          float seam = smoothstep(0.0, 0.025, min(sx, sy));
          float panelTone = 0.9 + 0.1 * fract(sin(floor((vWorldPos.x + vWorldPos.z) / 1.2) * 12.9898 + floor(vWorldPos.y / 0.65) * 78.233) * 43758.5453);
          diffuseColor.rgb *= (0.62 + 0.38 * seam) * panelTone;`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float strip = smoothstep(0.035, 0.0, abs(vWorldPos.y - 2.3));
          float skirt = smoothstep(0.03, 0.0, abs(vWorldPos.y - 0.08));
          totalEmissiveRadiance += uAccent * (strip * 0.55 + skirt * 0.25);`,
        )
    }
    m.customProgramCacheKey = () => 'facility-wall'
    return m
  }, [])

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#55647c" transparent opacity={0.55} />
      </lineSegments>
    </group>
  )
}
