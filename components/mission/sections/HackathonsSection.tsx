import { Building2, Calendar } from 'lucide-react'
import { site } from '@/content/site'
import { hackathons } from '@/content/hackathons'
import { Eyebrow } from '../ui/Eyebrow'
import { Chip } from '../ui/Chip'
import { IconByName } from '../ui/IconByName'
import { Panel } from '../ui/Panel'

export function HackathonsSection() {
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-24 pt-20 sm:px-10 lg:pb-64">
      <Eyebrow>ZONE 04 · {site.sections.hackathons.eyebrow}</Eyebrow>
      <h2 className="font-display mt-3 text-5xl font-bold uppercase tracking-wide text-text sm:text-6xl">{site.sections.hackathons.title}</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-3 lg:max-w-[1040px]">
        {hackathons.map((h, i) => {
          const medal = h.accent ?? 'var(--accent)'
          return (
            <Panel key={h.id} className="beat-acc flex flex-col" style={{ '--i': i } as React.CSSProperties}>
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full border" style={{ borderColor: medal, color: medal }}>
                  <IconByName name={h.icon} className="h-5 w-5" />
                </span>
                <span className="rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em]" style={{ borderColor: medal, color: medal }}>
                  {h.rank}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold leading-snug text-text">{h.title}</h3>
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] tracking-[0.1em] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {h.organizer}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {h.date}
                </span>
              </div>
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted">{h.description}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {h.tags.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
