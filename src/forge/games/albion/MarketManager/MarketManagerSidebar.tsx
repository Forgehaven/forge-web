import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SidebarShell } from '../../../../components/Sidebar/SidebarShell'
import { SidebarHeader } from '../../../../components/Sidebar/SidebarHeader'
import { SidebarDivider } from '../../../../components/Sidebar/SidebarDivider'
import { SidebarFooter } from '../../../../components/Sidebar/SidebarFooter'
import { Modal } from '../../../../components/Modal'
import { useAuth } from '../authContext'

interface MarketManagerSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

export function MarketManagerSidebar({ isOpen, onClose, onOpenSettings }: MarketManagerSidebarProps) {
  const [userModalOpen, setUserModalOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <>
    <SidebarShell isOpen={isOpen}>
      <SidebarHeader section="Games" to="/games" onClose={onClose} />

      <nav className="flex-1 overflow-y-auto py-1 min-w-0">
        {isAuthenticated && user?.guild_member && user?.has_role && (
          <>
          <NavLink
            to="/games/albion/market-manager/guild-data"
            onClick={onClose}
            className={({ isActive }) =>
              `block pl-4 pr-8 py-2 md:py-0 text-sm leading-5 transition-colors ${
                isActive
                  ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
                  : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
              }`
            }
          >
            Guild Data
          </NavLink>
          <SidebarDivider />
          <NavLink
            to="/games/albion/market-manager/gold"
            onClick={onClose}
            className={({ isActive }) =>
              `block pl-4 pr-8 py-2 md:py-0 text-sm leading-5 transition-colors ${
                isActive
                  ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
                  : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
              }`
            }
          >
            Gold Price
          </NavLink>
          </>
        )}
      </nav>

      {isAuthenticated && user && (
        <div className="border-t border-[#2a2d3a] px-4 py-2.5">
          <button
            onClick={() => setUserModalOpen(true)}
            className={`text-sm transition-colors cursor-pointer truncate w-full text-left ${!user.guild_member || !user.has_role ? 'text-red-400 hover:text-red-300' : 'text-[#9ca3af] hover:text-[#e2e4ed]'}`}
          >
            {user.username}
          </button>
        </div>
      )}

      <div className="border-t border-[#2a2d3a]">
        <Link
          to="/games"
          onClick={onClose}
          className="block pl-4 pr-8 py-2 text-sm leading-5 transition-colors text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]"
        >
          ← Return to Games
        </Link>
      </div>

      <SidebarFooter onOpenSettings={onOpenSettings} />
    </SidebarShell>

    {user && (
      <Modal open={userModalOpen} onClose={() => setUserModalOpen(false)} title="User">
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">Discord</p>
            <p className="text-sm text-[#e2e4ed]">{user.username}</p>
            <p className="text-xs text-[#6b7280]">{user.discord_id}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${user.guild_member ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {user.guild_member ? 'Guild Member' : 'Not in Guild'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${user.has_role ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {user.has_role ? 'Has Role' : 'No Role'}
            </span>
          </div>
          <button
            onClick={() => { logout(); setUserModalOpen(false) }}
            className="w-full py-2 rounded text-sm font-semibold text-white bg-red-600/80 hover:bg-red-600 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </Modal>
    )}
    </>
  )
}
