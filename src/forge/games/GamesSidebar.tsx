import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { SidebarShell } from '../../components/Sidebar/SidebarShell'
import { SidebarHeader } from '../../components/Sidebar/SidebarHeader'
import { SidebarSection } from '../../components/Sidebar/SidebarSection'
import { SidebarDivider } from '../../components/Sidebar/SidebarDivider'
import { SidebarFooter } from '../../components/Sidebar/SidebarFooter'
import { Modal } from '../../components/Modal'
import { useAuth } from './albion/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block pl-4 pr-8 py-2 md:py-0 text-sm leading-5 transition-colors ${
    isActive
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
  }`

type GameEntry = { path: string; label: string }
type GameSection = { section: string; games: GameEntry[] }

const G = '/games'

const sections: GameSection[] = [
  {
    section: 'FFXI - Horizon',
    games: [
      { path: `${G}/skillchain-calc`, label: 'Skillchain Calc' },
      { path: `${G}/clamming-tracker`, label: 'Clamming Tracker' },
      { path: `${G}/spell-tracker`,    label: 'Spell Tracker' },
      { path: `${G}/teleport-cost`,   label: 'Teleport Cost' },
      { path: `${G}/friend-viewer`,  label: 'Friend Viewer' },
    ],
  },
  {
    section: 'Albion Online',
    games: [
      { path: `${G}/market-manager`, label: 'Market Manager' },
    ],
  },
]

export interface GamesSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

export function GamesSidebar({ isOpen, onClose, onOpenSettings }: GamesSidebarProps) {
  const [userModalOpen, setUserModalOpen] = useState(false)
  const { pathname } = useLocation()
  const { collapsed, toggle } = useSidebarCollapse(STORAGE_KEYS.gamesCollapsedSections)
  const { isAuthenticated, user, logout } = useAuth()

  const isAlbionPage = pathname === `${G}/market-manager`

  if (isAlbionPage) {
    return (
      <>
      <SidebarShell isOpen={isOpen}>
        <SidebarHeader section="Games" to="/games" onClose={onClose} />

        <nav className="flex-1 overflow-y-auto py-1 min-w-0" />

        {isAuthenticated && user && (
          <div className="border-t border-[#2a2d3a] px-4 py-2.5">
            <button
              onClick={() => setUserModalOpen(true)}
              className="text-sm text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer truncate w-full text-left"
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
              <span className={`text-xs px-2 py-0.5 rounded ${user.guild_member ? 'bg-green-900/40 text-green-400' : 'bg-[#2a2d3a] text-[#6b7280]'}`}>
                {user.guild_member ? 'Guild Member' : 'Not in Guild'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${user.has_role ? 'bg-green-900/40 text-green-400' : 'bg-[#2a2d3a] text-[#6b7280]'}`}>
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

  return (
    <SidebarShell isOpen={isOpen}>
      <SidebarHeader section="Games" to="/games" onClose={onClose} />

      <nav className="flex-1 overflow-y-auto py-1 min-w-0">
        {sections.map(({ section, games }, i) => (
          <div key={section}>
            {i > 0 && <SidebarDivider />}
            <SidebarSection
              label={section}
              isCollapsed={!!collapsed[section]}
              onToggle={() => toggle(section)}
            >
              {games.map(game => (
                <NavLink key={game.path} to={game.path} onClick={onClose} className={navLinkClass}>
                  {game.label}
                </NavLink>
              ))}
            </SidebarSection>
          </div>
        ))}
      </nav>

      <SidebarFooter onOpenSettings={onOpenSettings} />
    </SidebarShell>
  )
}
