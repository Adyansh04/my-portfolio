"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"

type Marker = {
  id: string
  x: number
  y: number
  r: number
}

// Fiducial markers laid out across the schematic field (viewBox 0..400 x 0..300)
const MARKERS: Marker[] = [
  { id: "FID-01", x: 96, y: 92, r: 30 },
  { id: "FID-02", x: 300, y: 80, r: 24 },
  { id: "FID-03", x: 232, y: 196, r: 34 },
  { id: "FID-04", x: 112, y: 214, r: 20 },
]

const VW = 400
const VH = 300

// Each marker gets a lock window inside the loop; reticle travels then dwells.
const CYCLE = MARKERS.length // logical units, one per marker

export function WhyCodeSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduced = useReducedMotion()
  const uid = useId().replace(/[:]/g, "")

  const accent = colors.primary
  const rgb = colors.primaryRgb

  // t in [0, CYCLE): single rAF-driven progress value (one loop only)
  const [t, setT] = useState(0)

  useEffect(() => {
    if (reduced) return
    let raf = 0
    let start = 0
    const PERIOD = MARKERS.length * 1700 // ms per full sweep

    const tick = (now: number) => {
      if (!start) start = now
      const elapsed = (now - start) % PERIOD
      setT((elapsed / PERIOD) * CYCLE)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  // Derive reticle position + per-marker lock state from t.
  const { reticle, locks, loadPct, scanText } = useMemo(() => {
    // For the static/reduced frame, lock onto the largest marker.
    const tt = reduced ? CYCLE - 0.45 : t

    const idx = Math.floor(tt) % MARKERS.length
    const nextIdx = (idx + 1) % MARKERS.length
    const frac = tt - Math.floor(tt) // 0..1 within current segment

    // Travel phase 0..0.55, dwell/lock phase 0.55..1
    const travel = Math.min(frac / 0.55, 1)
    const ease = travel * travel * (3 - 2 * travel) // smoothstep
    const from = MARKERS[idx]
    const to = MARKERS[nextIdx]

    const rx = from.x + (to.x - from.x) * ease
    const ry = from.y + (to.y - from.y) * ease

    // Locked when dwelling on the target (frac in lock phase) -> target = nextIdx
    const lockPhase = frac >= 0.55
    const lockProgress = lockPhase ? (frac - 0.55) / 0.45 : 0 // 0..1
    const lockedIdx = lockPhase ? nextIdx : -1

    const locks = MARKERS.map((m, i) => ({
      ...m,
      locked: reduced ? i === 2 : i === lockedIdx,
      lockProgress: reduced ? (i === 2 ? 1 : 0) : i === lockedIdx ? lockProgress : 0,
    }))

    const focusIdx = reduced ? 2 : lockPhase ? nextIdx : nextIdx
    const focus = MARKERS[focusIdx]

    // Reticle size: tight when locked, slightly larger while traveling
    const reticleR = lockPhase
      ? focus.r + 14 - 6 * lockProgress
      : 40

    // Load bar: 180% -> 15% over the dwell; high while scanning
    const loadPct = reduced
      ? 15
      : lockPhase
        ? 180 - (180 - 15) * (lockProgress * lockProgress)
        : 180

    const scanText = reduced
      ? "LOCK"
      : lockPhase
        ? lockProgress > 0.75
          ? "LOCK"
          : "ALIGN"
        : "SCAN"

    return {
      reticle: { x: reticle_clampX(rx), y: reticle_clampY(ry), r: reticleR, locked: lockPhase },
      locks,
      loadPct,
      scanText,
    }
  }, [t, reduced])

  const glow = `drop-shadow(0 0 3px rgba(${rgb}, 0.55))`
  const glowStrong = `drop-shadow(0 0 5px rgba(${rgb}, 0.75))`

  const gridLines = useMemo(() => buildGrid(), [])

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid slice"
      className={["absolute inset-0 h-full w-full", className].filter(Boolean).join(" ")}
      style={{ background: "transparent", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-vig`} cx="50%" cy="46%" r="72%">
          <stop offset="0%" stopColor={`rgba(${rgb}, 0.05)`} />
          <stop offset="62%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
        <linearGradient id={`${uid}-load`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={`rgba(${rgb}, 0.25)`} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <style>{`
          @keyframes ${uid}-draw { to { stroke-dashoffset: 0; } }
          @keyframes ${uid}-spin { to { transform: rotate(360deg); } }
          @keyframes ${uid}-pulse { 0%,100% { opacity: .25 } 50% { opacity: .7 } }
          @keyframes ${uid}-blink { 0%,100% { opacity: .9 } 50% { opacity: .35 } }
          .${uid}-draw { stroke-dasharray: var(--len); stroke-dashoffset: var(--len);
            animation: ${uid}-draw 1.1s ease forwards; }
          .${uid}-spin { transform-box: fill-box; transform-origin: center;
            animation: ${uid}-spin 9s linear infinite; }
          .${uid}-pulse { animation: ${uid}-pulse 2.4s ease-in-out infinite; }
          .${uid}-blink { animation: ${uid}-blink 1.4s steps(2,end) infinite; }
          @media (prefers-reduced-motion: reduce) {
            .${uid}-draw, .${uid}-spin, .${uid}-pulse, .${uid}-blink { animation: none !important; }
            .${uid}-draw { stroke-dashoffset: 0 !important; }
          }
        `}</style>
      </defs>

      {/* vignette / field tint */}
      <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-vig)`} />

      {/* schematic grid */}
      <g stroke={`rgba(${rgb}, 0.10)`} strokeWidth={0.6}>
        {gridLines.map((d, i) => (
          <line key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} />
        ))}
      </g>

      {/* frame + corner brackets */}
      <g
        fill="none"
        stroke={`rgba(${rgb}, 0.45)`}
        strokeWidth={1}
        style={{ filter: glow }}
      >
        <rect x="10" y="10" width={VW - 20} height={VH - 20} rx="6" strokeOpacity={0.35} />
        {cornerBrackets(10, 10, VW - 20, VH - 20, 16).map((p, i) => (
          <path key={i} d={p} />
        ))}
      </g>

      {/* connector polylines between fiducials (schematic wiring) */}
      <g
        fill="none"
        stroke={`rgba(${rgb}, 0.30)`}
        strokeWidth={0.9}
        strokeDasharray="3 4"
        style={{ filter: glow }}
      >
        <path
          className={reduced ? undefined : `${uid}-draw`}
          style={{ ["--len" as any]: 700 }}
          d={polyPath(MARKERS)}
        />
      </g>

      {/* fiducial ring markers */}
      {locks.map((m, i) => (
        <FiducialMarker
          key={m.id}
          marker={m}
          accent={accent}
          rgb={rgb}
          uid={`${uid}-m${i}`}
          spinClass={reduced ? "" : `${uid}-spin`}
          pulseClass={reduced ? "" : `${uid}-pulse`}
          drawClass={reduced ? "" : `${uid}-draw`}
          glow={glow}
        />
      ))}

      {/* targeting reticle */}
      <Reticle
        x={reticle.x}
        y={reticle.y}
        r={reticle.r}
        locked={reticle.locked}
        accent={accent}
        rgb={rgb}
        glow={glowStrong}
        blinkClass={reduced ? "" : `${uid}-blink`}
        label={
          reticle.locked
            ? locks.find((l) => l.locked)?.id ?? "FID-—"
            : "ACQUIRING"
        }
      />

      {/* HUD: header + load bar */}
      <g fontFamily="ui-monospace, 'SFMono-Regular', Menlo, monospace">
        <text
          x="20"
          y="28"
          fill={accent}
          fontSize="9"
          letterSpacing="2"
          style={{ filter: glow }}
        >
          WHYCODE // VISION
        </text>
        <text
          x={VW - 20}
          y="28"
          fill={`rgba(${rgb}, 0.8)`}
          fontSize="8"
          letterSpacing="1.5"
          textAnchor="end"
        >
          {`MARKERS:${String(MARKERS.length).padStart(2, "0")}`}
        </text>

        {/* load bar */}
        <g transform={`translate(20, ${VH - 26})`}>
          <text x="0" y="-6" fill={`rgba(${rgb}, 0.75)`} fontSize="7.5" letterSpacing="1.5">
            CPU OPT
          </text>
          <rect
            x="0"
            y="0"
            width="220"
            height="7"
            rx="3.5"
            fill="none"
            stroke={`rgba(${rgb}, 0.4)`}
            strokeWidth={0.8}
          />
          {/* fill: width maps 15..180% across the bar visually (clamped) */}
          <rect
            x="1.2"
            y="1.2"
            height="4.6"
            rx="2.3"
            width={loadBarWidth(loadPct)}
            fill={`url(#${uid}-load)`}
            style={{ filter: glow }}
          />
          {/* tick marks */}
          <g stroke={`rgba(${rgb}, 0.30)`} strokeWidth={0.6}>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={220 * f} y1="0" x2={220 * f} y2="7" />
            ))}
          </g>
          <text
            x="232"
            y="6.5"
            fill={accent}
            fontSize="8.5"
            letterSpacing="0.5"
            style={{ filter: glow }}
          >
            {`${Math.round(loadPct)}%`}
          </text>
        </g>

        {/* status pill */}
        <g transform={`translate(${VW - 20}, ${VH - 22})`} textAnchor="end">
          <text
            x="0"
            y="0"
            fill={accent}
            fontSize="9"
            letterSpacing="2"
            className={reduced ? "" : `${uid}-blink`}
            style={{ filter: glow }}
          >
            {scanText}
          </text>
        </g>
      </g>
    </svg>
  )
}

