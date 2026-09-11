import type { ReactNode } from 'react'

export function Chip({ children, active = false, dim = false, className = '' }: { children: ReactNode; active?: boolean; dim?: boolean; className?: string }) {
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 font-mono text-[0.6875rem] leading-5 tracking-wide transition-colors ${
        active ? 'border-accent bg-accent/15 text-accent' : dim ? 'border-grid/60 text-muted/50' : 'border-grid text-muted'
      } ${className}`}
    >
      {children}
    </span>
  )
}
