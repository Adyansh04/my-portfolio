"use client"

import { Suspense, lazy, useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"

const Spline = lazy(() => import("@splinetool/react-spline"))

type Attention = "none" | "chat"

interface SplineSceneProps {
  scene: string
  className?: string
  trackingAreaRef?: React.RefObject<HTMLElement | null>
  /** When "chat", the robot biases its gaze toward the chat terminal (left). */
  attention?: Attention
  /** Increment to trigger a brief "acknowledge" reaction (e.g. when the assistant replies). */
  replyNonce?: number
}

const IDLE_MS = 2200 // after this long without cursor movement, the robot looks around on its own
const SMOOTH_RATE = 6 // higher = snappier; lower = heavier/laggier look-at

export function SplineScene({
  scene,
  className,
  trackingAreaRef,
  attention = "none",
  replyNonce = 0,
}: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const splineRef = useRef<any>(null)

  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()

  // Live values the rAF loop reads without re-subscribing.
  const attentionRef = useRef<Attention>(attention)
  const reactUntilRef = useRef(0)
  useEffect(() => {
    attentionRef.current = attention
  }, [attention])
  useEffect(() => {
    if (replyNonce > 0) reactUntilRef.current = performance.now() + 700
  }, [replyNonce])

  useEffect(() => {
    const trackingArea = trackingAreaRef?.current
    const container = containerRef.current
    if (!trackingArea || !container) return

    // Normalized gaze target in canvas space (0..1). Center = facing forward.
    const target = { x: 0.5, y: 0.5 }
    const smoothed = { x: 0.5, y: 0.5 }
    let lastMove = -Infinity
    let drift = 0
    let visible = true
    let raf = 0
    let last = performance.now()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = trackingArea.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      // Amplify so the robot reacts to the whole hero, not just over the canvas.
      target.x = (nx - 0.5) * 2.5 + 0.5
      target.y = (ny - 0.5) * 2.0 + 0.5
      lastMove = performance.now()
    }

    const dispatch = (nx: number, ny: number) => {
      const canvas = container.querySelector("canvas")
      if (!canvas) return
      const r = canvas.getBoundingClientRect()
      canvas.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: r.left + nx * r.width,
          clientY: r.top + ny * r.height,
          bubbles: true,
          cancelable: true,
        })
      )
    }

    // Static fallback: face roughly forward, no animation loop.
    if (isMobile || reducedMotion) {
      const t = setTimeout(() => dispatch(0.5, 0.46), 400)
      return () => clearTimeout(t)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { threshold: 0.05 }
    )
    io.observe(trackingArea)

    const loop = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      if (visible) {
        let dx: number
        let dy: number

        if (attentionRef.current === "chat") {
          // Turn to "listen" to the chat terminal on the left.
          dx = 0.12
          dy = 0.44
        } else if (now - lastMove > IDLE_MS) {
          // Idle: slowly look around so the robot never feels frozen.
          drift += dt
          dx = 0.5 + Math.sin(drift * 0.6) * 0.2
          dy = 0.5 + Math.sin(drift * 0.9 + 1.3) * 0.13
        } else {
          dx = target.x
          dy = target.y
        }

        // Brief "acknowledge" dip when the assistant replies.
        if (now < reactUntilRef.current) {
          const k = (reactUntilRef.current - now) / 700
          dy += Math.sin((1 - k) * Math.PI) * 0.16
        }

        const a = 1 - Math.exp(-dt * SMOOTH_RATE)
        smoothed.x += (dx - smoothed.x) * a
        smoothed.y += (dy - smoothed.y) * a
        dispatch(smoothed.x, smoothed.y)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    trackingArea.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      trackingArea.removeEventListener("mousemove", handleMouseMove)
    }
  }, [trackingAreaRef, isMobile, reducedMotion])

  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00FF9D]/20 border-t-[#00FF9D]" />
            <span className="text-sm text-[#71717A]">Loading 3D Model...</span>
          </div>
        </div>
      }
    >
      <div ref={containerRef} className="w-full h-full">
        <Spline
          scene={scene}
          className={className}
          onLoad={(spline: any) => {
            splineRef.current = spline
          }}
        />
      </div>
    </Suspense>
  )
}
