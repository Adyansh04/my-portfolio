import type { SlabDesign } from '../data/projects'

/**
 * What each project's console draws. No type anywhere: at the distance this is actually seen the
 * panel is a few hundred pixels wide, so 20 px text lands at about 2 px and is noise. Everything
 * here communicates through shape, bar length, box and colour, sized to survive that reduction —
 * line widths of 5-10, boxes of 30-60, bars 20 tall.
 */

export interface ReadoutState {
  /** seconds */
  t: number
  /** mission progress, 0..1 */
  u: number
  trail: [number, number][]
  /** indices of design.pins already reached */
  found: number[]
  robot: [number, number]
  heading: number
}

export type Painter = (x: CanvasRenderingContext2D, W: number, H: number, d: SlabDesign, s: ReadoutState) => void

/* ------------------------------------------------------------------ chrome */

const BG = '#070c13'
const PANEL = 300

/** Top strip: a coverage bar, no percentage. */
function header(x: CanvasRenderingContext2D, W: number, d: SlabDesign, u: number) {
  x.fillStyle = '#0d141d'
  x.fillRect(0, 0, W, 54)
  x.fillStyle = 'rgba(120,140,165,0.22)'
  x.fillRect(24, 20, W - 48, 16)
  x.fillStyle = d.accent
  x.fillRect(24, 20, (W - 48) * u, 16)
  // tick marks so the bar reads as a scale
  x.fillStyle = 'rgba(10,16,24,0.85)'
  for (let i = 1; i < 8; i++) x.fillRect(24 + ((W - 48) * i) / 8, 20, 3, 16)
}

/** Right strip: one block per finding, filling in as they are found. */
function findings(x: CanvasRenderingContext2D, W: number, H: number, d: SlabDesign, found: number[], t: number) {
  const X = W - PANEL
  x.fillStyle = '#0a1119'
  x.fillRect(X, 54, PANEL, H - 54)
  x.strokeStyle = 'rgba(120,140,165,0.3)'
  x.lineWidth = 2
  x.beginPath(); x.moveTo(X, 54); x.lineTo(X, H); x.stroke()
  d.pins.forEach((_, i) => {
    const row = Math.floor(i / 2)
    const col = i % 2
    const bx = X + 30 + col * 130
    const by = 100 + row * 96
    const hit = found.includes(i)
    x.strokeStyle = hit ? d.accent : 'rgba(140,155,175,0.28)'
    x.lineWidth = hit ? 5 : 2
    x.strokeRect(bx, by, 100, 62)
    if (hit) {
      // a fill that pulses briefly when it lands, then settles
      const age = (t * 2 + i) % 6
      x.fillStyle = d.accent
      x.globalAlpha = age < 1 ? 0.55 : 0.2
      x.fillRect(bx + 6, by + 6, 88, 50)
      x.globalAlpha = 1
    }
  })
}

function grid(x: CanvasRenderingContext2D, W: number, H: number, step = 46) {
  x.strokeStyle = 'rgba(90,110,140,0.13)'
  x.lineWidth = 1
  for (let g = 0; g < W; g += step) { x.beginPath(); x.moveTo(g, 54); x.lineTo(g, H); x.stroke() }
  for (let g = 54; g < H; g += step) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke() }
}

/** The map itself: walls, travelled path, boxed detections, the robot with a heading spur. */
function plan(x: CanvasRenderingContext2D, W: number, H: number, d: SlabDesign, s: ReadoutState, scale = 560) {
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  x.strokeStyle = '#d3dce7'
  x.lineWidth = 7
  x.lineCap = 'round'
  for (const [a, b] of d.runs) {
    x.beginPath(); x.moveTo(MX + a[0] * scale, MY + a[1] * scale); x.lineTo(MX + b[0] * scale, MY + b[1] * scale); x.stroke()
  }
  x.lineCap = 'butt'
  x.strokeStyle = d.data
  x.lineWidth = 5
  x.beginPath()
  s.trail.forEach((q, i) => (i ? x.lineTo(MX + q[0] * scale, MY + q[1] * scale) : x.moveTo(MX + q[0] * scale, MY + q[1] * scale)))
  x.stroke()
  d.pins.forEach((p, i) => {
    const px = MX + p.p[0] * scale
    const py = MY + p.p[1] * scale
    const hit = s.found.includes(i)
    x.strokeStyle = hit ? d.accent : 'rgba(140,155,175,0.28)'
    x.lineWidth = hit ? 5 : 2
    const r = hit ? 26 : 18
    x.strokeRect(px - r, py - r, r * 2, r * 2)
  })
  const rx = MX + s.robot[0] * scale
  const ry = MY + s.robot[1] * scale
  x.fillStyle = '#ffffff'
  x.beginPath(); x.arc(rx, ry, 13, 0, 7); x.fill()
  x.strokeStyle = '#ffffff'
  x.lineWidth = 5
  x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx + Math.cos(s.heading) * 40, ry + Math.sin(s.heading) * 40); x.stroke()
}

