import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { KEY_ITEMS, KEY_ITEM_CATEGORIES, type KeyItemCategory } from '../data/keyItems'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { getCharData, putCharData } from '../api'
import { useFfxiCharacters } from '../hooks/useFfxiCharacters'
import { useSyncedBlob } from '../hooks/useSyncedBlob'
import { useCharRank } from '../hooks/useCharRank'
import { SyncedCharacterHeader } from '../components/SyncedCharacterHeader'
import { loadSelectedCharId } from '../selectedChar'
import { ResetButton } from '../components/ResetButton'
import { CHAR_NATIONS } from '../nations'

const SK = STORAGE_KEYS.ffxiKeyItems
const MIRROR_KEY = STORAGE_KEYS.ffxiKeyItemsMirrorChar
const NOSYNC_KEY = STORAGE_KEYS.ffxiKeyItemsNoSync

type KeyItemBlob = {
  collected: Record<string, boolean>
}

const CATEGORY_ITEMS: Record<KeyItemCategory, typeof KEY_ITEMS> = Object.fromEntries(
  KEY_ITEM_CATEGORIES.map(cat => [cat, KEY_ITEMS.filter(k => k.category === cat)])
) as Record<KeyItemCategory, typeof KEY_ITEMS>

function loadState(): KeyItemBlob {
  try {
    const raw = localStorage.getItem(SK)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { collected: {}, ...parsed }
    }
  } catch { /* ignore */ }
  return { collected: {} }
}

// Character ids whose "import this browser's data" offer was declined.
function loadNoSync(): string[] {
  try {
    const raw = localStorage.getItem(NOSYNC_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string')
    }
  } catch { /* ignore */ }
  return []
}

function wikiUrl(name: string) {
  return `https://horizonffxi.wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`
}