/* ---------- subcomponents ---------- */

function FiducialMarker({
  marker,
  accent,
  rgb,
  uid,
  spinClass,
  pulseClass,
  drawClass,
  glow,
}: {
  marker: Marker & { locked: boolean; lockProgress: number }
  accent: string
  rgb: string
  uid: string
  spinClass: string
  pulseClass: string
  drawClass: string
  glow: string
}) {
  const { x, y, r, locked, lockProgress } = marker
  const ringOuterLen = Math.round(2 * Math.PI * r)
  const ringMidLen = Math.round(2 * Math.PI * (r * 0.62))
  const tickR = r + 6

  return (
    <g style={{ filter: glow }}>
      {/* outer ring */}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={locked ? accent : `rgba(${rgb}, 0.55)`}
        strokeWidth={locked ? 1.6 : 1.1}
        className={drawClass}
        style={{ ["--len" as any]: ringOuterLen }}
      />
      {/* concentric mid ring (dashed, rotating) */}
      <circle
        cx={x}
        cy={y}
        r={r * 0.62}
        fill="none"
        stroke={`rgba(${rgb}, 0.6)`}
        strokeWidth={0.9}
        strokeDasharray={`${ringMidLen * 0.12} ${ringMidLen * 0.06}`}
        className={spinClass}
      />
      {/* inner core */}
      <circle cx={x} cy={y} r={r * 0.26} fill="none" stroke={accent} strokeWidth={1} />
      <circle cx={x} cy={y} r={1.6} fill={accent} className={pulseClass} />

      {/* crosshair through center */}
      <g stroke={`rgba(${rgb}, 0.5)`} strokeWidth={0.7}>
        <line x1={x - r * 0.9} y1={y} x2={x - r * 0.34} y2={y} />
        <line x1={x + r * 0.34} y1={y} x2={x + r * 0.9} y2={y} />
        <line x1={x} y1={y - r * 0.9} x2={x} y2={y - r * 0.34} />
        <line x1={x} y1={y + r * 0.34} x2={x} y2={y + r * 0.9} />
      </g>

      {/* registration ticks at cardinal points */}
      <g stroke={accent} strokeWidth={locked ? 1.4 : 0.9}>
        {[0, 90, 180, 270].map((a) => {
          const rad = (a * Math.PI) / 180
          const ix = x + Math.cos(rad) * (tickR - 4)
          const iy = y + Math.sin(rad) * (tickR - 4)
          const ox = x + Math.cos(rad) * (tickR + (locked ? 3 * lockProgress : 0))
          const oy = y + Math.sin(rad) * (tickR + (locked ? 3 * lockProgress : 0))
          return <line key={a} x1={ix} y1={iy} x2={ox} y2={oy} strokeOpacity={locked ? 1 : 0.55} />
        })}
      </g>

      {/* id label */}
      <text
        x={x}
        y={y + r + 13}
        fill={locked ? accent : `rgba(${rgb}, 0.6)`}
        fontSize="7"
        letterSpacing="1.2"
        textAnchor="middle"
        fontFamily="ui-monospace, 'SFMono-Regular', Menlo, monospace"
      >
        {marker.id}
      </text>
    </g>
  )
}

