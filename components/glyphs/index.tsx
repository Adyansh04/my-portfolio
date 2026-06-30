"use client"

import { useEffect, useRef, useState, type ComponentType } from "react"
import { cn } from "@/lib/utils"
import { Go2Svg } from "./go2-svg"
import { WhyCodeSvg } from "./whycode-svg"
import { AiRoboticsSvg } from "./ai-robotics"
import { OliveSvg } from "./olive"
import { SepsisAtlasSvg } from "./sepsis-atlas"
import { AbuRoboconSvg } from "./abu-robocon"
import { KiwiDriveSvg } from "./kiwi-drive"
import { VanguardSvg } from "./vanguard"
import { AgroBotSvg } from "./agrobot"
import { DroneSystemsSvg } from "./drone-systems"

type GlyphComponent = ComponentType<{ className?: string }>

/** Maps a project's mediaFolder to its animated SVG line-art glyph. */
const GLYPHS: Record<string, GlyphComponent> = {
  "go2-inspection": Go2Svg,
  whycode: WhyCodeSvg,
  "ai-robotics": AiRoboticsSvg,
  olive: OliveSvg,
  "sepsis-atlas": SepsisAtlasSvg,
  "abu-robocon": AbuRoboconSvg,
  "kiwi-drive": KiwiDriveSvg,
  vanguard: VanguardSvg,
  agrobot: AgroBotSvg,
  "drone-systems": DroneSystemsSvg,
}

/**
 * Renders a project's animated glyph, but only while the card is near/in the
 * viewport — it unmounts when scrolled away so off-screen cards don't run their
 * animation loops (keeps all 10 cards cheap on the main thread).
 */
export function ProjectGlyph({ folder, className }: { folder?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "250px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const Glyph = folder ? GLYPHS[folder] : undefined

  return (
    <div ref={ref} className={cn("absolute inset-0", className)}>
      {visible && Glyph ? <Glyph /> : null}
    </div>
  )
}
