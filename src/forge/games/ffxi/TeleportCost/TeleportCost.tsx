import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { API_URLS } from '../../../../config/apiUrls'
import { CharacterHeader } from '../components/CharacterHeader'
import type { NationMeta } from '../components/CharacterHeader'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { ImportPanel } from '../../../../components/ImportPanel'

const getNow = () => Date.now()

const SK    = STORAGE_KEYS.ffxiTeleportCost
const ST_SK = STORAGE_KEYS.ffxiSpellTracker

// ---------------------------------------------------------------------------
// Nations
// ---------------------------------------------------------------------------

type NationId = 1 | 2 | 3 | 4
const NATIONS: Record<NationId, NationMeta> = {
  1: { name: 'Bastok',     symbol: '⚙',  color: '#5b8db8' },
  2: { name: 'Windurst',   symbol: '✦',  color: '#8aab7e' },
  3: { name: "San d'Oria", symbol: '⚔',  color: '#c0453a' },
  4: { name: 'Beastmen',   symbol: '☠',  color: '#9333ea' },
}
const NATION_IDS = [1, 2, 3, 4] as NationId[]

// ---------------------------------------------------------------------------
// Outpost data — source: horizonffxi.wiki/Outpost_Teleportation
// ---------------------------------------------------------------------------

type Access = { lv: number; owned: number; notOwned: number }
type Outpost = { zone: string; region: string; home: Access; jeuno: Access }

function wikiZoneUrl(zone: string) {
  return `https://horizonffxi.wiki/${encodeURIComponent(zone.replace(/ /g, '_'))}`
}

const OUTPOSTS: Outpost[] = [
  { zone: 'North Gustaberg',         region: 'Gustaberg',             home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'West Ronfaure',           region: 'Ronfaure',              home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'West Sarutabaruta',       region: 'Sarutabaruta',          home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'Valkurm Dunes',           region: 'Zulkheim',              home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'Buburimu Peninsula',      region: 'Kolshushu',             home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'Meriphataud Mountains',   region: 'Aragoneu',              home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Pashhow Marshlands',      region: 'Derfland',              home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Jugner Forest',           region: 'Norvallen',             home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Qufim Island',            region: 'Qufim',                 home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Lufaise Meadows',         region: 'Tavnazian Archipelago', home: { lv: 30, owned: 300,  notOwned: 1200 }, jeuno: { lv: 30, owned: 350,  notOwned: 1750 } },
  { zone: 'Yuhtunga Jungle',         region: 'Elshimo Lowlands',      home: { lv: 35, owned: 350,  notOwned: 1400 }, jeuno: { lv: 25, owned: 400,  notOwned: 1600 } },
  { zone: 'Beaucedine Glacier',      region: 'Fauregandi',            home: { lv: 35, owned: 350,  notOwned: 1400 }, jeuno: { lv: 35, owned: 400,  notOwned: 1600 } },
  { zone: "The Sanctuary of Zi'Tah", region: "Li'Telor",              home: { lv: 35, owned: 350,  notOwned: 1400 }, jeuno: { lv: 25, owned: 400,  notOwned: 1600 } },
  { zone: 'Eastern Altepa Desert',   region: 'Kuzotz',                home: { lv: 40, owned: 400,  notOwned: 1600 }, jeuno: { lv: 30, owned: 450,  notOwned: 1800 } },
  { zone: 'Xarcabard',               region: 'Valdeaunia',            home: { lv: 40, owned: 400,  notOwned: 1600 }, jeuno: { lv: 40, owned: 450,  notOwned: 1800 } },
  { zone: 'Yhoator Jungle',          region: 'Elshimo Uplands',       home: { lv: 45, owned: 450,  notOwned: 1800 }, jeuno: { lv: 35, owned: 350,  notOwned: 2000 } },
  { zone: 'Cape Teriggan',           region: 'Vollbow',               home: { lv: 65, owned: 650,  notOwned: 2600 }, jeuno: { lv: 50, owned: 500,  notOwned: 3500 } },
]

// ---------------------------------------------------------------------------
// Conquest reset — Sunday 23:59:59 JST = Sunday 14:59:59 UTC
// ---------------------------------------------------------------------------

function lastConquestReset(): number {
  const now = Date.now()
  const d = new Date(now)
  const sunday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - d.getUTCDay(), 14, 59, 59))
  if (sunday.getTime() > now) sunday.setUTCDate(sunday.getUTCDate() - 7)
  return sunday.getTime()
}

