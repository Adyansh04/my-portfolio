'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ChannelPulse, Pins, SLAB, ScanBar, boltGeometry, channelGeometry, extrudeUp, reliefGeometry, roundedRect, useSlabMaterials, type XZ } from './slabParts'
import { SLAB_DESIGNS, type SlabDesign } from './slabContent'

/**
 * One project, milled into a plate. The static geometry carries the detail — chamfered ridges,
 * a routed channel, countersunk bolts — and the motion is added on top: pulses running the
 * channel, pins breathing, a tool light tracking across the deck. Static geometry alone looked
 * like a paperweight; this has to read as a live readout.
 */

const BODY_H = 0.062
const DECK_H = 0.014
const TOP = BODY_H + DECK_H

export function SlabHologram({ design }: { design: SlabDesign }) {
  const M = useSlabMaterials(design.accent, design.data)

  const body = useMemo(() => extrudeUp(roundedRect(SLAB.w, SLAB.d, 0.03), BODY_H, 0.006), [])
  const deck = useMemo(() => {
    const g = extrudeUp(roundedRect(SLAB.w - 0.07, SLAB.d - 0.07, 0.022), DECK_H, 0.004)
    g.translate(0, BODY_H, 0)
    return g
  }, [])

  const rails = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    for (const s of [-1, 1]) {
      const g = extrudeUp(roundedRect(SLAB.w - 0.02, 0.018, 0.008), 0.026, 0.003)
      g.translate(0, BODY_H - 0.004, s * (SLAB.d / 2 - 0.016))
      geos.push(g)
    }
    return mergeGeometries(geos, false)!
  }, [])

  const bolts = useMemo(() => {
    const spots: XZ[] = []
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) spots.push([sx * (SLAB.w / 2 - 0.035), sz * (SLAB.d / 2 - 0.035)])
    return boltGeometry(spots, 0.012, 0.010, BODY_H - 0.002)
  }, [])

  const relief = useMemo(() => reliefGeometry(design.runs, 0.062, 0.018, TOP), [design.runs])
  const detail = useMemo(() => (design.detail ? reliefGeometry(design.detail, 0.016, 0.010, TOP) : null), [design.detail])
  const channel = useMemo(() => channelGeometry(design.path, 0.017, 0.007, TOP - 0.002, design.closed), [design.path, design.closed])

  return (
    <group>
      <mesh geometry={body} material={M.body} />
      <mesh geometry={deck} material={M.deck} />
      <mesh geometry={rails} material={M.rail} />
      <mesh geometry={bolts} material={M.bolt} />
      {detail && <mesh geometry={detail} material={M.dataDim} />}
      <mesh geometry={relief} material={M.relief} />
      <mesh geometry={channel} material={M.channel} />
      <Pins spots={design.pins} color={design.data} y={TOP} />
      <ChannelPulse path={design.path} color={design.data} closed={design.closed ?? false} y={TOP + 0.010} count={3} size={0.014} />
      <ScanBar color={design.accent} y={TOP + 0.004} />
      {/* the channel throws a little light back onto the deck */}
      <pointLight position={[0, TOP + 0.14, 0]} color={design.accent} intensity={0.22} distance={1.0} decay={2} />
    </group>
  )
}

/** One component per project, so the registry stays a plain lookup. */
export const SLAB_HOLOGRAMS: Record<string, () => React.ReactElement> = Object.fromEntries(
  Object.entries(SLAB_DESIGNS).map(([key, design]) => [key, () => <SlabHologram design={design} />]),
)
