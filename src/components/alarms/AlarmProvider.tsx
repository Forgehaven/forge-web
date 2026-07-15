import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlarmsContext, type AlarmsCtx, type TargetSource } from './alarmContext'
import { useNow } from '../../hooks/useNow'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { ensureAudio, hookAudioGesture, playChime, setChimeVolume, type ChimeLevel } from '../../lib/chime'
import { BellIcon } from '../Icons'
import { Modal } from '../Modal'

// Generic timed-notification engine. Pages register target SOURCES (pure
// functions of now-ms returning armable events); the provider owns arming,
// per-alarm leads, chime prefs, the cursor lead picker, the repeat modal, and
// the floating alarms widget. Keys are namespaced `sourceId:name` so sources
// can never collide.

type ArmedAlert = { key: string; lead: number }

const SK = STORAGE_KEYS.gameAlarms
const LEGACY_SK = STORAGE_KEYS.ffxiVanaTimers

const LEAD_CHOICES = [
  { ms: 60_000, label: '1m' },
  { ms: 120_000, label: '2m' },
  { ms: 300_000, label: '5m' },
  { ms: 900_000, label: '15m' },
  { ms: 3_600_000, label: '1h' },
]

const leadLabel = (ms: number) =>
  ms >= 3_600_000 ? `${ms / 3_600_000}h` : `${Math.round(ms / 60_000)}m`

const displayName = (key: string) => key.slice(key.indexOf(':') + 1)

function fmtWait(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  if (totalSec < 120) {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }
  const totalMin = Math.floor(totalSec / 60)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

type Prefs = {
  armed: ArmedAlert[]
  chimeLevel: ChimeLevel
  repeat: boolean
  volume: number
}

const DEFAULT_PREFS: Prefs = { armed: [], chimeLevel: 'normal', repeat: false, volume: 50 }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(SK)
    // One-time migration: alarm prefs used to live in the VanaTimers blob,
    // with keys unprefixed (and, before that, armed as string[] + alertLead).
    const p = raw ? JSON.parse(raw) : JSON.parse(localStorage.getItem(LEGACY_SK) ?? '')
    const prefix = raw ? '' : 'ffxi:'
    const legacyLead = (typeof p?.alertLead === 'number' ? p.alertLead : 2) * 60_000
    const armed: ArmedAlert[] = Array.isArray(p?.armed)
      ? p.armed
          .map((a: unknown) =>
            typeof a === 'string'
              ? { key: `${prefix}${a}`, lead: legacyLead }
              : a && typeof (a as ArmedAlert).key === 'string' && typeof (a as ArmedAlert).lead === 'number'
                ? { key: `${prefix}${(a as ArmedAlert).key}`, lead: (a as ArmedAlert).lead }
                : null)
          .filter((a: ArmedAlert | null): a is ArmedAlert => a !== null)
      : []
    return {
      armed,
      chimeLevel: p?.chimeLevel === 'soft' || p?.chimeLevel === 'loud' ? p.chimeLevel : 'normal',
      repeat: p?.repeat === true,
      volume: typeof p?.volume === 'number' ? Math.max(0, Math.min(100, p.volume)) : DEFAULT_PREFS.volume,
    }
  } catch { /* fall through to default */ }
  return DEFAULT_PREFS
}

export function AlertBell({ target, armed, onToggle, size = 12 }: {
  target: string
  armed: boolean
  onToggle: (target: string, e: React.MouseEvent) => void
  size?: number
}) {
  return (
    <button
      onClick={e => onToggle(target, e)}
      aria-label={`Toggle alert for ${target}`}
      title={armed ? 'Alert armed - click to disarm' : 'Chime before this event'}
      className={`cursor-pointer transition-colors align-middle ${
        armed ? 'text-[#c4af64]' : 'text-[#4b5563] hover:text-[#9ca3af]'
      }`}
    >
      <BellIcon size={size} />
    </button>
  )
}

