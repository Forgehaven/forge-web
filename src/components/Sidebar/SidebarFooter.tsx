import { CogIcon } from '../Icons'

export function SidebarFooter({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex border-t border-[#2a2d3a] h-10 items-center px-4">
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 text-[#3a3d4a] hover:text-[#6b7280] transition-colors cursor-pointer"
      >
        <CogIcon />
        <span className="text-xs tracking-widest uppercase">Settings</span>
      </button>
    </div>
  )
}
