import { useState, type ReactNode } from 'react'
import { isNarrow } from '../lib/isNarrow'
import { toggleProps } from '../lib/toggleProps'

// Collapsible on narrow screens (starting collapsed) under a section heading,
// plain content on desktop.
export function MobileSection({ title, summary, children }: { title: string; summary?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(() => !isNarrow())
  return (
    <>
      <div className="lg:hidden flex items-center gap-2 border-b border-forge-accent/30 pb-1 text-left cursor-pointer" {...toggleProps(open, () => setOpen(o => !o))}>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-forge-accent">{title}</span>
        <span className="min-w-0 truncate text-xs text-forge-dim">{summary}</span>
        <span className={`ml-auto text-xs text-forge-muted transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
      </div>
      <div className={`${open ? 'contents' : 'hidden'} lg:contents`}>{children}</div>
    </>
  )
}
