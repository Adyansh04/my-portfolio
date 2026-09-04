'use client'

import { useState } from 'react'
import { Calendar, ExternalLink, Github, MapPin, Trophy } from 'lucide-react'
import { site } from '@/content/site'
import { projects } from '@/content/projects'
import { useMission } from '@/lib/mission/store'
import { Eyebrow } from '../ui/Eyebrow'
import { Chip } from '../ui/Chip'
import { Panel } from '../ui/Panel'
import { TagFilter } from './TagFilter'
import { ProjectSheet } from './ProjectSheet'

export const projectCode = (id: number) => `PRJ-${String(id).padStart(3, '0')}`

/**
 * Projects zone layout: a slim tech-tag strip along the top, a compact heading top-left, and the
 * project card pinned to the right edge — the middle of the frame stays free for the pedestal holograms.
 */
export function ProjectsSection() {
  const [openId, setOpenId] = useState<number | null>(null)
  const activeTag = useMission((s) => s.activeTag)
  const beat = useMission((s) => s.beat)
  const open = projects.find((p) => p.id === openId) ?? null

  return (
    <div className="pz relative h-full">
      {/* tech-tag filter: one scrollable row under the HUD status */}
      <div className="pz-abs absolute left-6 right-6 top-[92px] hidden md:block sm:left-10 sm:right-10 lg:right-[min(480px,38vw)]">
        <TagFilter compact />
      </div>

      {/* heading: compact, top-left */}
      <div className="pz-abs absolute left-6 top-[142px] sm:left-10">
        <Eyebrow>ZONE 03 · {site.sections.projects.eyebrow}</Eyebrow>
        <div className="mt-2 flex items-baseline gap-4">
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide text-text sm:text-5xl">{site.sections.projects.title}</h2>
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted">
            <span className="text-text">{String(beat + 1).padStart(2, '0')}</span> / {String(projects.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* project card: right edge, vertically centred, narrow */}
      <div className="pz-abs absolute right-6 top-1/2 w-[min(440px,calc(100vw-3rem))] -translate-y-1/2 sm:right-10 lg:w-[min(440px,36vw)]">
        <div className="beat-stack">
          {projects.map((p, i) => {
            const dim = activeTag !== null && !p.tags.includes(activeTag)
            return (
              <Panel key={p.id} className={`beat !p-5 transition-opacity sm:!p-6 ${dim ? 'saturate-0' : ''}`} style={{ '--i': i } as React.CSSProperties}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] tracking-[0.1em] text-muted">
                  <span className="text-accent">{projectCode(p.id)}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.venue}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {p.year}
                  </span>
                </div>
                {p.award && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-sm border border-gold/40 bg-gold/10 px-1.5 font-mono text-[11px] tracking-[0.1em] text-gold">
                    <Trophy className="h-3 w-3" /> {p.award}
                  </div>
                )}
                <h3 className="mt-3 text-xl font-semibold leading-snug text-text">{p.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <Chip key={t} active={activeTag === t} dim={dim}>
                      {t}
                    </Chip>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <button type="button" onClick={() => setOpenId(p.id)} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#141414] transition hover:brightness-110">
                    Open sheet
                  </button>
                  {p.links.github !== '#' && (
                    <a href={p.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-grid px-3.5 py-2 text-sm text-text transition hover:border-muted">
                      <Github className="h-4 w-4" /> Source
                    </a>
                  )}
                  {p.links.demo !== '#' && (
                    <a href={p.links.demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-grid px-3.5 py-2 text-sm text-text transition hover:border-muted">
                      <ExternalLink className="h-4 w-4" /> Demo
                    </a>
                  )}
                </div>
              </Panel>
            )
          })}
        </div>
      </div>

      <ProjectSheet project={open} onClose={() => setOpenId(null)} />
    </div>
  )
}
