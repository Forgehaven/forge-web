import { Link } from 'react-router-dom'

export function SidebarHeader({ section, to, onClose }: { section: string; to: string; onClose?: () => void }) {
  return (
    <div className="border-b border-[#2a2d3a]">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to="/" className="shrink-0 rounded hover:opacity-75 transition-opacity">
          <img src="/images/logo.png" alt="Forgehaven" className="w-8 h-8" />
        </Link>
        <Link to={to} onClick={onClose} className="text-[#e2e4ed] font-semibold text-base tracking-wide hover:opacity-75 transition-opacity">
          Forge<span className="text-[#c4af64]">{section}</span>
        </Link>
      </div>
    </div>
  )
}
