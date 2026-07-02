import { useState, type ReactNode } from 'react'

// Generic collapsible section. `defaultOpen` is the initial state only (re-evaluated each time
// the component mounts - e.g. when a Modal that unmounts its children is reopened).
export function Collapsible({
  title,
  defaultOpen = false,
  children,
}: {
  title: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-1 text-sm font-medium text-[#e2e4ed] hover:text-white transition-colors cursor-pointer"
      >
        {title}
        <span className={`transition-transform duration-200 leading-none ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
      </button>
      {open && <div className="pt-1 pb-1">{children}</div>}
    </div>
  )
}
