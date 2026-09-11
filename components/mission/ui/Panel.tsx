import type { CSSProperties, ReactNode } from 'react'

/**
 * Content panel that sits over the world: dark, slightly translucent, one hairline. Opaque enough
 * to read against a lit floor — at 75% the brighter world showed straight through.
 *
 * No backdrop-filter, on purpose. Every panel sits over a WebGL canvas that redraws every frame, so
 * a blur behind it has to be recomputed by the compositor every frame too, and at 95% opacity it
 * was contributing almost nothing you could see.
 */
export function Panel({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-lg border border-grid/90 bg-ground/95 p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] sm:p-8 ${className}`} style={style}>
      {children}
    </div>
  )
}