/** Vertical bars in the side strip — wheel speeds, altitude, relevance. */
function bars(x: CanvasRenderingContext2D, W: number, H: number, d: SlabDesign, values: number[], color: string) {
  const X = W - PANEL
  x.fillStyle = '#0a1119'
  x.fillRect(X, 54, PANEL, H - 54)
  x.strokeStyle = 'rgba(120,140,165,0.3)'
  x.lineWidth = 2
  x.beginPath(); x.moveTo(X, 54); x.lineTo(X, H); x.stroke()
  const n = values.length
  const bw = (PANEL - 60) / n - 16
  values.forEach((v, i) => {
    const bx = X + 30 + i * (bw + 16)
    const full = H - 130
    x.fillStyle = 'rgba(120,140,165,0.18)'
    x.fillRect(bx, 90, bw, full)
    const h = full * Math.max(0.04, Math.min(1, v))
    x.fillStyle = color
    x.fillRect(bx, 90 + full - h, bw, h)
  })
}

const base = (x: CanvasRenderingContext2D, W: number, H: number) => {
  x.fillStyle = BG
  x.fillRect(0, 0, W, H)
}

/* ------------------------------------------------------------------ painters */

/** Default: occupancy map + findings. Used by anything that is fundamentally "a robot covering a space". */
const mapReadout: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  grid(x, W, H)
  plan(x, W, H, d, s)
  findings(x, W, H, d, s.found, s.t)
}

/** OLIVE: the graph tightening. Covariance rings shrink and the loop closure flashes across. */
const factorGraph: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  grid(x, W, H)
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  const SC = 560
  const closed = s.u > 0.82
  d.path.forEach((p, i) => {
    const px = MX + p[0] * SC
    const py = MY + p[1] * SC
    // uncertainty grows round the lap, then collapses when the loop closes
    const drift = closed ? 6 : 6 + (i / d.path.length) * 34
    x.strokeStyle = closed ? 'rgba(140,229,99,0.55)' : 'rgba(255,109,138,0.45)'
    x.lineWidth = 2
    x.beginPath(); x.ellipse(px, py, drift, drift * 0.6, 0.4, 0, 7); x.stroke()
  })
  x.strokeStyle = d.accent
  x.lineWidth = 6
  x.beginPath()
  d.path.forEach((p, i) => (i ? x.lineTo(MX + p[0] * SC, MY + p[1] * SC) : x.moveTo(MX + p[0] * SC, MY + p[1] * SC)))
  x.closePath(); x.stroke()
  d.path.forEach((p, i) => {
    x.fillStyle = i % 3 === 0 ? '#ffffff' : 'rgba(210,224,240,0.6)'
    x.beginPath(); x.arc(MX + p[0] * SC, MY + p[1] * SC, 9, 0, 7); x.fill()
  })
  if (closed) {
    const a = d.path[0]
    const b = d.path[d.path.length - 1]
    x.strokeStyle = '#ff4d6d'
    x.lineWidth = 8
    x.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(s.t * 6))
    x.beginPath(); x.moveTo(MX + a[0] * SC, MY + a[1] * SC); x.lineTo(MX + b[0] * SC, MY + b[1] * SC); x.stroke()
    x.globalAlpha = 1
  }
  const rx = MX + s.robot[0] * SC
  const ry = MY + s.robot[1] * SC
  x.fillStyle = '#ffffff'
  x.beginPath(); x.arc(rx, ry, 13, 0, 7); x.fill()
  // five modalities, each pulsing at its own rate
  bars(x, W, H, d, [0.5, 0.8, 0.65, 0.9, 0.45].map((v, i) => v * (0.7 + 0.3 * Math.abs(Math.sin(s.t * (1 + i * 0.4))))), d.data)
}

