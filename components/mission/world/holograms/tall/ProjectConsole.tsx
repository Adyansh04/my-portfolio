'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { emissive, lineMat, useClock, useNearState } from './tallParts'
import { useGlyphTexture } from './useGlyphTexture'
import { STAGES, STAGE_FOR, DECK } from './stages'
import type { SlabDesign } from '../data/projects'

/**
 * One project hologram: its hardware working below, its poster above.
 *
 * The split is set by the shot. The hall camera is 7.4 m out at 3.5 m looking 21 degrees down, so
 * anything laid flat foreshortens to nothing — the lower half has to carry silhouette and motion,
 * and the detail has to live on an upright surface. What goes on that surface is the project's own
 * SVG poster, the detailed schematic from the previous site, rasterised live so it keeps animating.
 *
 * The height budget is set by the shot, not by the ceiling. The hall is 4.75 m tall, but the top of
 * this frame — measured in the browser, not estimated — lands at 3.53 m at the pedestal's distance,
 * and the pedestal top is at 0.905 m. The frame scales this group by 1.2, so there are about 2.1
 * local units to spend, and the panel takes as much of them as it can: 0.65 up to 2.11, which is
 * 2.34 m of poster in world scale. Width is the cheap axis — the pedestals are 6 m apart on each
 * side of the aisle — so the platform spreads rather than climbing.
 */

const PW = 1.95
const PH = PW * 0.75 // the glyphs are all authored 400×300
const SCREEN_Y = 1.38
const PANEL_Z = -0.52
const MAST_Z = -0.74
const CANVAS_W = 1200
const CANVAS_H = 900

export function ProjectConsole({ design, projectKey }: { design: SlabDesign; projectKey: string }) {
  const t = useClock()
  const near = useNearState()
  const texture = useGlyphTexture(projectKey, CANVAS_W, CANVAS_H, near)
  const Stage = STAGES[STAGE_FOR[projectKey] ?? 'patrol']

  /* ---------------- the gantry that holds the panel ---------------- */
  const gantry = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const top = SCREEN_Y + PH / 2
    const mast = new THREE.CylinderGeometry(0.036, 0.055, top, 12)
    mast.translate(0, top / 2, MAST_Z)
    geos.push(mast)
    // struts out to the panel's lower corners, so the screen reads as mounted rather than floating
    for (const sx of [-1, 1]) {
      const len = 0.92
      const s = new THREE.CylinderGeometry(0.014, 0.014, len, 8)
      s.rotateZ(sx * 1.08)
      s.rotateX(-0.3)
      s.translate(sx * 0.4, SCREEN_Y - PH / 2 + 0.2, MAST_Z + 0.13)
      geos.push(s)
    }
    // a foot ring where the mast meets the deck
    const foot = new THREE.CylinderGeometry(0.11, 0.14, 0.06, 16)
    foot.translate(0, 0.025, MAST_Z)
    geos.push(foot)
    return mergeGeometries(geos, false)!
  }, [])
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#49535f', metalness: 0.9, roughness: 0.32 }), [])
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2c343e', metalness: 0.85, roughness: 0.38 }), [])
    // A display emits its own light, so it must not go through the tone mapper: Neutral crushes the
  // low end and the poster is mostly low end. The brightness is held down in the paint instead.
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture])
  const bezelMat = useMemo(() => emissive(design.accent, 0.4), [design.accent])

  /* ---------------- the link from the work to the readout ---------------- */
  const beads = useRef<THREE.InstancedMesh>(null)
  const beadMat = useMemo(() => emissive(design.data, 1.9), [design.data])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const scanMat = useMemo(() => lineMat(design.data, 0.5), [design.data])
  const scan = useRef<THREE.Line>(null)
  const scanLine = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-PW / 2, 0, 0), new THREE.Vector3(PW / 2, 0, 0)])
    return new THREE.Line(g, scanMat)
  }, [scanMat])

  useFrame(() => {
    if (!near) return
    const now = t.current
    const m = beads.current
    if (m) {
      for (let b = 0; b < 5; b++) {
        const u = (now * 0.42 + b / 5) % 1
        tmp.position.set(0, DECK + u * (SCREEN_Y - PH / 2 - DECK), MAST_Z)
        tmp.scale.setScalar(0.55 + 0.55 * Math.sin(Math.PI * u))
        tmp.updateMatrix()
        m.setMatrixAt(b, tmp.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }
    // a refresh bar crossing the poster, so the panel reads as live even at a glance
    if (scan.current) scan.current.position.y = (((now * 0.28) % 1) - 0.5) * PH
  })

  return (
    <group>
      <Stage design={design} />

      <mesh geometry={gantry} material={steel} />
      <instancedMesh ref={beads} args={[undefined, undefined, 5]} material={beadMat}>
        <sphereGeometry args={[0.028, 10, 8]} />
      </instancedMesh>

      <group position={[0, SCREEN_Y, PANEL_Z]}>
        <mesh material={screenMat} position={[0, 0, 0.021]}>
          <planeGeometry args={[PW, PH]} />
        </mesh>
        <primitive object={scanLine} ref={scan} position={[0, 0, 0.023]} />
        <mesh material={frameMat}>
          <boxGeometry args={[PW + 0.08, PH + 0.08, 0.03]} />
        </mesh>
        {/* lit edges, so the panel still reads as a display when the poster is dark */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={bezelMat} position={[0, s * (PH / 2 + 0.03), 0.019]}>
            <boxGeometry args={[PW + 0.08, 0.012, 0.009]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} material={bezelMat} position={[s * (PW / 2 + 0.03), 0, 0.019]}>
            <boxGeometry args={[0.012, PH + 0.08, 0.009]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
