import { useState, type ReactNode } from 'react'

export function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between pl-[11px] pr-3 pt-1 pb-0 text-xs font-medium text-[#6b7280] uppercase tracking-wider hover:text-[#9ca3af] transition-colors cursor-pointer"
      >
        {title}
        <span className={`transition-transform duration-200 leading-none ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
      </button>
      {open && <div className="flex flex-col">{children}</div>}
    </div>
  )
}
