"use client"

import { Suspense, lazy, useEffect, useRef } from "react"

const Spline = lazy(() => import("@splinetool/react-spline"))

interface SplineSceneProps {
  scene: string
  className?: string
  trackingAreaRef?: React.RefObject<HTMLElement | null>
}

export function SplineScene({ scene, className, trackingAreaRef }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Extend cursor tracking to the entire tracking area (e.g., hero section)
  useEffect(() => {
    if (!trackingAreaRef?.current || !containerRef.current) return

    const trackingArea = trackingAreaRef.current
    const container = containerRef.current

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = container.querySelector("canvas")
      if (!canvas) return

      const trackingRect = trackingArea.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()

      // Map mouse position from tracking area to canvas coordinates
      // Amplify the movement for more dramatic rotation (2x multiplier)
      const normalizedX = (e.clientX - trackingRect.left) / trackingRect.width
      const normalizedY = (e.clientY - trackingRect.top) / trackingRect.height

      // Apply amplification - extend the range beyond 0-1 for more dramatic movement
      const amplifiedX = (normalizedX - 0.5) * 2.5 + 0.5
      const amplifiedY = (normalizedY - 0.5) * 2.0 + 0.5

      // Map to canvas coordinates
      const canvasX = canvasRect.left + amplifiedX * canvasRect.width
      const canvasY = canvasRect.top + amplifiedY * canvasRect.height

      // Dispatch synthetic mouse event to the canvas
      const syntheticEvent = new MouseEvent("mousemove", {
        clientX: canvasX,
        clientY: canvasY,
        bubbles: true,
        cancelable: true,
      })
      canvas.dispatchEvent(syntheticEvent)
    }

    trackingArea.addEventListener("mousemove", handleMouseMove)
    return () => trackingArea.removeEventListener("mousemove", handleMouseMove)
  }, [trackingAreaRef])

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
        <Spline scene={scene} className={className} />
      </div>
    </Suspense>
  )
}
