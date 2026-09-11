import { MapPin } from 'lucide-react'
import { site } from '@/content/site'
import { experiences } from '@/content/experience'
import { Eyebrow } from '../ui/Eyebrow'
import { Chip } from '../ui/Chip'
import { IconByName } from '../ui/IconByName'
import { Panel } from '../ui/Panel'

export function ExperienceSection() {
  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-8 px-6 py-24 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pb-[var(--hud-bottom)]">
      <div className="exp-rail-col">
        <Eyebrow>ZONE 02 · {site.sections.experience.title}</Eyebrow>
        <h2 className="font-display mt-3 text-5xl font-bold uppercase tracking-wide text-text sm:text-6xl">Experience</h2>
        {/* Doorway rail: one node per role, one line each. Two lines per role put the seventh into
            the minimap at every desktop size. With one line, and the column top-aligned on screens
            up to 900px tall (.exp-rail-col), it holds the eleven roles the corridor has room for. */}
        <ol className="mt-8 hidden border-l border-grid lg:block">
          {experiences.map((e, i) => (
            <li key={e.id} className="rail-node relative flex items-baseline gap-3 py-1 pl-6" style={{ '--i': i } as React.CSSProperties}>
              <span className="rail-dot absolute -left-[5px] top-[0.65rem] h-2.5 w-2.5 rounded-full border border-grid bg-ground" />
              <span className="w-[13rem] shrink-0 font-mono text-[0.6875rem] tracking-[0.12em] text-muted">{e.period}</span>
              <span className="rail-label text-sm text-muted">{e.company}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="beat-stack lg:ml-auto lg:w-[min(35rem,100%)]">
        {experiences.map((e, i) => (
          <Panel key={e.id} className="beat" style={{ '--i': i } as React.CSSProperties}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md border border-grid text-accent">
                  <IconByName name={e.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-text">{e.title}</h3>
                  <div className="text-sm text-accent">{e.company}</div>
                </div>
              </div>
              <div className="text-right font-mono text-[0.6875rem] leading-5 tracking-[0.1em] text-muted">
                <div>{e.period}</div>
                <div className="flex items-center justify-end gap-1">
                  <MapPin className="h-3 w-3" /> {e.location}
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-snug text-text">{e.gist}</p>
            <ul className="mt-3 space-y-1.5">
              {e.points.map((pt) => (
                <li key={pt} className="grid max-w-[58ch] grid-cols-[0.75rem_1fr] gap-2 text-[0.875rem] leading-snug text-muted">
                  <span className="mt-[0.45em] h-1 w-1 rounded-full bg-accent" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 grid grid-cols-2 gap-4">
              {e.highlights.map((h) => (
                <div key={h.label} className="border-t border-grid pt-3">
                  <dt className="eyebrow">{h.label}</dt>
                  <dd className="mt-1 font-mono text-lg text-accent">{h.metric}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {e.badges.map((b) => (
                <Chip key={b}>{b}</Chip>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
