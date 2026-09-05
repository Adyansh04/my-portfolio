'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CYAN, LIME, MUTED, VIOLET, WHITE, useLabClock } from './labParts'
import { DETECTIONS, FACTORS, FACTOR_COLOR, FACTOR_LABEL, KEYFRAMES, LANDMARKS, PATROL, ROOMS, WALLS } from './subjects'

/**
 * Style 3 — Engineering Drawing. A plotted sheet standing on the pedestal: hatched walls, dimension
 * lines with real measurements, a legend and a title block, drawn to canvas so the linework and
 * type stay crisp at any distance. A thin extruded model floats off the sheet on leader lines, so
 * the drawing and the thing it describes are both present. Precision instead of glow.
 */

const W = 1500
const H = 1060
/** sheet size in world units */
const SW = 1.24
const SH = SW * (H / W)

function sheet(draw: (x: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')!
  x.fillStyle = '#070b11'
  x.fillRect(0, 0, W, H)
  // border + registration corners
  x.strokeStyle = 'rgba(79,209,255,0.55)'
  x.lineWidth = 2
  x.strokeRect(26, 26, W - 52, H - 52)
  x.strokeRect(38, 38, W - 76, H - 76)
  x.strokeStyle = 'rgba(79,209,255,0.35)'
  for (const [cx, cy] of [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]]) {
    x.beginPath(); x.moveTo(cx - 16, cy); x.lineTo(cx + 16, cy); x.moveTo(cx, cy - 16); x.lineTo(cx, cy + 16); x.stroke()
  }
  draw(x)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

const mono = (px: number, weight = '500') => `${weight} ${px}px "IBM Plex Mono", ui-monospace, monospace`

function titleBlock(x: CanvasRenderingContext2D, rows: [string, string][], title: string) {
  const y0 = H - 168
  x.strokeStyle = 'rgba(120,140,165,0.5)'
  x.lineWidth = 1.5
  x.strokeRect(52, y0, W - 104, 112)
  x.fillStyle = '#e9eef3'
  x.font = mono(30, '700')
  x.fillText(title, 70, y0 + 44)
  x.font = mono(19)
  rows.forEach(([k, v], i) => {
    const cx = 70 + i * 300
    x.fillStyle = '#7f8b9c'
    x.fillText(k, cx, y0 + 78)
    x.fillStyle = '#cfd8e3'
    x.fillText(v, cx, y0 + 100)
  })
  for (let i = 1; i < rows.length; i++) {
    x.strokeStyle = 'rgba(120,140,165,0.28)'
    x.beginPath(); x.moveTo(52 + i * 300, y0 + 56); x.lineTo(52 + i * 300, y0 + 112); x.stroke()
  }
}

/** Dimension line with ticks and the measurement sitting on it. */
function dim(x: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, label: string) {
  x.strokeStyle = 'rgba(79,209,255,0.75)'
  x.lineWidth = 1.4
  x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke()
  const a = Math.atan2(by - ay, bx - ax)
  for (const [px, py, s] of [[ax, ay, 1], [bx, by, -1]] as [number, number, number][]) {
    x.beginPath()
    x.moveTo(px + Math.cos(a + 2.5) * 12 * s, py + Math.sin(a + 2.5) * 12 * s)
    x.lineTo(px, py)
    x.lineTo(px + Math.cos(a - 2.5) * 12 * s, py + Math.sin(a - 2.5) * 12 * s)
    x.stroke()
  }
  x.save()
  x.translate((ax + bx) / 2, (ay + by) / 2)
  x.rotate(Math.abs(a) > Math.PI / 2 ? a + Math.PI : a)
  x.fillStyle = '#9fe6ff'
  x.font = mono(20)
  x.textAlign = 'center'
  x.fillText(label, 0, -9)
  x.restore()
  x.textAlign = 'left'
}

export function Go2Blueprint() {
  const tex = useMemo(
    () =>
      sheet((x) => {
        const SX = 980
        const OX = 540
        const OY = 430
        const px = (v: number) => OX + v * SX
        const py = (v: number) => OY + v * SX

        // hatched walls: two hairlines with 45-degree fill between them
        for (const w of WALLS) {
          const ax = px(w.a[0]); const ay = py(w.a[1]); const bx = px(w.b[0]); const by = py(w.b[1])
          const a = Math.atan2(by - ay, bx - ax)
          const nx = -Math.sin(a) * 5
          const ny = Math.cos(a) * 5
          x.fillStyle = 'rgba(150,170,195,0.14)'
          x.beginPath(); x.moveTo(ax + nx, ay + ny); x.lineTo(bx + nx, by + ny); x.lineTo(bx - nx, by - ny); x.lineTo(ax - nx, ay - ny); x.closePath(); x.fill()
          x.strokeStyle = 'rgba(210,224,240,0.85)'
          x.lineWidth = 1.6
          x.beginPath(); x.moveTo(ax + nx, ay + ny); x.lineTo(bx + nx, by + ny); x.moveTo(ax - nx, ay - ny); x.lineTo(bx - nx, by - ny); x.stroke()
        }
        // room labels + centre marks
        x.textAlign = 'center'
        ROOMS.forEach((r) => {
          x.strokeStyle = 'rgba(255,122,26,0.4)'
          x.lineWidth = 1
          x.strokeRect(px(r.x - r.w / 2) + 8, py(r.z - r.d / 2) + 8, r.w * SX - 16, r.d * SX - 16)
          x.fillStyle = '#e9eef3'
          x.font = mono(24, '700')
          x.fillText(r.id.toUpperCase(), px(r.x), py(r.z) - 4)
          x.fillStyle = '#7f8b9c'
          x.font = mono(18)
          x.fillText(`${r.found} objects`, px(r.x), py(r.z) + 22)
        })
        x.textAlign = 'left'
        // patrol path, dashed with direction arrows
        x.strokeStyle = 'rgba(255,122,26,0.9)'
        x.lineWidth = 2
        x.setLineDash([10, 7])
        x.beginPath()
        PATROL.forEach((p, i) => (i ? x.lineTo(px(p[0]), py(p[1])) : x.moveTo(px(p[0]), py(p[1]))))
        x.stroke()
        x.setLineDash([])
        for (let i = 0; i < PATROL.length - 1; i += 2) {
          const a = PATROL[i]; const b = PATROL[i + 1]
          const ang = Math.atan2(py(b[1]) - py(a[1]), px(b[0]) - px(a[0]))
          const mx = (px(a[0]) + px(b[0])) / 2; const my = (py(a[1]) + py(b[1])) / 2
          x.fillStyle = '#ff7a1a'
          x.beginPath()
          x.moveTo(mx + Math.cos(ang) * 11, my + Math.sin(ang) * 11)
          x.lineTo(mx + Math.cos(ang + 2.5) * 9, my + Math.sin(ang + 2.5) * 9)
          x.lineTo(mx + Math.cos(ang - 2.5) * 9, my + Math.sin(ang - 2.5) * 9)
          x.fill()
        }
        // detections as circled numbers with a legend down the right edge
        DETECTIONS.forEach((d, i) => {
          const cx = px(d.p[0]); const cy = py(d.p[1])
          x.strokeStyle = '#4fd1ff'
          x.lineWidth = 1.6
          x.beginPath(); x.arc(cx, cy, 13, 0, 7); x.stroke()
          x.fillStyle = '#4fd1ff'
          x.font = mono(17, '700')
          x.textAlign = 'center'
          x.fillText(String(i + 1), cx, cy + 6)
          x.textAlign = 'left'
        })
        x.font = mono(19)
        DETECTIONS.forEach((d, i) => {
          x.fillStyle = '#4fd1ff'
          x.fillText(`${i + 1}`, 1180, 200 + i * 30)
          x.fillStyle = '#a9b6c6'
          x.fillText(d.label, 1212, 200 + i * 30)
        })
        x.strokeStyle = 'rgba(79,209,255,0.4)'
        x.strokeRect(1160, 168, 290, 40 + DETECTIONS.length * 30)
        x.fillStyle = '#7f8b9c'
        x.font = mono(17, '700')
        x.fillText('YOLOE DETECTIONS', 1172, 158)

        dim(x, px(-0.53), py(-0.42), px(0.51), py(-0.42), '18 400 mm')
        dim(x, px(0.56), py(-0.36), px(0.56), py(0.42), '13 800 mm')
        // north arrow + scale bar
        x.strokeStyle = '#cfd8e3'
        x.lineWidth = 2
        x.beginPath(); x.moveTo(120, 220); x.lineTo(120, 150); x.stroke()
        x.beginPath(); x.moveTo(110, 168); x.lineTo(120, 148); x.lineTo(130, 168); x.closePath(); x.fillStyle = '#cfd8e3'; x.fill()
        x.font = mono(20, '700'); x.textAlign = 'center'; x.fillText('N', 120, 250); x.textAlign = 'left'
        for (let i = 0; i < 4; i++) {
          x.fillStyle = i % 2 ? '#0a0f16' : '#cfd8e3'
          x.fillRect(90 + i * 45, 800, 45, 12)
          x.strokeStyle = '#cfd8e3'
          x.strokeRect(90 + i * 45, 800, 45, 12)
        }
        x.fillStyle = '#7f8b9c'; x.font = mono(17); x.fillText('0', 86, 838); x.fillText('5 m', 250, 838)

        titleBlock(
          x,
          [['PROJECT', 'PRJ-001'], ['SLAM', 'RTAB-MAP GRAPH'], ['PLANNER', 'NAV2 + FRONTIER'], ['SHEET', '1 OF 1 · 1:50']],
          'GO2 AUTONOMOUS INSPECTION — FACILITY PLAN',
        )
      }),
    [],
  )
  return <BlueprintSheet tex={tex} />
}

export function OliveBlueprint() {
  const tex = useMemo(
    () =>
      sheet((x) => {
        const SX = 900
        const OX = 640
        const OY = 420
        const px = (v: number) => OX + v * SX
        const py = (v: number) => OY + v * SX
        const at = (id: number | string): [number, number] => (typeof id === 'number' ? KEYFRAMES[id].p : LANDMARKS[+String(id).slice(1)])

        // factors first so the nodes sit on top
        for (const f of FACTORS) {
          const a = at(f.from); const b = at(f.to)
          x.strokeStyle = FACTOR_COLOR[f.kind]
          x.globalAlpha = f.kind === 'loop' ? 0.95 : 0.55
          x.lineWidth = f.kind === 'loop' ? 3 : 1.6
          if (f.kind === 'fiducial') x.setLineDash([7, 5])
          x.beginPath(); x.moveTo(px(a[0]), py(a[1])); x.lineTo(px(b[0]), py(b[1])); x.stroke()
          x.setLineDash([])
        }
        x.globalAlpha = 1
        // keyframe nodes with covariance ellipses that shrink after the closure
        KEYFRAMES.forEach((k, i) => {
          const cx = px(k.p[0]); const cy = py(k.p[1])
          const cov = 6 + k.u * 26
          x.strokeStyle = 'rgba(255,77,109,0.35)'
          x.lineWidth = 1
          x.beginPath(); x.ellipse(cx, cy, cov, cov * 0.62, 0.5, 0, 7); x.stroke()
          x.fillStyle = '#0a0f16'
          x.strokeStyle = '#e9eef3'
          x.lineWidth = 1.8
          x.beginPath(); x.arc(cx, cy, 9, 0, 7); x.fill(); x.stroke()
          if (i % 4 === 0) {
            x.fillStyle = '#7f8b9c'
            x.font = mono(15)
            x.fillText(`x${i}`, cx + 13, cy - 10)
          }
        })
        LANDMARKS.forEach((l, i) => {
          const cx = px(l[0]); const cy = py(l[1])
          x.strokeStyle = FACTOR_COLOR.fiducial
          x.lineWidth = 2
          x.beginPath(); x.arc(cx, cy, 15, 0, 7); x.stroke()
          x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.stroke()
          x.fillStyle = FACTOR_COLOR.fiducial
          x.font = mono(15, '700')
          x.fillText(`L${i}`, cx + 20, cy + 5)
        })

        // legend
        x.strokeStyle = 'rgba(120,140,165,0.45)'
        x.strokeRect(78, 150, 330, 40 + Object.keys(FACTOR_COLOR).length * 30)
        x.fillStyle = '#7f8b9c'; x.font = mono(17, '700'); x.fillText('FACTOR TYPES', 90, 140)
        Object.entries(FACTOR_COLOR).forEach(([k, c], i) => {
          const yy = 182 + i * 30
          x.strokeStyle = c; x.lineWidth = 3
          x.beginPath(); x.moveTo(92, yy - 5); x.lineTo(132, yy - 5); x.stroke()
          x.fillStyle = '#c3ccd8'; x.font = mono(18)
          x.fillText(FACTOR_LABEL[k as keyof typeof FACTOR_LABEL], 144, yy)
        })

        // residual plot inset
        const PX = 1080; const PY = 640; const PW = 350; const PH = 190
        x.strokeStyle = 'rgba(120,140,165,0.45)'; x.lineWidth = 1.4
        x.strokeRect(PX, PY, PW, PH)
        x.fillStyle = '#7f8b9c'; x.font = mono(16, '700'); x.fillText('ATE vs DISTANCE', PX, PY - 12)
        x.strokeStyle = 'rgba(120,140,165,0.2)'
        for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(PX, PY + (i * PH) / 4); x.lineTo(PX + PW, PY + (i * PH) / 4); x.stroke() }
        x.strokeStyle = '#ff4d6d'; x.lineWidth = 2
        x.beginPath()
        for (let i = 0; i <= 60; i++) { const u = i / 60; const yy = PY + PH - Math.pow(u, 1.8) * PH * 0.85; i ? x.lineTo(PX + u * PW, yy) : x.moveTo(PX + u * PW, yy) }
        x.stroke()
        x.strokeStyle = LIME; x.lineWidth = 2
        x.beginPath()
        for (let i = 0; i <= 60; i++) { const u = i / 60; const yy = PY + PH - (0.08 + Math.sin(u * 9) * 0.02) * PH; i ? x.lineTo(PX + u * PW, yy) : x.moveTo(PX + u * PW, yy) }
        x.stroke()
        x.fillStyle = '#ff8fa3'; x.font = mono(15); x.fillText('odometry only', PX + 10, PY + 26)
        x.fillStyle = LIME; x.fillText('iSAM2 fused · 2.0 cm', PX + 10, PY + 48)

        dim(x, px(-0.46), py(0.42), px(0.46), py(0.42), '56 m circuit')
        titleBlock(
          x,
          [['PROJECT', 'PRJ-009'], ['BACKEND', 'GTSAM iSAM2'], ['MODALITIES', '5 · RUNTIME TOGGLE'], ['SHEET', '1 OF 1 · NTS']],
          'OLIVE — MULTI-SENSOR FACTOR GRAPH',
        )
      }),
    [],
  )
  return <BlueprintSheet tex={tex} />
}