function Reticle({
  x,
  y,
  r,
  locked,
  accent,
  rgb,
  glow,
  blinkClass,
  label,
}: {
  x: number
  y: number
  r: number
  locked: boolean
  accent: string
  rgb: string
  glow: string
  blinkClass: string
  label: string
}) {
  const c = r // half-size of bounding box
  const tick = Math.max(6, r * 0.32)
  const stroke = accent
  const corner = (cx: number, cy: number, sx: number, sy: number) =>
    `M ${cx + sx * tick} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * tick}`

  return (
    <g style={{ filter: glow }}>
      {/* four corner brackets */}
      <g fill="none" stroke={stroke} strokeWidth={locked ? 1.8 : 1.2} strokeLinecap="round">
        <path d={corner(x - c, y - c, 1, 1)} />
        <path d={corner(x + c, y - c, -1, 1)} />
        <path d={corner(x + c, y + c, -1, -1)} />
        <path d={corner(x - c, y + c, 1, -1)} />
      </g>

      {/* center micro-cross */}
      <g stroke={stroke} strokeWidth={1}>
        <line x1={x - 4} y1={y} x2={x + 4} y2={y} strokeOpacity={locked ? 0.9 : 0.4} />
        <line x1={x} y1={y - 4} x2={x} y2={y + 4} strokeOpacity={locked ? 0.9 : 0.4} />
      </g>

      {/* lock label */}
      <g
        transform={`translate(${x + c + 6}, ${y - c + 2})`}
        className={locked ? "" : blinkClass}
      >
        <rect
          x="0"
          y="-7"
          width={label.length * 5.2 + 8}
          height="11"
          rx="2"
          fill={`rgba(${rgb}, 0.10)`}
          stroke={`rgba(${rgb}, 0.5)`}
          strokeWidth={0.7}
        />
        <text
          x="4"
          y="1.5"
          fill={accent}
          fontSize="7"
          letterSpacing="1"
          fontFamily="ui-monospace, 'SFMono-Regular', Menlo, monospace"
        >
          {label}
        </text>
      </g>
    </g>
  )
}

