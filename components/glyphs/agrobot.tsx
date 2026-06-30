"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * AgroBotSvg — schematic side-view for "AgroBot" (autonomous cotton-plucking robot).
 * SVG line-art / blueprint vibe: a ground baseline with a row of plant glyphs each
 * topped by a cotton boll, a YOLO detection box that sweeps the row and locks onto a
 * boll, and a jointed manipulator arm that reaches down from a gantry rail to pluck it.
 * Drawn ONLY in the live accent color (plus transparent / dark). Recolors with theme.
 */
export function AgroBotSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // ground baseline
  const groundY = 232

  // Row of plant glyphs along the ground. Each has a stem base x, a height, and the
  // boll perched at the top (the pluck target). Spaced evenly across the field.
  const plants = useMemo(() => {
    const xs = [62, 118, 174, 230, 286, 342]
    return xs.map((x, i) => {
      const stemH = 58 + (i % 3) * 8
      const topY = groundY - stemH
      return {
        id: `P${i + 1}`,
        x,
        topY,
        stemH,
        bollR: 6.5,
        // small leaf offsets along the stem
        leafY1: groundY - stemH * 0.45,
        leafY2: groundY - stemH * 0.7,
      }
    })
  }, [])

  // The plant currently targeted for harvest (3rd in the row).
  const targetIndex = 2
  const target = plants[targetIndex]

  // Gantry rail (manipulator runs along the top). The arm shoulder rides this rail.
  const railY = 64
  const railX1 = 40
  const railX2 = 360

  // Detection box sweep keyframes (left edge x of the box across the row).
  const boxW = 46
  const boxH = 40

  // Arm geometry — shoulder on the rail above the target, two links down to a gripper.
  const shoulder = { x: target.x, y: railY }
  const elbow = { x: target.x - 18, y: (railY + target.topY) / 2 - 6 }
  const wrist = { x: target.x, y: target.topY - 10 }

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
          <pattern id="agro-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="agro-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="agro-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#agro-fade)" />
          </mask>
          {/* soil shading gradient below the baseline */}
          <linearGradient id="agro-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.1" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          {/* boll glow gradient for the highlighted target */}
          <radialGradient id="agro-boll" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#agro-grid)"
          mask="url(#agro-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* === GROUND BASELINE + soil hatch === */}
        <g style={{ filter: glow }}>
          <rect
            x={railX1}
            y={groundY}
            width={railX2 - railX1}
            height={H - groundY - 16}
            fill="url(#agro-soil)"
          />
          <line
            x1={railX1}
            y1={groundY}
            x2={railX2}
            y2={groundY}
            stroke={accent}
            strokeWidth={thin}
            strokeOpacity={0.85}
          />
          {/* soil tick hatches */}
          <g stroke={accent} strokeWidth={0.75} strokeOpacity={0.35}>
            {Array.from({ length: 13 }).map((_, i) => {
              const x = railX1 + 8 + i * 25
              return <line key={i} x1={x} y1={groundY + 4} x2={x - 6} y2={groundY + 13} />
            })}
          </g>
        </g>

        {/* === GANTRY RAIL: manipulator track === */}
        <g style={{ filter: glow }}>
          <line
            x1={railX1}
            y1={railY}
            x2={railX2}
            y2={railY}
            stroke={accent}
            strokeWidth={thin}
            strokeOpacity={0.7}
            strokeDasharray="2 4"
          />
          {/* rail end posts */}
          <line x1={railX1} y1={railY - 5} x2={railX1} y2={railY + 5} stroke={accent} strokeWidth={thin} strokeOpacity={0.6} />
          <line x1={railX2} y1={railY - 5} x2={railX2} y2={railY + 5} stroke={accent} strokeWidth={thin} strokeOpacity={0.6} />
        </g>

        {/* === PLANT ROW: stems + leaves + bolls, draw on one by one === */}
        <g style={{ filter: glow }} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {plants.map((p, i) => {
            const isTarget = i === targetIndex
            const stem = (
              <path
                d={`M${p.x},${groundY} L${p.x},${p.topY}`}
                fill="none"
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.85}
              />
            )
            const leaves = (
              <g stroke={accent} strokeWidth={0.75} strokeOpacity={0.7} fill="none">
                <path d={`M${p.x},${p.leafY1} q-12,-2 -16,-9`} />
                <path d={`M${p.x},${p.leafY2} q12,-2 16,-9`} />
              </g>
            )
            return reduce ? (
              <g key={p.id}>
                {stem}
                {leaves}
                {/* boll: kept on every plant except the target (already plucked) */}
                {!isTarget && (
                  <circle
                    cx={p.x}
                    cy={p.topY}
                    r={p.bollR}
                    fill={`rgba(${rgb}, 0.12)`}
                    stroke={accent}
                    strokeWidth={thin}
                    strokeOpacity={0.85}
                  />
                )}
              </g>
            ) : (
              <g key={p.id}>
                <motion.path
                  d={`M${p.x},${groundY} L${p.x},${p.topY}`}
                  fill="none"
                  stroke={accent}
                  strokeWidth={thin}
                  strokeOpacity={0.85}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 1.4,
                    delay: i * 0.25,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 7,
                    ease: "easeInOut",
                  }}
                />
                {leaves}
              </g>
            )
          })}
        </g>

        {/* === BOLLS (animated): perched on each stem; the target gets plucked === */}
        {!reduce && (
          <g style={{ filter: glow }}>
            {plants.map((p, i) => {
              const isTarget = i === targetIndex
              if (isTarget) {
                // Target boll: visible, then detaches/fades during the pluck window.
                return (
                  <g key={p.id}>
                    <motion.circle
                      cx={p.x}
                      cy={p.topY}
                      fill="url(#agro-boll)"
                      initial={{ r: 4, opacity: 0 }}
                      animate={{ r: [4, 12, 4], opacity: [0, 0.8, 0] }}
                      transition={{
                        duration: 8,
                        times: [0.45, 0.62, 0.78],
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.circle
                      cx={p.x}
                      cy={p.topY}
                      r={p.bollR}
                      fill={`rgba(${rgb}, 0.18)`}
                      stroke={accent}
                      strokeWidth={thin}
                      strokeOpacity={0.95}
                      // plucked away: lift + fade in the back half of the cycle
                      animate={{
                        cy: [p.topY, p.topY, p.topY - 26, p.topY],
                        opacity: [1, 1, 0, 1],
                        scale: [1, 1, 0.4, 1],
                      }}
                      transition={{
                        duration: 8,
                        times: [0, 0.7, 0.82, 0.86],
                        repeat: Infinity,
                        ease: "easeIn",
                      }}
                      style={{ transformOrigin: `${p.x}px ${p.topY}px` }}
                    />
                  </g>
                )
              }
              return (
                <motion.circle
                  key={p.id}
                  cx={p.x}
                  cy={p.topY}
                  r={p.bollR}
                  fill={`rgba(${rgb}, 0.12)`}
                  stroke={accent}
                  strokeWidth={thin}
                  strokeOpacity={0.85}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 1.4 + i * 0.25,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 7.2,
                    ease: "easeOut",
                  }}
                  style={{ transformOrigin: `${p.x}px ${p.topY}px` }}
                />
              )
            })}
          </g>
        )}

        {/* === YOLO DETECTION BOX: sweeps the row, locks on the target === */}
        {reduce ? (
          <g
            transform={`translate(${target.x - boxW / 2}, ${target.topY - boxH / 2})`}
            style={{ filter: glow }}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            <rect
              width={boxW}
              height={boxH}
              fill="none"
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.9}
            />
            <text x={1} y={-3} fontSize="6" fill={accent} fillOpacity={0.9} letterSpacing="0.5">
              BOLL 0.94
            </text>
          </g>
        ) : (
          <motion.g
            style={{ filter: glow }}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            animate={{
              x: [
                plants[0].x - boxW / 2,
                plants[1].x - boxW / 2,
                target.x - boxW / 2,
                target.x - boxW / 2,
                plants[4].x - boxW / 2,
                plants[5].x - boxW / 2,
                plants[0].x - boxW / 2,
              ],
              y: [
                plants[0].topY - boxH / 2,
                plants[1].topY - boxH / 2,
                target.topY - boxH / 2,
                target.topY - boxH / 2,
                plants[4].topY - boxH / 2,
                plants[5].topY - boxH / 2,
                plants[0].topY - boxH / 2,
              ],
            }}
            transition={{
              duration: 8,
              times: [0, 0.18, 0.36, 0.7, 0.82, 0.9, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.rect
              width={boxW}
              height={boxH}
              fill="transparent"
              stroke={accent}
              strokeWidth={thin}
              animate={{ strokeOpacity: [0.4, 0.4, 0.95, 0.95, 0.4, 0.4, 0.4] }}
              transition={{
                duration: 8,
                times: [0, 0.18, 0.36, 0.7, 0.82, 0.9, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* corner detection ticks */}
            <g stroke={accent} strokeWidth={thin} strokeOpacity={0.95} fill="none">
              <path d="M0,8 L0,0 L8,0" />
              <path d={`M${boxW - 8},0 L${boxW},0 L${boxW},8`} />
              <path d={`M0,${boxH - 8} L0,${boxH} L8,${boxH}`} />
              <path d={`M${boxW - 8},${boxH} L${boxW},${boxH} L${boxW},${boxH - 8}`} />
            </g>
            <text x={1} y={-3} fontSize="6" fill={accent} fillOpacity={0.9} letterSpacing="0.5">
              BOLL 0.94
            </text>
          </motion.g>
        )}

        {/* === MANIPULATOR ARM: jointed links from rail down to target boll === */}
        {reduce ? (
          <g style={{ filter: glow }}>
            {/* shoulder carriage on rail */}
            <rect x={shoulder.x - 7} y={railY - 4} width={14} height={8} fill={`rgba(${rgb}, 0.18)`} stroke={accent} strokeWidth={thin} />
            <path
              d={`M${shoulder.x},${railY + 4} L${elbow.x},${elbow.y} L${wrist.x},${wrist.y}`}
              fill="none"
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.9}
            />
            <circle cx={elbow.x} cy={elbow.y} r={2.4} fill={`rgba(${rgb}, 0.3)`} stroke={accent} strokeWidth={thin} />
            {/* gripper jaws */}
            <g stroke={accent} strokeWidth={thin} strokeOpacity={0.9} fill="none">
              <path d={`M${wrist.x - 4},${wrist.y} L${wrist.x - 4},${wrist.y + 7}`} />
              <path d={`M${wrist.x + 4},${wrist.y} L${wrist.x + 4},${wrist.y + 7}`} />
            </g>
          </g>
        ) : (
          <g style={{ filter: glow }}>
            {/* shoulder carriage rides above the target during the pluck */}
            <motion.rect
              y={railY - 4}
              width={14}
              height={8}
              fill={`rgba(${rgb}, 0.18)`}
              stroke={accent}
              strokeWidth={thin}
              animate={{ x: [shoulder.x - 7, shoulder.x - 7] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            {/* jointed links: extend down to the boll, then retract (plucking motion) */}
            <motion.path
              fill="none"
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.9}
              animate={{
                d: [
                  // retracted (parked high)
                  `M${shoulder.x},${railY + 4} L${shoulder.x - 10},${railY + 22} L${shoulder.x},${railY + 38}`,
                  // reaching toward target
                  `M${shoulder.x},${railY + 4} L${elbow.x},${elbow.y} L${wrist.x},${wrist.y}`,
                  // contact / grip at boll
                  `M${shoulder.x},${railY + 4} L${elbow.x},${elbow.y} L${wrist.x},${wrist.y}`,
                  // retract, carrying the boll up
                  `M${shoulder.x},${railY + 4} L${shoulder.x - 10},${railY + 22} L${shoulder.x},${railY + 38}`,
                  `M${shoulder.x},${railY + 4} L${shoulder.x - 10},${railY + 22} L${shoulder.x},${railY + 38}`,
                ],
              }}
              transition={{
                duration: 8,
                times: [0, 0.4, 0.72, 0.86, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* elbow joint marker tracking the arm */}
            <motion.circle
              r={2.4}
              fill={`rgba(${rgb}, 0.3)`}
              stroke={accent}
              strokeWidth={thin}
              animate={{
                cx: [shoulder.x - 10, elbow.x, elbow.x, shoulder.x - 10, shoulder.x - 10],
                cy: [railY + 22, elbow.y, elbow.y, railY + 22, railY + 22],
              }}
              transition={{
                duration: 8,
                times: [0, 0.4, 0.72, 0.86, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* gripper jaws: open while reaching, snap shut on contact */}
            <motion.g
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.95}
              fill="none"
              animate={{
                x: [shoulder.x, wrist.x, wrist.x, shoulder.x, shoulder.x],
                y: [railY + 38, wrist.y, wrist.y, railY + 38, railY + 38],
              }}
              transition={{
                duration: 8,
                times: [0, 0.4, 0.72, 0.86, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.path
                animate={{ d: ["M-5,0 L-6,8", "M-5,0 L-6,8", "M-5,0 L-3,8", "M-5,0 L-6,8", "M-5,0 L-6,8"] }}
                transition={{ duration: 8, times: [0, 0.4, 0.72, 0.86, 1], repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                animate={{ d: ["M5,0 L6,8", "M5,0 L6,8", "M5,0 L3,8", "M5,0 L6,8", "M5,0 L6,8"] }}
                transition={{ duration: 8, times: [0, 0.4, 0.72, 0.86, 1], repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          </g>
        )}

        {/* === PLANT ID LABELS === */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {plants.map((p) => (
            <text
              key={p.id}
              x={p.x}
              y={groundY + 11}
              fontSize="6"
              fill={accent}
              fillOpacity={0.55}
              textAnchor="middle"
              letterSpacing="0.5"
            >
              {p.id}
            </text>
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
          YOLO // PLUCK
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
            HARVEST
          </motion.text>
        )}
      </svg>
    </div>
  )
}
