import { useState, type ReactNode } from 'react'
import { isNarrow } from '../lib/isNarrow'
import { toggleProps } from '../lib/toggleProps'

// Collapsible on narrow screens (starting collapsed), plain content on desktop.
export function MobileSection({ title, summary, children }: { title: string; summary?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(() => !isNarrow())
  return (
    <>
      <div className="lg:hidden forge-card !p-3 flex items-center gap-2 text-left cursor-pointer" {...toggleProps(open, () => setOpen(o => !o))}>
        <span className="text-sm font-semibold text-forge-text">{title}</span>
        <span className="min-w-0 truncate text-xs text-forge-dim">{summary}</span>
        <span className={`ml-auto text-xs text-forge-muted transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
      </div>
      <div className={`${open ? 'contents' : 'hidden'} lg:contents`}>{children}</div>
    </>
  )
}
