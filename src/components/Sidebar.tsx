import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { useFavourites } from '../hooks/useFavourites'

type ToolEntry = { path: string; label: string }
type Section = { section: string; tools: ToolEntry[] }

const T = '/tools'

const sections: Section[] = [
  {
    section: 'Converters',
    tools: [
      { path: `${T}/unit-converter`, label: 'Unit Converter' },
      { path: `${T}/timestamp-converter`, label: 'Discord Timestamp' },
      { path: `${T}/base-converter`, label: 'Base Converter' },
      { path: `${T}/color-converter`, label: 'Colour Converter' },
      { path: `${T}/currency-converter`, label: 'Currency Converter' },
    ],
  },
  {
    section: 'Text',
    tools: [
      { path: `${T}/text-formatter`, label: 'Text Formatter' },
      { path: `${T}/text-diff`, label: 'Text Diff' },
      { path: `${T}/text-translate`, label: 'Text Translate' },
      { path: `${T}/regex-tester`, label: 'Regex Tester' },
      { path: `${T}/markdown-preview`, label: 'Markdown Preview' },
      { path: `${T}/pdf-to-epub`, label: 'PDF to EPUB' },
      { path: `${T}/word-counter`, label: 'Word Counter' },
    ],
  },
  {
    section: 'Media',
    tools: [
      { path: `${T}/audio-cutter`, label: 'Audio Cutter' },
      { path: `${T}/video-cutter`, label: 'Video Cutter' },
      { path: `${T}/white-to-alpha`, label: 'White to Alpha' },
      { path: `${T}/video-to-gif`, label: 'Video to GIF' },
      { path: `${T}/img-colour-palette`, label: 'Img Colour Palette' },
      { path: `${T}/img-editor`, label: 'Img Editor' },
      { path: `${T}/qr-generator`, label: 'QR Generator' },
      { path: `${T}/video-to-mp3`, label: 'Video to MP3' },
      { path: `${T}/image-converter`, label: 'Image Converter' },
      { path: `${T}/media-compressor`, label: 'Media Compressor' },
    ],
  },
  {
    section: 'Lookups',
    tools: [
      { path: `${T}/ip-geolocation`, label: 'IP Geolocation' },
      { path: `${T}/phone-area-code`, label: 'Phone Area Code' },
      { path: `${T}/timezone-lookup`, label: 'City Time Zones' },
      { path: `${T}/weather`, label: 'Weather Lookup' },
    ],
  },
  {
    section: 'Encoding',
    tools: [
      { path: `${T}/base64`, label: 'Base64' },
      { path: `${T}/url-encoder`, label: 'URL Encoder' },
      { path: `${T}/jwt-decoder`, label: 'JWT Decoder' },
    ],
  },
  {
    section: 'Generators',
    tools: [
      { path: `${T}/hash-generator`, label: 'Hash Generator' },
      { path: `${T}/uuid-generator`, label: 'UUID Generator' },
      { path: `${T}/password-generator`, label: 'Password Generator' },
      { path: `${T}/lorem-ipsum`, label: 'Lorem Ipsum' },
    ],
  },
  {
    section: 'Sysadmin',
    tools: [
      { path: `${T}/cron-parser`, label: 'Cron Parser' },
      { path: `${T}/unix-timestamp`, label: 'Unix Timestamp' },
      { path: `${T}/json-api`, label: 'JSON API Tester' },
      { path: `${T}/webhook-tester`, label: 'Webhook Tester' },
    ],
  },
  {
    section: 'Network',
    tools: [
      { path: `${T}/cidr-calculator`, label: 'CIDR Calculator' },
      { path: `${T}/http-headers`, label: 'HTTP Headers' },
      { path: `${T}/contrast-checker`, label: 'Contrast Checker' },
      { path: `${T}/user-agent`, label: 'User Agent Parser' },
    ],
  },
  {
    section: 'Crypto',
    tools: [
      { path: `${T}/aes`, label: 'AES Encrypt / Decrypt' },
      { path: `${T}/bcrypt`, label: 'Bcrypt Tester' },
    ],
  },
]

const allTools = sections.flatMap(s => s.tools)

const COLLAPSED_KEY = 'forgetools_collapsed_sections'

function loadCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block pl-4 pr-8 py-px text-sm transition-colors ${
    isActive
      ? 'bg-[#c4af64]/10 text-[#c4af64] border-r-2 border-[#c4af64]'
      : 'text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
  }`

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

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [query, setQuery] = useState('')
  const [mounted] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed)
  const { toggle, isFavourite } = useFavourites()

  function toggleSection(section: string) {
    setCollapsed(prev => {
      const next = { ...prev, [section]: !prev[section] }
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next))
      return next
    })
  }

  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed
    ? allTools.filter(t => t.label.toLowerCase().includes(trimmed))
    : null

  const favouriteTools = allTools.filter(t => isFavourite(t.path))

  function handleSelect() {
    setQuery('')
    onClose()
  }

  const inner = (
    <>
      <Logo />

      <div className="px-3 py-1.5 border-b border-[#2a2d3a]">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2.5 py-1.5 text-xs text-[#e2e4ed] placeholder-[#6b7280] focus:outline-none focus:border-[#c4af64] pr-6"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#e2e4ed] transition-colors leading-none cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-1 min-w-0">
        {filtered ? (
          filtered.length > 0 ? (
            filtered.map(tool => (
              <ToolRow
                key={tool.path}
                tool={tool}
                isFav={isFavourite(tool.path)}
                onToggle={() => toggle(tool.path)}
                onClick={handleSelect}
              />
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
                  <ToolRow
                    key={tool.path}
                    tool={tool}
                    isFav={true}
                    onToggle={() => toggle(tool.path)}
                    onClick={handleSelect}
                  />
                ))}
                <div className="mx-4 my-px border-t border-[#2a2d3a]" />
              </div>
            )}

            {sections.map(({ section, tools }, i) => (
              <div key={section}>
                {i > 0 && (
                  <div className="mx-4 my-px border-t border-[#2a2d3a]" />
                )}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between pl-[11px] pr-3 pt-1 pb-0 text-xs font-medium text-[#6b7280] uppercase tracking-wider hover:text-[#9ca3af] transition-colors cursor-pointer"
                >
                  {section}
                  <span
                    className="transition-transform duration-200 leading-none"
                    style={{ transform: collapsed[section] ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                  >
                    ▾
                  </span>
                </button>
                {!collapsed[section] && tools.map(tool => (
                  <ToolRow
                    key={tool.path}
                    tool={tool}
                    isFav={isFavourite(tool.path)}
                    onToggle={() => toggle(tool.path)}
                    onClick={handleSelect}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="hidden md:flex border-t border-[#2a2d3a] h-10 items-center px-4">
        <a
          href="https://github.com/forgehaven"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3a3d4a] hover:text-[#6b7280] transition-colors text-xs tracking-widest uppercase"
        >
          FORGEHAVEN Inc.
        </a>
      </div>
    </>
  )

  return (
    <>
      <aside
        className={`
          md:hidden fixed inset-y-0 left-0 z-50
          w-max shrink-0 bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col
          ${mounted ? 'transition-transform duration-300 ease-in-out' : ''}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {inner}
      </aside>

      <aside className="hidden md:flex flex-col w-max shrink-0 bg-[#1a1d27] border-r border-[#2a2d3a]">
        {inner}
      </aside>
    </>
  )
}
