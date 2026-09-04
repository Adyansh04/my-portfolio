import { ChevronRight, Download } from 'lucide-react'
import { site } from '@/content/site'
import { contactCommands, resume } from '@/content/contact'
import { asset } from '@/lib/base-path'
import { Eyebrow } from '../ui/Eyebrow'
import { IconByName } from '../ui/IconByName'
import { Panel } from '../ui/Panel'
import { ChatConsole } from './ChatConsole'

export function DockSection() {
  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-8 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:pb-52">
      <div className="space-y-6">
        <div className="beat-acc" style={{ '--i': 0 } as React.CSSProperties}>
          <Eyebrow>ZONE 06 · {site.sections.contact.eyebrow}</Eyebrow>
          <h2 className="font-display mt-3 text-5xl font-bold uppercase tracking-wide text-text sm:text-6xl">{site.sections.contact.title}</h2>
          <div className="mt-4 font-mono text-[11px] tracking-[0.14em] text-accent">LOOP CLOSED · MISSION COMPLETE · 100% MAPPED</div>
        </div>

        <Panel className="beat-acc font-mono text-[13px] leading-6" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="mb-3 text-muted">{site.sections.contact.welcome}</div>
          <ol className="space-y-3">
            {contactCommands.map((c) => (
              <li key={c.label}>
                <div className="text-muted">
                  <span className="text-accent">adyansh@portfolio</span>:<span className="text-accent">~</span>$ <span className="text-text">{c.command}</span>
                </div>
                <a href={c.link} target="_blank" rel="noopener noreferrer" className="ml-4 inline-flex items-center gap-2 text-accent hover:underline">
                  <ChevronRight className="h-3 w-3" />
                  <IconByName name={c.icon} className="h-3.5 w-3.5" />
                  {c.output}
                </a>
              </li>
            ))}
          </ol>
          <a
            href={asset(resume.href)}
            download={resume.downloadName}
            className="mt-6 inline-flex items-center gap-3 rounded-md border border-grid px-4 py-3 text-text transition hover:border-accent"
          >
            <Download className="h-4 w-4 text-accent" />
            <span>
              <span className="block text-sm">{resume.fileLabel}</span>
              <span className="block text-[11px] tracking-[0.1em] text-muted">{resume.label.toUpperCase()} · {resume.hint}</span>
            </span>
          </a>
        </Panel>
      </div>

      <div className="beat-acc" style={{ '--i': 2 } as React.CSSProperties}>
        <ChatConsole />
        <footer className="mt-4 font-mono text-[11px] tracking-[0.12em] text-muted">
          © {new Date().getFullYear()} {site.name} · {site.role}
        </footer>
      </div>
    </div>
  )
}
