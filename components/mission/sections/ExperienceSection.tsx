import { MapPin } from 'lucide-react'
import { site } from '@/content/site'
import { experiences } from '@/content/experience'
import { Eyebrow } from '../ui/Eyebrow'
import { Chip } from '../ui/Chip'
import { IconByName } from '../ui/IconByName'
import { Panel } from '../ui/Panel'

export function ExperienceSection() {
  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-8 px-6 py-24 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <Eyebrow>ZONE 02 · {site.sections.experience.title}</Eyebrow>
        <h2 className="font-display mt-3 text-5xl font-bold uppercase tracking-wide text-text sm:text-6xl">Experience</h2>
        {/* doorway rail: one node per role */}
        <ol className="mt-8 hidden border-l border-grid lg:block">
          {experiences.map((e, i) => (
            <li key={e.id} className="rail-node relative pl-6 py-2.5" style={{ '--i': i } as React.CSSProperties}>
              <span className="rail-dot absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full border border-grid bg-ground" />
              <div className="font-mono text-[11px] tracking-[0.12em] text-muted">{e.period}</div>
              <div className="rail-label text-sm text-muted">{e.company}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="beat-stack lg:ml-auto lg:w-[min(560px,100%)]">
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
              <div className="text-right font-mono text-[11px] leading-5 tracking-[0.1em] text-muted">
                <div>{e.period}</div>
                <div className="flex items-center justify-end gap-1">
                  <MapPin className="h-3 w-3" /> {e.location}
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-[62ch] leading-relaxed text-muted">{e.description}</p>
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
