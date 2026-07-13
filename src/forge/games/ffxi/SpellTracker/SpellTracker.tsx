import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  whiteMagic, blackMagic, songs, ninjutsu, summoningMagic, blueMagic,
  spellSchoolMap,
  type JobAbbr, type Spell,
} from '../data/spells'
import { ELEMENT_COLORS } from '../data/elements'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { getCharData, putCharData } from '../api'
import { useFfxiCharacters } from '../hooks/useFfxiCharacters'
import { useSyncedBlob } from '../hooks/useSyncedBlob'
import { useCharLive } from '../hooks/useCharRank'
import { SyncedCharacterHeader } from '../components/SyncedCharacterHeader'
import { loadSelectedCharId } from '../selectedChar'
import { ResetButton } from '../components/ResetButton'
import { CHAR_NATIONS } from '../nations'

const SK = STORAGE_KEYS.ffxiSpellTracker
const MIRROR_KEY = STORAGE_KEYS.ffxiSpellMirrorChar
const NOSYNC_KEY = STORAGE_KEYS.ffxiSpellNoSync

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

const JOBS: JobAbbr[] = [
  'WHM', 'BLM', 'RDM', 'PLD', 'DRK', 'BRD', 'SMN', 'NIN',
  // 'BLU', // not yet implemented
]

// Tracked progress only. Logged out this lives in localStorage; logged in it
// mirrors the selected character's server blob (name/nation/avatar/rank come
// from the registered character row, not from here).
type SavedState = {
  jobLevels: Partial<Record<JobAbbr, number>>
  learned: Record<string, boolean>
}

type SpellBlob = SavedState

function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(SK)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { jobLevels: parsed.jobLevels ?? {}, learned: parsed.learned ?? {} }
    }
  } catch { /* ignore */ }
  return { jobLevels: {}, learned: {} }
}

const ALL_SPELLS = [...whiteMagic, ...blackMagic, ...songs, ...ninjutsu, ...summoningMagic, ...blueMagic]

const JOB_SPELLS: Record<JobAbbr, Spell[]> = Object.fromEntries(
  JOBS.map(job => [
    job,
    ALL_SPELLS.filter(s => job in s.jobs).sort((a, b) => a.jobs[job]! - b.jobs[job]!),
  ])
) as Record<JobAbbr, Spell[]>

type SchoolMeta = { label: string; color: string }
const SCHOOL_META: Record<string, SchoolMeta> = {
  'White Magic':     { label: 'White',  color: '#f8fafc' },
  'Black Magic':     { label: 'Black',  color: '#c084fc' },
  'Songs':           { label: 'Song',   color: '#fbbf24' },
  'Ninjutsu':        { label: 'Nin.',   color: '#94a3b8' },
  'Summoning Magic': { label: 'Summon', color: '#67e8f9' },
  'Blue Magic':      { label: 'Blue',   color: '#60a5fa' },
}

type SkillMeta = { label: string; color: string }
const SKILL_META: Record<string, SkillMeta> = {
  'Healing Magic':    { label: 'Healing',    color: '#4ade80' },
  'Enhancing Magic':  { label: 'Enhancing',  color: '#38bdf8' },
  'Enfeebling Magic': { label: 'Enfeebling', color: '#fb7185' },
  'Divine Magic':     { label: 'Divine',     color: '#fcd34d' },
  'Elemental Magic':  { label: 'Elemental',  color: '#fb923c' },
  'Dark Magic':       { label: 'Dark',       color: '#a78bfa' },
  'Singing':          { label: 'Singing',    color: '#fbbf24' },
  'Ninjutsu':         { label: 'Ninjutsu',   color: '#94a3b8' },
  'Summoning Magic':  { label: 'Summoning',  color: '#67e8f9' },
  'Blue Magic':       { label: 'Blue Magic', color: '#60a5fa' },
}

// --- Sub-components ---

type SpellRowProps = {
  spell: Spell
  job: JobAbbr
  jobLevel: number
  learned: boolean
  isAnimating: boolean
  onToggle: () => void
}

