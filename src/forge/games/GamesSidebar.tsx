import { NavLink } from 'react-router-dom'
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { SidebarShell } from '../../components/Sidebar/SidebarShell'
import { SidebarHeader } from '../../components/Sidebar/SidebarHeader'
import { SidebarSection } from '../../components/Sidebar/SidebarSection'
import { SidebarDivider } from '../../components/Sidebar/SidebarDivider'
import { SidebarFooter } from '../../components/Sidebar/SidebarFooter'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block pl-4 pr-8 py-2 md:py-0 text-sm leading-5 transition-colors ${
    isActive
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
  }`

const subLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block pl-8 pr-8 py-1.5 text-xs leading-5 transition-colors ${
    isActive
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2d3a]'
  }`

type GameEntry = { path: string; label: string; sub?: { path: string; label: string }[] }

const G = '/games'

const sections: { section: string; games: GameEntry[] }[] = [
  {
    section: 'FFXI - Horizon',
    games: [
      { path: `${G}/ffxi/skillchain-calc`, label: 'Skillchain Calc' },
      { path: `${G}/ffxi/clamming-tracker`, label: 'Clamming Tracker' },
      { path: `${G}/ffxi/spell-tracker`,    label: 'Spell Tracker' },
      { path: `${G}/ffxi/teleport-cost`,   label: 'Teleport Cost' },
      { path: `${G}/ffxi/friend-viewer`,  label: 'Friend Viewer' },
    ],
  },
  {
    section: 'Albion Online',
    games: [
      { path: `${G}/albion/market-manager`, label: 'Market Manager' },
    ],
  },
]

export interface GamesSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

export function GamesSidebar({ isOpen, onClose, onOpenSettings }: GamesSidebarProps) {
  const { collapsed, toggle } = useSidebarCollapse(STORAGE_KEYS.gamesCollapsedSections)

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
                <div key={game.path}>
                  <NavLink to={game.path} onClick={onClose} className={navLinkClass}>
                    {game.label}
                  </NavLink>
                  {game.sub?.map(sub => (
                    <NavLink key={sub.path} to={sub.path} onClick={onClose} className={subLinkClass}>
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </SidebarSection>
          </div>
        ))}
      </nav>

      <SidebarFooter onOpenSettings={onOpenSettings} />
    </SidebarShell>
  )
}
