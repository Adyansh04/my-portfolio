"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * AiRoboticsSvg — schematic for "AI+Robotics Hackathon" (vision-guided manipulation).
 * SVG line-art / blueprint vibe: a jointed robot arm draws on and reaches toward a target,
 * a 6-DOF pose bounding box locks onto the object (corner ticks + brief flash), a faint
 * NvBlox-style voxel grid blooms around the scene, and a MoveIt collision-free path arc
 * carries a grasp marker to the object. Drawn ONLY in the live accent color (plus
 * transparent / dark). Recolors with theme.
 */
export function AiRoboticsSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // === Robot arm: anchored at base, 3 links forming a reaching pose ===
  const base = { x: 70, y: 232 }
  const joints = useMemo(
    () =>
      [
        base, // shoulder / base
        { x: 118, y: 150 }, // elbow 1
        { x: 196, y: 122 }, // elbow 2
        { x: 256, y: 146 }, // wrist
      ] as { x: number; y: number }[],
    [],
  )

  // Per-link path strings (each a single segment so pathLength draws cleanly)
  const links = useMemo(
    () =>
      joints.slice(0, -1).map((p, i) => {
        const q = joints[i + 1]
        return `M${p.x},${p.y} L${q.x},${q.y}`
      }),
    [joints],
  )

  // Grasp target object (right side) + its 6-DOF pose box (a small parallelepiped).
  const target = { x: 300, y: 168 }
  // box footprint corners + depth offset to fake the 6-DOF / 3D pose
  const dx = 7
  const dy = -7
  const boxFront = useMemo(() => {
    const x = target.x - 22
    const y = target.y - 18
    const w = 40
    const h = 34
    return [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ]
  }, [])
  const boxBack = useMemo(
    () => boxFront.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    [boxFront],
  )

  // MoveIt collision-free path: an arc from the wrist out and around to the grasp.
  const wrist = joints[3]
  const grasp = { x: target.x - 18, y: target.y - 4 }
  const arcD = useMemo(
    () =>
      `M${wrist.x},${wrist.y} C${wrist.x + 30},${wrist.y - 70} ${grasp.x - 70},${grasp.y - 80} ${grasp.x},${grasp.y}`,
    [wrist.x, wrist.y, grasp.x, grasp.y],
  )

  // NvBlox-style voxel grid: small squares blooming around the target/scene volume.
  const voxels = useMemo(() => {
    const cells: { x: number; y: number; i: number }[] = []
    const ox = 230
    const oy = 96
    const s = 16
    const cols = 8
    const rows = 7
    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // skip a few to keep it sparse / schematic
        if ((r + c) % 3 === 0 && (r * c) % 2 === 0) {
          i++
          continue
        }
        cells.push({ x: ox + c * s, y: oy + r * s, i })
        i++
      }
    }
    return cells
  }, [])

  // Common stroke styling
  const thin = 1
  const glow = `drop-shadow(0 0 3px rgba(${rgb}, 0.55))`

  // Corner-tick markers for the pose box (draw the 6-DOF lock ticks)
  const tickLen = 7

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
          <pattern id="airx-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="airx-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="airx-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#airx-fade)" />
          </mask>
          {/* arc gradient for the MoveIt plan path */}
          <linearGradient id="airx-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#airx-grid)"
          mask="url(#airx-fademask)"
        />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* === NVBLOX-STYLE VOXEL GRID: blooms around the scene volume === */}
        <g style={{ filter: glow }}>
          {voxels.map((v) =>
            reduce ? (
              <rect
                key={v.i}
                x={v.x}
                y={v.y}
                width={9}
                height={9}
                fill={`rgba(${rgb}, 0.05)`}
                stroke={accent}
                strokeWidth={0.5}
                strokeOpacity={0.3}
              />
            ) : (
              <motion.rect
                key={v.i}
                x={v.x}
                y={v.y}
                width={9}
                height={9}
                fill={`rgba(${rgb}, 0.05)`}
                stroke={accent}
                strokeWidth={0.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0.18, 0.18] }}
                transition={{
                  duration: 9,
                  times: [0, 0.18, 0.5, 1],
                  delay: (v.i % 11) * 0.12,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ),
          )}
        </g>

        {/* === 6-DOF POSE BOUNDING BOX: parallelepiped that locks onto the object === */}
        <g style={{ filter: glow }}>
          {/* depth connector edges (back box) */}
          {(() => {
            const edges = boxFront.map((p, i) => {
              const b = boxBack[i]
              return `M${p.x},${p.y} L${b.x},${b.y}`
            })
            const backPoly = boxBack.map((p) => `${p.x},${p.y}`).join(" ")
            const frontPoly = boxFront.map((p) => `${p.x},${p.y}`).join(" ")
            return (
              <>
                {/* brief fill flash as the pose "locks" */}
                {reduce ? (
                  <polygon points={frontPoly} fill={`rgba(${rgb}, 0.06)`} stroke="none" />
                ) : (
                  <motion.polygon
                    points={frontPoly}
                    fill={accent}
                    stroke="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 0.22, 0.05, 0.05] }}
                    transition={{
                      duration: 9,
                      times: [0, 0.34, 0.42, 0.55, 1],
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                {/* back rectangle */}
                {reduce ? (
                  <polygon
                    points={backPoly}
                    fill="none"
                    stroke={accent}
                    strokeWidth={0.75}
                    strokeOpacity={0.45}
                  />
                ) : (
                  <motion.polygon
                    points={backPoly}
                    fill="none"
                    stroke={accent}
                    strokeWidth={0.75}
                    strokeOpacity={0.45}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 0, 1, 1] }}
                    transition={{
                      duration: 9,
                      times: [0, 0.22, 0.4, 1],
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                {/* depth connectors */}
                {edges.map((d, i) =>
                  reduce ? (
                    <path
                      key={i}
                      d={d}
                      stroke={accent}
                      strokeWidth={0.75}
                      strokeOpacity={0.45}
                      fill="none"
                    />
                  ) : (
                    <motion.path
                      key={i}
                      d={d}
                      stroke={accent}
                      strokeWidth={0.75}
                      strokeOpacity={0.45}
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: [0, 0, 1, 1] }}
                      transition={{
                        duration: 9,
                        times: [0, 0.26, 0.42, 1],
                        delay: i * 0.04,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ),
                )}
                {/* front rectangle */}
                {reduce ? (
                  <polygon
                    points={frontPoly}
                    fill="none"
                    stroke={accent}
                    strokeWidth={thin}
                    strokeOpacity={0.9}
                  />
                ) : (
                  <motion.polygon
                    points={frontPoly}
                    fill="none"
                    stroke={accent}
                    strokeWidth={thin}
                    strokeOpacity={0.9}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 1, 1] }}
                    transition={{
                      duration: 9,
                      times: [0, 0.34, 0.9, 1],
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </>
            )
          })()}

          {/* 6-DOF corner lock ticks on the front face */}
          {boxFront.map((p, i) => {
            // direction signs toward box interior, per corner
            const sx = i === 0 || i === 3 ? 1 : -1
            const sy = i === 0 || i === 1 ? 1 : -1
            const d = `M${p.x + sx * tickLen},${p.y} L${p.x},${p.y} L${p.x},${p.y + sy * tickLen}`
            return reduce ? (
              <path key={i} d={d} stroke={accent} strokeWidth={thin} fill="none" />
            ) : (
              <motion.path
                key={i}
                d={d}
                stroke={accent}
                strokeWidth={thin}
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
                transition={{
                  duration: 9,
                  times: [0, 0.42, 0.9, 1],
                  delay: 0.05 + i * 0.05,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )
          })}

          {/* pose center crosshair + axis tick */}
          <g style={{ filter: glow }}>
            <line
              x1={target.x - 4}
              y1={target.y}
              x2={target.x + 4}
              y2={target.y}
              stroke={accent}
              strokeWidth={0.75}
              strokeOpacity={0.8}
            />
            <line
              x1={target.x}
              y1={target.y - 4}
              x2={target.x}
              y2={target.y + 4}
              stroke={accent}
              strokeWidth={0.75}
              strokeOpacity={0.8}
            />
            {reduce ? (
              <circle
                cx={target.x}
                cy={target.y}
                r={3}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                strokeOpacity={0.5}
              />
            ) : (
              <motion.circle
                cx={target.x}
                cy={target.y}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                initial={{ r: 3, opacity: 0 }}
                animate={{ r: [3, 14], opacity: [0.6, 0] }}
                transition={{
                  duration: 2.6,
                  delay: 0.6,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}
          </g>
        </g>

        {/* === MOVEIT COLLISION-FREE PATH: arc to the grasp === */}
        {reduce ? (
          <path
            d={arcD}
            fill="none"
            stroke={accent}
            strokeWidth={0.75}
            strokeOpacity={0.5}
            strokeDasharray="3 4"
            style={{ filter: glow }}
          />
        ) : (
          <>
            <motion.path
              d={arcD}
              fill="none"
              stroke="url(#airx-arc)"
              strokeWidth={thin}
              strokeOpacity={0.7}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 0.9, 0.9, 0.9] }}
              transition={{
                duration: 9,
                times: [0, 0.55, 0.9, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ filter: glow }}
            />
            {/* dashed travel overlay */}
            <motion.path
              d={arcD}
              fill="none"
              stroke={accent}
              strokeWidth={0.75}
              strokeOpacity={0.45}
              strokeDasharray="3 5"
              animate={{ strokeDashoffset: [0, -64] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}

        {/* === ROBOT ARM: jointed links draw on and reach toward the target === */}
        <g style={{ filter: glow }}>
          {/* base plate */}
          <path
            d={`M${base.x - 14},${base.y + 10} L${base.x + 14},${base.y + 10} L${base.x + 9},${base.y} L${base.x - 9},${base.y} Z`}
            fill={`rgba(${rgb}, 0.1)`}
            stroke={accent}
            strokeWidth={thin}
            strokeOpacity={0.8}
          />

          {/* links */}
          {links.map((d, i) =>
            reduce ? (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={accent}
                strokeWidth={thin + 0.6}
                strokeOpacity={0.9}
                strokeLinecap="round"
              />
            ) : (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke={accent}
                strokeWidth={thin + 0.6}
                strokeOpacity={0.9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 1, 1] }}
                transition={{
                  duration: 9,
                  times: [0, 0.28, 0.9, 1],
                  delay: i * 0.16,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ),
          )}

          {/* joints */}
          {joints.map((p, i) => (
            <g key={i}>
              {!reduce && (
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  fill="none"
                  stroke={accent}
                  strokeWidth={0.75}
                  initial={{ r: 3, opacity: 0.5 }}
                  animate={{ r: [3, 8], opacity: [0.5, 0] }}
                  transition={{
                    duration: 2.4,
                    delay: i * 0.25,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={i === joints.length - 1 ? 2 : 2.6}
                fill={`rgba(${rgb}, 0.3)`}
                stroke={accent}
                strokeWidth={thin}
              />
            </g>
          ))}

          {/* gripper at the wrist — two opposing fingers */}
          <g
            transform={`translate(${wrist.x},${wrist.y}) rotate(28)`}
            stroke={accent}
            strokeWidth={thin}
            fill="none"
            strokeLinecap="round"
            opacity={0.9}
          >
            <path d="M0,0 L10,-5 M10,-5 L15,-5" />
            <path d="M0,0 L10,5 M10,5 L15,5" />
          </g>
        </g>

        {/* === GRASP MARKER: travels the MoveIt arc toward the object === */}
        {reduce ? (
          <g transform={`translate(${grasp.x}, ${grasp.y})`} style={{ filter: glow }}>
            <circle r="5" fill={`rgba(${rgb}, 0.12)`} stroke={accent} strokeWidth={thin} />
            <circle r="1.3" fill={accent} />
          </g>
        ) : (
          <motion.g
            style={{ filter: glow, offsetPath: `path("${arcD}")` as unknown as string }}
            initial={{ offsetDistance: "0%", opacity: 0 }}
            animate={{
              offsetDistance: ["0%", "100%", "100%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 9,
              times: [0, 0.55, 0.92, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <circle r="5" fill={`rgba(${rgb}, 0.12)`} stroke={accent} strokeWidth={thin} />
            <circle r="1.3" fill={accent} />
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
          6-DOF PICK // MOVEIT
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
            PLAN OK
          </motion.text>
        )}
      </svg>
    </div>
  )
}
