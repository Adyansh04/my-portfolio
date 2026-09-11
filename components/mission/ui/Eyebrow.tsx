import type { ReactNode } from 'react'

/** Zone label line: `ZONE 03 · PROJECTS`. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`eyebrow ${className}`}>{children}</div>
}
