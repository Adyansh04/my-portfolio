"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useColorTheme } from "./color-theme-provider"
import { useIsMobile } from "@/hooks/use-mobile"

interface PerceptionHudProps {
  /** True while the AI assistant is processing a query. */
  thinking?: boolean
  /** Increment when the assistant posts a reply, to fire the acknowledge flare. */
  replyNonce?: number
}

interface HudState {
  batt: number
  cpu: number
  temp: number
  heading: number
  roll: number
  pitch: number
  joints: number[]
}

const INITIAL: HudState = { batt: 87, cpu: 34, temp: 41, heading: 0, roll: 0, pitch: 0, joints: [60, 45, 70, 50, 65, 40] }
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function Brackets({ color }: { color: string }) {
  const common = "pointer-events-none absolute h-6 w-6"
  return (
    <>
      {[
        "left-0 top-0 border-l-2 border-t-2",
        "right-0 top-0 border-r-2 border-t-2",
        "bottom-0 left-0 border-b-2 border-l-2",
        "bottom-0 right-0 border-b-2 border-r-2",
      ].map((c, i) => (
        <motion.div
          key={i}
          className={`${common} ${c}`}
          style={{ borderColor: color }}
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
        />
      ))}
    </>
  )
}

export function PerceptionHud({ thinking = false, replyNonce = 0 }: PerceptionHudProps) {
  const { colors } = useColorTheme()
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const [hud, setHud] = useState<HudState>(INITIAL)

  const animate = !isMobile && !reducedMotion

  useEffect(() => {
    if (!animate) return
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener("mousemove", onMove, { passive: true })

    let raf = 0
    let lastUpdate = 0
    const start = performance.now()

    const loop = (now: number) => {
      // Throttle React updates to ~14fps — plenty for telemetry, cheap on the main thread.
      if (now - lastUpdate > 70) {
        lastUpdate = now
        const t = (now - start) / 1000
        const el = rootRef.current
        let heading = 0
        let roll = 0
        let pitch = 0
        if (el) {
          const r = el.getBoundingClientRect()
          const dx = mouse.current.x - (r.left + r.width / 2)
          const dy = mouse.current.y - (r.top + r.height / 2)
          heading = (Math.atan2(dx, -dy) * (180 / Math.PI) + 360) % 360
          roll = clamp((dx / (r.width / 2)) * 16, -18, 18)
          pitch = clamp((dy / (r.height / 2)) * 12, -14, 14)
        }
        setHud({
          batt: 84 + Math.sin(t * 0.25) * 4,
          cpu: thinking ? 70 + Math.sin(t * 6) * 18 : 32 + Math.sin(t * 0.9) * 14 + Math.sin(t * 2.3) * 6,
          temp: 41 + Math.sin(t * 0.5) * 3,
          heading,
          roll,
          pitch,
          joints: Array.from({ length: 6 }, (_, i) => 50 + Math.sin(t * (0.6 + i * 0.18) + i) * 34),
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
    }
  }, [animate, thinking])

  const accent = colors.primary
  const rgb = colors.primaryRgb
  const navState = thinking ? "RECEIVING_QUERY" : "NOMINAL"

  // ---- Reduced / mobile: static minimal frame only ----
  if (!animate) {
    return (
      <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20">
        <Brackets color={`${accent}99`} />
        <div
          className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: `${accent}cc` }}
        >
          SYS // ONLINE
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, rgba(${rgb},0.6) 0px, rgba(${rgb},0.6) 1px, transparent 1px, transparent 4px)`,
        }}
      />
      {/* Moving scan beam */}
      <motion.div
        className="absolute inset-x-0 h-24"
        style={{ background: `linear-gradient(to bottom, transparent, rgba(${rgb},0.10), transparent)` }}
        animate={{ top: ["-15%", "115%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      {/* Accent vignette */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, transparent 55%, rgba(${rgb},0.05) 100%)` }}
      />

      <Brackets color={accent} />

      {/* Top-left: attitude indicator */}
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <div
          className="relative h-14 w-14 overflow-hidden rounded-full border"
          style={{ borderColor: `${accent}66`, boxShadow: `0 0 12px rgba(${rgb},0.25)` }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translateY(${hud.pitch}px) rotate(${hud.roll}deg)`,
              background: `linear-gradient(to bottom, transparent 49%, ${accent} 49%, ${accent} 51%, transparent 51%)`,
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: accent }} />
          <div className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: `${accent}80` }} />
        </div>
        <div className="font-mono leading-tight">
          <div className="text-[9px] uppercase tracking-widest text-white/40">Attitude</div>
          <div className="text-[11px]" style={{ color: accent }}>
            HDG {String(Math.round(hud.heading)).padStart(3, "0")}°
          </div>
        </div>
      </div>

      {/* Top-right: gauges */}
      <div className="absolute right-4 top-4 w-28 space-y-1.5 text-right font-mono">
        {([
          ["BATT", hud.batt, "%"],
          ["CPU", hud.cpu, "%"],
          ["TEMP", hud.temp, "°"],
        ] as const).map(([label, val]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-[9px]">
              <span className="uppercase tracking-widest text-white/40">{label}</span>
              <span style={{ color: accent }}>{Math.round(val)}</span>
            </div>
            <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${clamp(val, 0, 100)}%`, backgroundColor: accent, boxShadow: `0 0 8px rgba(${rgb},0.6)` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Right edge: joint encoders */}
      <div className="absolute bottom-16 right-4 flex items-end gap-1.5">
        {hud.joints.map((j, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex h-16 w-1.5 items-end overflow-hidden rounded-full bg-white/10">
              <div className="w-full rounded-full" style={{ height: `${clamp(j, 5, 100)}%`, backgroundColor: `${accent}cc` }} />
            </div>
            <span className="font-mono text-[8px] text-white/30">J{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Bottom telemetry ticker */}
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 font-mono text-[10px]">
        <span style={{ color: accent }}>{">"}</span>
        <span className="truncate" style={{ color: `${accent}cc` }}>
          nav_state:{" "}
          <span style={{ color: thinking ? accent : `${accent}b3` }}>{navState}</span>
          <span className="text-white/30"> | </span>HDG {String(Math.round(hud.heading)).padStart(3, "0")}°
          <span className="text-white/30"> | </span>/odom 30Hz
          <span className="text-white/30"> | </span>/scan OK
          <span className="text-white/30"> | </span>loop 8.3ms
        </span>
        <motion.span
          className="ml-auto inline-block h-3 w-1.5"
          style={{ backgroundColor: accent }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>

      {/* Embodied: "thinking" halo over the robot's core */}
      <AnimatePresence>
        {thinking && (
          <motion.div
            key="halo"
            className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
          >
            {[0, 0.4, 0.8].map((delay, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{ borderColor: `${accent}66` }}
                animate={{ scale: [0.6, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, delay, ease: "easeOut" }}
              />
            ))}
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 20px 6px rgba(${rgb},0.7)` }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embodied: acknowledge flare when a reply arrives */}
      <AnimatePresence>
        {replyNonce > 0 && (
          <motion.div
            key={`flare-${replyNonce}`}
            className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ borderColor: accent }}
            initial={{ width: 8, height: 8, opacity: 0.9 }}
            animate={{ width: 220, height: 220, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