/** The sheet itself: a standing plate with a machined frame and a slow drafting-light sweep. */
function BlueprintSheet({ tex }: { tex: THREE.Texture }) {
  const t = useLabClock()
  const glow = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (glow.current) glow.current.position.x = -SW / 2 + ((t.current * 0.18) % 1) * SW
  })
  return (
    <group position={[0, SH / 2 + 0.06, 0]} rotation={[-0.08, 0, 0]}>
      <mesh>
        <planeGeometry args={[SW, SH]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* sheet edge + stand */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(SW, SH)]} />
        <lineBasicMaterial color={CYAN} transparent opacity={0.5} />
      </lineSegments>
      <mesh ref={glow} position={[0, 0, 0.002]}>
        <planeGeometry args={[0.05, SH]} />
        <meshBasicMaterial color={WHITE} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * SW) / 2 - s * 0.01, -SH / 2 - 0.03, -0.01]}>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#8f98a5" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -SH / 2 - 0.06, 0]}>
        <boxGeometry args={[SW * 0.7, 0.012, 0.16]} />
        <meshStandardMaterial color="#59626e" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[SW + 0.03, SH + 0.03]} />
        <meshStandardMaterial color="#161d26" metalness={0.4} roughness={0.6} />
      </mesh>
      <lineSegments position={[0, 0, 0.001]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(SW * 0.999, SH * 0.999)]} />
        <lineBasicMaterial color={MUTED} transparent opacity={0.3} />
      </lineSegments>
      <group position={[0, 0, 0.02]}>
        <mesh visible={false}>
          <planeGeometry args={[0.01, 0.01]} />
          <meshBasicMaterial color={VIOLET} />
        </mesh>
      </group>
    </group>
  )
}