function SpellRow({ spell, job, jobLevel, learned, isAnimating, onToggle }: SpellRowProps) {
  const spellLevel = spell.jobs[job]!
  const canLearn = jobLevel >= spellLevel
  const school = spellSchoolMap[spell.name]
  const schoolMeta = school ? SCHOOL_META[school] : null
  const skillMeta = spell.skill ? SKILL_META[spell.skill] : null
  const element = spell.element ?? null
  const elementColor = element ? ELEMENT_COLORS[element] : null

  return (
    <tr className={`border-b last:border-0 transition-all duration-300 ${
      isAnimating ? 'opacity-0 scale-95' : 'opacity-100'
    } ${learned ? 'bg-[#166534]/10 border-[#166534]/25' : 'border-[#1a1d27]'}`}>
      <td className={`pl-4 pr-2 py-1.5 border-l-2 ${learned ? 'border-l-[#22c55e]/70' : 'border-l-transparent'}`}>
        <input
          type="checkbox"
          checked={learned}
          onChange={onToggle}
          className="w-3.5 h-3.5 cursor-pointer accent-[#c4af64]"
        />
      </td>
      <td className={`py-1.5 pr-3 text-sm ${
        learned ? 'text-[#c4af64]' : canLearn ? 'text-[#e2e4ed]' : 'text-[#374151]'
      }`}>
        {spell.name}
      </td>
      <td className="py-1.5 pr-3 text-center">
        {schoolMeta && (
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
            style={{
              color: schoolMeta.color,
              background: `${schoolMeta.color}15`,
              border: `1px solid ${schoolMeta.color}40`,
            }}
          >
            {schoolMeta.label}
          </span>
        )}
      </td>
      <td className="py-1.5 pr-3 text-center">
        {skillMeta && (
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
            style={{
              color: skillMeta.color,
              background: `${skillMeta.color}15`,
              border: `1px solid ${skillMeta.color}40`,
            }}
          >
            {skillMeta.label}
          </span>
        )}
      </td>
      <td className="py-1.5 pr-3 text-center">
        {elementColor && (
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
            style={{
              color: elementColor,
              background: `${elementColor}15`,
              border: `1px solid ${elementColor}40`,
            }}
          >
            {element}
          </span>
        )}
      </td>
      <td className="py-1.5 pr-3 text-center text-[10px] text-[#9ca3af] tabular-nums">
        {spellLevel}
      </td>
      <td className="py-1.5 pr-4 text-center">
        <a
          href={`https://horizonffxi.wiki/${encodeURIComponent(spell.name.replace(/ /g, '_'))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#6b7280] hover:text-[#e2e4ed] transition-colors text-xs"
          title={`${spell.name} on HorizonXI wiki`}
        >
          ↗
        </a>
      </td>
    </tr>
  )
}

type ResetTarget = 'levels' | 'spells'

// --- Main component ---

export function SpellTracker() {
  const [saved, setSaved] = useState<SavedState>(loadState)
  const [activeJob, setActiveJob] = useState<JobAbbr>('WHM')
  const { isAuthenticated } = useAuth()
  const { characters } = useFfxiCharacters()
  const [selectedCharId, setSelectedCharId] = useState<string | null>(loadSelectedCharId)
  const [serverEmpty, setServerEmpty] = useState(false)
  const [noSync, setNoSync] = useState<string[]>(loadNoSync)

  const selectedChar = isAuthenticated
    ? characters.find(c => c.id === selectedCharId) ?? null
    : null
  // Synced mode: `saved` mirrors the selected character's server blob, and
  // localStorage is kept as a lagged copy of it so an offline reload shows
  // last-synced data instead of stale pre-login state.
  const synced = selectedChar !== null

  const { rank: syncedRank, jobs: liveJobs } = useCharLive(selectedChar?.name ?? null)
  const [loadedCharId, setLoadedCharId] = useState<string | null>(null)
  // Pre-sync browser copy for the migration banner; the mirror and live-jobs
  // writes clobber localStorage, so Import must read this instead.
  const [localSnapshot, setLocalSnapshot] = useState<SavedState | null>(null)

  const { scheduleSave } = useSyncedBlob<SpellBlob>({
    key: selectedChar?.id ?? null,
    load: selectedChar
      ? () => getCharData<SpellBlob>(selectedChar.id, 'spell_tracker')
      : null,
    save: selectedChar
      ? (data, base) => putCharData(selectedChar.id, 'spell_tracker', data, base)
      : null,
    onLoaded: data => {
      if (data === null && localSnapshot === null) {
        // A mirror left by ANOTHER character is not migratable local data.
        const owner = localStorage.getItem(MIRROR_KEY)
        setLocalSnapshot(owner && owner !== selectedChar?.id
          ? { jobLevels: {}, learned: {} }
          : loadState())
      }
      setServerEmpty(data === null)
      setLoadedCharId(selectedChar?.id ?? null)
      setSaved(prev => ({
        ...prev,
        jobLevels: data?.jobLevels ?? {},
        learned: data?.learned ?? {},
      }))
      if (data) writeLocal({ jobLevels: data.jobLevels ?? {}, learned: data.learned ?? {} })
    },
  })
  const [search, setSearch] = useState('')
  const [hideMode, setHideMode] = useState(true)
  const [countdown, setCountdown] = useState<Set<string>>(new Set())
  const [animating, setAnimating] = useState<Set<string>>(new Set())
  const [confirmReset, setConfirmReset] = useState<ResetTarget | null>(null)

  const countdownTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const animationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [tableMaxH, setTableMaxH] = useState<number | null>(null)

  const updateTableHeight = useCallback(() => {
    if (!tableRef.current) return
    const top = tableRef.current.getBoundingClientRect().top
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    // bottom bar (40) + gap above bar + content-div bottom padding (md:py-8=32, py-6=24)
    const offset = isDesktop ? (40 + 15 + 32) : (40 + 0 + 24)
    setTableMaxH(Math.max(200, window.innerHeight - top - offset))
  }, [])

  useLayoutEffect(() => {
    updateTableHeight()
    window.addEventListener('resize', updateTableHeight)
    return () => window.removeEventListener('resize', updateTableHeight)
  }, [updateTableHeight])

  // Re-measure when the character section changes height (portrait appears/disappears)
  const charLoaded = selectedChar !== null
  useLayoutEffect(() => {
    updateTableHeight()
  }, [charLoaded, updateTableHeight])

  // Mirror writes are stamped with the owning character so another character's
  // mirror is never mistaken for migratable pre-login data; logged-out edits
  // make the copy this browser's own again.
  function writeLocal(next: SavedState) {
    localStorage.setItem(SK, JSON.stringify(next))
    if (synced && selectedChar) localStorage.setItem(MIRROR_KEY, selectedChar.id)
    else if (!synced) localStorage.removeItem(MIRROR_KEY)
  }

  function persist(next: SavedState) {
    setSaved(next)
    writeLocal(next)
    if (synced) scheduleSave({ jobLevels: next.jobLevels, learned: next.learned })
  }

  function importLocalToCharacter() {
    const local = localSnapshot ?? loadState()
    setServerEmpty(false)
    // Live armoury levels already overwrote jobLevels and the effect won't
    // re-fire, so keep them; otherwise take the browser copy's levels.
    const liveApplied = liveJobs !== null && Object.values(liveJobs).some(lvl => lvl > 0)
    persist({
      ...saved,
      jobLevels: liveApplied ? saved.jobLevels : local.jobLevels,
      learned: { ...local.learned, ...saved.learned },
    })
  }

  function declineMigration() {
    if (!selectedChar) return
    const next = [...noSync, selectedChar.id]
    setNoSync(next)
    localStorage.setItem(NOSYNC_KEY, JSON.stringify(next))
  }

  const localHasData = useMemo(() => {
    if (!synced || !serverEmpty) return false
    const local = localSnapshot ?? loadState()
    return Object.keys(local.learned).length > 0 || Object.keys(local.jobLevels).length > 0
  }, [synced, serverEmpty, localSnapshot])

  const showMigration =
    localHasData && selectedChar !== null && !noSync.includes(selectedChar.id)

  function setJobLevel(job: JobAbbr, level: number) {
    persist({ ...saved, jobLevels: { ...saved.jobLevels, [job]: Math.max(0, Math.min(99, level)) } })
  }

  // Armoury job map: 0/missing = advanced job not unlocked; null when no
  // usable data yet (fetch pending or /anon all-zero payload).
  function liveLevelMap(): Partial<Record<JobAbbr, number>> | null {
    if (!liveJobs || !Object.values(liveJobs).some(lvl => lvl > 0)) return null
    const next: Partial<Record<JobAbbr, number>> = {}
    for (const job of JOBS) {
      next[job] = Math.max(0, Math.min(99, liveJobs[job] ?? 0))
    }
    return next
  }

  // Live armoury levels overwrite tracked ones after the blob loads.
  useEffect(() => {
    if (!synced || !selectedChar || loadedCharId !== selectedChar.id) return
    const next = liveLevelMap()
    if (!next) return
    if (JOBS.every(job => next[job] === saved.jobLevels[job])) return
    persist({ ...saved, jobLevels: next }) // eslint-disable-line react-hooks/set-state-in-effect
  }, [liveJobs, loadedCharId, synced]) // eslint-disable-line react-hooks/exhaustive-deps

  function cancelSpellTimers(spellName: string) {
    if (countdownTimers.current.has(spellName)) {
      clearTimeout(countdownTimers.current.get(spellName)!)
      countdownTimers.current.delete(spellName)
      setCountdown(prev => { const s = new Set(prev); s.delete(spellName); return s })
    }
    if (animationTimers.current.has(spellName)) {
      clearTimeout(animationTimers.current.get(spellName)!)
      animationTimers.current.delete(spellName)
      setAnimating(prev => { const s = new Set(prev); s.delete(spellName); return s })
    }
  }

  function toggleLearned(spellName: string) {
    const isLearning = !saved.learned[spellName]
    setSaved(prev => {
      const learned = { ...prev.learned }
      if (isLearning) learned[spellName] = true
      else delete learned[spellName]
      const next = { ...prev, learned }
      writeLocal(next)
      if (synced) scheduleSave({ jobLevels: next.jobLevels, learned: next.learned })
      return next
    })

    cancelSpellTimers(spellName)

    if (isLearning && hideMode && !search.trim()) {
      setCountdown(prev => new Set([...prev, spellName]))
      const t1 = setTimeout(() => {
        countdownTimers.current.delete(spellName)
        setCountdown(prev => { const s = new Set(prev); s.delete(spellName); return s })
        setAnimating(prev => new Set([...prev, spellName]))
        const t2 = setTimeout(() => {
          animationTimers.current.delete(spellName)
          setAnimating(prev => { const s = new Set(prev); s.delete(spellName); return s })
        }, 400)
        animationTimers.current.set(spellName, t2)
      }, 2000)
      countdownTimers.current.set(spellName, t1)
    }
  }

  function handleReset(target: ResetTarget) {
    // Synced levels come from the armoury, so "reset" means re-sync to it
    // (discarding manual tweaks), not blanking until the next page load.
    if (target === 'levels') persist({ ...saved, jobLevels: liveLevelMap() ?? {} })
    else persist({ ...saved, learned: {} })
    setConfirmReset(null)
  }

  function exportJSON() {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spells-${selectedChar?.name ?? 'export'}-${dateStr}.json`
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
        persist({ jobLevels: parsed.jobLevels ?? {}, learned: parsed.learned ?? {} })
      } catch { /* invalid JSON - ignore */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const jobLevel = saved.jobLevels[activeJob] ?? 1

  const tabStates = useMemo(() => {
    const states = {} as Record<JobAbbr, { lvl: number; missing: number }>
    for (const job of JOBS) {
      const lvl = saved.jobLevels[job] ?? 1
      const missing = lvl === 0
        ? 0
        : JOB_SPELLS[job].filter(s => s.jobs[job]! <= lvl && !saved.learned[s.name]).length
      states[job] = { lvl, missing }
    }
    return states
  }, [saved.jobLevels, saved.learned])
  const jobSpells = JOB_SPELLS[activeJob]

  const visibleSpells = useMemo(() => {
    const q = search.trim().toLowerCase()
    return jobSpells.filter(spell => {
      if (q) return spell.name.toLowerCase().includes(q)
      if (hideMode && saved.learned[spell.name] && !countdown.has(spell.name) && !animating.has(spell.name)) return false
      return true
    })
  }, [jobSpells, search, hideMode, saved.learned, countdown, animating])

  const learnedCount = useMemo(
    () => jobSpells.filter(s => saved.learned[s.name]).length,
    [jobSpells, saved.learned]
  )

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">

      {/* Character section - top (logged in only; logged out is pure localStorage) */}
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

      {/* First-sync migration: browser has data, the selected char has none.
          Declining is remembered per character. */}
      {showMigration && selectedChar && (
        <div className="flex items-center gap-3 px-3 py-2 rounded border border-[#c4af64]/40 bg-[#c4af64]/10 text-sm text-[#e2e4ed]">
          <span className="flex-1">This browser has unsynced Spell Tracker data.</span>
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
            Spell <span className="text-[#c4af64]">Tracker</span>
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
          <div className="flex flex-col gap-0.5">
            <ResetButton label="Levels" target="levels" confirm={confirmReset} onRequest={setConfirmReset} onConfirm={() => handleReset('levels')} onCancel={() => setConfirmReset(null)} />
            <ResetButton label="Spells" target="spells" confirm={confirmReset} onRequest={setConfirmReset} onConfirm={() => handleReset('spells')} onCancel={() => setConfirmReset(null)} />
          </div>
        </div>
      </div>

      {/* Tab panel */}
      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">

        {/* Job tabs */}
        <div className="flex border-b border-[#2a2d3a] overflow-x-auto">
          {JOBS.map(job => {
            const { lvl, missing } = tabStates[job]
            const isActive = activeJob === job
            const lvlColor = lvl === 0
              ? 'text-[#4b5563]'
              : missing > 0 ? 'text-[#c4af64]' : 'text-[#4ade80]'
            const title = lvl === 0
              ? 'Job not unlocked'
              : missing > 0
                ? `${missing} learnable spell${missing === 1 ? '' : 's'} missing`
                : 'All learnable spells learned'
            return (
              <button
                key={job}
                title={title}
                onClick={() => { setActiveJob(job); setSearch('') }}
                className={`flex flex-col items-center px-4 py-2.5 text-sm font-bold shrink-0 transition-colors border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-[#c4af64] border-[#c4af64] bg-[#c4af64]/5'
                    : 'text-[#9ca3af] border-transparent hover:text-[#e2e4ed] hover:bg-[#1a1d27]/50'
                }`}
              >
                <span>{job}</span>
                <span className={`text-xs font-semibold ${lvlColor}`}>{lvl}</span>
              </button>
            )
          })}
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1e2130] bg-[#1a1d27]/40 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#4b5563] uppercase tracking-wider">Level</span>
            <div className="flex items-center">
              <button
                onClick={() => setJobLevel(activeJob, jobLevel - 1)}
                disabled={jobLevel <= 0}
                className="px-1.5 py-0.5 text-xs text-[#6b7280] hover:text-[#e2e4ed] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors border border-r-0 border-[#2a2d3a] rounded-l bg-[#0f1117] leading-none"
              >▼</button>
              <input
                type="text"
                inputMode="numeric"
                value={jobLevel}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  setJobLevel(activeJob, digits ? parseInt(digits, 10) : 1)
                }}
                className="w-10 py-0.5 text-xs text-center border border-[#2a2d3a] bg-[#0f1117] text-[#9ca3af] focus:outline-none focus:border-[#4a5070]"
              />
              <button
                onClick={() => setJobLevel(activeJob, jobLevel + 1)}
                disabled={jobLevel >= 99}
                className="px-1.5 py-0.5 text-xs text-[#6b7280] hover:text-[#e2e4ed] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors border border-l-0 border-[#2a2d3a] rounded-r bg-[#0f1117] leading-none"
              >▲</button>
            </div>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search spells…"
            className="px-2 py-0.5 text-xs rounded border bg-[#0f1117] text-[#9ca3af] border-[#2a2d3a] hover:border-[#3a4060] focus:border-[#4a5070] focus:outline-none w-40"
          />
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hideMode}
              onChange={e => setHideMode(e.target.checked)}
              className="w-3 h-3 cursor-pointer accent-[#c4af64]"
            />
            <span className="text-[10px] text-[#6b7280]">Hide learned</span>
          </label>
          <span className="ml-auto text-xs text-[#6b7280] tabular-nums">{learnedCount} / {jobSpells.length}</span>
        </div>

        <div ref={tableRef} className="overflow-y-auto" style={{ maxHeight: tableMaxH ?? undefined, minHeight: 200 }}>
          {visibleSpells.length === 0 ? (
            <p className="py-6 px-4 text-sm text-[#374151]">
              {search ? 'No spells match your search.' : 'All spells learned!'}
            </p>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0f1117] z-10">
                <tr className="border-b border-[#1e2130]">
                  <th className="w-10 pl-4 pr-2 py-1.5" />
                  <th className="py-1.5 pr-3 text-left text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Spell</th>
                  <th className="py-1.5 pr-3 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Type</th>
                  <th className="py-1.5 pr-3 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Skill</th>
                  <th className="py-1.5 pr-3 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">Element</th>
                  <th className="py-1.5 pr-3 text-center text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold">LVL</th>
                  <th className="py-1.5 pr-4 w-8" />
                </tr>
              </thead>
              <tbody>
                {visibleSpells.map(spell => (
                  <SpellRow
                    key={spell.name}
                    spell={spell}
                    job={activeJob}
                    jobLevel={jobLevel}
                    learned={!!saved.learned[spell.name]}
                    isAnimating={animating.has(spell.name)}
                    onToggle={() => toggleLearned(spell.name)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
