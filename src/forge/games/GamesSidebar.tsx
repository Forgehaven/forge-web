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

type GameEntry = { path: string; label: string }
type GameSection = { section: string; games: GameEntry[] }

const G = '/games'

const sections: GameSection[] = [
  {
    section: 'FFXI - Horizon',
    games: [
      { path: `${G}/skillchain-calc`, label: 'Skillchain Calc' },
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
