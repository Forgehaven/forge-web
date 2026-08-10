import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useFavourites } from '../../hooks/useFavourites'
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { SidebarShell } from '../../components/Sidebar/SidebarShell'
import { SidebarHeader } from '../../components/Sidebar/SidebarHeader'
import { SidebarSearch } from '../../components/Sidebar/SidebarSearch'
import { SidebarSection } from '../../components/Sidebar/SidebarSection'
import { SidebarDivider } from '../../components/Sidebar/SidebarDivider'
import { SidebarFooter } from '../../components/Sidebar/SidebarFooter'
import { TOOL_SECTIONS, ALL_TOOLS } from './toolsManifest'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block pl-4 pr-8 py-2 md:py-0 text-sm leading-5 transition-colors ${
    isActive
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
  }`

type ToolEntry = { path: string; label: string }

const sections = TOOL_SECTIONS
const allTools: ToolEntry[] = ALL_TOOLS

function ToolRow({
  tool,
  isFav,
  onToggle,
  onClick,
}: {
  tool: ToolEntry
  isFav: boolean
  onToggle: () => void
  onClick: () => void
}) {
  return (
    <div className="relative group">
      <NavLink to={tool.path} onClick={onClick} className={navLinkClass}>
        {tool.label}
      </NavLink>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle() }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs cursor-pointer transition-opacity ${
          isFav
            ? 'opacity-100 text-[#c4af64]'
            : 'opacity-40 text-[#c4af64] md:opacity-0 md:text-[#3a3d4a] md:group-hover:opacity-100 md:hover:text-[#6b7280]'
        }`}
        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
      >
        ★
      </button>
    </div>
  )
}

export interface ToolsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
  onOpenLogin: () => void
}

export function ToolsSidebar({ isOpen, onClose, onOpenSettings, onOpenLogin }: ToolsSidebarProps) {
  const [query, setQuery] = useState('')
  const { collapsed, toggle: toggleSection } = useSidebarCollapse(STORAGE_KEYS.collapsedSections)
  const { toggle, isFavourite } = useFavourites()

  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed ? allTools.filter(t => t.label.toLowerCase().includes(trimmed)) : null
  const favouriteTools = allTools.filter(t => isFavourite(t.path))

  function handleSelect() {
    setQuery('')
    onClose()
  }

  return (
    <SidebarShell isOpen={isOpen}>
      <SidebarHeader section="Tools" to="/tools" />

      <SidebarSearch query={query} onChange={setQuery} placeholder="Search tools..." />

      <nav className="flex-1 overflow-y-auto py-1 min-w-0">
        {filtered ? (
          filtered.length > 0 ? (
            filtered.map(tool => (
              <ToolRow key={tool.path} tool={tool} isFav={isFavourite(tool.path)} onToggle={() => toggle(tool.path)} onClick={handleSelect} />
            ))
          ) : (
            <p className="px-4 py-3 text-xs text-[#6b7280]">No tools found</p>
          )
        ) : (
          <>
            {favouriteTools.length > 0 && (
              <div>
                <p className="pl-[11px] pr-4 pt-1 pb-0 text-xs font-medium text-[#c4af64] uppercase tracking-wider">
                  Favourites
                </p>
                {favouriteTools.map(tool => (
                  <ToolRow key={tool.path} tool={tool} isFav={true} onToggle={() => toggle(tool.path)} onClick={handleSelect} />
                ))}
                <SidebarDivider />
              </div>
            )}

            {sections.map(({ section, tools }, i) => (
              <div key={section}>
                {i > 0 && <SidebarDivider />}
                <SidebarSection
                  label={section}
                  isCollapsed={!!collapsed[section]}
                  onToggle={() => toggleSection(section)}
                >
                  {tools.filter(t => !isFavourite(t.path)).map(tool => (
                    <ToolRow key={tool.path} tool={tool} isFav={false} onToggle={() => toggle(tool.path)} onClick={handleSelect} />
                  ))}
                </SidebarSection>
              </div>
            ))}
          </>
        )}
      </nav>

      <SidebarFooter onOpenSettings={onOpenSettings} onOpenLogin={onOpenLogin} />
    </SidebarShell>
  )
}
