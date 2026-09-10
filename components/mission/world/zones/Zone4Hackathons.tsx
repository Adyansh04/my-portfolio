'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { surface, worldUV } from '../materials'
import { PODIUMS } from '@/lib/mission/facility'
import { hackathons } from '@/content/hackathons'
import { mission } from '@/lib/mission/store'
import { makeLabelTexture } from '../labels'
import { TROPHIES } from './podiumTrophies'

const ACCENT = '#ff7a1a'
const HOLO_SCALE = 2.1

/**
 * A machined plinth with an emitter in its top face, projecting what the win actually was.
 *
 * It used to be a box with a ring spinning over it, which said "award" and nothing else. The
 * podium is now a stepped plinth in the facility's own steel, and what stands on it is the work:
 * the Hex board being searched, the Snake arena the bots played, the grasp pipeline that took the
 * technical prize. Rank stays carried by height and the label — the platforms are deliberately the
 * same colour, because a gold/silver/bronze ramp would fight the accent the whole site runs on.
 */
function Podium({ index }: { index: number }) {
  const p = PODIUMS[index]
  const h = hackathons[index]
  const Trophy = TROPHIES[index] ?? TROPHIES[0]

  const tex = useMemo(
    () =>
      makeLabelTexture(
        [
          { text: h.rank.toUpperCase(), size: 40, color: ACCENT, font: '700' },
          { text: h.title, size: 26, color: '#e9eef3' },
          { text: `${h.organizer} · ${h.date}`, size: 22, color: '#8a94a6' },
        ],
        { w: 768, h: 256, bg: '#0d1117', pad: 32, align: 'center' },
      ),
    [h],
  )
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])

  /** base slab, tapered body and a capping plate — three steps, so the silhouette has edges */
  const plinth = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const slab = new THREE.BoxGeometry(1.22, 0.07, 1.22)
    slab.translate(0, 0.035, 0)
    geos.push(slab)
    const body = new THREE.CylinderGeometry(0.72, 0.80, p.h - 0.14, 4, 1)
    body.rotateY(Math.PI / 4)
    body.translate(0, 0.07 + (p.h - 0.14) / 2, 0)
    geos.push(body)
    const cap = new THREE.BoxGeometry(1.10, 0.05, 1.10)
    cap.translate(0, p.h - 0.045, 0)
    geos.push(cap)
    const m = worldUV(mergeGeometries(geos, false)!, 0.6)
    geos.forEach((g) => g.dispose())
    return m
  }, [p.h])
  const plinthMat = useMemo(() => surface('steel', { scale: 0.6, tint: '#57637a', roughness: 0.95, metalness: 0.95, normalScale: 0.8 }), [])

  /** the emitter: a lit ring recessed into the cap, and the cone of light it throws */
  const emitterMat = useRef<THREE.MeshStandardMaterial>(null)
  const coneMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    [],
  )
  const bandMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 1.4, roughness: 0.5 }),
    [],
  )

  const holo = useRef<THREE.Group>(null)
  const scan = useRef<THREE.Mesh>(null)
  const HOLO_Y = p.h + 0.46

  useFrame(({ clock }, dt) => {
    // the podium lights as the beat reaches it, so the three read as being awarded in order
    const lit = mission.zone === 4 && mission.beat >= index ? 1 : 0.12
    const k = Math.min(1, (dt || 0.016) * 3)
    if (emitterMat.current) emitterMat.current.emissiveIntensity += (lit * 2.6 - emitterMat.current.emissiveIntensity) * k
    coneMat.opacity += (lit * 0.14 - coneMat.opacity) * k
    if (holo.current) {
      holo.current.rotation.y = clock.elapsedTime * 0.28 + index
      holo.current.position.y = HOLO_Y + Math.sin(clock.elapsedTime * 1.1 + index) * 0.012
      // the projection is about 0.9 m across when it is up; it has to hold its own against a
      // 1.2 m plinth from three or four metres away
      holo.current.scale.setScalar(HOLO_SCALE * (0.35 + 0.65 * Math.min(1, lit * 2)))
    }
    // a bar sweeping up through the projection — the cheapest possible "this is a hologram"
    if (scan.current) {
      scan.current.position.y = p.h + 0.12 + ((clock.elapsedTime * 0.35 + index * 0.4) % 1) * 0.78
      scan.current.visible = lit > 0.5
    }
  })

  return (
    <group position={[p.x, 0, p.z]}>
      <mesh geometry={plinth} material={plinthMat} />
      {/* recessed accent band around the body */}
      <mesh position={[0, p.h - 0.14, 0]} rotation-y={Math.PI / 4} material={bandMat}>
        <cylinderGeometry args={[0.735, 0.735, 0.02, 4, 1, true]} />
      </mesh>
      {/* the emitter ring in the cap */}
      <mesh position={[0, p.h - 0.012, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.2, 0.3, 36]} />
        <meshStandardMaterial ref={emitterMat} color={ACCENT} emissive={ACCENT} emissiveIntensity={0.3} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* the light it throws, widening upward */}
      <mesh position={[0, p.h + 0.43, 0]} material={coneMat}>
        <coneGeometry args={[0.52, 0.86, 26, 1, true]} />
      </mesh>
      <mesh ref={scan} rotation-x={-Math.PI / 2} material={coneMat}>
        <ringGeometry args={[0.0, 0.42, 28]} />
      </mesh>

      <group ref={holo} position={[0, HOLO_Y, 0]}>
        <Trophy />
      </group>

      <mesh position={[0, p.h * 0.52, 0.63]} material={face}>
        <planeGeometry args={[1.0, 0.34]} />
      </mesh>
    </group>
  )
}

export function Zone4Hackathons() {
  return (
    <group>
      {PODIUMS.map((_, i) => (
        <Podium key={i} index={i} />
      ))}
      <pointLight position={[-4, 2.4, 38]} color="#ffd9c2" intensity={2.5} distance={7} decay={2} />
    </group>
  )
}
