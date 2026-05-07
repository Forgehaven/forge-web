import { useMemo, useRef, useState } from 'react'
import { API_URLS } from '../../../../config/apiUrls'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { ImportPanel } from '../../../../components/ImportPanel'
import bastokIcon from '../data/BastokIcon.png'
import windurstIcon from '../data/WindurstIcon.png'
import sandoriaIcon from '../data/SandoriaIcon.png'

const SK = STORAGE_KEYS.ffxiFriendViewer

const JOB_ORDER = [
  'WAR', 'MNK', 'WHM', 'BLM', 'RDM', 'THF', 'PLD', 'DRK',
  'BST', 'BRD', 'RNG', 'SAM', 'NIN', 'DRG', 'SMN', 'BLU',
  'COR', 'PUP', 'DNC', 'SCH',
]

const NATION_META: Record<number, { icon: string; name: string }> = {
  0: { icon: sandoriaIcon, name: "San d'Oria" },
  1: { icon: bastokIcon,   name: 'Bastok' },
  2: { icon: windurstIcon, name: 'Windurst' },
}

function getRaceDisplay(avatar: string | null | undefined): string | null {
  if (!avatar) return null
  const first = avatar[0]
  const second = avatar[1]
  if (first === 'H') return second === 'm' ? 'H♂' : 'H♀'
  if (first === 'E') return second === 'm' ? 'E♂' : 'E♀'
  if (first === 'T') return second === 'm' ? 'T♂' : 'T♀'
  if (first === 'M') return 'M'
  if (first === 'G') return 'G'
  return null
}

