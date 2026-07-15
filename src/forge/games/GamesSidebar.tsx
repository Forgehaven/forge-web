import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { Modal } from '../../components/Modal'
import { SidebarShell } from '../../components/Sidebar/SidebarShell'
import { SidebarHeader } from '../../components/Sidebar/SidebarHeader'
import { SidebarSection } from '../../components/Sidebar/SidebarSection'
import { SidebarDivider } from '../../components/Sidebar/SidebarDivider'
import { SidebarFooter } from '../../components/Sidebar/SidebarFooter'
import { CraftSettingsPanel } from './albion/CraftSettings/CraftSettingsPanel'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block pl-4 pr-8 py-2 md:py-0 text-sm leading-5 transition-colors ${
    isActive
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
  }`

const navBtnClass = (active: boolean) =>
  `block w-full text-left pl-4 pr-8 py-2 md:py-0 text-sm leading-5 transition-colors cursor-pointer ${
    active
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
  }`

const subLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block pl-8 pr-8 py-1.5 text-xs leading-5 transition-colors ${
    isActive
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2d3a]'
  }`

type GameEntry = {
  path?: string
  label: string
  sub?: { path: string; label: string }[]
  modal?: 'craftSettings'
}

const G = '/games'

const sections: { section: string; games: GameEntry[] }[] = [
  {
    section: 'FFXI - Horizon',
    games: [
      { path: `${G}/ffxi/skillchain-calc`, label: 'Skillchain Calc' },
      { path: `${G}/ffxi/vana-timers`,    label: 'Vana Timers' },
      { path: `${G}/ffxi/quest-tracker`,   label: 'Quest Tracker' },
      { path: `${G}/ffxi/spell-tracker`,    label: 'Spell Tracker' },
      { path: `${G}/ffxi/key-item-tracker`, label: 'Key Item Tracker' },
      { path: `${G}/ffxi/lockouts`,        label: 'Lockout Tracker' },
      { path: `${G}/ffxi/clamming-tracker`, label: 'Clamming Tracker' },
      { path: `${G}/ffxi/faction-conquest`, label: 'Faction Conquest' },
      { path: `${G}/ffxi/friend-viewer`,  label: 'Friend Viewer' },
    ],
  },
  {
    section: 'Albion Online',
    games: [
      { path: `${G}/albion/item-index`, label: 'Item Index' },
      { path: `${G}/albion/favourites`, label: 'Favourite Items' },
      { label: 'Craft Settings', modal: 'craftSettings' },
      { path: `${G}/albion/gold`,       label: 'Gold Price' },
    ],
  },
]

export interface GamesSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
  onOpenLogin: () => void
}

export function GamesSidebar({ isOpen, onClose, onOpenSettings, onOpenLogin }: GamesSidebarProps) {
  const { collapsed, toggle } = useSidebarCollapse(STORAGE_KEYS.gamesCollapsedSections)
  const [craftOpen, setCraftOpen] = useState(false)

  return (
    <>
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
                  <div key={game.path ?? game.label}>
                    {game.modal ? (
                      <button
                        type="button"
                        onClick={() => { setCraftOpen(true); onClose() }}
                        className={navBtnClass(craftOpen)}
                      >
                        {game.label}
                      </button>
                    ) : (
                      <NavLink to={game.path!} onClick={onClose} className={navLinkClass}>
                        {game.label}
                      </NavLink>
                    )}
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

        <SidebarFooter onOpenSettings={onOpenSettings} onOpenLogin={onOpenLogin} />
      </SidebarShell>

      <Modal open={craftOpen} onClose={() => setCraftOpen(false)} title="Craft Settings" maxWidth="max-w-6xl">
        <CraftSettingsPanel />
      </Modal>
    </>
  )
}
