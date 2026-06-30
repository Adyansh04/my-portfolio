"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * Go2Svg — schematic top-down floorplan for "Go2 Autonomous Inspection" (SLAM + zones).
 * SVG line-art / blueprint vibe: zone polygons draw on via pathLength, a rotating scan
 * sweep, labeled nodes, and a tiny robot marker patrolling a dashed inspection route.
 * Drawn ONLY in the live accent color (plus transparent / dark). Recolors with theme.
 */
export function Go2Svg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // Segmented facility — a handful of zone polygons (top-down rooms / inspection zones).
  const zones = useMemo(
    () => [
      { id: "A", pts: "40,40 150,40 150,120 40,120", cx: 95, cy: 80, label: "A-01" },
      { id: "B", pts: "150,40 270,40 270,110 150,110", cx: 210, cy: 75, label: "B-02" },
      { id: "C", pts: "270,40 360,40 360,150 270,150", cx: 315, cy: 95, label: "C-03" },
      { id: "D", pts: "40,120 150,120 150,260 40,260", cx: 95, cy: 190, label: "D-04" },
      { id: "E", pts: "150,110 270,110 270,200 150,200", cx: 210, cy: 155, label: "E-05" },
      { id: "F", pts: "150,200 270,200 270,260 150,260", cx: 210, cy: 230, label: "F-06" },
      { id: "G", pts: "270,150 360,150 360,260 270,260", cx: 315, cy: 205, label: "G-07" },
    ],
    [],
  )

  // Inspection waypoints (the robot route) — kept inside zone centers.
  const route = useMemo(
    () => [
      [95, 80],
      [210, 75],
      [315, 95],
      [315, 205],
      [210, 155],
      [210, 230],
      [95, 190],
      [95, 80],
    ] as [number, number][],
    [],
  )

  const routeD = useMemo(
    () => route.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" "),
    [route],
  )

  // Sweep geometry — a long thin wedge from the facility origin node.
  const origin = { x: 95, y: 80 }
  const sweepLen = 340

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
          <pattern id="go2-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="go2-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="go2-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#go2-fade)" />
          </mask>
          {/* conic-like sweep gradient (linear approximation along wedge) */}
          <linearGradient id="go2-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#go2-grid)"
          mask="url(#go2-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* === ZONE POLYGONS: draw-on one by one === */}
        <g style={{ filter: glow }}>
          {zones.map((z, i) =>
            reduce ? (
              <polygon
                key={z.id}
                points={z.pts}
                fill={`rgba(${rgb}, 0.04)`}
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.85}
              />
            ) : (
              <g key={z.id}>
                <motion.polygon
                  points={z.pts}
                  fill="transparent"
                  stroke={accent}
                  strokeWidth={thin}
                  strokeOpacity={0.85}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
                  transition={{
                    duration: 8,
                    times: [0, 0.18, 0.9, 1],
                    delay: i * 0.35,
                    repeat: Infinity,
                    repeatDelay: zones.length * 0.35,
                    ease: "easeInOut",
                  }}
                />
                {/* subtle fill flash as the zone "registers" */}
                <motion.polygon
                  points={z.pts}
                  fill={accent}
                  stroke="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.1, 0.04, 0.04] }}
                  transition={{
                    duration: 8,
                    times: [0, 0.22, 0.4, 1],
                    delay: i * 0.35,
                    repeat: Infinity,
                    repeatDelay: zones.length * 0.35,
                    ease: "easeInOut",
                  }}
                />
              </g>
            ),
          )}
        </g>

        {/* === ROTATING SCAN SWEEP === */}
        {!reduce && (
          <motion.g
            style={{ originX: `${origin.x}px`, originY: `${origin.y}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            {/* wedge */}
            <path
              d={`M${origin.x},${origin.y} L${origin.x + sweepLen},${origin.y - 9} L${origin.x + sweepLen},${origin.y + 9} Z`}
              fill="url(#go2-sweep)"
            />
            {/* leading scan ray */}
            <line
              x1={origin.x}
              y1={origin.y}
              x2={origin.x + sweepLen}
              y2={origin.y}
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.7}
              style={{ filter: glow }}
            />
          </motion.g>
        )}

        {/* expanding range rings from origin */}
        {!reduce &&
          [0, 1, 2].map((k) => (
            <motion.circle
              key={k}
              cx={origin.x}
              cy={origin.y}
              fill="none"
              stroke={accent}
              strokeWidth={0.75}
              initial={{ r: 4, opacity: 0 }}
              animate={{ r: [4, 150], opacity: [0.5, 0] }}
              transition={{
                duration: 3.6,
                delay: k * 1.2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

        {/* === INSPECTION ROUTE: dashed patrol path === */}
        <motion.path
          d={routeD}
          fill="none"
          stroke={accent}
          strokeWidth={thin}
          strokeOpacity={0.5}
          strokeDasharray="4 5"
          initial={reduce ? undefined : { strokeDashoffset: 0 }}
          animate={reduce ? undefined : { strokeDashoffset: -90 }}
          transition={
            reduce
              ? undefined
              : { duration: 5, repeat: Infinity, ease: "linear" }
          }
          style={{ filter: glow }}
        />

        {/* === ZONE NODES + LABELS === */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {zones.map((z, i) => (
            <g key={z.id} style={{ filter: glow }}>
              {/* pulsing node ring */}
              {reduce ? (
                <circle
                  cx={z.cx}
                  cy={z.cy}
                  r={3}
                  fill={`rgba(${rgb}, 0.25)`}
                  stroke={accent}
                  strokeWidth={thin}
                />
              ) : (
                <>
                  <motion.circle
                    cx={z.cx}
                    cy={z.cy}
                    fill="none"
                    stroke={accent}
                    strokeWidth={0.75}
                    initial={{ r: 3, opacity: 0.6 }}
                    animate={{ r: [3, 9], opacity: [0.6, 0] }}
                    transition={{
                      duration: 2.4,
                      delay: i * 0.3,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <circle
                    cx={z.cx}
                    cy={z.cy}
                    r={2.4}
                    fill={`rgba(${rgb}, 0.3)`}
                    stroke={accent}
                    strokeWidth={thin}
                  />
                </>
              )}
              {/* label */}
              <text
                x={z.cx + 7}
                y={z.cy - 6}
                fontSize="7"
                fill={accent}
                fillOpacity={0.85}
                letterSpacing="0.5"
              >
                {z.label}
              </text>
            </g>
          ))}
        </g>

        {/* === ROBOT MARKER: tiny chevron patrolling the route === */}
        {reduce ? (
          <g transform={`translate(${route[0][0]}, ${route[0][1]})`} style={{ filter: glow }}>
            <circle r="6" fill="none" stroke={accent} strokeWidth={thin} />
            <path d="M-3,2 L0,-4 L3,2 Z" fill={accent} />
          </g>
        ) : (
          <motion.g
            style={{ filter: glow, offsetPath: `path("${routeD}")` as unknown as string }}
            animate={{ offsetDistance: ["0%", "100%"] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          >
            <motion.g
              animate={{ rotate: [0, 0] }}
              transition={{ duration: 0.001 }}
            >
              <circle r="6" fill={`rgba(${rgb}, 0.12)`} stroke={accent} strokeWidth={thin} />
              <circle r="1.4" fill={accent} />
            </motion.g>
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
          SLAM // ZONE MAP
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
            SCAN ACTIVE
          </motion.text>
        )}
      </svg>
    </div>
  )
}
