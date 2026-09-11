'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ZONES } from '@/lib/mission/zones'
import { mission, setProgress } from '@/lib/mission/store'
import { ENTRY_T } from '@/lib/mission/path'
import { ZoneSection } from './ZoneSection'
import { Hud } from './hud/Hud'
import { WorldCanvas } from './WorldCanvas'
import { HeroSection } from './sections/HeroSection'
import { ProfileSection } from './sections/ProfileSection'
import { ExperienceSection } from './sections/ExperienceSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { HackathonsSection } from './sections/HackathonsSection'
import { CredentialsSection } from './sections/CredentialsSection'
import { DockSection } from './sections/DockSection'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const SECTIONS = {
  hero: HeroSection,
  profile: ProfileSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
  hackathons: HackathonsSection,
  credentials: CredentialsSection,
  contact: DockSection,
} as const

export function MissionPage() {
  const mainRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const main = mainRef.current
      if (!main) return
      const sections = Array.from(main.querySelectorAll<HTMLElement>('[data-zone]'))
      const lastBeat = new Array(sections.length).fill(-1)
      let lastZone = -1

      const apply = (t: number) => {
        setProgress(t)
        const { zone, zoneT, beat, beatT } = mission
        sections.forEach((el, i) => {
          const zt = i < zone ? 1 : i > zone ? 0 : zoneT
          // hold this zone's copy back until the robot has actually arrived in the room
          const lo = ENTRY_T[i] * 0.72
          const hi = ENTRY_T[i] + 0.012
          const enter = i < zone ? 1 : i > zone ? 0 : Math.min(1, Math.max(0, (zoneT - lo) / (hi - lo)))
          el.style.setProperty('--enter', enter.toFixed(4))
          const b = i < zone ? ZONES[i].beats - 1 : i > zone ? 0 : beat
          el.style.setProperty('--zt', zt.toFixed(4))
          el.style.setProperty('--bt', (i === zone ? beatT : i < zone ? 1 : 0).toFixed(4))
          if (b !== lastBeat[i]) {
            lastBeat[i] = b
            el.style.setProperty('--beat', String(b))
            // only the active beat may receive pointer events
            el.querySelectorAll<HTMLElement>('.beat').forEach((item) => {
              item.classList.toggle('is-active', Number(item.style.getPropertyValue('--i')) === b)
            })
          }
          const state = i < zone ? 'past' : i > zone ? 'future' : 'active'
          if (el.dataset.state !== state) el.dataset.state = state
        })
        if (zone !== lastZone) {
          lastZone = zone
          // keep the URL in sync with the zone so deep links work
          const id = ZONES[zone].id
          // keep ?mode=static / ?capture=1 etc. intact while syncing the hash
          if (typeof history !== 'undefined') history.replaceState(null, '', `${location.pathname}${location.search}${zone === 0 ? '' : `#${id}`}`)
        }
      }

      const trigger = ScrollTrigger.create({
        trigger: main,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => apply(self.progress),
      })
      apply(trigger.progress)

      // Layout can shift once web fonts land → recompute trigger bounds, then honour a deep link.
      const onReady = () => {
        ScrollTrigger.refresh()
        const hash = location.hash.replace('#', '')
        if (hash && ZONES.some((z) => z.id === hash)) document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
      }
      if (document.fonts?.ready) document.fonts.ready.then(onReady)
      else onReady()
    },
    { scope: mainRef },
  )

  return (
    <>
      <WorldCanvas />
      <main ref={mainRef} className="relative z-10">
        {ZONES.map((zone) => {
          const Section = SECTIONS[zone.id]
          return (
            <ZoneSection key={zone.id} zone={zone}>
              <Section />
            </ZoneSection>
          )
        })}
      </main>
      <Hud />
    </>
  )
}
