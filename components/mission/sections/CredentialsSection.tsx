import { ExternalLink } from 'lucide-react'
import { site } from '@/content/site'
import { credentialGroups } from '@/content/credentials'
import { Eyebrow } from '../ui/Eyebrow'
import { Chip } from '../ui/Chip'
import { IconByName } from '../ui/IconByName'
import { Panel } from '../ui/Panel'

export function CredentialsSection() {
  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-8 px-6 py-20 sm:px-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <div>
        <Eyebrow>ZONE 05 · {site.sections.credentials.eyebrow}</Eyebrow>
        <h2 className="font-display mt-3 text-5xl font-bold uppercase tracking-wide text-text sm:text-6xl">{site.sections.credentials.title}</h2>
        <ol className="mt-8 hidden border-l border-grid lg:block">
          {credentialGroups.map((g, i) => (
            <li key={g.id} className="rail-node relative py-2.5 pl-6" style={{ '--i': i } as React.CSSProperties}>
              <span className="rail-dot absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full border border-grid bg-ground" />
              <div className="rail-label flex items-center gap-2 text-sm text-muted">
                <IconByName name={g.icon} className="h-4 w-4" /> {g.title}
                <span className="font-mono text-[11px]">· {g.items.length}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="beat-stack">
        {credentialGroups.map((g, i) => (
          <Panel key={g.id} className="beat" style={{ '--i': i } as React.CSSProperties}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconByName name={g.icon} className="h-4 w-4 text-accent" />
                <h3 className="text-lg font-semibold text-text">{g.title}</h3>
              </div>
              <span className="font-mono text-[11px] tracking-[0.12em] text-muted">{g.id.toUpperCase()}_REGISTRY · {g.items.length} ITEMS</span>
            </div>
            <ul className="divide-y divide-grid/70">
              {g.items.map((item) => (
                <li key={item.title} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="max-w-[52ch] font-medium leading-snug text-text">{item.title}</h4>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-accent">{item.status}</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] tracking-[0.1em] text-muted">
                    {item.id} · {item.year}
                  </div>
                  <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-muted">{item.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {item.highlights.map((h) => (
                      <Chip key={h}>{h}</Chip>
                    ))}
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.1em] text-accent hover:underline">
                      OPEN <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  )
}
