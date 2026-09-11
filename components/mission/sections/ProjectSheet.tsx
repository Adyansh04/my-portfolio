'use client'

import { ExternalLink, Github } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { MediaCarousel } from '@/components/media-carousel'
import { ProjectGlyph } from '@/components/glyphs'
import { projects } from '@/content/projects'
import type { Project } from '@/content/types'
import { Chip } from '../ui/Chip'

const ACCENT = '#FF7A1A'
const code = (id: number) => `PRJ-${String(id).padStart(3, '0')}`

/** Engineering-drawing title block (borrowed from Direction B). Every field is real project data. */
function TitleBlock({ p }: { p: Project }) {
  const sheetNo = projects.findIndex((x) => x.id === p.id) + 1
  const cell = 'border-grid px-3 py-2 font-mono text-[0.6875rem] leading-4 tracking-[0.08em]'
  return (
    <div className="grid grid-cols-2 border border-grid sm:grid-cols-4" aria-label="Title block">
      <div className={`${cell} border-b border-r`}>
        <div className="text-muted">SHEET</div>
        <div className="text-text">
          {String(sheetNo).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
        </div>
      </div>
      <div className={`${cell} border-b sm:border-r`}>
        <div className="text-muted">ID</div>
        <div className="text-accent">{code(p.id)}</div>
      </div>
      <div className={`${cell} border-b border-r sm:border-b-0`}>
        <div className="text-muted">VENUE</div>
        <div className="text-text">{p.venue}</div>
      </div>
      <div className={`${cell} border-b sm:border-b-0`}>
        <div className="text-muted">YEAR</div>
        <div className="text-text">{p.year}</div>
      </div>
      <div className={`${cell} col-span-2 border-r sm:col-span-3 sm:border-t`}>
        <div className="text-muted">TITLE</div>
        <div className="text-text">{p.title}</div>
      </div>
      <div className={`${cell} col-span-2 sm:col-span-1 sm:border-t`}>
        <div className="text-muted">STATUS</div>
        <div className={p.award ? 'text-gold' : 'text-text'}>{p.award ?? 'RELEASED'}</div>
      </div>
    </div>
  )
}

export function ProjectSheet({ project, onClose }: { project: Project | null; onClose: () => void }) {
  return (
    <Dialog open={project !== null} onOpenChange={(o) => !o && onClose()}>
      {/* minmax(0,1fr): DialogContent is a grid, and an auto track won't shrink below its widest
          unbreakable label, which pushed the sheet 28px past a phone's edge */}
      <DialogContent className="max-h-[92vh] w-[min(68.75rem,96vw)] max-w-[min(68.75rem,96vw)] grid-cols-[minmax(0,1fr)] overflow-y-auto border-grid bg-ground p-0 text-text sm:max-w-[min(68.75rem,96vw)] sm:rounded-lg">
        {project && (
          <div className="p-6 sm:p-10">
            <DialogTitle className="sr-only">{project.title}</DialogTitle>
            <DialogDescription className="sr-only">Project sheet with media, overview, tech stack and challenges.</DialogDescription>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-6">
                <TitleBlock p={project} />
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </div>
              {/* the project's line-art glyph, kept from the previous site */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-grid bg-panel">
                <ProjectGlyph folder={project.details.mediaFolder} />
              </div>
            </div>

            {/* The numbers first: someone who opens a sheet wants to know what it achieved before
                they decide whether to read anything. The column count follows the metric count —
                a fixed three left an empty cell on every project with only two worth showing. */}
            {project.metrics.length > 0 && (
              <dl
                className="mt-8 grid gap-px overflow-hidden rounded-md border border-grid bg-grid"
                style={{ gridTemplateColumns: `repeat(${Math.min(project.metrics.length, 3)}, minmax(0, 1fr))` }}
              >
                {project.metrics.map((m) => (
                  <div key={m.label} className="bg-ground px-4 py-3">
                    <dt className="font-mono text-lg leading-tight text-accent">{m.value}</dt>
                    <dd className="eyebrow mt-1">{m.label}</dd>
                  </div>
                ))}
              </dl>
            )}

            <p className="mt-6 max-w-[64ch] text-lg leading-snug text-text">{project.gist}</p>

            <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <section>
                <h3 className="eyebrow mb-3">How it works</h3>
                <ol className="space-y-2.5">
                  {project.details.approach.map((a, i) => (
                    <li key={a} className="grid grid-cols-[1.75rem_1fr] gap-2 text-[0.875rem] leading-relaxed text-muted">
                      <span className="font-mono text-accent">{String(i + 1).padStart(2, '0')}</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <h3 className="eyebrow mb-3">Tech stack</h3>
                <ul className="space-y-1.5">
                  {project.details.techStack.map((t) => (
                    <li key={t} className="flex items-start gap-2 border-b border-grid/70 py-2 font-mono text-[0.8125rem] text-text">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Each challenge is a problem and the thing that solved it. As one paragraph they read
                as prose and got skipped; split, the pair is the interesting part. */}
            <section className="mt-8">
              <h3 className="eyebrow mb-3">Hard parts</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {project.details.challenges.map((c, i) => (
                  <article key={c.title} className="rounded-md border border-grid bg-panel/60 p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[0.6875rem] text-accent">{String(i + 1).padStart(2, '0')}</span>
                      <h4 className="text-[0.9375rem] font-semibold leading-snug text-text">{c.title}</h4>
                    </div>
                    <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-muted">{c.problem}</p>
                    <p className="mt-2.5 border-t border-grid pt-2.5 text-[0.8125rem] leading-relaxed text-text">
                      <span className="eyebrow mr-1.5 text-accent">Fix</span>
                      {c.solution}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h3 className="eyebrow mb-3">Media gallery</h3>
              <MediaCarousel project={project.details.mediaFolder} primaryColor={ACCENT} />
            </section>

            {/* Nothing was thrown away — the original write-up is here for anyone who wants it. */}
            <details className="group mt-8 rounded-md border border-grid">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm text-muted transition hover:text-text">
                <span className="eyebrow mr-2 text-accent">Full write-up</span>
                <span className="group-open:hidden">Read the long version</span>
                <span className="hidden group-open:inline">Hide</span>
              </summary>
              <div className="border-t border-grid px-4 py-4">
                <p className="max-w-[72ch] leading-relaxed text-text">{project.description}</p>
                <p className="mt-4 max-w-[72ch] leading-relaxed text-muted">{project.details.fullDescription}</p>
              </div>
            </details>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-grid pt-6">
              {project.links.github !== '#' && (
                <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-grid px-4 py-2 text-sm text-text transition hover:border-muted pointer-coarse:py-3">
                  <Github className="h-4 w-4" /> View Source Code
                </a>
              )}
              {project.links.demo !== '#' && (
                <a href={project.links.demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#141414] pointer-coarse:py-3">
                  <ExternalLink className="h-4 w-4" /> Live Demo
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