export function AlarmProvider({ sources, children }: {
  sources: Record<string, TargetSource>
  children: ReactNode
}) {
  const now = useNow(250)
  const ms = now.getTime()
  const [prefsInit] = useState(loadPrefs)
  const [armed, setArmed] = useState<Map<string, number>>(
    () => new Map(prefsInit.armed.map(a => [a.key, a.lead])))
  const [chimeLevel, setChimeLevel] = useState<ChimeLevel>(prefsInit.chimeLevel)
  const [repeatMode, setRepeatMode] = useState<boolean>(prefsInit.repeat)
  const [volume, setVolumeState] = useState<number>(prefsInit.volume)
  const [leadPicker, setLeadPicker] = useState<{ target: string; x: number; y: number } | null>(null)
  const [alarm, setAlarm] = useState<string[]>([])
  // Collapsed by default on small screens so the floating widget stays out of the way.
  const [alarmsOpen, setAlarmsOpen] = useState(() =>
    typeof window === 'undefined'
    || typeof window.matchMedia !== 'function'
    || !window.matchMedia('(max-width: 767px)').matches)
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    hookAudioGesture()
    setChimeVolume(prefsInit.volume / 100)
    // Persist migrated legacy prefs immediately so later writes to the old
    // VanaTimers blob can't lose them.
    if (!localStorage.getItem(SK)) {
      localStorage.setItem(SK, JSON.stringify(prefsInit))
    }
  }, [prefsInit])

  const targets = Object.entries(sources).flatMap(([id, source]) =>
    source(ms).map(t => ({ key: `${id}:${t.key}`, inMs: t.inMs })))

  const armedToArr = (m: Map<string, number>): ArmedAlert[] =>
    [...m.entries()].map(([key, lead]) => ({ key, lead }))

  function persistPrefs(over: Partial<Prefs>) {
    const cur: Prefs = { armed: armedToArr(armed), chimeLevel, repeat: repeatMode, volume }
    localStorage.setItem(SK, JSON.stringify({ ...cur, ...over }))
  }

  function toggleAlert(target: string, e: React.MouseEvent) {
    ensureAudio()
    if (armed.has(target)) disarmAlert(target)
    else setLeadPicker({ target, x: e.clientX, y: e.clientY })
  }

  function armAlert(target: string, lead: number) {
    setArmed(prev => {
      const next = new Map(prev)
      next.set(target, lead)
      // Re-arming resets this target's fired history so the CURRENT window
      // can chime again.
      for (const key of [...firedRef.current]) {
        if (key.startsWith(`${target}@`)) firedRef.current.delete(key)
      }
      persistPrefs({ armed: armedToArr(next) })
      return next
    })
    setLeadPicker(null)
  }

  function disarmAlert(target: string) {
    setArmed(prev => {
      const next = new Map(prev)
      next.delete(target)
      persistPrefs({ armed: armedToArr(next) })
      return next
    })
  }

  function setChime(level: ChimeLevel) {
    setChimeLevel(level)
    persistPrefs({ chimeLevel: level })
  }

  function toggleRepeat() {
    setRepeatMode(prev => {
      persistPrefs({ repeat: !prev })
      return !prev
    })
  }

  function setVolume(v: number) {
    setVolumeState(v)
    setChimeVolume(v / 100)
    persistPrefs({ volume: v })
  }

  useEffect(() => {
    if (!leadPicker) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLeadPicker(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leadPicker])

  // Fire armed alerts once per event instance, then auto-disarm. Rides the
  // useNow tick; instances keyed by target + event second.
  useEffect(() => {
    if (armed.size === 0) return
    const next = new Map(armed)
    const firedTargets: string[] = []
    let fired = false
    for (const t of targets) {
      const lead = next.get(t.key)
      if (lead === undefined) continue
      if (t.inMs > lead) continue
      const instance = `${t.key}@${Math.round((ms + t.inMs) / 1000)}`
      if (firedRef.current.has(instance)) continue
      firedRef.current.add(instance)
      playChime(chimeLevel)
      next.delete(t.key)
      firedTargets.push(t.key)
      fired = true
    }
    if (fired) {
      setArmed(next) // eslint-disable-line react-hooks/set-state-in-effect
      persistPrefs({ armed: armedToArr(next) })
      if (repeatMode) setAlarm(prev => [...prev, ...firedTargets])
    }
  }, [ms]) // eslint-disable-line react-hooks/exhaustive-deps

  // Repeat mode: keep ringing while the alarm modal is up.
  useEffect(() => {
    if (alarm.length === 0) return
    const id = setInterval(() => playChime(chimeLevel), 3000)
    return () => clearInterval(id)
  }, [alarm, chimeLevel])

  const ctx: AlarmsCtx = {
    armed, toggleAlert, disarmAlert,
    chimeLevel, setChime, repeatMode, toggleRepeat, volume, setVolume,
  }

  return (
    <AlarmsContext.Provider value={ctx}>
      {children}

      {leadPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setLeadPicker(null)} />
          <div
            role="dialog"
            aria-label={`Set alert lead for ${displayName(leadPicker.target)}`}
            className="fixed z-50 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1"
            style={{
              top: Math.max(8, leadPicker.y - 44),
              left: Math.max(8, Math.min(leadPicker.x - 100, window.innerWidth - 230)),
            }}
          >
            <span className="text-[10px] uppercase tracking-wider text-[#6b7280] pr-1">chime</span>
            {LEAD_CHOICES.map(c => (
              <button
                key={c.ms}
                onClick={() => armAlert(leadPicker.target, c.ms)}
                aria-label={`Chime ${c.label} before`}
                className="text-xs px-1.5 py-0.5 rounded border border-[#2a2d3a] text-[#9ca3af] hover:text-[#c4af64] hover:border-[#c4af64] transition-colors cursor-pointer"
              >
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      {armed.size > 0 && (
        <div className={`fixed top-4 right-4 z-40 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg shadow-xl px-3 py-2 flex flex-col gap-1 ${
          alarmsOpen ? 'w-[260px]' : ''
        }`}>
          <button
            onClick={() => setAlarmsOpen(o => !o)}
            className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider font-semibold text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[#c4af64]"><BellIcon size={11} /></span>
              Alarms ({armed.size})
            </span>
            <span className={`transition-transform duration-200 leading-none ${alarmsOpen ? 'rotate-0' : '-rotate-90'}`}>▾</span>
          </button>
          {alarmsOpen && [...armed.entries()]
            .map(([key, lead]) => ({ key, lead, inMs: targets.find(t => t.key === key)?.inMs ?? null }))
            // Soonest at the BOTTOM, nearest the collapse toggle.
            .sort((a, b) => (b.inMs ?? Infinity) - (a.inMs ?? Infinity))
            .map(({ key, lead, inMs }) => (
              <div key={key} className="flex items-center gap-1.5 text-xs min-w-0">
                <span className="text-[#c4af64] shrink-0"><BellIcon size={11} /></span>
                <span className="text-[#e2e4ed] truncate">{displayName(key)}</span>
                <span className="text-[#4b5563] shrink-0">{leadLabel(lead)}</span>
                <span className="ml-auto text-[#9ca3af] tabular-nums shrink-0">
                  {inMs === null ? '—' : fmtWait(inMs)}
                </span>
                <button
                  onClick={() => disarmAlert(key)}
                  aria-label={`Disarm alarm for ${displayName(key)}`}
                  className="text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}

      <Modal open={alarm.length > 0} onClose={() => setAlarm([])} title="Alarm">
        <div className="px-5 py-4 flex flex-col gap-3">
          {alarm.map(key => (
            <div key={key} className="text-sm text-[#e2e4ed]">{displayName(key)}</div>
          ))}
          <button
            onClick={() => setAlarm([])}
            className="self-end text-sm px-4 py-1.5 rounded border border-[#c4af64] text-[#c4af64] hover:bg-[#c4af64]/10 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </Modal>
    </AlarmsContext.Provider>
  )
}