function formatNextReset(): string {
  const next = lastConquestReset() + 7 * 24 * 60 * 60 * 1000
  const ms = next - Date.now()
  if (ms <= 0) return 'imminent'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// ---------------------------------------------------------------------------
// Saved state
// ---------------------------------------------------------------------------

type SavedState = {
  charName: string
  nation: NationId | null
  avatar: string | null
  owners: Record<string, NationId | null>
  savedAt: number
}

const DEFAULT: SavedState = { charName: '', nation: null, avatar: null, owners: {}, savedAt: 0 }

function loadState(): SavedState {
  try {
    const own = localStorage.getItem(SK)
    if (own) {
      const p = JSON.parse(own) as Partial<SavedState>
      const owners = (p.savedAt ?? 0) < lastConquestReset() ? {} : (p.owners ?? {})
      return { ...DEFAULT, ...p, owners }
    }
    // Seed charName / nation / avatar from SpellTracker if present
    const st = localStorage.getItem(ST_SK)
    if (st) {
      const p = JSON.parse(st)
      return { ...DEFAULT, charName: p.charName ?? '', nation: p.nation ?? null, avatar: p.avatar ?? null, savedAt: Date.now() }
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
      </td>
      <td className="py-2 pr-3 text-xs text-[#c4af64]/70 whitespace-nowrap hidden md:table-cell">{outpost.region}</td>
      <td className="py-2 pr-3 text-xs text-[#374151] text-center tabular-nums">{access.lv}</td>
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
      {NATION_IDS.map(nid => {
        const meta = NATIONS[nid]
        const active = owner === nid
        return (
          <td key={nid} className="py-2 px-1.5 text-center">
            <button
              onClick={() => onOwnerChange(active ? null : nid)}
              title={`${meta.name} controls this region`}
              className="w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center mx-auto"
              style={active ? {
                background: `${meta.color}25`,
                border: `1px solid ${meta.color}`,
                color: meta.color,
              } : {
                background: 'transparent',
                border: '1px solid #2a2d3a',
                color: '#374151',
              }}
            >
              <span style={{ fontSize: '11px', lineHeight: 0 }}>{meta.symbol}</span>
            </button>
          </td>
        )
      })}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TeleportCost() {
  const [saved, setSaved]           = useState<SavedState>(loadState)
  const [mode, setMode]             = useState<'home' | 'jeuno'>('jeuno')
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [importOpen, setImportOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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

  function setCharName(name: string) {
    persist({ ...saved, charName: name })
    setFetchStatus('idle')
  }

  async function fetchCharacter() {
    const name = saved.charName.trim()
    if (!name) return
    setFetchStatus('loading')
    try {
      const res = await fetch(`${API_URLS.horizonXiChars}/${encodeURIComponent(name)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      persist({ ...saved, nation: data.nation ?? null, avatar: data.avatar ?? null })
      setFetchStatus('success')
    } catch {
      setFetchStatus('error')
    }
  }

  function setOwner(zone: string, nation: NationId | null) {
    persist({ ...saved, owners: { ...saved.owners, [zone]: nation } })
  }

  function handleReset() {
    persist({ ...saved, owners: {} })
  }

  function exportState() {
    const code = btoa(JSON.stringify({ owners: saved.owners }))
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function importState(code: string): boolean {
    try {
      const parsed = JSON.parse(atob(code))
      persist({ ...saved, owners: parsed.owners ?? {} })
      return true
    } catch {
      return false
    }
  }

  const nation = saved.nation !== null ? NATIONS[saved.nation] : null

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">

      {/* Character / nation section */}
      <CharacterHeader
        charName={saved.charName}
        avatar={saved.avatar}
        nation={nation}
        fetchStatus={fetchStatus}
        onCharNameChange={setCharName}
        onFetch={fetchCharacter}
        onClear={() => persist({ ...saved, nation: null, avatar: null })}
        extra={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#374151]">or select nation:</span>
            {NATION_IDS.map(nid => {
              const meta = NATIONS[nid]
              return (
                <button
                  key={nid}
                  onClick={() => persist({ ...saved, nation: nid, avatar: null })}
                  className="text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer"
                  style={{ color: meta.color, borderColor: `${meta.color}50`, background: `${meta.color}10` }}
                >
                  {meta.symbol} {meta.name}
                </button>
              )
            })}
          </div>
        }
      />

      {/* Title + controls */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Teleport <span className="text-[#c4af64]">Costs</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
        </div>
        <div className="flex items-center gap-3 mt-1 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-[#374151] uppercase tracking-wider">Next reset</p>
            <p className="text-xs text-[#4b5563] tabular-nums">{formatNextReset()}</p>
          </div>
          <span className="text-[#2a2d3a]">|</span>
          <button
            onClick={exportState}
            className="text-xs text-[#4b5563] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Export'}
          </button>
          <button
            onClick={() => setImportOpen(v => !v)}
            className="text-xs text-[#4b5563] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            Import
          </button>
          <span className="text-[#2a2d3a]">|</span>
          <ConfirmButton label="Reset Conquest" onConfirm={handleReset} />
        </div>
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
          <div className="ml-auto flex items-center gap-3 px-4">
            {NATION_IDS.map(nid => {
              const meta = NATIONS[nid]
              return (
                <span key={nid} className="text-xs hidden sm:flex items-center gap-1.5" style={{ color: meta.color }}>
                  <span className="text-base leading-none">{meta.symbol}</span>{meta.name}
                </span>
              )
            })}
          </div>
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
                <th className="pl-4 pr-3 py-1.5 text-left text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Zone</th>
                <th className="pr-3 py-1.5 text-left text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold hidden md:table-cell">Region</th>
                <th className="pr-3 py-1.5 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Lv.</th>
                <th colSpan={2} className="py-1.5 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Cost</th>
                {NATION_IDS.map(nid => (
                  <th key={nid} className="px-1.5 py-1.5 text-center w-9 text-base font-semibold"
                    style={{ color: NATIONS[nid].color }}>
                    {NATIONS[nid].symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OUTPOSTS.map(outpost => (
                <OutpostRow
                  key={outpost.zone}
                  outpost={outpost}
                  mode={mode}
                  userNation={saved.nation}
                  owner={saved.owners[outpost.zone] ?? null}
                  onOwnerChange={n => setOwner(outpost.zone, n)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
