'use client'

import { projects } from '@/content/projects'
import { setActiveTag, useMission } from '@/lib/mission/store'

const TAGS = Array.from(new Set(projects.flatMap((p) => p.tags)))

/** Borrowed from Direction C: pick a technology and every project sharing it lights up (cards + pedestals). */
export function TagFilter({ compact = false }: { compact?: boolean }) {
  const active = useMission((s) => s.activeTag)
  return (
    <div
      role="group"
      aria-label="Filter projects by technology"
      className={compact ? 'scrollbar-none flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 [mask-image:linear-gradient(90deg,#000_92%,transparent)]' : 'flex flex-wrap gap-1.5'}
    >
      {compact && <span className="mr-1 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">FILTER</span>}
      {TAGS.map((tag) => {
        const on = active === tag
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={on}
            onClick={() => setActiveTag(on ? null : tag)}
            onMouseEnter={() => setActiveTag(tag)}
            onMouseLeave={() => !on && setActiveTag(null)}
            className={`shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[11px] leading-5 tracking-wide transition-colors ${
              on ? 'border-accent bg-accent/15 text-accent' : 'border-grid bg-ground/60 text-muted hover:border-muted hover:text-text'
            }`}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