/** Manipulation: the target locked in a grasp box while the arm arcs between bins. */
const graspReadout: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  grid(x, W, H)
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  const SC = 560
  // the clutter it has to reach into
  d.runs.forEach(([a, b], i) => {
    x.strokeStyle = i % 3 === 0 ? 'rgba(210,224,240,0.75)' : 'rgba(140,155,175,0.35)'
    x.lineWidth = 6
    x.beginPath(); x.moveTo(MX + a[0] * SC, MY + a[1] * SC); x.lineTo(MX + b[0] * SC, MY + b[1] * SC); x.stroke()
  })
  // the pick arc
  const u = (s.t * 0.35) % 1
  x.strokeStyle = d.accent
  x.lineWidth = 5
  x.setLineDash([16, 10])
  x.beginPath()
  d.path.forEach((p, i) => (i ? x.lineTo(MX + p[0] * SC, MY + p[1] * SC) : x.moveTo(MX + p[0] * SC, MY + p[1] * SC)))
  x.stroke()
  x.setLineDash([])
  // the grasp box locking onto the target
  const tgt = d.pins[0]
  const px = MX + tgt.p[0] * SC
  const py = MY + tgt.p[1] * SC
  const lock = 60 - 26 * Math.min(1, (u % 0.5) * 4)
  x.strokeStyle = d.data
  x.lineWidth = 6
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    x.beginPath()
    x.moveTo(px + sx * lock, py + sy * lock - sy * 22)
    x.lineTo(px + sx * lock, py + sy * lock)
    x.lineTo(px + sx * lock - sx * 22, py + sy * lock)
    x.stroke()
  }
  findings(x, W, H, d, s.found, s.t)
}

/** Fiducials: rings acquired one by one, crosshair sweeping between them. */
const fiducialReadout: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  grid(x, W, H)
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  const SC = 560
  d.pins.forEach((p, i) => {
    const px = MX + p.p[0] * SC
    const py = MY + p.p[1] * SC
    const hit = s.found.includes(i)
    for (let r = 0; r < 3; r++) {
      x.strokeStyle = hit ? d.accent : 'rgba(140,155,175,0.3)'
      x.lineWidth = hit ? 6 : 3
      x.beginPath(); x.arc(px, py, 20 + r * 18, 0, 7); x.stroke()
    }
    if (hit) {
      x.strokeStyle = d.data
      x.lineWidth = 4
      x.beginPath(); x.moveTo(px - 80, py); x.lineTo(px + 80, py); x.moveTo(px, py - 80); x.lineTo(px, py + 80); x.stroke()
    }
  })
  const rx = MX + s.robot[0] * SC
  const ry = MY + s.robot[1] * SC
  x.strokeStyle = '#ffffff'
  x.lineWidth = 4
  x.strokeRect(rx - 34, ry - 34, 68, 68)
  bars(x, W, H, d, [0.9, 0.55, 0.75].map((v, i) => v * (0.6 + 0.4 * Math.abs(Math.sin(s.t * (1.2 + i * 0.5))))), d.accent)
}

/** Retrieval: a query fanning out to documents, the relevant ones lighting. */
const retrievalReadout: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  grid(x, W, H)
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  const SC = 560
  const q: [number, number] = [MX - 210, MY]
  d.pins.forEach((p, i) => {
    const px = MX + p.p[0] * SC + 90
    const py = MY + p.p[1] * SC
    const hot = (s.t * 0.6 + i * 0.3) % 2 < 1
    x.strokeStyle = hot ? d.accent : 'rgba(140,155,175,0.25)'
    x.lineWidth = hot ? 5 : 2
    x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(px, py); x.stroke()
    x.fillStyle = hot ? d.data : 'rgba(140,155,175,0.4)'
    x.fillRect(px - 26, py - 34, 52, 68)
  })
  d.runs.slice(0, 6).forEach(([a], i) => {
    x.fillStyle = 'rgba(140,155,175,0.2)'
    x.fillRect(MX - 40 + i * 12, MY - 200, 8, 400)
  })
  x.fillStyle = '#ffffff'
  x.beginPath(); x.arc(q[0], q[1], 22, 0, 7); x.fill()
  bars(x, W, H, d, d.pins.slice(0, 4).map((_, i) => 0.35 + 0.6 * Math.abs(Math.sin(s.t * 0.9 + i))), d.accent)
}

