import type { CSSProperties, ReactNode } from 'react'

/** Content panel that sits over the world: dark, slightly translucent, one hairline. */
export function Panel({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-lg border border-grid bg-ground/75 p-6 backdrop-blur-md sm:p-8 ${className}`} style={style}>
      {children}
    </div>
  )
}
