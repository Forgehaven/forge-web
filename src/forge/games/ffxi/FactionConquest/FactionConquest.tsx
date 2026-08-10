import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { OUTPOSTS, NO_OUTPOST_REGIONS, type Outpost } from '../data/zones'
import { MAP_IDS } from '../InteractiveMap/mapIds'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { getConquest, putConquest } from '../api'
import { lastConquestReset, formatNextReset } from '../conquest'
import { useFfxiCharacters } from '../hooks/useFfxiCharacters'
import { useCharRank } from '../hooks/useCharRank'
import { SyncedCharacterHeader } from '../components/SyncedCharacterHeader'
import { loadSelectedCharId } from '../selectedChar'
import type { NationMeta } from '../nations'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { ImportPanel } from '../../../../components/ImportPanel'
import { useCopy } from '../../../../hooks/useCopy'
import bastokIcon from '../data/BastokIcon.png'
import windurstIcon from '../data/WindurstIcon.png'
import sandoriaIcon from '../data/SandoriaIcon.png'
import beastmenIcon from '../data/BeastmenIcon.png'

const getNow = () => Date.now()

const SK    = STORAGE_KEYS.ffxiFactionConquest

// ---------------------------------------------------------------------------
// Nations
// ---------------------------------------------------------------------------

type NationId = 1 | 2 | 3 | 4
const NATIONS: Record<NationId, NationMeta> = {
  1: { name: 'Bastok',     symbol: '⚙', color: '#5b8db8', icon: bastokIcon },
  2: { name: 'Windurst',   symbol: '✦', color: '#8aab7e', icon: windurstIcon },
  3: { name: "San d'Oria", symbol: '⚔', color: '#c0453a', icon: sandoriaIcon },
  4: { name: 'Beastmen',   symbol: '☠', color: '#9333ea', icon: beastmenIcon },
}
const NATION_IDS = [1, 2, 3, 4] as NationId[]
// Beastmen own outposts but are not a selectable home nation.
const HOME_NATION_IDS = [1, 2, 3] as NationId[]

// The char API encodes nation 0/1/2 (San d'Oria/Bastok/Windurst); this tool
// uses 1-4 (Bastok/Windurst/San d'Oria/Beastmen). Map registered-character
// nations into the local ids.
const CHAR_NATION_TO_TC: Record<number, NationId> = { 0: 3, 1: 1, 2: 2 }

const ORDINALS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

function wikiZoneUrl(zone: string) {
  return `https://horizonffxi.wiki/${encodeURIComponent(zone.replace(/ /g, '_'))}`
}

const MAP_ID_SET = new Set(MAP_IDS)

