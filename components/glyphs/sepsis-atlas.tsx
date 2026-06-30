"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

/**
 * SepsisAtlasSvg — schematic for "Sepsis Atlas": local-first RAG over medical PDFs.
 * A document/page glyph on the left emits tokens that stream right and scatter into a
 * 2D EMBEDDING cloud of nodes. A QUERY node fires retrieval beams to its nearest
 * neighbors (which highlight), and a small verify tick confirms a source-grounded match.
 * Drawn ONLY in the live accent color (plus transparent / dark). Recolors with theme.
 */
export function SepsisAtlasSvg({ className }: { className?: string }) {
  const { colors } = useColorTheme()
  const reduce = useReducedMotion()
  const accent = colors.primary
  const rgb = colors.primaryRgb

  // viewBox space
  const W = 400
  const H = 300

  // Document / page glyph (source PDF) on the left.
  const doc = { x: 36, y: 96, w: 64, h: 96, fold: 18 }
  const docOutline = useMemo(() => {
    const { x, y, w, h, fold } = doc
    return `M${x},${y} L${x + w - fold},${y} L${x + w},${y + fold} L${x + w},${y + h} L${x},${y + h} Z`
  }, [])
  const docEmit = { x: doc.x + doc.w, y: doc.y + doc.h / 2 + 6 } // token launch point

  // Embedding cloud — scattered nodes in 2D latent space (center / right).
  const nodes = useMemo(
    () => [
      { id: "n0", x: 196, y: 70, r: 2.6 },
      { id: "n1", x: 248, y: 52, r: 2.2 },
      { id: "n2", x: 302, y: 78, r: 2.6 },
      { id: "n3", x: 344, y: 116, r: 2.2 },
      { id: "n4", x: 214, y: 122, r: 2.4 },
      { id: "n5", x: 276, y: 132, r: 3.0 }, // top match (verified)
      { id: "n6", x: 330, y: 168, r: 2.4 },
      { id: "n7", x: 200, y: 178, r: 2.2 },
      { id: "n8", x: 250, y: 196, r: 2.6 },
      { id: "n9", x: 312, y: 214, r: 2.2 },
      { id: "n10", x: 168, y: 116, r: 2.0 },
      { id: "n11", x: 358, y: 64, r: 2.0 },
    ],
    [],
  )

  // Query node (the question being asked) and its nearest neighbors (retrieved set).
  const query = { x: 232, y: 244 }
  const neighborIds = ["n5", "n8", "n4", "n9", "n7"]
  const neighbors = useMemo(
    () => neighborIds.map((id) => nodes.find((n) => n.id === id)!),
    [nodes],
  )

  // Token glyphs streaming from the doc into the cloud.
  const tokenPaths = useMemo(
    () =>
      [nodes[0], nodes[4], nodes[7], nodes[10]].map((n) => {
        const mx = (docEmit.x + n.x) / 2
        const my = (docEmit.y + n.y) / 2 - 24
        return `M${docEmit.x},${docEmit.y} Q${mx},${my} ${n.x},${n.y}`
      }),
    [nodes],
  )

  // The verified top-match node and its tick location.
  const match = nodes[5]

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
          <pattern id="sepsis-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0H0V20"
              fill="none"
              stroke={`rgba(${rgb}, 0.08)`}
              strokeWidth="0.5"
            />
          </pattern>
          {/* radial mask so grid fades at edges */}
          <radialGradient id="sepsis-fade" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="sepsis-fademask">
            <rect x="0" y="0" width={W} height={H} fill="url(#sepsis-fade)" />
          </mask>
          {/* retrieval beam gradient — bright at query, fading toward neighbor */}
          <linearGradient id="sepsis-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
          </linearGradient>
          {/* soft halo for embedding cloud region */}
          <radialGradient id="sepsis-cloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.06" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* grid backdrop */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#sepsis-grid)"
          mask="url(#sepsis-fademask)"
        />

        {/* soft halo behind the embedding cloud */}
        <ellipse cx="268" cy="128" rx="120" ry="92" fill="url(#sepsis-cloud)" />

        {/* corner registration brackets — static HUD framing */}
        <g stroke={accent} strokeWidth={thin} fill="none" opacity={0.55}>
          <path d="M14,28 L14,14 L28,14" />
          <path d={`M${W - 28},14 L${W - 14},14 L${W - 14},28`} />
          <path d={`M14,${H - 28} L14,${H - 14} L28,${H - 14}`} />
          <path d={`M${W - 28},${H - 14} L${W - 14},${H - 14} L${W - 14},${H - 28}`} />
        </g>

        {/* === SOURCE DOCUMENT / PAGE GLYPH === */}
        <g style={{ filter: glow }} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {reduce ? (
            <path
              d={docOutline}
              fill={`rgba(${rgb}, 0.05)`}
              stroke={accent}
              strokeWidth={thin}
              strokeOpacity={0.9}
            />
          ) : (
            <>
              <motion.path
                d={docOutline}
                fill="transparent"
                stroke={accent}
                strokeWidth={thin}
                strokeOpacity={0.9}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
                transition={{
                  duration: 6,
                  times: [0, 0.25, 0.95, 1],
                  repeat: Infinity,
                  repeatDelay: 0,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d={docOutline}
                fill={accent}
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.07, 0.04, 0.04] }}
                transition={{
                  duration: 6,
                  times: [0, 0.3, 0.5, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          )}
          {/* folded corner crease */}
          <path
            d={`M${doc.x + doc.w - doc.fold},${doc.y} L${doc.x + doc.w - doc.fold},${doc.y + doc.fold} L${doc.x + doc.w},${doc.y + doc.fold}`}
            fill="none"
            stroke={accent}
            strokeWidth={0.75}
            strokeOpacity={0.7}
          />
          {/* text rules on the page */}
          <g stroke={accent} strokeWidth={0.75} strokeOpacity={0.45}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ly = doc.y + 32 + i * 10
              const lw = i === 5 ? doc.w * 0.4 : doc.w * 0.66
              return (
                <line
                  key={i}
                  x1={doc.x + 10}
                  y1={ly}
                  x2={doc.x + 10 + lw}
                  y2={ly}
                />
              )
            })}
          </g>
          <text
            x={doc.x}
            y={doc.y - 6}
            fontSize="7"
            fill={accent}
            fillOpacity={0.8}
            letterSpacing="0.5"
          >
            SOURCE.pdf
          </text>
        </g>

        {/* === TOKENS STREAMING FROM DOC INTO THE CLOUD === */}
        {!reduce &&
          tokenPaths.map((d, i) => (
            <g key={`tok-${i}`}>
              {/* faint emit trail */}
              <path
                d={d}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                strokeOpacity={0.18}
                strokeDasharray="2 4"
              />
              {/* travelling token glyph */}
              <motion.g
                style={{ filter: glow, offsetPath: `path("${d}")` as unknown as string }}
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 2.6,
                  times: [0, 0.1, 0.85, 1],
                  delay: i * 0.55,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: "easeInOut",
                }}
              >
                <rect x={-2.2} y={-2.2} width={4.4} height={4.4} rx={1} fill={accent} />
              </motion.g>
            </g>
          ))}

        {/* === EMBEDDING CLOUD: nodes scatter / register === */}
        <g style={{ filter: glow }} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {nodes.map((n, i) =>
            reduce ? (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={`rgba(${rgb}, 0.28)`}
                stroke={accent}
                strokeWidth={0.75}
              />
            ) : (
              <motion.circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={`rgba(${rgb}, 0.28)`}
                stroke={accent}
                strokeWidth={0.75}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.85] }}
                style={{ originX: `${n.x}px`, originY: `${n.y}px` }}
                transition={{
                  duration: 1.2,
                  delay: 0.6 + (i % 6) * 0.25,
                  repeat: Infinity,
                  repeatDelay: 4.8,
                  ease: "easeOut",
                }}
              />
            ),
          )}
          <text
            x="196"
            y="44"
            fontSize="7"
            fill={accent}
            fillOpacity={0.7}
            letterSpacing="0.5"
          >
            EMBEDDING SPACE
          </text>
        </g>

        {/* === RETRIEVAL BEAMS: query → nearest neighbors === */}
        <g>
          {neighbors.map((n, i) => {
            const d = `M${query.x},${query.y} L${n.x},${n.y}`
            return reduce ? (
              <line
                key={`beam-${n.id}`}
                x1={query.x}
                y1={query.y}
                x2={n.x}
                y2={n.y}
                stroke="url(#sepsis-beam)"
                strokeWidth={thin}
                strokeOpacity={0.7}
              />
            ) : (
              <motion.path
                key={`beam-${n.id}`}
                d={d}
                fill="none"
                stroke="url(#sepsis-beam)"
                strokeWidth={thin}
                style={{ filter: glow }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
                transition={{
                  duration: 5,
                  times: [0, 0.18, 0.4, 0.85, 1],
                  delay: 2 + i * 0.18,
                  repeat: Infinity,
                  repeatDelay: 0,
                  ease: "easeInOut",
                }}
              />
            )
          })}
        </g>

        {/* highlighted neighbor rings (retrieved set lights up) */}
        <g style={{ filter: glow }}>
          {neighbors.map((n, i) =>
            reduce ? (
              <circle
                key={`hi-${n.id}`}
                cx={n.x}
                cy={n.y}
                r={n.r + 4}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                strokeOpacity={0.8}
              />
            ) : (
              <motion.circle
                key={`hi-${n.id}`}
                cx={n.x}
                cy={n.y}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                initial={{ r: n.r + 1, opacity: 0 }}
                animate={{ r: [n.r + 1, n.r + 8], opacity: [0, 0.8, 0] }}
                transition={{
                  duration: 2.6,
                  delay: 2.4 + i * 0.18,
                  repeat: Infinity,
                  repeatDelay: 2.4,
                  ease: "easeOut",
                }}
              />
            ),
          )}
        </g>

        {/* === QUERY NODE === */}
        <g style={{ filter: glow }} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {!reduce &&
            [0, 1].map((k) => (
              <motion.circle
                key={`q-${k}`}
                cx={query.x}
                cy={query.y}
                fill="none"
                stroke={accent}
                strokeWidth={0.75}
                initial={{ r: 5, opacity: 0.55 }}
                animate={{ r: [5, 16], opacity: [0.55, 0] }}
                transition={{
                  duration: 2.6,
                  delay: k * 1.3,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          <circle
            cx={query.x}
            cy={query.y}
            r={5}
            fill={`rgba(${rgb}, 0.18)`}
            stroke={accent}
            strokeWidth={thin}
          />
          {/* magnifier handle to read as a query */}
          <line
            x1={query.x + 3.6}
            y1={query.y + 3.6}
            x2={query.x + 8}
            y2={query.y + 8}
            stroke={accent}
            strokeWidth={thin}
          />
          <text
            x={query.x - 16}
            y={query.y + 22}
            fontSize="7"
            fill={accent}
            fillOpacity={0.8}
            letterSpacing="0.5"
          >
            QUERY
          </text>
        </g>

        {/* === VERIFY TICK on the top-grounded match === */}
        <g style={{ filter: glow }}>
          {reduce ? (
            <g>
              <circle
                cx={match.x}
                cy={match.y}
                r={9}
                fill={`rgba(${rgb}, 0.12)`}
                stroke={accent}
                strokeWidth={0.75}
              />
              <path
                d={`M${match.x - 4},${match.y} L${match.x - 1},${match.y + 3} L${match.x + 4.5},${match.y - 3.5}`}
                fill="none"
                stroke={accent}
                strokeWidth={thin}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ) : (
            <motion.g
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.6, 0.6, 1, 1, 0.6] }}
              style={{ originX: `${match.x}px`, originY: `${match.y}px` }}
              transition={{
                duration: 5,
                times: [0, 0.5, 0.62, 0.9, 1],
                repeat: Infinity,
                ease: "easeOut",
              }}
            >
              <circle
                cx={match.x}
                cy={match.y}
                r={9}
                fill={`rgba(${rgb}, 0.14)`}
                stroke={accent}
                strokeWidth={0.75}
              />
              <motion.path
                d={`M${match.x - 4},${match.y} L${match.x - 1},${match.y + 3} L${match.x + 4.5},${match.y - 3.5}`}
                fill="none"
                stroke={accent}
                strokeWidth={thin}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 0, 1, 1, 0] }}
                transition={{
                  duration: 5,
                  times: [0, 0.55, 0.7, 0.9, 1],
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            </motion.g>
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
          RAG // VECTOR DB
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
            RETRIEVE
          </motion.text>
        )}
      </svg>
    </div>
  )
}
