"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * DroneSystemsSvg — schematic for "Development of Drone Systems" (Crazyflie/Tello
 * indoor autonomy + swarm). SVG line-art / blueprint vibe: 2-3 quadrotor glyphs
 * (body + 4 spinning rotor circles) fly along dashed FORMATION paths, multiranger
 * distance BEAMS probe outward from the lead craft, and SLAM map points pulse.
 * Drawn ONLY in the live accent color (plus transparent / dark). Recolors with theme.
 */
export function DroneSystemsSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // Formation paths — looping flight routes the swarm rides (offsetPath).
  const formations = useMemo(
    () => [
      {
        id: "lead",
        // wide sweeping loop through the cell — the lead craft
        d: "M70,90 C150,40 260,60 330,120 C360,150 320,210 240,220 C160,230 90,200 70,150 Z",
        dur: 22,
        start: "0%",
        label: "CF-01",
      },
      {
        id: "wing-l",
        // tighter inner loop, offset phase
        d: "M120,160 C170,120 250,120 280,170 C300,205 240,225 180,215 C140,208 110,195 120,160 Z",
        dur: 18,
        start: "38%",
        label: "CF-02",
      },
      {
        id: "wing-r",
        // small high orbit
        d: "M210,70 C260,55 320,80 325,120 C328,150 285,160 255,140 C220,118 185,95 210,70 Z",
        dur: 15,
        start: "70%",
        label: "CF-03",
      },
    ],
    [],
  )

  // SLAM map points — scattered detected features inside the cell.
  const slamPts = useMemo(
    () => [
      [96, 70], [148, 56], [228, 52], [304, 84], [338, 134],
      [318, 196], [252, 232], [168, 236], [102, 198], [74, 138],
      [196, 104], [266, 156], [150, 170], [288, 118],
    ] as [number, number][],
    [],
  )

  // Multiranger beam angles (deg) fanning out from the lead craft anchor.
  const beamAngles = useMemo(() => [-90, -36, 18, 72, 144, -144], [])
  const beamOrigin = { x: 200, y: 150 }
  const beamLen = 78

  // Common stroke styling
  const thin = 1
  const glow = `drop-shadow(0 0 3px rgba(${rgb}, 0.55))`

  // A single quadrotor glyph — square body + 4 rotor circles (rotors spin).
  const Quad = ({ spin = true }: { spin?: boolean }) => {
    const arm = 7.5
    const rotor = 3.4
    const rotors: [number, number][] = [
      [-arm, -arm],
      [arm, -arm],
      [arm, arm],
      [-arm, arm],
    ]
    return (
      <g style={{ filter: glow }}>
        {/* arms */}
        <line x1={-arm} y1={-arm} x2={arm} y2={arm} stroke={accent} strokeWidth={thin} strokeOpacity={0.8} />
        <line x1={arm} y1={-arm} x2={-arm} y2={arm} stroke={accent} strokeWidth={thin} strokeOpacity={0.8} />
        {/* body */}
        <rect x={-3.2} y={-3.2} width={6.4} height={6.4} rx={1} fill={`rgba(${rgb}, 0.18)`} stroke={accent} strokeWidth={thin} />
        <circle r={1.1} fill={accent} />
        {/* rotors */}
        {rotors.map(([rx, ry], i) =>
          !spin || reduce ? (
            <circle key={i} cx={rx} cy={ry} r={rotor} fill="none" stroke={accent} strokeWidth={0.75} strokeOpacity={0.85} />
          ) : (
            <motion.g
              key={i}
              style={{ originX: `${rx}px`, originY: `${ry}px` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            >
              <circle cx={rx} cy={ry} r={rotor} fill="none" stroke={accent} strokeWidth={0.75} strokeOpacity={0.85} />
              {/* spinning blade tick */}
              <line x1={rx} y1={ry} x2={rx + rotor} y2={ry} stroke={accent} strokeWidth={0.75} strokeOpacity={0.9} />
              <line x1={rx} y1={ry} x2={rx - rotor} y2={ry} stroke={accent} strokeWidth={0.75} strokeOpacity={0.9} />
            </motion.g>
          ),
        )}
      </g>
    )
  }

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
          <pattern id="drone-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="drone-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="drone-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#drone-fade)" />
          </mask>
          {/* multiranger beam gradient — bright at craft, fades outward */}
          <linearGradient id="drone-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#drone-grid)"
          mask="url(#drone-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* === FORMATION PATHS: draw-on dashed flight routes === */}
        <g style={{ filter: glow }}>
          {formations.map((f, i) =>
            reduce ? (
              <path
                key={f.id}
                d={f.d}
                fill="none"
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.4}
                strokeDasharray="4 5"
              />
            ) : (
              <motion.path
                key={f.id}
                d={f.d}
                fill="none"
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.4}
                strokeDasharray="4 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
                transition={{
                  duration: 9,
                  times: [0, 0.25, 0.9, 1],
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "easeInOut",
                }}
              />
            ),
          )}
        </g>

        {/* === SLAM MAP POINTS: pulsing detected features === */}
        <g style={{ filter: glow }}>
          {slamPts.map(([x, y], i) =>
            reduce ? (
              <g key={i}>
                <circle cx={x} cy={y} r={1.4} fill={`rgba(${rgb}, 0.5)`} />
                <path
                  d={`M${x - 2.4},${y} L${x + 2.4},${y} M${x},${y - 2.4} L${x},${y + 2.4}`}
                  stroke={accent}
                  strokeWidth={0.6}
                  strokeOpacity={0.6}
                />
              </g>
            ) : (
              <g key={i}>
                <path
                  d={`M${x - 2.4},${y} L${x + 2.4},${y} M${x},${y - 2.4} L${x},${y + 2.4}`}
                  stroke={accent}
                  strokeWidth={0.6}
                  strokeOpacity={0.55}
                />
                <motion.circle
                  cx={x}
                  cy={y}
                  r={1.4}
                  fill={accent}
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: [0.2, 0.85, 0.2] }}
                  transition={{
                    duration: 2.6,
                    delay: (i % 6) * 0.32,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </g>
            ),
          )}
        </g>

        {/* === MULTIRANGER BEAMS: distance probes from lead craft === */}
        <g>
          {beamAngles.map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const ex = beamOrigin.x + Math.cos(rad) * beamLen
            const ey = beamOrigin.y + Math.sin(rad) * beamLen
            return reduce ? (
              <g key={i}>
                <line
                  x1={beamOrigin.x}
                  y1={beamOrigin.y}
                  x2={ex}
                  y2={ey}
                  stroke="url(#drone-beam)"
                  strokeWidth={thin}
                />
                <circle cx={ex} cy={ey} r={2} fill="none" stroke={accent} strokeWidth={0.75} style={{ filter: glow }} />
              </g>
            ) : (
              <g key={i}>
                <motion.line
                  x1={beamOrigin.x}
                  y1={beamOrigin.y}
                  x2={ex}
                  y2={ey}
                  stroke="url(#drone-beam)"
                  strokeWidth={thin}
                  initial={{ pathLength: 0.3, opacity: 0.3 }}
                  animate={{ pathLength: [0.3, 1, 0.55, 0.3], opacity: [0.3, 0.9, 0.6, 0.3] }}
                  transition={{
                    duration: 3,
                    delay: i * 0.25,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* range hit marker pinging at the tip */}
                <motion.circle
                  cx={ex}
                  cy={ey}
                  fill="none"
                  stroke={accent}
                  strokeWidth={0.75}
                  style={{ filter: glow }}
                  initial={{ r: 1, opacity: 0 }}
                  animate={{ r: [1, 5], opacity: [0.7, 0] }}
                  transition={{
                    duration: 1.6,
                    delay: i * 0.25 + 0.6,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              </g>
            )
          })}
        </g>

        {/* === QUADROTOR GLYPHS: fly along formation paths === */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {formations.map((f) => {
            if (reduce) {
              // static: park each craft at the path start (approx via path "M" coords)
              const m = f.d.match(/M([\d.]+),([\d.]+)/)
              const px = m ? parseFloat(m[1]) : 200
              const py = m ? parseFloat(m[2]) : 150
              return (
                <g key={f.id} transform={`translate(${px}, ${py})`}>
                  <Quad spin={false} />
                  <text x={12} y={-8} fontSize="7" fill={accent} fillOpacity={0.85} letterSpacing="0.5">
                    {f.label}
                  </text>
                </g>
              )
            }
            return (
              <motion.g
                key={f.id}
                style={{ offsetPath: `path("${f.d}")` as unknown as string }}
                animate={{ offsetDistance: [f.start, `calc(${f.start} + 100%)`] }}
                transition={{ duration: f.dur, repeat: Infinity, ease: "linear" }}
              >
                <Quad />
                <text x={12} y={-8} fontSize="7" fill={accent} fillOpacity={0.85} letterSpacing="0.5">
                  {f.label}
                </text>
              </motion.g>
            )
          })}
        </g>

        {/* lead-craft anchor node where multiranger originates */}
        <g style={{ filter: glow }}>
          {reduce ? (
            <circle cx={beamOrigin.x} cy={beamOrigin.y} r={3} fill={`rgba(${rgb}, 0.3)`} stroke={accent} strokeWidth={thin} />
          ) : (
            <>
              <motion.circle
                cx={beamOrigin.x}
                cy={beamOrigin.y}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                initial={{ r: 3, opacity: 0.6 }}
                animate={{ r: [3, 12], opacity: [0.6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
              />
              <circle cx={beamOrigin.x} cy={beamOrigin.y} r={2.4} fill={`rgba(${rgb}, 0.3)`} stroke={accent} strokeWidth={thin} />
            </>
          )}
        </g>

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
          SWARM // SLAM
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
            NAV
          </motion.text>
        )}
      </svg>
    </div>
  )
}
