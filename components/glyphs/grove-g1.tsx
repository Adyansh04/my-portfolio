"use client"

import { motion, useReducedMotion } from "framer-motion"
import { GLYPH_COLORS } from "./colors"
import { cn } from "@/lib/utils"

/**
 * GroveG1Svg — line-art for "Grove-G1", the Unitree G1 autonomy stack.
 * Left: the humanoid as a joint schematic, stepping under its own balance with a cube in its hands,
 * the centre-of-mass line held over the support polygon. Right: the README's mission as a floor
 * plan — approach bench A, pick, carry through the doorway under Nav2, close the last half metre,
 * place on bench B — with the 0.5 m goal ring against the arm's 0.2 m window.
 * Drawn only in the accent colour, with inline attributes, so the hologram can rasterise it live.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
const LOOP = 12
// mission keyframes: approach A · pick · carry · reach the Nav2 goal · approach B · place · fade
const T = [0, 0.1, 0.2, 0.28, 0.44, 0.6, 0.7, 0.8, 0.9, 0.96, 1]
const RX = [232, 228, 228, 250, 290, 318, 336, 346, 346, 346, 346]
const RY = [192, 202, 202, 170, 168, 124, 98, 84, 84, 84, 84]
// the cube sits on bench A, rides with the robot, then sits on bench B
const CX = [223, 223, 228, 250, 290, 318, 336, 346, 352, 352, 352]
const CY = [210, 210, 196, 164, 162, 118, 92, 78, 66, 66, 66]
const FADE = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
const PHASES: { label: string; from: number; to: number }[] = [
  { label: "APPROACH", from: 0, to: 0.1 },
  { label: "PICK", from: 0.1, to: 0.2 },
  { label: "CARRY // NAV2", from: 0.2, to: 0.7 },
  { label: "APPROACH", from: 0.7, to: 0.8 },
  { label: "PLACE", from: 0.8, to: 0.96 },
]

// joint nodes on the schematic (29 DOF is the body; these are the ones worth marking)
const NODES: [number, number][] = [
  [95, 76], [74, 86], [116, 86], [67, 112], [123, 112], [88, 122], [102, 122],
  [95, 132], [86, 148], [104, 148], [85, 190], [105, 190], [85, 230], [105, 230],
]

export function GroveG1Svg({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const accent = GLYPH_COLORS.primary
  const rgb = GLYPH_COLORS.primaryRgb
  const glow = `drop-shadow(0 0 3px rgba(${rgb}, 0.55))`
  const loop = (extra: object = {}) => ({ duration: LOOP, times: T, repeat: Infinity, ease: "easeInOut" as const, ...extra })
  const W = 400
  const H = 300

  // a leg: hip → knee → ankle, then the foot
  const leg = (hx: number, side: 1 | -1) => (
    <g>
      <path d={`M${hx},150 L${hx - side},190 L${hx - side},230`} fill="none" stroke={accent} strokeWidth={1.4} />
      <path d={`M${hx - side - 9},236 L${hx - side + 9},236`} stroke={accent} strokeWidth={1.6} />
      <path d={`M${hx - side},230 L${hx - side},236`} stroke={accent} strokeWidth={1} />
    </g>
  )

  return (
    <div className={cn("absolute inset-0 h-full w-full overflow-hidden", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" style={{ background: "transparent" }}>
        <defs>
          <pattern id="g1-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke={`rgba(${rgb}, 0.08)`} strokeWidth="0.5" />
          </pattern>
          <radialGradient id="g1-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="g1-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#g1-fade)" />
          </mask>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#g1-grid)" mask="url(#g1-fademask)" />

        {/* corner registration brackets */}
        <g stroke={accent} strokeWidth={1} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* ================= the humanoid ================= */}
        <g fontFamily={MONO} fill={accent} fillOpacity={0.85} fontSize="7" letterSpacing="0.5">
          <text x="44" y="40">G1 // 29 DOF</text>
        </g>
        <g style={{ filter: glow }}>
          {/* support polygon under the feet, and the centre of mass held over it */}
          <path d="M70,244 L120,244" stroke={accent} strokeWidth={1} strokeOpacity={0.6} />
          <path d="M70,240 L70,248 M120,240 L120,248" stroke={accent} strokeWidth={0.8} strokeOpacity={0.6} />
          <motion.g
            animate={reduce ? undefined : { x: [-2, 2, -2] }}
            transition={reduce ? undefined : { duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M95,140 L95,242" stroke={accent} strokeWidth={0.8} strokeDasharray="3 3" strokeOpacity={0.6} />
            <circle cx="95" cy="140" r="3.2" fill="none" stroke={accent} strokeWidth={1} />
            <path d="M92,140 L98,140 M95,137 L95,143" stroke={accent} strokeWidth={0.8} />

            {/* head, torso, pelvis */}
            <circle cx="95" cy="62" r="10" fill="none" stroke={accent} strokeWidth={1.4} />
            <path d="M89,60 L101,60" stroke={accent} strokeWidth={1} strokeOpacity={0.8} />
            <path d="M95,72 L95,78" stroke={accent} strokeWidth={1.2} />
            <path d="M74,82 L116,82 L108,130 L82,130 Z" fill={`rgba(${rgb}, 0.05)`} stroke={accent} strokeWidth={1.4} />
            <path d="M82,132 L108,132 L104,148 L86,148 Z" fill="none" stroke={accent} strokeWidth={1.2} />
            {/* arms carrying the cube in front of the chest */}
            <path d="M74,86 L67,112 L88,122" fill="none" stroke={accent} strokeWidth={1.4} />
            <path d="M116,86 L123,112 L102,122" fill="none" stroke={accent} strokeWidth={1.4} />
            <rect x="87" y="110" width="16" height="16" fill={`rgba(${rgb}, 0.18)`} stroke={accent} strokeWidth={1.2} />
          </motion.g>

          {/* legs: each lifts in turn */}
          <motion.g
            animate={reduce ? undefined : { y: [0, -7, 0, 0, 0] }}
            transition={reduce ? undefined : { duration: 1.25, times: [0, 0.25, 0.5, 0.75, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            {leg(88, 1)}
          </motion.g>
          <motion.g
            animate={reduce ? undefined : { y: [0, 0, 0, -7, 0] }}
            transition={reduce ? undefined : { duration: 1.25, times: [0, 0.25, 0.5, 0.75, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            {leg(102, -1)}
          </motion.g>

          {/* joint nodes light up in turn: the policy writes every one of them */}
          {NODES.map(([x, y], i) =>
            reduce ? (
              <circle key={i} cx={x} cy={y} r={2} fill={`rgba(${rgb}, 0.35)`} stroke={accent} strokeWidth={0.8} />
            ) : (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={2}
                stroke={accent}
                strokeWidth={0.8}
                initial={{ fillOpacity: 0.1 }}
                animate={{ fillOpacity: [0.1, 0.9, 0.1] }}
                fill={accent}
                transition={{ duration: 1.6, delay: i * 0.11, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
              />
            ),
          )}
        </g>
        <g fontFamily={MONO} fill={accent} fontSize="7" letterSpacing="1">
          <text x="30" y="264" fillOpacity={0.65}>rt/lowcmd · 200 Hz</text>
          {!reduce && (
            <motion.text
              x="30"
              y="274"
              animate={{ fillOpacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              POLICY 50 Hz
            </motion.text>
          )}
        </g>

        {/* ================= the mission ================= */}
        <g fontFamily={MONO} fill={accent} fillOpacity={0.85} fontSize="7" letterSpacing="0.5">
          <text x="200" y="40">FACILITY // BT MISSION</text>
        </g>
        <g stroke={accent} strokeWidth={1} fill="none" style={{ filter: glow }}>
          {/* two rooms, a doorway in the shared wall */}
          <rect x="196" y="48" width="184" height="190" strokeOpacity={0.85} fill={`rgba(${rgb}, 0.03)`} />
          <path d="M288,48 L288,140 M288,168 L288,238" strokeOpacity={0.85} />
          {/* benches */}
          <rect x="206" y="206" width="34" height="14" fill={`rgba(${rgb}, 0.12)`} />
          <rect x="335" y="58" width="34" height="14" fill={`rgba(${rgb}, 0.12)`} />
          {/* Nav2's route, and the goal ring it stops inside (0.5 m) against the arm's window (0.2 m) */}
          <motion.path
            d="M232,192 L250,170 L290,168 L318,124 L336,98"
            strokeOpacity={0.55}
            strokeDasharray="4 4"
            animate={reduce ? undefined : { strokeDashoffset: [0, -32] }}
            transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
          <path d="M336,98 L346,84" strokeOpacity={0.9} strokeWidth={1.4} />
          <circle cx="336" cy="98" r="15" strokeOpacity={0.55} strokeDasharray="2 3" />
          <circle cx="349" cy="80" r="6" strokeOpacity={0.9} />
        </g>
        <g fontFamily={MONO} fill={accent} fontSize="6.5" letterSpacing="0.5" fillOpacity={0.85}>
          <text x="206" y="231">WB-A</text>
          <text x="335" y="53">WB-B</text>
          <text x="304" y="118">0.5 m</text>
          <text x="357" y="91">0.2 m</text>
        </g>

        {/* the cube and the robot moving through the mission */}
        {reduce ? (
          <g style={{ filter: glow }}>
            <rect x="219" y="206" width="8" height="8" fill={accent} />
            <circle cx="232" cy="192" r="5" fill={`rgba(${rgb}, 0.15)`} stroke={accent} strokeWidth={1} />
          </g>
        ) : (
          <g style={{ filter: glow }}>
            <motion.rect
              width="8"
              height="8"
              fill={accent}
              initial={{ x: CX[0] - 4, y: CY[0] - 4, opacity: 0 }}
              animate={{ x: CX.map((v) => v - 4), y: CY.map((v) => v - 4), opacity: FADE }}
              transition={loop()}
            />
            <motion.circle
              r="5.5"
              fill={`rgba(${rgb}, 0.15)`}
              stroke={accent}
              strokeWidth={1.1}
              initial={{ cx: RX[0], cy: RY[0], opacity: 0 }}
              animate={{ cx: RX, cy: RY, opacity: FADE }}
              transition={loop()}
            />
            <motion.circle
              r="1.6"
              fill={accent}
              initial={{ cx: RX[0], cy: RY[0], opacity: 0 }}
              animate={{ cx: RX, cy: RY, opacity: FADE }}
              transition={loop()}
            />
          </g>
        )}

        {/* the behaviour tree's current leaf */}
        <g fontFamily={MONO} fontSize="7" letterSpacing="1" fill={accent}>
          <text x="200" y="264" fillOpacity={0.65}>BT LEAF</text>
          {reduce ? (
            <text x="200" y="274">PICK · CARRY · PLACE</text>
          ) : (
            PHASES.map((p) => (
              <motion.text
                key={p.label + p.from}
                x="200"
                y="274"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
                transition={{ duration: LOOP, times: [0, p.from, p.from + 0.01, p.to - 0.01, p.to, 1], repeat: Infinity, ease: "linear" }}
              >
                {p.label}
              </motion.text>
            ))
          )}
        </g>
      </svg>
    </div>
  )
}
