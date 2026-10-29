import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { emptyBuild, type Build, type PlanMode, type Purchase } from '../engine'
import { createBuild, deleteBuild, getBuild, listBuilds, putBuild, type BuildSummary } from '../api'
import { uid } from '../CharacterPlanner/util'
import { MAX_BLANKETS_PER_MONTH, SCHOOLS_OF_MAGIC } from '../rules'

export type SaveKind = 'local' | 'server'

export interface LocalSave {
  id: string
  name: string
  updatedAt: string
  build: Build
}

export interface SaveEntry {
  kind: SaveKind
  id: string
  name: string
  updatedAt: string | null
}

interface Stored {
  build: Build
  // Which save the working copy belongs to; null = unsaved draft.
  current: { kind: SaveKind; id: string } | null
  // Server updated_at for compare-and-set.
  base: string | null
  // JSON of the build as last saved, for the dirty check.
  saved: string | null
  local: LocalSave[]
  // Undo history, kept in memory only.
  past?: Build[]
  pastAt?: number
}

const UNDO_LIMIT = 50
// Edits closer together than this undo as one step (typing a name, a burst of clicks).
const UNDO_GAP_MS = 600
// Account saves wait for a pause in editing; device saves are cheap.
const AUTOSAVE_MS = { server: 2000, local: 300 }

function thisMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const blank = (): Build => emptyBuild(thisMonth())
const nameOf = (b: Build) => b.name.trim() || 'Unnamed character'
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const str = (x: unknown, fallback = '') => (typeof x === 'string' ? x : fallback)
const purchases = (x: unknown): Purchase[] =>
  Array.isArray(x) ? x.filter((p): p is Purchase => isObj(p) && typeof p.id === 'string' && typeof p.skill === 'string' && typeof p.at === 'number') : []

// Drafts and server blobs are untrusted: coerce every field the engine reads
// so a bad blob can't crash the page on every reload.
export function sanitize(raw: unknown): Build {
  const b = blank()
  if (!isObj(raw)) return b
  const simple = isObj(raw.simple) ? raw.simple : {}
  const priority = isObj(raw.priority) ? raw.priority : {}
  const blankets = (x: unknown) => (Number.isInteger(x) && (x as number) >= 0 && (x as number) <= MAX_BLANKETS_PER_MONTH ? (x as number) : null)
  const modes: PlanMode[] = ['sandbox', 'timeline', 'priority']
  return {
    ...b,
    name: str(raw.name), race: str(raw.race), culture: str(raw.culture),
    occupation: str(raw.occupation), vocation: str(raw.vocation),
    schools: Array.from({ length: Math.min(Math.max(Array.isArray(raw.schools) ? raw.schools.length : 0, 3), SCHOOLS_OF_MAGIC.length) }, (_, i) => str(Array.isArray(raw.schools) ? raw.schools[i] : '')),
    attunement: str(raw.attunement),
    startMonth: /^\d{4}-\d{2}$/.test(str(raw.startMonth)) ? str(raw.startMonth) : b.startMonth,
    blankets: Array.isArray(raw.blankets) ? raw.blankets.filter(m => typeof m === 'string' && /^\d{4}-\d{2}$/.test(m)) : [],
    purchases: purchases(raw.purchases),
    spells: isObj(raw.spells) ? Object.fromEntries(Object.entries(raw.spells).filter(([, v]) => typeof v === 'string')) as Record<string, string> : {},
    // useTimeline: builds saved before plan modes existed.
    mode: modes.includes(raw.mode as PlanMode) ? raw.mode as PlanMode : raw.useTimeline === true ? 'timeline' : 'sandbox',
    priority: {
      perMonth: blankets(priority.perMonth) || MAX_BLANKETS_PER_MONTH,
      months: Object.fromEntries(Object.entries(isObj(priority.months) ? priority.months : {})
        .filter(([m, n]) => /^\d{4}-\d{2}$/.test(m) && blankets(n) !== null)) as Record<string, number>,
      purchases: purchases(priority.purchases),
    },
    simple: {
      blankets: typeof simple.blankets === 'number' && simple.blankets >= 0 ? Math.floor(simple.blankets) : 0,
      purchases: purchases(simple.purchases),
    },
  }
}