/* ---------- helpers ---------- */

function reticle_clampX(x: number) {
  return Math.max(28, Math.min(VW - 28, x))
}
function reticle_clampY(y: number) {
  return Math.max(28, Math.min(VH - 28, y))
}

function loadBarWidth(pct: number) {
  // map 15..180 -> 0..218 (clamped). High values overflow visually = "overloaded".
  const lo = 15
  const hi = 180
  const f = (Math.min(hi, Math.max(lo, pct)) - lo) / (hi - lo)
  return Math.max(2, f * 217.6)
}

function polyPath(markers: Marker[]) {
  if (!markers.length) return ""
  return markers
    .map((m, i) => `${i === 0 ? "M" : "L"} ${m.x.toFixed(1)} ${m.y.toFixed(1)}`)
    .join(" ")
}

function buildGrid() {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  const step = 40
  for (let x = step; x < VW; x += step) lines.push({ x1: x, y1: 12, x2: x, y2: VH - 12 })
  for (let y = step; y < VH; y += step) lines.push({ x1: 12, y1: y, x2: VW - 12, y2: y })
  return lines
}

function cornerBrackets(x: number, y: number, w: number, h: number, len: number) {
  const r = x + w
  const b = y + h
  return [
    `M ${x} ${y + len} L ${x} ${y} L ${x + len} ${y}`,
    `M ${r - len} ${y} L ${r} ${y} L ${r} ${y + len}`,
    `M ${r} ${b - len} L ${r} ${b} L ${r - len} ${b}`,
    `M ${x + len} ${b} L ${x} ${b} L ${x} ${b - len}`,
  ]
}
