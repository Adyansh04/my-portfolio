"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * AbuRoboconSvg — top-down schematic for "R2 - ABU Robocon" (autonomous mecanum robot).
 * SVG line-art / blueprint vibe: a square chassis with 4 mecanum wheels (angled roller
 * hatching), omnidirectional strafe arrows that draw on, a target ball orbiting while a
 * YOLO detection box latches onto it, and an alignment crosshair locking on.
 * Drawn ONLY in the live accent color (plus transparent / dark). Recolors with theme.
 */
export function AbuRoboconSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // Chassis geometry (top-down square robot, centered-left of canvas)
  const C = { x: 150, y: 150 } // chassis center
  const half = 52 // half-width of square chassis
  const wheelW = 26 // mecanum wheel length (along chassis side)
  const wheelT = 14 // wheel thickness

  // The 4 mecanum wheels, each at a corner. dir flips the roller-hatch angle so opposite
  // corners mirror — exactly how a real mecanum drive is laid out.
  const wheels = useMemo(
    () =>
      [
        { id: "FL", x: C.x - half, y: C.y - half, ox: -1, oy: -1, dir: 1 },
        { id: "FR", x: C.x + half, y: C.y - half, ox: 1, oy: -1, dir: -1 },
        { id: "RL", x: C.x - half, y: C.y + half, ox: -1, oy: 1, dir: -1 },
        { id: "RR", x: C.x + half, y: C.y + half, ox: 1, oy: 1, dir: 1 },
      ] as const,
    [],
  )

  // Omnidirectional strafe arrows — 8 compass directions radiating from chassis center.
  const arrows = useMemo(
    () =>
      [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180
        const r0 = 74
        const r1 = 96
        const c = Math.cos(a)
        const s = Math.sin(a)
        return {
          deg,
          x1: C.x + c * r0,
          y1: C.y + s * r0,
          x2: C.x + c * r1,
          y2: C.y + s * r1,
          // arrowhead barbs
          hx: C.x + c * r1,
          hy: C.y + s * r1,
          a,
        }
      }),
    [],
  )

  // Target ball orbit — an elliptical path on the right side that the robot tracks.
  const orbit = { cx: 300, cy: 140, rx: 66, ry: 52 }
  const orbitD = useMemo(
    () =>
      `M${orbit.cx + orbit.rx},${orbit.cy} A${orbit.rx},${orbit.ry} 0 1 1 ${orbit.cx - orbit.rx},${orbit.cy} A${orbit.rx},${orbit.ry} 0 1 1 ${orbit.cx + orbit.rx},${orbit.cy}`,
    [],
  )

  // Static ball position for the reduced-motion frame.
  const ballStatic = { x: orbit.cx + orbit.rx * Math.cos(-0.6), y: orbit.cy + orbit.ry * Math.sin(-0.6) }

  // Common stroke styling
  const thin = 1
  const glow = `drop-shadow(0 0 3px rgba(${rgb}, 0.55))`

  return (
    <div className={cn("absolute inset-0 h-full w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        style={{ background: "transparent" }}
      >
        <defs>
          {/* faint blueprint grid */}
          <pattern id="abu-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="abu-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="abu-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#abu-fade)" />
          </mask>
          {/* directional fade for the orbit trail */}
          <linearGradient id="abu-orbit" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.05" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#abu-grid)"
          mask="url(#abu-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* === CHASSIS: square robot body draws on === */}
        <g style={{ filter: glow }}>
          {reduce ? (
            <rect
              x={C.x - half}
              y={C.y - half}
              width={half * 2}
              height={half * 2}
              rx={6}
              fill={`rgba(${rgb}, 0.05)`}
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.9}
            />
          ) : (
            <>
              <motion.rect
                x={C.x - half}
                y={C.y - half}
                width={half * 2}
                height={half * 2}
                rx={6}
                fill="transparent"
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.9}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 1] }}
                transition={{ duration: 6, times: [0, 0.3, 1], repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.rect
                x={C.x - half}
                y={C.y - half}
                width={half * 2}
                height={half * 2}
                rx={6}
                fill={accent}
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.08, 0.05] }}
                transition={{ duration: 6, times: [0, 0.35, 1], repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}

          {/* inner deck outline + heading indicator (front = up) */}
          <rect
            x={C.x - half + 12}
            y={C.y - half + 12}
            width={(half - 12) * 2}
            height={(half - 12) * 2}
            rx={3}
            fill="none"
            stroke={accent}
            strokeWidth={0.75}
            strokeOpacity={0.4}
          />
          {/* heading chevron pointing to chassis front */}
          <path
            d={`M${C.x - 7},${C.y - 8} L${C.x},${C.y - 18} L${C.x + 7},${C.y - 8}`}
            fill="none"
            stroke={accent}
            strokeWidth={thin}
            strokeOpacity={0.75}
          />
          {/* center hub */}
          <circle cx={C.x} cy={C.y} r={3} fill={`rgba(${rgb}, 0.3)`} stroke={accent} strokeWidth={0.75} />
        </g>

        {/* === MECANUM WHEELS: 4 corners with angled roller hatching === */}
        <g style={{ filter: glow }}>
          {wheels.map((w) => {
            // wheel body rect (long axis vertical = aligned to chassis sides)
            const rx = w.x - wheelT / 2
            const ry = w.y - wheelW / 2
            // roller hatch lines inside the wheel, angled per dir (mecanum 45°)
            const rollers = [-8, -2, 4, 10].map((off, k) => {
              const cy = w.y + off
              const dx = (wheelT / 2 - 1) * w.dir
              return (
                <line
                  key={k}
                  x1={w.x - dx}
                  y1={cy - 4}
                  x2={w.x + dx}
                  y2={cy + 4}
                  stroke={accent}
                  strokeWidth={0.75}
                  strokeOpacity={0.65}
                />
              )
            })
            return (
              <g key={w.id}>
                <rect
                  x={rx}
                  y={ry}
                  width={wheelT}
                  height={wheelW}
                  rx={3}
                  fill={`rgba(${rgb}, 0.06)`}
                  stroke={accent}
                  strokeWidth={thin}
                  strokeOpacity={0.85}
                />
                {rollers}
              </g>
            )
          })}
        </g>

        {/* === OMNIDIRECTIONAL STRAFE ARROWS === */}
        <g style={{ filter: glow }}>
          {arrows.map((ar, i) => {
            // arrowhead barbs computed from direction
            const back = ar.a + Math.PI
            const b1 = back + 0.4
            const b2 = back - 0.4
            const len = 6
            const head = `M${ar.hx},${ar.hy} L${ar.hx + Math.cos(b1) * len},${ar.hy + Math.sin(b1) * len} M${ar.hx},${ar.hy} L${ar.hx + Math.cos(b2) * len},${ar.hy + Math.sin(b2) * len}`
            if (reduce) {
              return (
                <g key={ar.deg} stroke={accent} strokeWidth={thin} strokeOpacity={0.55} fill="none">
                  <line x1={ar.x1} y1={ar.y1} x2={ar.x2} y2={ar.y2} />
                  <path d={head} />
                </g>
              )
            }
            return (
              <motion.g
                key={ar.deg}
                stroke={accent}
                strokeWidth={thin}
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.85, 0.2, 0.2] }}
                transition={{
                  duration: 4,
                  times: [0, 0.2, 0.55, 1],
                  delay: i * 0.18,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  ease: "easeInOut",
                }}
              >
                <line x1={ar.x1} y1={ar.y1} x2={ar.x2} y2={ar.y2} />
                <path d={head} />
              </motion.g>
            )
          })}
        </g>

        {/* === TARGET ORBIT: faint guide path the ball travels === */}
        <path
          d={orbitD}
          fill="none"
          stroke={accent}
          strokeWidth={0.75}
          strokeOpacity={0.18}
          strokeDasharray="3 5"
        />

        {/* alignment line from chassis hub toward the orbit center / ball */}
        {reduce ? (
          <line
            x1={C.x}
            y1={C.y}
            x2={ballStatic.x}
            y2={ballStatic.y}
            stroke={accent}
            strokeWidth={0.75}
            strokeOpacity={0.4}
            strokeDasharray="2 4"
            style={{ filter: glow }}
          />
        ) : null}

        {/* === BALL + YOLO BOX + ALIGNMENT CROSSHAIR === */}
        {reduce ? (
          <g style={{ filter: glow }} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
            {/* ball */}
            <circle cx={ballStatic.x} cy={ballStatic.y} r={6} fill={`rgba(${rgb}, 0.18)`} stroke={accent} strokeWidth={thin} />
            <circle cx={ballStatic.x} cy={ballStatic.y} r={1.6} fill={accent} />
            {/* YOLO corner-bracket box */}
            <YoloBox x={ballStatic.x} y={ballStatic.y} accent={accent} thin={thin} rgb={rgb} />
          </g>
        ) : (
          <motion.g
            style={{ filter: glow, offsetPath: `path("${orbitD}")` as unknown as string }}
            animate={{ offsetDistance: ["0%", "100%"] }}
            transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {/* alignment crosshair locked on the ball (long cross-lines) */}
            <line x1={-20} y1={0} x2={20} y2={0} stroke={accent} strokeWidth={0.75} strokeOpacity={0.55} />
            <line x1={0} y1={-20} x2={0} y2={20} stroke={accent} strokeWidth={0.75} strokeOpacity={0.55} />
            {/* lock ring */}
            <motion.circle
              r={11}
              fill="none"
              stroke={accent}
              strokeWidth={0.75}
              strokeDasharray="3 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            {/* ball */}
            <circle r={6} fill={`rgba(${rgb}, 0.18)`} stroke={accent} strokeWidth={thin} />
            <circle r={1.6} fill={accent} />
            {/* YOLO detection box bracketing the ball */}
            <YoloBox x={0} y={0} accent={accent} thin={thin} rgb={rgb} />
          </motion.g>
        )}

        {/* status caption */}
        <text
          x="16"
          y={H - 22}
          fontSize="7"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill={accent}
          fillOpacity={0.65}
          letterSpacing="1"
        >
          MECANUM // YOLO TRACK
        </text>
        {!reduce && (
          <motion.text
            x="16"
            y={H - 12}
            fontSize="7"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill={accent}
            letterSpacing="1"
            animate={{ fillOpacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ALIGN
          </motion.text>
        )}
      </svg>
    </div>
  )
}