function mapIdFor(zone: string): string | null {
  const slug = zone.toLowerCase().replace(/['.]/g, '').replace(/[^a-z0-9]+/g, '_')
  if (MAP_ID_SET.has(slug)) return slug
  if (MAP_ID_SET.has(`${slug}_1`)) return `${slug}_1`
  return null
}

function MapLink({ zone }: { zone: string }) {
  const id = mapIdFor(zone)
  if (!id) return null
  return (
    <Link
      to={`/games/ffxi/map/${id}`}
      title={`Open ${zone} on the Interactive Map`}
      aria-label={`Open ${zone} on the Interactive Map`}
      className="ml-1.5 text-[#6b7280] hover:text-[#c4af64] transition-colors"
    >
      ⌖
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Saved state
// ---------------------------------------------------------------------------

type SavedState = {
  nation: NationId | null
  owners: Record<string, NationId | null>
  savedAt: number
}

const DEFAULT: SavedState = { nation: null, owners: {}, savedAt: 0 }

function loadState(): SavedState {
  try {
    const own = localStorage.getItem(SK)
    if (own) {
      const p = JSON.parse(own) as Partial<SavedState>
      const owners = (p.savedAt ?? 0) < lastConquestReset() ? {} : (p.owners ?? {})
      return { nation: p.nation ?? null, owners, savedAt: p.savedAt ?? 0 }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT, savedAt: Date.now() }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type OutpostRowProps = {
  outpost: Outpost
  mode: 'home' | 'jeuno'
  userNation: NationId | null
  owner: NationId | null
  onOwnerChange: (n: NationId | null) => void
}

function OutpostRow({ outpost, mode, userNation, owner, onOwnerChange }: OutpostRowProps) {
  const access = mode === 'home' ? outpost.home : outpost.jeuno
  const isOwned   = userNation !== null && owner === userNation
  const isNotOwned = userNation !== null && !isOwned

  return (
    <tr className="border-b border-[#1a1d27] last:border-0 hover:bg-[#1a1d27]/30">
      <td className="pl-4 py-2 pr-3 text-sm whitespace-nowrap">
        <a
          href={wikiZoneUrl(outpost.zone)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#e2e4ed] hover:text-[#c4af64] transition-colors"
        >
          {outpost.zone}
        </a>
        <MapLink zone={outpost.zone} />
      </td>
      <td className="py-2 pr-3 text-xs text-[#c4af64]/70 whitespace-nowrap hidden md:table-cell">{outpost.region}</td>
      <td className="py-2 pr-3 text-xs text-[#6b7280] text-center tabular-nums">{access.lv}</td>
      <td
        style={{ width: '64px' }}
        className={`py-2 pr-2 text-xs text-right tabular-nums whitespace-nowrap ${
          isOwned ? 'text-[#4ade80] font-semibold' : 'text-[#374151]'
        }`}
      >
        {access.owned.toLocaleString()}
      </td>
      <td
        style={{ width: '64px' }}
        className={`py-2 pl-2 pr-3 text-xs text-left tabular-nums whitespace-nowrap ${
          isNotOwned ? 'text-[#fb923c] font-semibold' : 'text-[#374151]'
        }`}
      >
        {access.notOwned.toLocaleString()}
      </td>
      <OwnerCells owner={owner} onOwnerChange={onOwnerChange} />
    </tr>
  )
}

function OwnerCells({ owner, onOwnerChange }: {
  owner: NationId | null
  onOwnerChange: (n: NationId | null) => void
}) {
  return (
    <>
      {NATION_IDS.map(nid => {
        const meta = NATIONS[nid]
        const active = owner === nid
        return (
          <td key={nid} className="py-2 px-1.5 text-center">
            <button
              onClick={() => onOwnerChange(active ? null : nid)}
              title={`${meta.name} controls this region`}
              className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center mx-auto ${owner === null ? 'animate-pulse' : ''}`}
              style={active ? {
                background: `${meta.color}25`,
                border: `1px solid ${meta.color}`,
                color: meta.color,
              } : {
                background: 'transparent',
                border: `1px solid ${owner === null ? '#4b5563' : '#2a2d3a'}`,
                color: owner === null ? '#6b7280' : '#374151',
              }}
            >
              {meta.icon
                ? <img src={meta.icon} alt={meta.name} className="w-3.5 h-3.5 object-contain" style={{ opacity: active ? 1 : 0.25 }} />
                : <span style={{ fontSize: '11px', lineHeight: 0 }}>{meta.symbol}</span>
              }
            </button>
          </td>
        )
      })}
    </>
  )
}

// Conquest regions without an outpost: no teleport, no costs, but their
// owner still feeds the standings.
function NoOutpostRow({ region, owner, onOwnerChange }: {
  region: string
  owner: NationId | null
  onOwnerChange: (n: NationId | null) => void
}) {
  return (
    <tr className="border-b border-[#1a1d27] last:border-0 hover:bg-[#1a1d27]/30">
      <td className="pl-4 py-2 pr-3 whitespace-nowrap">
        {/* Region link stands in on mobile, where the Region column is hidden. */}
        <a
          href={wikiZoneUrl(region)}
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden text-sm text-[#c4af64]/70 hover:text-[#c4af64] transition-colors"
        >
          {region}
        </a>
        <span className="hidden md:inline text-xs text-[#4b5563] italic">no outpost</span>
      </td>
      <td className="py-2 pr-3 text-xs whitespace-nowrap hidden md:table-cell">
        <a
          href={wikiZoneUrl(region)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#c4af64]/70 hover:text-[#c4af64] transition-colors"
        >
          {region}
        </a>
      </td>
      <td className="py-2 pr-3 text-xs text-[#374151] text-center">—</td>
      <td style={{ width: '64px' }} className="py-2 pr-2 text-xs text-right text-[#374151]">—</td>
      <td style={{ width: '64px' }} className="py-2 pl-2 pr-3 text-xs text-left text-[#374151]">—</td>
      <OwnerCells owner={owner} onOwnerChange={onOwnerChange} />
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FactionConquest() {
  const [saved, setSaved]           = useState<SavedState>(loadState)
  const [mode, setMode]             = useState<'home' | 'jeuno'>('jeuno')
  const { isAuthenticated } = useAuth()
  const { characters } = useFfxiCharacters()
  const [selectedCharId, setSelectedCharId] = useState<string | null>(loadSelectedCharId)
  const [communityUpdatedAt, setCommunityUpdatedAt] = useState<string | null>(null)

  const selectedChar = isAuthenticated
    ? characters.find(c => c.id === selectedCharId) ?? null
    : null
  const syncedRank = useCharRank(selectedChar?.name ?? null)
  // Synced mode: the character's nation drives the owned/not-owned pricing
  // highlight; the free-text header (and its Beastmen override) is replaced.
  const charNationId: NationId | null =
    selectedChar && selectedChar.nation !== null
      ? CHAR_NATION_TO_TC[selectedChar.nation] ?? null
      : null
  const putTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingOwners = useRef<Record<string, NationId | null> | null>(null)
  // Edits may only push to the shared map once this week's map has loaded;
  // a click before the GET resolves must not overwrite the community data
  // with this browser's stale local map.
  const conquestLoaded = useRef(false)

  // The owners map is community-shared: everyone reads it (public GET); the
  // backend blanks it once it predates the weekly tally. Local state is the
  // offline fallback and gets replaced when the server has this week's map.
  useEffect(() => {
    let cancelled = false
    getConquest().then(res => {
      if (cancelled || res.status !== 'ok') return
      conquestLoaded.current = true
      const { owners, updated_at } = res.payload
      if (!updated_at) return
      setCommunityUpdatedAt(updated_at)
      setSaved(prev => {
        const next = {
          ...prev,
          owners: owners as Record<string, NationId | null>,
          savedAt: getNow(),
        }
        localStorage.setItem(SK, JSON.stringify(next))
        return next
      })
    }).catch(() => { /* offline - local fallback stands */ })
    return () => { cancelled = true }
  }, [])

  // Logged-in edits push the shared map (debounced); flushed on unmount.
  const syncOwners = useCallback((owners: Record<string, NationId | null>) => {
    if (!isAuthenticated || !conquestLoaded.current) return
    pendingOwners.current = owners
    if (putTimer.current) clearTimeout(putTimer.current)
    putTimer.current = setTimeout(() => {
      putTimer.current = null
      const toSave = pendingOwners.current
      pendingOwners.current = null
      if (toSave) putConquest(toSave)
    }, 1000)
  }, [isAuthenticated])

  useEffect(() => () => {
    if (putTimer.current) clearTimeout(putTimer.current)
    if (pendingOwners.current) putConquest(pendingOwners.current)
  }, [])
  const [importOpen, setImportOpen] = useState(false)
  const { copy, copied } = useCopy()
  const [sortCol, setSortCol] = useState<'zone' | 'region' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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

  const charLoaded = saved.nation !== null
  useLayoutEffect(() => {
    updateTableHeight()
  }, [charLoaded, updateTableHeight])

  function persist(next: SavedState) {
    const withTs = { ...next, savedAt: getNow() }
    setSaved(withTs)
    localStorage.setItem(SK, JSON.stringify(withTs))
  }

  function setOwner(zone: string, nation: NationId | null) {
    const owners = { ...saved.owners, [zone]: nation }
    persist({ ...saved, owners })
    syncOwners(owners)
  }

  function handleReset() {
    // Local-only: the button rendering this is hidden when logged in, and the
    // backend refuses an empty owners map anyway.
    persist({ ...saved, owners: {} })
  }

  function exportState() {
    copy(btoa(JSON.stringify({ owners: saved.owners })))
  }

  function importState(code: string): boolean {
    try {
      const parsed = JSON.parse(atob(code))
      const owners = parsed.owners ?? {}
      persist({ ...saved, owners })
      syncOwners(owners)
      return true
    } catch {
      return false
    }
  }

  function handleSort(col: 'zone' | 'region') {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc')
      else setSortCol(null)
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sortedOutposts = useMemo(() => {
    if (!sortCol) return OUTPOSTS
    return [...OUTPOSTS].sort((a, b) => {
      const av = sortCol === 'zone' ? a.zone : a.region
      const bv = sortCol === 'zone' ? b.zone : b.region
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [sortCol, sortDir])

  const synced = isAuthenticated && characters.length > 0
  const userNation = synced ? charNationId : saved.nation

  // Territory standings from the community map; ties share a place, exactly
  // like a conquest tally draw. Signet duration = character rank + place
  // (era rule; max 13h).
  const standings = useMemo(() => {
    const counts: Record<NationId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
    const keys = [...OUTPOSTS.map(o => o.zone), ...NO_OUTPOST_REGIONS]
    for (const key of keys) {
      const own = saved.owners[key] ?? null
      if (own) counts[own]++
    }
    const ranked = HOME_NATION_IDS
      .map(nid => ({ nid, count: counts[nid] }))
      .sort((a, b) => b.count - a.count)
    const placed = ranked.map(e => ({
      ...e,
      place: 1 + ranked.filter(x => x.count > e.count).length,
    }))
    return { placed, beastmen: counts[4] }
  }, [saved.owners])

  const anyOwned = standings.placed.some(e => e.count > 0) || standings.beastmen > 0
  const userPlace = userNation !== null && userNation !== 4
    ? standings.placed.find(e => e.nid === userNation)?.place ?? null
    : null
  const rankNum = syncedRank ? parseInt(syncedRank.replace(/\D/g, ''), 10) || null : null
  const signetHours = rankNum !== null && userPlace !== null && anyOwned
    ? rankNum + userPlace
    : null

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">

      {/* Character / nation section */}
      {synced ? (
        <SyncedCharacterHeader
          characters={characters}
          selectedId={selectedCharId}
          onSelect={setSelectedCharId}
          avatar={selectedChar?.avatar}
          name={selectedChar?.name}
          nation={charNationId !== null ? NATIONS[charNationId] : null}
          rank={syncedRank}
        />
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#6b7280]">Home Nation:</span>
          {HOME_NATION_IDS.map(nid => {
            const meta = NATIONS[nid]
            const active = saved.nation === nid
            const dimmed = saved.nation !== null && !active
            return (
              <button
                key={nid}
                onClick={() => persist({ ...saved, nation: active ? null : nid })}
                className="text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5"
                style={active
                  ? { color: meta.color, borderColor: meta.color, background: `${meta.color}25` }
                  : dimmed
                    ? { color: '#4b5563', borderColor: '#2a2d3a', background: 'transparent' }
                    : { color: meta.color, borderColor: `${meta.color}50`, background: `${meta.color}10` }}
              >
                {meta.icon
                  ? <img src={meta.icon} alt="" className="w-3.5 h-3.5 object-contain shrink-0" style={{ opacity: dimmed ? 0.25 : 1 }} />
                  : meta.symbol
                }
                {meta.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Title + controls */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Faction <span className="text-[#c4af64]">Conquest</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
          {communityUpdatedAt && (
            <p className="text-xs text-[#4b5563] mt-0.5">
              Community conquest map · updated {new Date(communityUpdatedAt).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Next reset</p>
            <p className="text-xs text-[#c4af64] tabular-nums">{formatNextReset()}</p>
          </div>
          <span className="text-[#2a2d3a]">|</span>
          <button
            onClick={exportState}
            className="text-xs text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Export'}
          </button>
          <button
            onClick={() => setImportOpen(v => !v)}
            className="text-xs text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            Import
          </button>
          {/* Hidden when logged in: the map is community-shared, so a reset
              would blank this week's data for everyone. */}
          {!isAuthenticated && (
            <>
              <span className="text-[#2a2d3a]">|</span>
              <ConfirmButton label="Reset Conquest" onConfirm={handleReset} className="text-xs text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer" />
            </>
          )}
        </div>
      </div>

      {/* Faction standings + signet */}
      <div className="flex items-center gap-4 flex-wrap rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-4 py-2.5 text-sm">
        {anyOwned ? (
          <>
            {standings.placed.map(e => {
              const meta = NATIONS[e.nid]
              return (
                <span key={e.nid} className="flex items-center gap-1.5">
                  <span className="text-[#6b7280] text-xs">{ORDINALS[e.place]}</span>
                  {meta.icon && <img src={meta.icon} alt="" className="w-4 h-4 object-contain" />}
                  <span style={{ color: meta.color }}>{meta.name}</span>
                  <span className="text-[#9ca3af] tabular-nums">{e.count}</span>
                </span>
              )
            })}
            {standings.beastmen > 0 && (
              <span className="flex items-center gap-1.5 opacity-60">
                <img src={NATIONS[4].icon} alt="" className="w-4 h-4 object-contain" />
                <span style={{ color: NATIONS[4].color }}>Beastmen</span>
                <span className="text-[#9ca3af] tabular-nums">{standings.beastmen}</span>
              </span>
            )}
            {signetHours !== null && (
              <span className="ml-auto text-xs text-[#9ca3af]">
                Signet max <span className="text-[#c4af64] font-semibold">{signetHours}h</span>
              </span>
            )}
          </>
        ) : (
          <span className="text-[#6b7280] text-xs">No conquest data yet this week - set region owners below.</span>
        )}
      </div>

      {/* Import panel */}
      {importOpen && (
        <ImportPanel
          description="Paste an export code to load conquest ownership from another source. Your character and nation are kept."
          onImport={importState}
          onClose={() => setImportOpen(false)}
        />
      )}

      {/* Table panel */}
      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">

        {/* Tabs + nation legend */}
        <div className="flex items-center border-b border-[#2a2d3a]">
          {(['jeuno', 'home'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer shrink-0 ${
                mode === m
                  ? 'text-[#c4af64] border-[#c4af64] bg-[#c4af64]/5'
                  : 'text-[#9ca3af] border-transparent hover:text-[#e2e4ed] hover:bg-[#1a1d27]/50'
              }`}
            >
              {m === 'home' ? 'Home Nation' : 'Jeuno'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div
          ref={tableRef}
          className="overflow-auto"
          style={{ maxHeight: tableMaxH ?? undefined, minHeight: 200 }}
        >
          <table className="w-full min-w-[520px]">
            <thead className="sticky top-0 bg-[#0f1117] z-10">
              <tr className="border-b border-[#1e2130]">
                <th
                  onClick={() => handleSort('zone')}
                  className={`pl-4 pr-3 py-1.5 text-left text-[10px] uppercase tracking-wider font-semibold cursor-pointer select-none transition-colors ${sortCol === 'zone' ? 'text-[#c4af64]' : 'text-[#9ca3af] hover:text-[#e2e4ed]'}`}
                >
                  <span className="inline-flex items-center gap-0.5">
                    Zone
                    <span className={sortCol === 'zone' ? '' : 'opacity-0'}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('region')}
                  className={`pr-3 py-1.5 text-left text-[10px] uppercase tracking-wider font-semibold cursor-pointer select-none transition-colors hidden md:table-cell ${sortCol === 'region' ? 'text-[#c4af64]' : 'text-[#9ca3af] hover:text-[#e2e4ed]'}`}
                >
                  <span className="inline-flex items-center gap-0.5">
                    Region
                    <span className={sortCol === 'region' ? '' : 'opacity-0'}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  </span>
                </th>
                <th className="pr-3 py-1.5 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Lv.</th>
                <th colSpan={2} className="py-1.5 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Cost</th>
                {NATION_IDS.map(nid => (
                  <th key={nid} className="px-1.5 py-1.5 text-center w-9 font-semibold"
                    style={{ color: NATIONS[nid].color }}>
                    {NATIONS[nid].icon
                      ? <img src={NATIONS[nid].icon} alt={NATIONS[nid].name} title={NATIONS[nid].name} className="w-4 h-4 object-contain mx-auto" />
                      : <span className="text-base">{NATIONS[nid].symbol}</span>
                    }
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedOutposts.map(outpost => (
                <OutpostRow
                  key={outpost.zone}
                  outpost={outpost}
                  mode={mode}
                  userNation={userNation}
                  owner={saved.owners[outpost.zone] ?? null}
                  onOwnerChange={n => setOwner(outpost.zone, n)}
                />
              ))}
              {NO_OUTPOST_REGIONS.map(region => (
                <NoOutpostRow
                  key={region}
                  region={region}
                  owner={saved.owners[region] ?? null}
                  onOwnerChange={n => setOwner(region, n)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