/** Flight: attitude horizon plus a climbing altitude bar. */
const flightReadout: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  const roll = Math.sin(s.t * 0.7) * 0.22
  const pitch = Math.sin(s.t * 0.5) * 60
  x.save()
  x.beginPath(); x.rect(0, 54, MW, H - 54); x.clip()
  x.translate(MX, MY + pitch)
  x.rotate(roll)
  x.fillStyle = 'rgba(80,120,180,0.22)'
  x.fillRect(-700, -700, 1400, 700)
  x.fillStyle = 'rgba(60,80,110,0.35)'
  x.fillRect(-700, 0, 1400, 700)
  x.strokeStyle = '#d3dce7'
  x.lineWidth = 6
  x.beginPath(); x.moveTo(-700, 0); x.lineTo(700, 0); x.stroke()
  for (let i = -3; i <= 3; i++) {
    if (!i) continue
    x.lineWidth = 4
    x.beginPath(); x.moveTo(-70, i * 62); x.lineTo(70, i * 62); x.stroke()
  }
  x.restore()
  // fixed aircraft mark
  x.strokeStyle = d.accent
  x.lineWidth = 8
  x.beginPath(); x.moveTo(MX - 90, MY); x.lineTo(MX - 26, MY); x.moveTo(MX + 26, MY); x.lineTo(MX + 90, MY); x.stroke()
  x.beginPath(); x.arc(MX, MY, 10, 0, 7); x.stroke()
  bars(x, W, H, d, [0.3 + 0.65 * Math.abs(Math.sin(s.t * 0.4)), 0.5 + 0.4 * Math.sin(s.t * 1.3), 0.7], d.data)
}

/** Drive: three wheel speeds and the resulting body velocity vector. */
const driveReadout: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  grid(x, W, H)
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  const R = 170
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2
    const sp = 0.5 + 0.5 * Math.sin(s.t * 1.5 + i * 2.1)
    x.strokeStyle = 'rgba(140,155,175,0.3)'
    x.lineWidth = 14
    x.beginPath(); x.arc(MX + Math.cos(a) * R, MY + Math.sin(a) * R, 54, 0, 7); x.stroke()
    x.strokeStyle = d.accent
    x.lineWidth = 14
    x.beginPath(); x.arc(MX + Math.cos(a) * R, MY + Math.sin(a) * R, 54, -Math.PI / 2, -Math.PI / 2 + sp * Math.PI * 2); x.stroke()
  }
  const va = s.t * 0.8
  x.strokeStyle = d.data
  x.lineWidth = 10
  x.beginPath(); x.moveTo(MX, MY); x.lineTo(MX + Math.cos(va) * 130, MY + Math.sin(va) * 130); x.stroke()
  x.fillStyle = '#ffffff'
  x.beginPath(); x.arc(MX, MY, 16, 0, 7); x.fill()
  bars(x, W, H, d, [0, 1, 2].map((i) => 0.5 + 0.5 * Math.sin(s.t * 1.5 + i * 2.1)), d.accent)
}

/** Harvest: rows swept left to right, bolls popping as they are picked. */
const harvestReadout: Painter = (x, W, H, d, s) => {
  base(x, W, H)
  header(x, W, d, s.u)
  grid(x, W, H)
  const MW = W - PANEL
  const MX = MW / 2
  const MY = (H + 54) / 2
  const SC = 560
  d.runs.forEach(([a, b]) => {
    x.strokeStyle = 'rgba(140,229,99,0.4)'
    x.lineWidth = 14
    x.beginPath(); x.moveTo(MX + a[0] * SC, MY + a[1] * SC); x.lineTo(MX + b[0] * SC, MY + b[1] * SC); x.stroke()
  })
  x.strokeStyle = d.data
  x.lineWidth = 6
  x.beginPath()
  s.trail.forEach((q, i) => (i ? x.lineTo(MX + q[0] * SC, MY + q[1] * SC) : x.moveTo(MX + q[0] * SC, MY + q[1] * SC)))
  x.stroke()
  d.pins.forEach((p, i) => {
    const px = MX + p.p[0] * SC
    const py = MY + p.p[1] * SC
    const hit = s.found.includes(i)
    x.fillStyle = hit ? d.accent : 'rgba(255,255,255,0.35)'
    x.beginPath(); x.arc(px, py, hit ? 22 : 13, 0, 7); x.fill()
  })
  findings(x, W, H, d, s.found, s.t)
}

export const READOUTS: Record<string, Painter> = {
  'go2-inspection': mapReadout,
  olive: factorGraph,
  'ai-robotics': graspReadout,
  whycode: fiducialReadout,
  'sepsis-atlas': retrievalReadout,
  'abu-robocon': mapReadout,
  'kiwi-drive': driveReadout,
  vanguard: mapReadout,
  agrobot: harvestReadout,
  'drone-systems': flightReadout,
}