function load(): Stored {
  const empty: Stored = { build: blank(), current: null, base: null, saved: null, local: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.uwPlanner)
    if (!raw) return empty
    const s = JSON.parse(raw) as Record<string, unknown>
    const local = (Array.isArray(s.local) ? s.local : [])
      .filter((l): l is LocalSave => isObj(l) && typeof l.id === 'string')
      .map(l => ({ id: l.id, name: str(l.name, 'Unnamed character'), updatedAt: str(l.updatedAt), build: sanitize(l.build) }))
    const c = s.current
    // Older drafts stored only an account build id.
    const current = isObj(c) && (c.kind === 'local' || c.kind === 'server') && typeof c.id === 'string'
      ? { kind: c.kind as SaveKind, id: c.id }
      : typeof s.buildId === 'string' ? { kind: 'server' as const, id: s.buildId } : null
    const build = sanitize(s.build)
    return { build, current, base: str(s.base) || null, saved: typeof s.saved === 'string' ? JSON.stringify(sanitize(JSON.parse(s.saved))) : null, local }
  } catch {
    return empty
  }
}

// Builds save to this device's localStorage, or (logged in) to the account.
// The working copy is always mirrored locally so a reload never loses edits.
export function useBuildStore() {
  const { isAuthenticated, loading } = useAuth()
  const [state, setState] = useState<Stored>(load)
  const [server, setServer] = useState<BuildSummary[]>([])
  const [conflict, setConflict] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Bumped whenever the working copy switches builds, so a slow response for
  // the previous build can't attach itself to the new one.
  const generation = useRef(0)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.uwPlanner, JSON.stringify({ ...state, past: undefined, pastAt: undefined })) } catch { /* quota */ }
  }, [state])

  // Logged out (not just still loading): an account build can't be saved
  // here, so keep the plan but drop the link.
  const linkedToServer = state.current?.kind === 'server'
  useEffect(() => {
    if (loading || isAuthenticated || !linkedToServer) return
    generation.current++
    setState(s => ({ ...s, current: null, base: null, saved: null })) // eslint-disable-line react-hooks/set-state-in-effect
  }, [loading, isAuthenticated, linkedToServer])

  const refresh = useCallback(() => {
    if (!isAuthenticated) return
    listBuilds().then(res => { if (res.status === 'ok') setServer(res.payload) }).catch(() => {})
  }, [isAuthenticated])

  useEffect(() => { refresh() }, [refresh])

  const setBuild = useCallback((fn: (b: Build) => Build) => {
    setError(null)
    setState(s => {
      const build = fn(s.build)
      if (build === s.build) return s
      const now = Date.now()
      const burst = now - (s.pastAt ?? 0) < UNDO_GAP_MS && !!s.past?.length
      return { ...s, build, past: burst ? s.past : [...(s.past ?? []), s.build].slice(-UNDO_LIMIT), pastAt: now }
    })
  }, [])

  const undo = () => setState(s => (s.past?.length ? { ...s, build: s.past[s.past.length - 1], past: s.past.slice(0, -1), pastAt: 0 } : s))

  // Runs an async action; `apply` is skipped if the user switched builds meanwhile.
  const run = async (fn: (stillCurrent: () => boolean) => Promise<void>) => {
    const gen = generation.current
    setBusy(true)
    setError(null)
    try { await fn(() => generation.current === gen) } catch { setError('Could not reach the server') } finally { setBusy(false) }
  }

  const switchTo = (next: Partial<Stored>) => {
    generation.current++
    setConflict(false)
    setState(s => ({ ...s, ...next, past: [], pastAt: 0 }))
  }

  const saveLocal = () => setState(s => {
    const id = s.current?.kind === 'local' ? s.current.id : uid()
    const entry: LocalSave = { id, name: nameOf(s.build), updatedAt: new Date().toISOString(), build: s.build }
    const local = [entry, ...s.local.filter(l => l.id !== id)]
    return { ...s, local, current: { kind: 'local', id }, base: null, saved: JSON.stringify(s.build) }
  })

  const createOnServer = (dropLocalId?: string) => run(async stillCurrent => {
    const build = state.build
    const res = await createBuild(build)
    if (!stillCurrent()) return
    if (res.status !== 'ok') return setError(res.message)
    setState(s => ({
      ...s,
      current: { kind: 'server', id: res.payload.id },
      base: res.payload.updated_at,
      saved: JSON.stringify(build),
      local: dropLocalId ? s.local.filter(l => l.id !== dropLocalId) : s.local,
    }))
    refresh()
  })

  // Server builds update in place; device saves stay on the device; a new
  // build goes to the account when logged in, else to the device.
  const save = (overwrite = false) => {
    const { current } = state
    if (current?.kind === 'local' || (!current && !isAuthenticated)) return saveLocal()
    if (!current) return createOnServer()
    return run(async stillCurrent => {
      const build = state.build
      // No known base (e.g. a migrated draft): overwrite rather than fake a conflict.
      const base = overwrite || state.base === null ? undefined : state.base
      const res = await putBuild(current.id, build, base)
      if (!stillCurrent()) return
      if (res.status === 'ok') {
        setState(s => ({ ...s, base: res.payload.updated_at, saved: JSON.stringify(build) }))
        setConflict(false)
      } else if (res.message === 'conflict') setConflict(true)
      else setError(res.message)
      refresh()
    })
  }

  // Moves the current device save into the account.
  const moveToAccount = () => createOnServer(state.current?.kind === 'local' ? state.current.id : undefined)

  const open = (kind: SaveKind, id: string) => {
    if (kind === 'local') {
      const entry = state.local.find(l => l.id === id)
      if (!entry) return
      const build = sanitize(entry.build)
      return switchTo({ build, current: { kind, id }, base: null, saved: JSON.stringify(build) })
    }
    generation.current++
    return run(async stillCurrent => {
      const res = await getBuild(id)
      if (!stillCurrent()) return
      if (res.status !== 'ok') return setError(res.message)
      const build = sanitize(res.payload.data)
      switchTo({ build, current: { kind, id }, base: res.payload.updated_at, saved: JSON.stringify(build) })
    })
  }

  const remove = (kind: SaveKind, id: string) => {
    const isCurrent = state.current?.kind === kind && state.current.id === id
    const unlink = () => { if (isCurrent) switchTo({ current: null, base: null, saved: null }) }
    if (kind === 'local') {
      setState(s => ({ ...s, local: s.local.filter(l => l.id !== id) }))
      return unlink()
    }
    return run(async stillCurrent => {
      const res = await deleteBuild(id)
      if (res.status !== 'ok') return setError(res.message)
      if (stillCurrent()) unlink()
      refresh()
    })
  }

  const startNew = () => switchTo({ build: blank(), current: null, base: null, saved: null })

  // Keeps the current plan as an unsaved copy.
  const detach = () => switchTo({ current: null, base: null, saved: null })

  // Once a build has a save, edits save themselves. A failed save waits for the
  // next edit or for the connection to come back; a conflict waits for the user.
  const dirty = JSON.stringify(state.build) !== state.saved
  const [online, setOnline] = useState(() => navigator.onLine)
  const autosave = useEffectEvent(() => save())
  const flush = useEffectEvent(() => {
    if (document.visibilityState === 'hidden' && state.current?.kind === 'server' && dirty && !busy && !conflict) save()
  })
  useEffect(() => {
    const on = () => { setOnline(true); setError(null) }
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [])
  const kind = state.current?.kind
  useEffect(() => {
    if (!kind || !dirty || conflict || busy || error || (kind === 'server' && !online)) return
    const t = setTimeout(autosave, AUTOSAVE_MS[kind])
    return () => clearTimeout(t)
  }, [state.build, kind, dirty, conflict, busy, error, online])

  const saves: SaveEntry[] = [
    ...(isAuthenticated ? server : []).map(b => ({ kind: 'server' as const, id: b.id, name: b.name, updatedAt: b.updated_at })),
    ...state.local.map(l => ({ kind: 'local' as const, id: l.id, name: l.name, updatedAt: l.updatedAt })),
  ]

  return {
    build: state.build, setBuild, current: state.current, saves,
    dirty, online, conflict, busy, error, isAuthenticated,
    canUndo: !!state.past?.length, undo,
    save, moveToAccount, open, remove, startNew, detach,
  }
}

export type BuildStore = ReturnType<typeof useBuildStore>
