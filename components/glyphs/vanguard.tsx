"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * VanguardSvg — overhead-camera guided A* navigation schematic for "Vanguard (eYRC)".
 * SVG line-art / blueprint vibe: a top-down arena cell grid, flagged DANGER cells, a
 * "Watchtower" camera whose FOV cone sweeps the arena, and an A* PATH that draws itself
 * from START to GOAL routing AROUND the danger cells, with a probe running the route.
 * Drawn ONLY in the live accent color (plus transparent / dark). Recolors with theme.
 */
export function VanguardSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // Arena cell grid geometry (top-down navigation field).
  const cell = 36
  const cols = 8
  const rows = 6
  const ox = 56 // arena origin x
  const oy = 42 // arena origin y

  // helper: center of cell (c=col, r=row)
  const cc = (c: number, r: number): [number, number] => [
    ox + c * cell + cell / 2,
    oy + r * cell + cell / 2,
  ]

  // Flagged danger cells (the A* route must avoid these).
  const dangers = useMemo(
    () => [
      { c: 3, r: 2 },
      { c: 4, r: 2 },
      { c: 5, r: 3 },
    ],
    [],
  )

  // START (bottom-left) and GOAL (top-right) nodes, in cell coords.
  const start = { c: 0, r: 5 }
  const goal = { c: 7, r: 0 }

  // A* path through cell centers — manhattan steps routing AROUND danger cells.
  const pathCells = useMemo(
    () =>
      [
        [0, 5],
        [1, 5],
        [2, 5],
        [2, 4],
        [2, 3],
        [3, 3],
        [4, 3],
        [4, 4],
        [5, 4],
        [6, 4],
        [6, 3],
        [6, 2],
        [6, 1],
        [7, 1],
        [7, 0],
      ] as [number, number][],
    [],
  )

  const pathD = useMemo(
    () =>
      pathCells
        .map((p, i) => {
          const [x, y] = cc(p[0], p[1])
          return `${i === 0 ? "M" : "L"}${x},${y}`
        })
        .join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathCells],
  )

  // Watchtower camera node (top-right corner outside the arena) + FOV cone.
  const cam = { x: ox + cols * cell + 6, y: oy - 8 }
  const fovLen = 230
  const fovHalf = 26 // half-width of cone at the far end

  // Common stroke styling
  const thin = 1
  const glow = `drop-shadow(0 0 3px rgba(${rgb}, 0.55))`

  const startC = cc(start.c, start.r)
  const goalC = cc(goal.c, goal.r)

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
          <pattern id="vgd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="vgd-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="vgd-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#vgd-fade)" />
          </mask>
          {/* camera FOV cone gradient (bright at lens, fades into arena) */}
          <linearGradient id="vgd-fov" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          {/* danger-cell hatch fill */}
          <pattern
            id="vgd-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke={accent}
              strokeWidth="0.75"
              strokeOpacity="0.5"
            />
          </pattern>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#vgd-grid)"
          mask="url(#vgd-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* === ARENA CELL GRID === */}
        <g stroke={accent} strokeWidth="0.5" strokeOpacity={0.28} fill="none">
          {Array.from({ length: cols + 1 }).map((_, c) => (
            <line
              key={`v${c}`}
              x1={ox + c * cell}
              y1={oy}
              x2={ox + c * cell}
              y2={oy + rows * cell}
            />
          ))}
          {Array.from({ length: rows + 1 }).map((_, r) => (
            <line
              key={`h${r}`}
              x1={ox}
              y1={oy + r * cell}
              x2={ox + cols * cell}
              y2={oy + r * cell}
            />
          ))}
        </g>
        {/* arena outer frame */}
        <rect
          x={ox}
          y={oy}
          width={cols * cell}
          height={rows * cell}
          fill="none"
          stroke={accent}
          strokeWidth={thin}
          strokeOpacity={0.5}
          style={{ filter: glow }}
        />

        {/* === FLAGGED DANGER CELLS === */}
        <g style={{ filter: glow }}>
          {dangers.map((d, i) => {
            const x = ox + d.c * cell
            const y = oy + d.r * cell
            const inset = 2
            const xm = x + inset
            const ym = y + inset
            const s = cell - inset * 2
            return reduce ? (
              <g key={`d${i}`}>
                <rect
                  x={xm}
                  y={ym}
                  width={s}
                  height={s}
                  fill="url(#vgd-hatch)"
                  stroke={accent}
                  strokeWidth={0.75}
                  strokeOpacity={0.7}
                />
                <path
                  d={`M${xm + 7},${ym + 7} L${xm + s - 7},${ym + s - 7} M${xm + s - 7},${ym + 7} L${xm + 7},${ym + s - 7}`}
                  stroke={accent}
                  strokeWidth={thin}
                  strokeOpacity={0.85}
                />
              </g>
            ) : (
              <g key={`d${i}`}>
                <rect
                  x={xm}
                  y={ym}
                  width={s}
                  height={s}
                  fill="url(#vgd-hatch)"
                  stroke={accent}
                  strokeWidth={0.75}
                  strokeOpacity={0.7}
                />
                <motion.path
                  d={`M${xm + 7},${ym + 7} L${xm + s - 7},${ym + s - 7} M${xm + s - 7},${ym + 7} L${xm + 7},${ym + s - 7}`}
                  stroke={accent}
                  strokeWidth={thin}
                  animate={{ strokeOpacity: [0.35, 0.95, 0.35] }}
                  transition={{
                    duration: 2.2,
                    delay: i * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </g>
            )
          })}
        </g>

        {/* === WATCHTOWER CAMERA FOV CONE (sweeps back and forth) === */}
        {reduce ? (
          <g style={{ originX: `${cam.x}px`, originY: `${cam.y}px` }}>
            <path
              d={`M${cam.x},${cam.y} L${cam.x - fovHalf - fovLen * 0.35},${cam.y + fovLen} L${cam.x - fovLen * 0.35 + fovHalf},${cam.y + fovLen} Z`}
              fill="url(#vgd-fov)"
            />
          </g>
        ) : (
          <motion.g
            style={{ originX: `${cam.x}px`, originY: `${cam.y}px` }}
            animate={{ rotate: [18, 46, 18] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d={`M${cam.x},${cam.y} L${cam.x - fovLen - fovHalf},${cam.y + fovLen * 0.55} L${cam.x - fovLen + fovHalf},${cam.y + fovLen * 0.7} Z`}
              fill="url(#vgd-fov)"
            />
            {/* leading edge ray */}
            <line
              x1={cam.x}
              y1={cam.y}
              x2={cam.x - fovLen}
              y2={cam.y + fovLen * 0.55}
              stroke={accent}
              strokeWidth={0.75}
              strokeOpacity={0.55}
              style={{ filter: glow }}
            />
          </motion.g>
        )}

        {/* Watchtower camera node */}
        <g
          style={{ filter: glow }}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          <rect
            x={cam.x - 6}
            y={cam.y - 5}
            width={12}
            height={9}
            rx={1.5}
            fill={`rgba(${rgb}, 0.18)`}
            stroke={accent}
            strokeWidth={thin}
          />
          <circle cx={cam.x} cy={cam.y} r={2.2} fill="none" stroke={accent} strokeWidth={0.75} />
          <circle cx={cam.x} cy={cam.y} r={0.9} fill={accent} />
          <text
            x={cam.x - 8}
            y={cam.y - 9}
            fontSize="6.5"
            fill={accent}
            fillOpacity={0.8}
            letterSpacing="0.5"
          >
            CAM-00
          </text>
        </g>

        {/* === A* PATH: draws itself START -> GOAL around dangers === */}
        {/* faint full-route guide */}
        <path
          d={pathD}
          fill="none"
          stroke={accent}
          strokeWidth={0.75}
          strokeOpacity={0.18}
          strokeDasharray="2 4"
        />
        {reduce ? (
          <path
            d={pathD}
            fill="none"
            stroke={accent}
            strokeWidth={thin + 0.4}
            strokeOpacity={0.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: glow }}
          />
        ) : (
          <motion.path
            d={pathD}
            fill="none"
            stroke={accent}
            strokeWidth={thin + 0.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0.2] }}
            transition={{
              duration: 7,
              times: [0, 0.55, 0.85, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ filter: glow }}
          />
        )}

        {/* probe marker running the resolved route */}
        {!reduce && (
          <motion.g
            style={{ filter: glow, offsetPath: `path("${pathD}")` as unknown as string }}
            animate={{ offsetDistance: ["0%", "100%"] }}
            transition={{
              duration: 7,
              times: [0, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <circle r="3.4" fill={`rgba(${rgb}, 0.14)`} stroke={accent} strokeWidth={thin} />
            <circle r="1.2" fill={accent} />
          </motion.g>
        )}

        {/* === START + GOAL NODES === */}
        <g
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          style={{ filter: glow }}
        >
          {/* START */}
          {!reduce && (
            <motion.circle
              cx={startC[0]}
              cy={startC[1]}
              fill="none"
              stroke={accent}
              strokeWidth={0.75}
              initial={{ r: 4, opacity: 0.6 }}
              animate={{ r: [4, 12], opacity: [0.6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <circle
            cx={startC[0]}
            cy={startC[1]}
            r={3.4}
            fill={`rgba(${rgb}, 0.3)`}
            stroke={accent}
            strokeWidth={thin}
          />
          <text
            x={startC[0] - 4}
            y={startC[1] + 14}
            fontSize="6.5"
            fill={accent}
            fillOpacity={0.85}
          >
            START
          </text>

          {/* GOAL — diamond target */}
          <rect
            x={goalC[0] - 4}
            y={goalC[1] - 4}
            width={8}
            height={8}
            transform={`rotate(45 ${goalC[0]} ${goalC[1]})`}
            fill={`rgba(${rgb}, 0.22)`}
            stroke={accent}
            strokeWidth={thin}
          />
          {!reduce && (
            <motion.rect
              x={goalC[0] - 6}
              y={goalC[1] - 6}
              width={12}
              height={12}
              transform={`rotate(45 ${goalC[0]} ${goalC[1]})`}
              fill="none"
              stroke={accent}
              strokeWidth={0.75}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <text
            x={goalC[0] - 18}
            y={goalC[1] - 9}
            fontSize="6.5"
            fill={accent}
            fillOpacity={0.85}
          >
            GOAL
          </text>
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
          A* PATH // WATCHTOWER
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
            ROUTING
          </motion.text>
        )}
      </svg>
    </div>
  )
}
