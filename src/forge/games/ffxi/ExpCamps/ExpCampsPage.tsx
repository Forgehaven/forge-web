import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, type Column } from '../../../../components/DataTable'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { getUserData, putUserData } from '../api'
import { useSyncedBlob } from '../hooks/useSyncedBlob'
import { EXP_CAMPS, levelLabel, type ExpCamp, type ExpCampType } from './camps'

const FK = STORAGE_KEYS.ffxiExpCamps

function loadFavs(): Set<string> {
  try {
    const p = JSON.parse(localStorage.getItem(FK) ?? '')
    if (Array.isArray(p?.favs)) return new Set(p.favs.filter((x: unknown): x is string => typeof x === 'string'))
  } catch { /* fall through */ }
  return new Set()
}

const SELECT = 'bg-forge-surface border border-forge-border rounded px-2 py-1.5 text-sm text-forge-text focus:border-forge-accent outline-none cursor-pointer'
const INPUT = 'bg-forge-surface border border-forge-border rounded px-2 py-1.5 text-sm text-forge-text focus:border-forge-accent outline-none'
const LABEL = 'text-xs text-forge-muted uppercase tracking-widest'

const TYPE_LABELS: Record<ExpCampType, string> = {
  standard: 'Standard',
  unverified: 'Unverified',
  sky: 'Sky',
  merit: 'Merit',
  alpha: 'Alpha',
  shatter: 'Shatter',
  manaburn: 'Mana Burn',
  undeadburn: 'Undead Burn',
}
// only types that actually have rows (Alpha/Shatter are empty on the wiki today)
const TYPES = [...new Set(EXP_CAMPS.map(c => c.type))]

const COLUMNS: Column<ExpCamp>[] = [
  {
    key: 'level',
    label: 'Level',
    render: c => <span className="text-forge-accent font-semibold">{levelLabel(c)}</span>,
    sortKey: c => c.levels?.[0] ?? 76,
  },
  {
    key: 'zone',
    label: 'Zone',
    render: c => c.mapId
      ? (
        <Link
          to={`/games/ffxi/map/${c.mapId}`}
          state={{ flashCamp: c.id }}
          className="text-[#4ade80] hover:underline"
          title={c.spots.length ? 'Show on map' : 'Open zone map'}
        >
          {c.zone}
        </Link>
      )
      : c.zone,
    sortKey: c => c.zone,
  },
  {
    key: 'camp',
    label: 'Camp',
    render: c => <div className="whitespace-normal min-w-56 max-w-md">{c.description}</div>,
  },
  {
    key: 'mobs',
    label: 'Mob(s)',
    render: c => (
      <div className="whitespace-normal min-w-48 max-w-sm text-forge-dim">
        {c.mobs.map((m, i) => <div key={i}>{m}</div>)}
      </div>
    ),
  },
  {
    key: 'notes',
    label: 'Notes',
    render: c => <div className="whitespace-normal min-w-64 text-xs text-forge-muted">{c.notes}</div>,
  },
  {
    key: 'type',
    label: 'Type',
    render: c => (
      <span className="text-[10px] uppercase tracking-wider text-forge-dim border border-forge-border rounded px-1.5 py-0.5">
        {TYPE_LABELS[c.type]}
      </span>
    ),
    sortKey: c => c.type,
  },
]

export function ExpCampsPage() {
  const [level, setLevel] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [favs, setFavs] = useState<Set<string>>(loadFavs)

  // Account sync for favourites, offline-first: localStorage is the source of
  // truth, the server copy follows when logged in (FriendViewer idiom).
  type FavBlob = { favs: string[] }
  const { isAuthenticated } = useAuth()
  const { scheduleSave } = useSyncedBlob<FavBlob>({
    key: isAuthenticated ? 'exp_camps' : null,
    load: isAuthenticated ? () => getUserData<FavBlob>('exp_camps') : null,
    save: isAuthenticated ? (data, base) => putUserData('exp_camps', data, base) : null,
    onLoaded: data => {
      if (!data) {
        // Server has nothing yet: push this browser's favourites up once.
        if (favs.size) scheduleSave({ favs: [...favs] })
        return
      }
      // Union merge: known limitation - a favourite removed on another device
      // can be resurrected by this browser's stale local copy.
      const server = (data.favs ?? []).filter((x): x is string => typeof x === 'string')
      const merged = new Set([...server, ...favs])
      setFavs(merged)
      localStorage.setItem(FK, JSON.stringify({ favs: [...merged] }))
      if (merged.size !== server.length) scheduleSave({ favs: [...merged] })
    },
  })

  const toggleFav = useCallback((id: string) => {
    const next = new Set(favs)
    if (!next.delete(id)) next.add(id)
    setFavs(next)
    localStorage.setItem(FK, JSON.stringify({ favs: [...next] }))
    scheduleSave({ favs: [...next] })
  }, [favs, scheduleSave])

  const columns = useMemo<Column<ExpCamp>[]>(() => [
    {
      key: 'fav',
      label: '',
      title: 'Favourites stay pinned to the top',
      render: c => (
        <button
          onClick={() => toggleFav(c.id)}
          aria-label={`${favs.has(c.id) ? 'Unfavourite' : 'Favourite'} ${c.zone} camp`}
          aria-pressed={favs.has(c.id)}
          className={`cursor-pointer text-base leading-none transition-colors ${
            favs.has(c.id) ? 'text-forge-accent' : 'text-forge-line hover:text-forge-muted'
          }`}
        >
          ★
        </button>
      ),
    },
    ...COLUMNS,
  ], [favs, toggleFav])

  const rows = useMemo(() => {
    const lv = Number(level)
    const q = search.trim().toLowerCase()
    return EXP_CAMPS.filter(c => {
      if (level !== '' && !Number.isNaN(lv)) {
        if (c.levels ? lv < c.levels[0] || lv > c.levels[1] : lv < 75) return false
      }
      if (type && c.type !== type) return false
      if (q && !`${c.zone} ${c.description} ${c.mobs.join(' ')} ${c.notes}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [level, type, search])

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <h1 className="text-xl font-semibold text-forge-text tracking-wide">
          EXP <span className="text-forge-accent">Camps</span>
        </h1>
        <p className="text-sm text-forge-muted mt-0.5">
          FFXI · Horizon · sourced from the{' '}
          <a href="https://horizonffxi.wiki/EXP_Camps" target="_blank" rel="noreferrer" className="text-forge-accent hover:underline">
            HorizonXI wiki
          </a>
          {' '}· zone links jump to the camp on the Interactive Map
        </p>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className={LABEL} htmlFor="exp-level">Level</label>
          <input
            id="exp-level"
            type="number"
            min={1}
            max={75}
            placeholder="Any"
            className={`${INPUT} w-20`}
            value={level}
            onChange={e => setLevel(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={LABEL} htmlFor="exp-type">Type</label>
          <select id="exp-type" className={SELECT} value={type} onChange={e => setType(e.target.value)}>
            <option value="">All</option>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-48 max-w-sm">
          <label className={LABEL} htmlFor="exp-search">Search</label>
          <input
            id="exp-search"
            type="text"
            placeholder="Zone, camp, mob…"
            className={INPUT}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {rows.length > 0 ? (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={c => c.id}
          defaultSort="level"
          defaultSortDir="asc"
          pinned={c => favs.has(c.id)}
          footer={`${rows.length} of ${EXP_CAMPS.length} camps`}
        />
      ) : (
        <p className="text-sm text-forge-muted">No camps match the filters.</p>
      )}
    </div>
  )
}
