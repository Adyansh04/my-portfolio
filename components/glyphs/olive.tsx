"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * OliveSvg — schematic for "Olive" graph-based multi-sensor fusion localization.
 * SVG line-art / blueprint vibe: a factor graph of variable nodes + edges draws on along
 * a trajectory; four labeled sensor streams (IMU, LIDAR, ODOM, VISION) flow in dashed from
 * the sides and converge on a fusion hub, from which a smooth estimated path draws across.
 * Drawn ONLY in the live accent color (plus transparent / dark). Recolors with theme.
 */
export function OliveSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // Factor-graph variable nodes along the trajectory (the optimized pose chain).
  const nodes = useMemo(
    () => [
      { id: "x0", x: 46, y: 232, label: "x0" },
      { id: "x1", x: 104, y: 206, label: "x1" },
      { id: "x2", x: 166, y: 218, label: "x2" },
      { id: "x3", x: 228, y: 190, label: "x3" },
      { id: "x4", x: 292, y: 206, label: "x4" },
      { id: "x5", x: 354, y: 178, label: "x5" },
    ],
    [],
  )

  // The fusion hub — where sensor streams converge before refining the graph.
  const hub = { x: 200, y: 110 }

  // Sensor streams entering from the sides, each converging onto the hub.
  const sensors = useMemo(
    () => [
      { id: "imu", label: "IMU", from: [16, 56], dash: "5 4" },
      { id: "lidar", label: "LIDAR", from: [16, 150], dash: "2 4" },
      { id: "odom", label: "ODOM", from: [384, 56], dash: "6 5" },
      { id: "vision", label: "VISION", from: [384, 150], dash: "3 3" },
    ] as { id: string; label: string; from: [number, number]; dash: string }[],
    [],
  )

  // Smooth estimated path (the fused trajectory estimate) as a flowing curve.
  const estPath = useMemo(
    () =>
      "M40,244 C90,224 110,196 166,210 S224,176 268,196 S330,168 372,170",
    [],
  )

  // Factor edges between consecutive variable nodes.
  const edges = useMemo(
    () =>
      nodes.slice(0, -1).map((n, i) => ({
        id: `${n.id}-${nodes[i + 1].id}`,
        x1: n.x,
        y1: n.y,
        x2: nodes[i + 1].x,
        y2: nodes[i + 1].y,
      })),
    [nodes],
  )

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
          <pattern id="olive-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="olive-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="olive-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#olive-fade)" />
          </mask>
          {/* fusion-hub aura gradient */}
          <radialGradient id="olive-hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#olive-grid)"
          mask="url(#olive-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* fusion-hub aura */}
        <circle cx={hub.x} cy={hub.y} r="46" fill="url(#olive-hub)" />

        {/* === SENSOR STREAMS: dashed lines flowing in and converging on the hub === */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {sensors.map((s, i) => {
            const right = s.from[0] > W / 2
            return (
              <g key={s.id} style={{ filter: glow }}>
                {/* converging stream */}
                {reduce ? (
                  <line
                    x1={s.from[0]}
                    y1={s.from[1]}
                    x2={hub.x}
                    y2={hub.y}
                    stroke={accent}
                    strokeWidth={0.75}
                    strokeOpacity={0.55}
                    strokeDasharray={s.dash}
                  />
                ) : (
                  <motion.line
                    x1={s.from[0]}
                    y1={s.from[1]}
                    x2={hub.x}
                    y2={hub.y}
                    stroke={accent}
                    strokeWidth={0.75}
                    strokeOpacity={0.55}
                    strokeDasharray={s.dash}
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: -40 }}
                    transition={{
                      duration: 2.2 + i * 0.3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
                {/* source node */}
                <circle
                  cx={s.from[0]}
                  cy={s.from[1]}
                  r={2.4}
                  fill={`rgba(${rgb}, 0.3)`}
                  stroke={accent}
                  strokeWidth={thin}
                />
                {/* travelling packet along the stream */}
                {!reduce && (
                  <motion.circle
                    r={1.6}
                    fill={accent}
                    initial={{ cx: s.from[0], cy: s.from[1], opacity: 0 }}
                    animate={{
                      cx: [s.from[0], hub.x],
                      cy: [s.from[1], hub.y],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: i * 0.45,
                      repeat: Infinity,
                      repeatDelay: 0.6,
                      ease: "easeIn",
                    }}
                  />
                )}
                {/* label */}
                <text
                  x={right ? s.from[0] - 6 : s.from[0] + 6}
                  y={s.from[1] - 5}
                  textAnchor={right ? "end" : "start"}
                  fontSize="7"
                  fill={accent}
                  fillOpacity={0.85}
                  letterSpacing="0.5"
                >
                  {s.label}
                </text>
              </g>
            )
          })}
        </g>

        {/* fusion hub core + pulsing ring */}
        <g style={{ filter: glow }}>
          {reduce ? (
            <circle
              cx={hub.x}
              cy={hub.y}
              r={6}
              fill={`rgba(${rgb}, 0.25)`}
              stroke={accent}
              strokeWidth={thin}
            />
          ) : (
            <>
              <motion.circle
                cx={hub.x}
                cy={hub.y}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                initial={{ r: 6, opacity: 0.6 }}
                animate={{ r: [6, 20], opacity: [0.6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
              <circle
                cx={hub.x}
                cy={hub.y}
                r={5}
                fill={`rgba(${rgb}, 0.18)`}
                stroke={accent}
                strokeWidth={thin}
              />
              <circle cx={hub.x} cy={hub.y} r={1.6} fill={accent} />
            </>
          )}
        </g>

        {/* === ESTIMATED PATH: smooth fused trajectory drawing on === */}
        {reduce ? (
          <path
            d={estPath}
            fill="none"
            stroke={accent}
            strokeWidth={thin}
            strokeOpacity={0.9}
            style={{ filter: glow }}
          />
        ) : (
          <motion.path
            d={estPath}
            fill="none"
            stroke={accent}
            strokeWidth={thin}
            strokeOpacity={0.9}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
            transition={{
              duration: 7,
              times: [0, 0.35, 0.92, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ filter: glow }}
          />
        )}

        {/* === FACTOR EDGES: graph constraints between variable nodes === */}
        <g style={{ filter: glow }}>
          {edges.map((e, i) =>
            reduce ? (
              <line
                key={e.id}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.75}
              />
            ) : (
              <motion.line
                key={e.id}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.75}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
                transition={{
                  duration: 7,
                  times: [0, 0.18, 0.92, 1],
                  delay: 0.5 + i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ),
          )}
        </g>

        {/* === VARIABLE NODES (graph poses) + labels === */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {nodes.map((n, i) => (
            <g key={n.id} style={{ filter: glow }}>
              {/* small registration tether from hub to node (constraint hint) */}
              {!reduce && (
                <motion.line
                  x1={hub.x}
                  y1={hub.y}
                  x2={n.x}
                  y2={n.y}
                  stroke={accent}
                  strokeWidth={0.5}
                  strokeOpacity={0.18}
                  strokeDasharray="1 5"
                  animate={{ strokeDashoffset: [-12, 0] }}
                  transition={{
                    duration: 2.4,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
              {/* variable node — square marker (graph variable) */}
              {reduce ? (
                <rect
                  x={n.x - 3}
                  y={n.y - 3}
                  width={6}
                  height={6}
                  fill={`rgba(${rgb}, 0.25)`}
                  stroke={accent}
                  strokeWidth={thin}
                />
              ) : (
                <>
                  <motion.rect
                    x={n.x - 4}
                    y={n.y - 4}
                    width={8}
                    height={8}
                    fill="none"
                    stroke={accent}
                    strokeWidth={0.75}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1.4, 1.4] }}
                    transition={{
                      duration: 2.2,
                      delay: i * 0.25,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                  />
                  <rect
                    x={n.x - 3}
                    y={n.y - 3}
                    width={6}
                    height={6}
                    fill={`rgba(${rgb}, 0.3)`}
                    stroke={accent}
                    strokeWidth={thin}
                  />
                </>
              )}
              {/* label */}
              <text
                x={n.x}
                y={n.y + 16}
                textAnchor="middle"
                fontSize="7"
                fill={accent}
                fillOpacity={0.85}
                letterSpacing="0.5"
              >
                {n.label}
              </text>
            </g>
          ))}
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
          SENSOR FUSION // GRAPH
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
            OPTIMIZING
          </motion.text>
        )}
      </svg>
    </div>
  )
}
