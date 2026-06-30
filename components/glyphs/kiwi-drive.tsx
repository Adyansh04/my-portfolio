"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * KiwiDriveSvg — schematic for "Kiwi Drive Robot" (three-wheeled omnidirectional drive).
 * SVG line-art / blueprint vibe: a triangular chassis with 3 wheels at 120 degrees,
 * a live holonomic velocity force-rosette rotating around the centroid, the fused
 * translation vector drawing on via pathLength, and an EKF heading indicator with a
 * pulsing covariance ring. Drawn ONLY in the live accent color (plus transparent /
 * dark). Recolors with theme.
 */
export function KiwiDriveSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // Chassis centroid
  const cx = 200
  const cy = 150

  // Three wheel mounts at 120 degrees. Angle 0 = up (-90deg in screen space),
  // then +120, +240 going clockwise. Radius = distance from centroid to each wheel.
  const R = 78
  const wheels = useMemo(() => {
    // screen-space angles (deg). -90 = top, then evenly spaced.
    const base = [-90, 30, 150]
    return base.map((a, i) => {
      const rad = (a * Math.PI) / 180
      const x = cx + R * Math.cos(rad)
      const y = cy + R * Math.sin(rad)
      return { id: ["W1", "W2", "W3"][i], a, x, y, label: `M${i + 1}` }
    })
  }, [])

  // Chassis triangle path through the three wheel anchors.
  const chassisD = useMemo(() => {
    const p = wheels.map((w) => `${w.x.toFixed(1)},${w.y.toFixed(1)}`)
    return `M${p[0]} L${p[1]} L${p[2]} Z`
  }, [wheels])

  // Force-rosette spokes: small velocity stubs around the rim of the centroid hub.
  const spokes = useMemo(() => {
    const arr: { a: number; len: number }[] = []
    for (let k = 0; k < 12; k++) {
      const a = (k * 30 * Math.PI) / 180
      const len = k % 3 === 0 ? 30 : 20
      arr.push({ a, len })
    }
    return arr
  }, [])

  // Common stroke styling
  const thin = 1
  const glow = `drop-shadow(0 0 3px rgba(${rgb}, 0.55))`

  // Fused translation vector (resultant) — points up-right out of the hub.
  const vecAngle = (-40 * Math.PI) / 180
  const vecLen = 92
  const vx = cx + vecLen * Math.cos(vecAngle)
  const vy = cy + vecLen * Math.sin(vecAngle)
  // arrowhead
  const ah = 7
  const ax1 = vx - ah * Math.cos(vecAngle - 0.4)
  const ay1 = vy - ah * Math.sin(vecAngle - 0.4)
  const ax2 = vx - ah * Math.cos(vecAngle + 0.4)
  const ay2 = vy - ah * Math.sin(vecAngle + 0.4)

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
          <pattern id="kiwi-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="kiwi-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="kiwi-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#kiwi-fade)" />
          </mask>
          {/* radial fill for the chassis hub */}
          <radialGradient id="kiwi-hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          {/* fading wedge for the heading sector */}
          <linearGradient id="kiwi-heading" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#kiwi-grid)"
          mask="url(#kiwi-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* hub glow disc */}
        <circle cx={cx} cy={cy} r={70} fill="url(#kiwi-hub)" />

        {/* === CHASSIS TRIANGLE: draws on edge-by-edge === */}
        <g style={{ filter: glow }}>
          {reduce ? (
            <path
              d={chassisD}
              fill={`rgba(${rgb}, 0.05)`}
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.9}
            />
          ) : (
            <>
              <motion.path
                d={chassisD}
                fill="transparent"
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.9}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
                transition={{
                  duration: 7,
                  times: [0, 0.25, 0.92, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d={chassisD}
                fill={accent}
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.08, 0.05, 0.05] }}
                transition={{
                  duration: 7,
                  times: [0, 0.3, 0.45, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          )}
        </g>

        {/* === WHEELS: oriented roller-wheels tangent to the chassis === */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {wheels.map((w, i) => {
            // a wheel is tangent to the radial direction -> rotate by (angle + 90)
            const rot = w.a + 90
            return (
              <g
                key={w.id}
                transform={`translate(${w.x.toFixed(1)}, ${w.y.toFixed(1)}) rotate(${rot})`}
                style={{ filter: glow }}
              >
                {/* wheel body */}
                <rect
                  x={-15}
                  y={-6}
                  width={30}
                  height={12}
                  rx={2.5}
                  fill={`rgba(${rgb}, 0.1)`}
                  stroke={accent}
                  strokeWidth={thin}
                  strokeOpacity={0.85}
                />
                {/* omni-wheel rollers (the little tread ticks) */}
                {[-10, -3.3, 3.3, 10].map((rx) => (
                  <line
                    key={rx}
                    x1={rx}
                    y1={-6}
                    x2={rx}
                    y2={6}
                    stroke={accent}
                    strokeWidth={0.75}
                    strokeOpacity={0.6}
                  />
                ))}
                {/* mount strut back to centroid (drawn unrotated visually via radial line) */}
              </g>
            )
          })}
        </g>

        {/* mount struts from centroid out to each wheel hub */}
        <g stroke={accent} strokeWidth={0.75} strokeOpacity={0.45}>
          {wheels.map((w) => (
            <line
              key={w.id}
              x1={cx}
              y1={cy}
              x2={w.x.toFixed(1)}
              y2={w.y.toFixed(1)}
            />
          ))}
        </g>

        {/* === FORCE ROSETTE: holonomic velocity stubs, slowly rotating === */}
        {reduce ? (
          <g style={{ filter: glow }}>
            {spokes.map((s, i) => {
              const x1 = cx + 14 * Math.cos(s.a)
              const y1 = cy + 14 * Math.sin(s.a)
              const x2 = cx + (14 + s.len) * Math.cos(s.a)
              const y2 = cy + (14 + s.len) * Math.sin(s.a)
              return (
                <line
                  key={i}
                  x1={x1.toFixed(1)}
                  y1={y1.toFixed(1)}
                  x2={x2.toFixed(1)}
                  y2={y2.toFixed(1)}
                  stroke={accent}
                  strokeWidth={0.75}
                  strokeOpacity={i % 3 === 0 ? 0.7 : 0.35}
                />
              )
            })}
          </g>
        ) : (
          <motion.g
            style={{ filter: glow, originX: `${cx}px`, originY: `${cy}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          >
            {spokes.map((s, i) => {
              const x1 = cx + 14 * Math.cos(s.a)
              const y1 = cy + 14 * Math.sin(s.a)
              const x2 = cx + (14 + s.len) * Math.cos(s.a)
              const y2 = cy + (14 + s.len) * Math.sin(s.a)
              return (
                <motion.line
                  key={i}
                  x1={x1.toFixed(1)}
                  y1={y1.toFixed(1)}
                  x2={x2.toFixed(1)}
                  y2={y2.toFixed(1)}
                  stroke={accent}
                  strokeWidth={0.75}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1, 1, 0],
                    opacity: [0, i % 3 === 0 ? 0.75 : 0.4, i % 3 === 0 ? 0.75 : 0.4, 0],
                  }}
                  transition={{
                    duration: 3.2,
                    times: [0, 0.3, 0.8, 1],
                    delay: i * 0.12,
                    repeat: Infinity,
                    repeatDelay: 0.6,
                    ease: "easeInOut",
                  }}
                />
              )
            })}
          </motion.g>
        )}

        {/* === EKF HEADING SECTOR + ROTATING NEEDLE === */}
        {!reduce && (
          <motion.g
            style={{ originX: `${cx}px`, originY: `${cy}px` }}
            animate={{ rotate: [0, 18, -10, 8, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* heading wedge */}
            <path
              d={`M${cx},${cy} L${cx + 96},${cy - 12} L${cx + 96},${cy + 12} Z`}
              fill="url(#kiwi-heading)"
            />
            {/* needle */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + 96}
              y2={cy}
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.7}
              style={{ filter: glow }}
            />
          </motion.g>
        )}

        {/* === EKF COVARIANCE / UNCERTAINTY RING (expanding) === */}
        {!reduce &&
          [0, 1].map((k) => (
            <motion.circle
              key={k}
              cx={cx}
              cy={cy}
              fill="none"
              stroke={accent}
              strokeWidth={0.75}
              strokeDasharray="3 4"
              initial={{ r: 18, opacity: 0 }}
              animate={{ r: [18, 64], opacity: [0.55, 0] }}
              transition={{
                duration: 3.4,
                delay: k * 1.7,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

        {/* === FUSED TRANSLATION VECTOR (resultant) — draws on === */}
        <g style={{ filter: glow }}>
          {reduce ? (
            <>
              <line
                x1={cx}
                y1={cy}
                x2={vx.toFixed(1)}
                y2={vy.toFixed(1)}
                stroke={accent}
                strokeWidth={thin}
              />
              <path
                d={`M${ax1.toFixed(1)},${ay1.toFixed(1)} L${vx.toFixed(1)},${vy.toFixed(1)} L${ax2.toFixed(1)},${ay2.toFixed(1)}`}
                fill="none"
                stroke={accent}
                strokeWidth={thin}
              />
            </>
          ) : (
            <>
              <motion.line
                x1={cx}
                y1={cy}
                x2={vx.toFixed(1)}
                y2={vy.toFixed(1)}
                stroke={accent}
                strokeWidth={thin}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 4,
                  times: [0, 0.25, 0.85, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d={`M${ax1.toFixed(1)},${ay1.toFixed(1)} L${vx.toFixed(1)},${vy.toFixed(1)} L${ax2.toFixed(1)},${ay2.toFixed(1)}`}
                fill="none"
                stroke={accent}
                strokeWidth={thin}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                  duration: 4,
                  times: [0, 0.22, 0.3, 0.85, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          )}
        </g>

        {/* central hub node */}
        <g style={{ filter: glow }}>
          {!reduce && (
            <motion.circle
              cx={cx}
              cy={cy}
              fill="none"
              stroke={accent}
              strokeWidth={0.75}
              initial={{ r: 5, opacity: 0.6 }}
              animate={{ r: [5, 13], opacity: [0.6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={`rgba(${rgb}, 0.25)`}
            stroke={accent}
            strokeWidth={thin}
          />
          <circle cx={cx} cy={cy} r={1.4} fill={accent} />
        </g>

        {/* wheel labels */}
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {wheels.map((w) => (
            <text
              key={w.id}
              x={(cx + (R + 20) * Math.cos((w.a * Math.PI) / 180)).toFixed(1)}
              y={(cy + (R + 20) * Math.sin((w.a * Math.PI) / 180)).toFixed(1)}
              fontSize="7"
              fill={accent}
              fillOpacity={0.8}
              letterSpacing="0.5"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {w.label}
            </text>
          ))}
          {/* vector magnitude tag */}
          <text
            x={(vx + 6).toFixed(1)}
            y={(vy - 4).toFixed(1)}
            fontSize="7"
            fill={accent}
            fillOpacity={0.85}
            letterSpacing="0.5"
          >
            V
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
          KIWI DRIVE // EKF
        </text>
        {reduce ? (
          <text
            x="16"
            y={H - 12}
            fontSize="7"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill={accent}
            fillOpacity={0.6}
            letterSpacing="1"
          >
            FUSED
          </text>
        ) : (
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
            FUSED
          </motion.text>
        )}
      </svg>
    </div>
  )
}