/** YOLO-style detection box: 4 corner brackets + a tiny confidence label. */
function YoloBox({
  x,
  y,
  accent,
  thin,
  rgb,
}: {
  x: number
  y: number
  accent: string
  thin: number
  rgb: string
}) {
  const s = 13 // half-size of the box
  const c = 5 // corner bracket length
  const L = x - s
  const R = x + s
  const T = y - s
  const B = y + s
  return (
    <g stroke={accent} strokeWidth={thin} fill="none" strokeOpacity={0.95}>
      {/* faint fill */}
      <rect x={L} y={T} width={s * 2} height={s * 2} fill={`rgba(${rgb}, 0.05)`} stroke="none" />
      {/* corner brackets */}
      <path d={`M${L},${T + c} L${L},${T} L${L + c},${T}`} />
      <path d={`M${R - c},${T} L${R},${T} L${R},${T + c}`} />
      <path d={`M${L},${B - c} L${L},${B} L${L + c},${B}`} />
      <path d={`M${R - c},${B} L${R},${B} L${R},${B - c}`} />
      {/* confidence label tab */}
      <text
        x={L}
        y={T - 3}
        fontSize="6"
        fill={accent}
        fillOpacity={0.85}
        stroke="none"
        letterSpacing="0.4"
      >
        BALL 0.98
      </text>
    </g>
  )
}