function parseRank(rank: string | null | undefined): number | null {
  if (!rank) return null
  const m = rank.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

type FriendData = {
  jobs: Record<string, number>
  nation?: number | null
  rank?: string | null
  avatar?: string | null
}
type FetchStatus = 'loading' | 'error' | null

type SavedState = {
  names: string[]
  data: Record<string, FriendData>
  starred: string | null
}

function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(SK)
    if (raw) return { names: [], data: {}, starred: null, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { names: [], data: {}, starred: null }
}

function levelColor(lvl: number): { text: string; bg: string } | null {
  if (lvl >= 75) return { text: '#c4af64', bg: '#c4af6418' }
  if (lvl >= 37) return { text: '#7dd3fc', bg: '#7dd3fc18' }
  if (lvl > 0)   return { text: '#6b7280', bg: 'transparent' }
  return null
}

export function FriendViewer() {
  const [saved, setSaved] = useState<SavedState>(loadState)
  const [nameInput, setNameInput] = useState('')
  const [statuses, setStatuses] = useState<Record<string, FetchStatus>>({})
  const [sortJob, setSortJob] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [isFetching, setIsFetching] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const touchDragRef = useRef<{ fromIdx: number; overIdx: number | null; startX: number; startY: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [diff, setDiff] = useState<Record<string, Record<string, number>>>({})

  function save(next: SavedState) {
    setSaved(next)
    localStorage.setItem(SK, JSON.stringify(next))
  }

  function addName() {
    const name = nameInput.trim()
    if (!name) return
    if (saved.names.some(n => n.toLowerCase() === name.toLowerCase())) {
      setNameInput('')
      return
    }
    save({ ...saved, names: [...saved.names, name] })
    setNameInput('')
  }

  function removeName(name: string) {
    const next: SavedState = {
      names: saved.names.filter(n => n !== name),
      data: { ...saved.data },
      starred: saved.starred === name ? null : saved.starred,
    }
    delete next.data[name]
    save(next)
    setStatuses(prev => { const s = { ...prev }; delete s[name]; return s })
  }

  function toggleStar(name: string) {
    save({ ...saved, starred: saved.starred === name ? null : name })
  }

  function handleSortJob(job: string) {
    if (sortJob === job) {
      if (sortDir === 'desc') setSortDir('asc')
      else setSortJob(null)
    } else {
      setSortJob(job)
      setSortDir('desc')
    }
  }

  function handleDragStart(idx: number) { setDraggedIdx(idx) }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (idx !== dragOverIdx) setDragOverIdx(idx)
  }

  function handleDrop(idx: number) {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null); setDragOverIdx(null); return
    }
    const names = [...saved.names]
    const [removed] = names.splice(draggedIdx, 1)
    names.splice(idx, 0, removed)
    save({ ...saved, names })
    setDraggedIdx(null); setDragOverIdx(null)
  }

  function handleDragEnd() { setDraggedIdx(null); setDragOverIdx(null) }

  function handleChipTouchStart(e: React.TouchEvent, idx: number) {
    if ((e.target as HTMLElement).closest('button')) return
    const t = e.touches[0]
    touchDragRef.current = { fromIdx: idx, overIdx: null, startX: t.clientX, startY: t.clientY }
  }

  function handleChipTouchMove(e: React.TouchEvent) {
    const drag = touchDragRef.current
    if (!drag) return
    const t = e.touches[0]
    if (Math.abs(t.clientX - drag.startX) < 6 && Math.abs(t.clientY - drag.startY) < 6) return
    e.preventDefault()
    setDraggedIdx(drag.fromIdx)
    const under = document.elementFromPoint(t.clientX, t.clientY)
    const chip = (under as HTMLElement | null)?.closest<HTMLElement>('[data-drag-idx]')
    if (chip) {
      const targetIdx = Number(chip.dataset.dragIdx)
      drag.overIdx = targetIdx
      setDragOverIdx(targetIdx)
    }
  }

  function handleChipTouchEnd() {
    const drag = touchDragRef.current
    touchDragRef.current = null
    if (drag && drag.overIdx !== null && drag.fromIdx !== drag.overIdx) {
      const names = [...saved.names]
      const [removed] = names.splice(drag.fromIdx, 1)
      names.splice(drag.overIdx, 0, removed)
      save({ ...saved, names })
    }
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  function exportNames() {
    navigator.clipboard.writeText(btoa(JSON.stringify(saved.names)))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function importNames(code: string): boolean {
    try {
      const names = JSON.parse(atob(code))
      if (!Array.isArray(names) || !names.every(n => typeof n === 'string')) throw new Error()
      const merged = [...saved.names]
      for (const name of names) {
        if (!merged.some(n => n.toLowerCase() === name.toLowerCase())) merged.push(name)
      }
      save({ ...saved, names: merged })
      return true
    } catch {
      return false
    }
  }

  function resetAll() {
    const empty: SavedState = { names: [], data: {}, starred: null }
    setSaved(empty)
    setStatuses({})
    localStorage.setItem(SK, JSON.stringify(empty))
  }

  async function fetchAll() {
    if (!saved.names.length || isFetching) return
    setIsFetching(true)
    const snapshot = { ...saved.data }
    setStatuses(Object.fromEntries(saved.names.map(n => [n, 'loading' as FetchStatus])))

    const names = saved.names
    const results = await Promise.allSettled(
      names.map(async name => {
        const res = await fetch(`${API_URLS.horizonXiChars}/${encodeURIComponent(name)}`)
        if (!res.ok) throw new Error()
        const json = await res.json()
        return {
          name,
          jobs: json.jobs as Record<string, number>,
          nation: json.nation ?? null,
          rank: json.rank ?? null,
          avatar: json.avatar ?? null,
        }
      })
    )

    const newData = { ...saved.data }
    const newStatuses: Record<string, FetchStatus> = {}
    const newDiff: Record<string, Record<string, number>> = {}

    for (let i = 0; i < names.length; i++) {
      const r = results[i]
      const name = names[i]
      if (r.status === 'fulfilled') {
        newData[name] = { jobs: r.value.jobs, nation: r.value.nation, rank: r.value.rank, avatar: r.value.avatar }
        newStatuses[name] = null
        const prevJobs = snapshot[name]?.jobs
        if (prevJobs) {
          const charDiff: Record<string, number> = {}
          for (const [job, newLvl] of Object.entries(r.value.jobs)) {
            const delta = (newLvl as number) - (prevJobs[job] ?? 0)
            if (delta !== 0) charDiff[job] = delta
          }
          if (Object.keys(charDiff).length > 0) newDiff[name] = charDiff
        }
      } else {
        newStatuses[name] = 'error'
      }
    }

    setDiff(newDiff)
    setStatuses(newStatuses)
    save({ ...saved, data: newData })
    setIsFetching(false)
  }

  const activeJobs = useMemo(() => {
    const seen = new Set<string>()
    for (const d of Object.values(saved.data)) {
      for (const [job, lvl] of Object.entries(d.jobs)) {
        if (lvl > 0) seen.add(job)
      }
    }
    return JOB_ORDER.filter(j => seen.has(j))
  }, [saved.data])

  const sortedNames = useMemo(() => {
    const starred = saved.starred && saved.names.includes(saved.starred) ? saved.starred : null
    const rest = saved.names.filter(n => n !== starred)
    if (sortJob) {
      rest.sort((a, b) => {
        const aLvl = saved.data[a]?.jobs[sortJob] ?? 0
        const bLvl = saved.data[b]?.jobs[sortJob] ?? 0
        return sortDir === 'desc' ? bLvl - aLvl : aLvl - bLvl
      })
    }
    return starred ? [starred, ...rest] : rest
  }, [saved.names, saved.starred, saved.data, sortJob, sortDir])

  const hasData = activeJobs.length > 0
  const hasErrors = Object.values(statuses).some(s => s === 'error')

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Friend <span className="text-[#c4af64]">Viewer</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
        </div>
        <div className="flex items-center gap-3 mt-1 shrink-0">
          <button
            onClick={exportNames}
            className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Export'}
          </button>
          <button
            onClick={() => setImportOpen(v => !v)}
            className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            Import
          </button>
          <span className="text-[#2a2d3a]">|</span>
          <ConfirmButton label="Reset all" confirmPrompt="Reset all?" onConfirm={resetAll} />
        </div>
      </div>

      {importOpen && (
        <ImportPanel
          description="Paste an export code to merge names from another device or share with a friend."
          onImport={importNames}
          onClose={() => setImportOpen(false)}
        />
      )}

      <div className="flex flex-col gap-3">
        <p className="forge-label text-xs uppercase tracking-widest">Characters</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addName() }}
            placeholder="Enter a character name…"
            className="forge-input text-sm flex-1"
          />
          <button
            onClick={addName}
            disabled={!nameInput.trim()}
            className="forge-btn px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {saved.names.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {saved.names.map((name, idx) => {
                const status = statuses[name]
                const hasFetched = !!saved.data[name]
                const isBeingDragged = draggedIdx === idx
                const isDropTarget = dragOverIdx === idx && draggedIdx !== idx
                return (
                  <span
                    key={name}
                    data-drag-idx={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={e => handleChipTouchStart(e, idx)}
                    onTouchMove={handleChipTouchMove}
                    onTouchEnd={handleChipTouchEnd}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border bg-[#1a1d27] text-[#9ca3af] cursor-grab active:cursor-grabbing select-none transition-opacity"
                    style={{
                      borderColor: isDropTarget ? '#c4af64' : '#2a2d3a',
                      opacity: isBeingDragged ? 0.35 : 1,
                    }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      status === 'loading' ? 'bg-[#6b7280] animate-pulse' :
                      status === 'error'   ? 'bg-[#ef4444]' :
                      hasFetched          ? 'bg-[#22c55e]' :
                                            'bg-[#2a2d3a]'
                    }`} />
                    {name}
                    <button
                      onClick={() => removeName(name)}
                      className="text-[#4b5563] hover:text-[#e2e4ed] transition-colors cursor-pointer leading-none ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAll}
                disabled={isFetching}
                className="forge-btn px-5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFetching ? 'Fetching…' : 'Fetch All'}
              </button>
              {hasErrors && (
                <span className="text-xs text-[#ef4444]">Some characters could not be found</span>
              )}
            </div>
          </>
        )}
      </div>

      {saved.names.length === 0 && (
        <div className="forge-card flex items-center justify-center py-10">
          <p className="text-sm text-[#6b7280]">Add character names above then click Fetch All.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#2a2d3a]">
            {Object.keys(diff).length > 0 && (
              <div className="flex justify-end px-3 py-1.5 border-b border-[#2a2d3a] bg-[#1a1d27]">
                <button onClick={() => setDiff({})} className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer">
                  Clear Diff
                </button>
              </div>
            )}
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1a1d27] border-b border-[#2a2d3a]">
                  <th className="sticky left-0 z-10 bg-[#1a1d27] px-3 py-2.5 text-left text-xs text-[#6b7280] uppercase tracking-widest font-semibold w-32 min-w-[8rem] border-r border-[#2a2d3a]">
                    Character
                  </th>
                  <th className="px-2 py-2.5 text-center text-xs text-[#6b7280] uppercase tracking-widest font-semibold w-12">
                    Nation
                  </th>
                  <th className="px-1 py-2.5 text-center text-xs text-[#6b7280] uppercase tracking-widest font-semibold w-9 border-r border-[#2a2d3a]">
                    Race
                  </th>
                  {activeJobs.map(job => {
                    const isActive = sortJob === job
                    return (
                      <th
                        key={job}
                        onClick={() => handleSortJob(job)}
                        className={`px-1 py-2.5 text-center text-xs uppercase tracking-widest font-semibold select-none whitespace-nowrap cursor-pointer transition-colors ${
                          isActive ? 'text-[#c4af64]' : 'text-[#6b7280] hover:text-[#9ca3af]'
                        }`}
                      >
                        <span className="relative inline-block">
                          {job}
                          {isActive && (
                            <span className="absolute -right-2.5 top-0 text-[8px] leading-none">
                              {sortDir === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedNames.map((name, i) => {
                  const d = saved.data[name]
                  const isStarred = saved.starred === name
                  const status = statuses[name]
                  const rowBg = i % 2 === 0 ? '#0f1117' : '#111420'
                  return (
                    <tr key={name} className="border-b border-[#1e2130] last:border-0" style={{ background: rowBg }}>
                      <td className="sticky left-0 z-10 px-3 py-2 border-r border-[#2a2d3a]" style={{ background: rowBg }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => toggleStar(name)}
                            className="text-sm leading-none cursor-pointer transition-colors shrink-0"
                            style={{ color: isStarred ? '#c4af64' : '#374151' }}
                          >
                            {isStarred ? '★' : '☆'}
                          </button>
                          {d ? (
                            <a
                              href={`${API_URLS.horizonXiPlayers}/${encodeURIComponent(name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium truncate hover:underline"
                              style={{ color: isStarred ? '#c4af64' : '#e2e4ed' }}
                            >
                              {name}
                            </a>
                          ) : (
                            <span className="font-medium truncate" style={{ color: isStarred ? '#c4af64' : '#e2e4ed' }}>
                              {name}
                            </span>
                          )}
                          {status === 'loading' && <span className="text-xs text-[#6b7280] shrink-0">…</span>}
                          {status === 'error'   && <span className="text-xs text-[#ef4444] shrink-0" title="Character not found">!</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center whitespace-nowrap align-middle">
                        {d?.nation != null ? (() => {
                          const meta = NATION_META[d.nation]
                          const rank = parseRank(d.rank)
                          return meta ? (
                            <span className="inline-flex items-center gap-1 align-middle">
                              <img src={meta.icon} alt={meta.name} title={meta.name} className="w-4 h-4 object-contain" />
                              <span className="text-xs text-[#9ca3af] tabular-nums w-5 text-center">{rank ?? '?'}</span>
                            </span>
                          ) : <span className="text-[#2a2d3a] select-none">—</span>
                        })() : <span className="text-[#2a2d3a] select-none">—</span>}
                      </td>
                      <td className="px-1 py-2 text-center border-r border-[#2a2d3a]">
                        {(() => {
                          const race = getRaceDisplay(d?.avatar)
                          return race
                            ? <span className="text-xs text-[#9ca3af]">{race}</span>
                            : <span className="text-[#2a2d3a] select-none">—</span>
                        })()}
                      </td>
                      {activeJobs.map(job => {
                        const lvl = d?.jobs[job] ?? 0
                        const colors = levelColor(lvl)
                        const delta = diff[name]?.[job]
                        return (
                          <td key={job} className="px-1 py-2 text-center tabular-nums">
                            {colors ? (
                              <span className="inline-flex items-center gap-0.5">
                                <span
                                  className="inline-flex items-center justify-center w-7 py-0.5 rounded text-sm font-semibold"
                                  style={{ color: colors.text, background: colors.bg }}
                                >
                                  {lvl}
                                </span>
                                {delta !== undefined && (
                                  <span className="text-[9px] font-semibold leading-none" style={{ color: delta > 0 ? '#4ade80' : '#f87171' }}>
                                    {delta > 0 ? `+${delta}` : delta}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-[#2a2d3a] select-none">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#6b7280]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded text-center font-semibold text-[10px] leading-4" style={{ color: '#c4af64', background: '#c4af6418' }}>75</span>
              Max level
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded text-center font-semibold text-[10px] leading-4" style={{ color: '#7dd3fc', background: '#7dd3fc18' }}>37</span>
              Sub-job ready
            </span>
          </div>
        </>
      )}
    </div>
  )
}
