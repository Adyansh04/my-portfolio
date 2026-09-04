import { GraduationCap } from 'lucide-react'
import { site } from '@/content/site'
import { education } from '@/content/education'
import { techStack } from '@/content/tech-stack'
import { Eyebrow } from '../ui/Eyebrow'
import { Panel } from '../ui/Panel'

export function ProfileSection() {
  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-8 px-6 py-24 sm:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pb-56">
      <div className="space-y-6">
        <div>
          <Eyebrow>ZONE 01 · {site.sections.profile.title} · {site.sections.profile.subtitle}</Eyebrow>
          <h2 className="font-display mt-3 text-5xl font-bold uppercase tracking-wide text-text sm:text-6xl">{site.sections.profile.title}</h2>
        </div>

        <blockquote className="beat-acc max-w-[44ch] rounded-md border-l-2 border-accent bg-ground/70 py-4 pl-5 pr-5 text-xl font-medium leading-snug text-text backdrop-blur-md sm:text-2xl" style={{ '--i': 0 } as React.CSSProperties}>
          {site.mission}
        </blockquote>

        <Panel className="beat-acc" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="mb-4 flex items-center gap-2 text-muted">
            <GraduationCap className="h-4 w-4 text-accent" />
            <span className="eyebrow">{site.sections.profile.education}</span>
          </div>
          <ol className="space-y-5">
            {education.map((e) => (
              <li key={e.school} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:gap-6">
                <div>
                  <div className="font-mono text-[11px] tracking-[0.12em] text-muted">
                    {e.flag} · {e.country}
                  </div>
                  <div className="mt-1 font-medium text-text">{e.school}</div>
                  <div className="text-sm text-muted">{e.degree}</div>
                </div>
                <div className="font-mono text-xs text-accent sm:text-right">{e.years}</div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel className="beat-acc" style={{ '--i': 2 } as React.CSSProperties}>
        <div className="mb-4 flex items-center justify-between">
          <span className="eyebrow">{site.sections.profile.techStack} · inventory</span>
          <span className="font-mono text-[11px] tracking-[0.12em] text-accent">{techStack.length} ITEMS</span>
        </div>
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {techStack.map((t, i) => (
            <li key={t} className="flex items-baseline gap-2 rounded-sm border border-grid/70 px-2.5 py-1.5 font-mono text-[12px] text-text">
              <span className="text-[10px] text-muted">{String(i + 1).padStart(2, '0')}</span>
              {t}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
