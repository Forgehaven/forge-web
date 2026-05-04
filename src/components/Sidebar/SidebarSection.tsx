export function SidebarSection({
  label,
  isCollapsed,
  onToggle,
  children,
}: {
  label: string
  isCollapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between pl-[11px] pr-3 pt-1 pb-0 text-xs font-medium text-[#6b7280] uppercase tracking-wider hover:text-[#9ca3af] transition-colors cursor-pointer"
      >
        {label}
        <span
          className="transition-transform duration-200 leading-none"
          style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>
      {!isCollapsed && children}
    </div>
  )
}
