'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ROOMS } from '@/lib/mission/facility'

const CEIL_Y = 3.2
/** the hall is one storey taller and carries its own roof truss (see ambient/Dressing) */
const HALL_Y = 4.75
const HALL_ZONE = 3
/** the project hall gets no joists; its truss does that job */
const SKIP = new Set([HALL_ZONE])

interface Bar {
  x: number
  z: number
  len: number
  alongX: boolean
}

function layout() {
  const beams: Bar[] = []
  const lamps: Bar[] = []
  for (const r of ROOMS) {
    if (SKIP.has(r.zone)) continue
    const w = r.x1 - r.x0
    const d = r.z1 - r.z0
    const alongX = w >= d // the room's long axis
    const long = alongX ? w : d
    const short = alongX ? d : w
    const cx = (r.x0 + r.x1) / 2
    const cz = (r.z0 + r.z1) / 2

    // joists across the short span
    const step = 2.2
    const n = Math.max(2, Math.round(long / step))
    for (let i = 0; i <= n; i++) {
      const t = r0(long, i, n)
      beams.push(alongX ? { x: r.x0 + t, z: cz, len: short, alongX: false } : { x: cx, z: r.z0 + t, len: short, alongX: true })
    }
    // two runners tying them together
    for (const f of [0.22, 0.78]) {
      beams.push(alongX ? { x: cx, z: r.z0 + d * f, len: long, alongX: true } : { x: r.x0 + w * f, z: cz, len: long, alongX: false })
    }
    // luminaires down the centre line
    const m = Math.max(1, Math.floor(long / 3.4))
    for (let i = 0; i < m; i++) {
      const t = ((i + 0.5) / m) * long
      lamps.push(alongX ? { x: r.x0 + t, z: cz, len: 1.7, alongX: true } : { x: cx, z: r.z0 + t, len: 1.7, alongX: false })
    }
  }
  return { beams, lamps }
}
const r0 = (long: number, i: number, n: number) => (i / n) * long

/**
 * The deck the joists hang from. Without it you look up between the beams and straight out at the
 * night sky, which is what made these rooms read as open boxes with a hole in the top rather than
 * the inside of a building. Extended past the walls so there is no seam at the junction.
 */
function deckGeometry(zones: (z: number) => boolean, y: number) {
  const geos = ROOMS.filter((r) => zones(r.zone)).map((r) => {
    const g = new THREE.PlaneGeometry(r.x1 - r.x0 + 0.4, r.z1 - r.z0 + 0.4)
    g.rotateX(Math.PI / 2) // normal down, so it is only lit and only seen from inside
    g.translate((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2)
    return g
  })
  const m = mergeGeometries(geos, false)!
  geos.forEach((g) => g.dispose())
  return m
}

function barGeometry(bars: Bar[], w: number, h: number, y: number) {
  const geos = bars.map((b) => {
    const g = new THREE.BoxGeometry(b.alongX ? b.len : w, h, b.alongX ? w : b.len)
    g.translate(b.x, y, b.z)
    return g
  })
  const m = mergeGeometries(geos, false)!
  geos.forEach((g) => g.dispose())
  return m
}

/**
 * Open joist ceiling over every room but the hall, with strip lights and the pools they throw.
 * Rooms whose walls just stop at 2.6 m read as an open-topped diorama; a ceiling is what makes them
 * feel like the inside of a building. It dissolves once the camera climbs above it, so the
 * loop-closure shot still gets its view down into the facility.
 */
export function Ceiling() {
  const { beams, lamps } = useMemo(layout, [])
  const structure = useMemo(() => barGeometry(beams, 0.11, 0.16, CEIL_Y), [beams])
  const strips = useMemo(() => barGeometry(lamps, 0.16, 0.06, CEIL_Y - 0.13), [lamps])
  // just above the joists, so they read as hanging from it
  const deck = useMemo(() => deckGeometry((z) => !SKIP.has(z), CEIL_Y + 0.09), [])
  const hallDeck = useMemo(() => deckGeometry((z) => z === HALL_ZONE, HALL_Y), [])
  const pools = useMemo(() => {
    const geos = lamps.map((b) => {
      const g = new THREE.PlaneGeometry(b.alongX ? 4.6 : 3.4, b.alongX ? 3.4 : 4.6)
      g.rotateX(-Math.PI / 2)
      g.translate(b.x, 0.011, b.z)
      return g
    })
    const m = mergeGeometries(geos, false)!
    geos.forEach((g) => g.dispose())
    return m
  }, [lamps])

  const poolMat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d')!
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 32)
    g.addColorStop(0, 'rgba(200,222,255,0.2)')
    g.addColorStop(0.55, 'rgba(150,180,225,0.055)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 64, 64)
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  }, [])
  const structureMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#333d4c', roughness: 0.78, metalness: 0.2, transparent: true }), [])
  const deckMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#202833', roughness: 0.92, metalness: 0.05, transparent: true }), [])
  const hallDeckMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c242e', roughness: 0.92, metalness: 0.05, transparent: true }), [])
  // dim enough that a fixture passing right over the lens doesn't turn into a white slab
  const stripMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#9fbbe0', transparent: true, toneMapped: false }), [])

  const group = useRef<THREE.Group>(null)
  const hallGroup = useRef<THREE.Group>(null)
  useFrame(({ camera }, dt) => {
    // each roof dissolves as the camera rises through its own height, so the loop-closure shot
    // still gets its view down into the facility
    const fade = (y: number) => 1 - THREE.MathUtils.clamp((camera.position.y - y + 0.5) / 1.1, 0, 1)
    const want = fade(CEIL_Y)
    const hallWant = fade(HALL_Y)
    const k = 1 - Math.exp(-Math.min(0.05, dt || 0.016) * 6)
    structureMat.opacity += (want - structureMat.opacity) * k
    deckMat.opacity += (want - deckMat.opacity) * k
    hallDeckMat.opacity += (hallWant - hallDeckMat.opacity) * k
    stripMat.opacity += (want * 0.6 - stripMat.opacity) * k
    if (group.current) group.current.visible = structureMat.opacity > 0.02
    if (hallGroup.current) hallGroup.current.visible = hallDeckMat.opacity > 0.02
  })

  return (
    <group>
      <group ref={group}>
        <mesh geometry={deck} material={deckMat} />
        <mesh geometry={structure} material={structureMat} />
        <mesh geometry={strips} material={stripMat} />
      </group>
      <group ref={hallGroup}>
        <mesh geometry={hallDeck} material={hallDeckMat} />
      </group>
      <mesh geometry={pools} material={poolMat} renderOrder={-2} />
    </group>
  )
}