export function KeyItemTracker() {
  const [saved, setSaved] = useState<KeyItemBlob>(loadState)
  const [activeCategory, setActiveCategory] = useState<KeyItemCategory>('Maps')
  const [search, setSearch] = useState('')
  const [hideMode, setHideMode] = useState(true)
  const { isAuthenticated } = useAuth()
  const { characters } = useFfxiCharacters()
  const [selectedCharId, setSelectedCharId] = useState<string | null>(loadSelectedCharId)
  const [serverEmpty, setServerEmpty] = useState(false)
  const [noSync, setNoSync] = useState<string[]>(loadNoSync)
  const [confirmReset, setConfirmReset] = useState<'collected' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Pre-sync browser copy for the migration banner; synced toggles mirror
  // into localStorage, so Import must read this instead.
  const [localSnapshot, setLocalSnapshot] = useState<KeyItemBlob | null>(null)

  const selectedChar = isAuthenticated
    ? characters.find(c => c.id === selectedCharId) ?? null
    : null
  const synced = selectedChar !== null
  const syncedRank = useCharRank(selectedChar?.name ?? null)

  const { scheduleSave } = useSyncedBlob<KeyItemBlob>({
    key: selectedChar?.id ?? null,
    load: selectedChar
      ? () => getCharData<KeyItemBlob>(selectedChar.id, 'key_item_tracker')
      : null,
    save: selectedChar
      ? (data, base) => putCharData(selectedChar.id, 'key_item_tracker', data, base)
      : null,
    onLoaded: data => {
      if (data === null && localSnapshot === null) {
        // A mirror left by ANOTHER character is not migratable local data.
        const owner = localStorage.getItem(MIRROR_KEY)
        setLocalSnapshot(owner && owner !== selectedChar?.id ? { collected: {} } : loadState())
      }
      setServerEmpty(data === null)
      setSaved({ collected: data?.collected ?? {} })
      if (data) writeLocal({ collected: data.collected ?? {} })
    },
  })

  const tableRef = useRef<HTMLDivElement>(null)
  const [tableMaxH, setTableMaxH] = useState<number | null>(null)

  const updateTableHeight = useCallback(() => {
    if (!tableRef.current) return
    const top = tableRef.current.getBoundingClientRect().top
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    const offset = isDesktop ? (40 + 15 + 32) : (40 + 0 + 24)
    setTableMaxH(Math.max(200, window.innerHeight - top - offset))
  }, [])

  useLayoutEffect(() => {
    updateTableHeight()
    window.addEventListener('resize', updateTableHeight)
    return () => window.removeEventListener('resize', updateTableHeight)
  }, [updateTableHeight])

  // Mirror writes are stamped with the owning character so another character's
  // mirror is never mistaken for migratable pre-login data; logged-out edits
  // make the copy this browser's own again.
  function writeLocal(next: KeyItemBlob) {
    localStorage.setItem(SK, JSON.stringify(next))
    if (synced && selectedChar) localStorage.setItem(MIRROR_KEY, selectedChar.id)
    else if (!synced) localStorage.removeItem(MIRROR_KEY)
  }

  function persist(next: KeyItemBlob) {
    setSaved(next)
    writeLocal(next)
    if (synced) scheduleSave(next)
  }

  function toggleCollected(name: string) {
    const collected = { ...saved.collected }
    if (collected[name]) delete collected[name]
    else collected[name] = true
    persist({ collected })
  }

  function importLocalToCharacter() {
    const local = localSnapshot ?? loadState()
    setServerEmpty(false)
    persist({ collected: { ...local.collected, ...saved.collected } })
  }

  function declineMigration() {
    if (!selectedChar) return
    const next = [...noSync, selectedChar.id]
    setNoSync(next)
    localStorage.setItem(NOSYNC_KEY, JSON.stringify(next))
  }

  const localHasData = useMemo(() => {
    if (!synced || !serverEmpty) return false
    return Object.keys((localSnapshot ?? loadState()).collected).length > 0
  }, [synced, serverEmpty, localSnapshot])

  function handleReset() {
    persist({ collected: {} })
    setConfirmReset(null)
  }

  function exportJSON() {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keyitems-${selectedChar?.name ?? 'export'}-${dateStr}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        persist({ collected: parsed.collected ?? {} })
      } catch { /* invalid JSON - ignore */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const showMigration =
    localHasData && selectedChar !== null && !noSync.includes(selectedChar.id)

  const categoryItems = CATEGORY_ITEMS[activeCategory]

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    // Searching looks across ALL categories; browsing stays within the tab.
    const pool = q ? KEY_ITEMS : categoryItems
    return pool.filter(item => {
      if (q && !item.name.toLowerCase().includes(q)) return false
      if (!q && hideMode && saved.collected[item.name]) return false
      return true
    })
  }, [categoryItems, search, hideMode, saved.collected])

  const collectedCount = useMemo(
    () => categoryItems.filter(i => saved.collected[i.name]).length,
    [categoryItems, saved.collected]
  )

  const searching = search.trim().length > 0

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">

      {/* Character section */}
      {isAuthenticated && characters.length > 0 && (
        <SyncedCharacterHeader
          characters={characters}
          selectedId={selectedCharId}
          onSelect={setSelectedCharId}
          avatar={selectedChar?.avatar}
          name={selectedChar?.name}
          nation={
            selectedChar && selectedChar.nation !== null
              ? CHAR_NATIONS[selectedChar.nation] ?? null
              : null
          }
          rank={syncedRank}
        />
      )}

      {/* First-sync migration: browser has data, the selected char has none. */}
      {showMigration && selectedChar && (
        <div className="flex items-center gap-3 px-3 py-2 rounded border border-[#c4af64]/40 bg-[#c4af64]/10 text-sm text-[#e2e4ed]">
          <span className="flex-1">This browser has unsynced Key Item data.</span>
          <button
            onClick={importLocalToCharacter}
            className="text-xs px-3 py-1 rounded bg-[#c4af64] text-[#0f1117] font-semibold hover:bg-[#d4bf74] transition-colors cursor-pointer shrink-0"
          >
            Save it to {selectedChar.name}
          </button>
          <button
            onClick={declineMigration}
            className="text-xs px-3 py-1 rounded border border-[#2a2d3a] text-[#9ca3af] hover:text-[#e2e4ed] hover:border-[#3a4060] transition-colors cursor-pointer shrink-0"
          >
            No thanks
          </button>
        </div>
      )}

      {/* Title + export/import + reset */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Key Item <span className="text-[#c4af64]">Tracker</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-1.5">
          <button onClick={exportJSON} className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer">Export</button>
          <button onClick={() => fileInputRef.current?.click()} className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer">Import</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-[#c4af64] uppercase tracking-wider">Reset</span>
          <ResetButton label="Collected" target="collected" confirm={confirmReset} onRequest={setConfirmReset} onConfirm={handleReset} onCancel={() => setConfirmReset(null)} />
        </div>
      </div>

      {/* Tab panel */}
      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">

        {/* Category tabs */}
        <div className="flex border-b border-[#2a2d3a] overflow-x-auto">
          {KEY_ITEM_CATEGORIES.map(cat => {
            const items = CATEGORY_ITEMS[cat]
            const done = items.filter(i => saved.collected[i.name]).length
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setSearch('') }}
                className={`flex flex-col items-center px-4 py-2.5 text-sm font-bold shrink-0 transition-colors border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-[#c4af64] border-[#c4af64] bg-[#c4af64]/5'
                    : 'text-[#9ca3af] border-transparent hover:text-[#e2e4ed] hover:bg-[#1a1d27]/50'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-xs font-semibold tabular-nums ${isActive ? 'text-[#c4af64]/70' : 'text-[#4b5563]'}`}>
                  {done}/{items.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1e2130] bg-[#1a1d27]/40 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search all key items…"
            className="px-2 py-0.5 text-xs rounded border bg-[#0f1117] text-[#9ca3af] border-[#2a2d3a] hover:border-[#3a4060] focus:border-[#4a5070] focus:outline-none w-48"
          />
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hideMode}
              onChange={e => setHideMode(e.target.checked)}
              className="w-3 h-3 cursor-pointer accent-[#c4af64]"
            />
            <span className="text-[10px] text-[#6b7280]">Hide collected</span>
          </label>
          <span className="ml-auto text-xs text-[#6b7280] tabular-nums">
            {collectedCount} / {categoryItems.length}
          </span>
        </div>

        <div ref={tableRef} className="overflow-y-auto" style={{ maxHeight: tableMaxH ?? undefined, minHeight: 200 }}>
          {visibleItems.length === 0 ? (
            <p className="py-6 px-4 text-sm text-[#374151]">
              {searching ? 'No key items match your search.' : 'All collected!'}
            </p>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0f1117] z-10">
                <tr className="border-b border-[#1e2130]">
                  <th className="w-10 pl-4 pr-2 py-1.5" />
                  <th className="py-1.5 pr-3 text-left text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Key Item</th>
                  <th className="py-1.5 pr-3 text-left text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold hidden sm:table-cell">
                    {searching ? 'Category' : 'Source'}
                  </th>
                  <th className="py-1.5 pr-4 w-8" />
                </tr>
              </thead>
              <tbody>
                {visibleItems.map(item => {
                  const collected = !!saved.collected[item.name]
                  return (
                    <tr
                      key={item.name}
                      className={`border-b last:border-0 ${
                        collected ? 'bg-[#166534]/10 border-[#166534]/25' : 'border-[#1a1d27]'
                      }`}
                    >
                      <td className={`pl-4 pr-2 py-1.5 border-l-2 ${collected ? 'border-l-[#22c55e]/70' : 'border-l-transparent'}`}>
                        <input
                          type="checkbox"
                          checked={collected}
                          onChange={() => toggleCollected(item.name)}
                          aria-label={item.name}
                          className="w-3.5 h-3.5 cursor-pointer accent-[#c4af64]"
                        />
                      </td>
                      <td className={`py-1.5 pr-3 text-sm ${collected ? 'text-[#c4af64]' : 'text-[#e2e4ed]'}`}>
                        {item.name}
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-[#6b7280] hidden sm:table-cell">
                        {searching ? item.category : item.source ?? ''}
                      </td>
                      <td className="py-1.5 pr-4 text-center">
                        <a
                          href={wikiUrl(item.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6b7280] hover:text-[#e2e4ed] transition-colors text-xs"
                          title={`${item.name} on HorizonXI wiki`}
                        >
                          ↗
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
