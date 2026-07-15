import { useEffect, useRef, useState } from 'react'
import { useNow } from '../../../../hooks/useNow'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { ensureAudio, hookAudioGesture, playChime, setChimeVolume, type ChimeLevel } from '../../../../lib/chime'
import { BellIcon, RepeatIcon } from '../../../../components/Icons'
import { Modal } from '../../../../components/Modal'
import { InfoTip } from '../../../../components/InfoTip'
import { ELEMENT_COLORS } from '../data/elements'
import { formatNextReset, lastConquestReset } from '../conquest'
import sandoriaIcon from '../data/SandoriaIcon.png'
import bastokIcon from '../data/BastokIcon.png'
import windurstIcon from '../data/WindurstIcon.png'
import { Select, type SelectOption } from '../../../../components/Select'
import {
  vanaTime, moonPhase, nextDeparture, formatEarthWait,
  rseSchedule, rseNow, upcomingMoonEvents, itemActivations, dayNight,
  VANA_WEEKDAYS, WEEKDAY_ELEMENTS, RSE_RACES,
  AIRSHIP_ROUTES, FERRY_ROUTES, MANACLIPPER_ROUTES, BARGE_ROUTES,
  GUILDS, guildStatus,
  type ScheduleRoute,
} from '../data/vanaTime'

const RSE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All races' },
  ...RSE_RACES.map((r, i) => ({ value: String(i), label: r })),
]

const pad = (n: number) => String(n).padStart(2, '0')

const SK = STORAGE_KEYS.ffxiVanaTimers

type ArmedAlert = { key: string; lead: number }

type Prefs = {
  collapsed: Record<string, boolean>
  armed: ArmedAlert[]
  chimeLevel: ChimeLevel
  repeat: boolean
  volume: number
}

const DEFAULT_PREFS: Prefs = {
  collapsed: { barge: true }, armed: [], chimeLevel: 'normal', repeat: false, volume: 50,
}

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(SK) ?? '')
    // Legacy format stored armed as string[] with a global alertLead (minutes).
    const legacyLead = (typeof p?.alertLead === 'number' ? p.alertLead : 2) * 60_000
    const armed: ArmedAlert[] = Array.isArray(p?.armed)
      ? p.armed
          .map((a: unknown) =>
            typeof a === 'string'
              ? { key: a, lead: legacyLead }
              : a && typeof (a as ArmedAlert).key === 'string' && typeof (a as ArmedAlert).lead === 'number'
                ? (a as ArmedAlert)
                : null)
          .filter((a: ArmedAlert | null): a is ArmedAlert => a !== null)
      : []
    return {
      collapsed: p?.collapsed && typeof p.collapsed === 'object' ? p.collapsed : DEFAULT_PREFS.collapsed,
      armed,
      chimeLevel: p?.chimeLevel === 'soft' || p?.chimeLevel === 'loud' ? p.chimeLevel : 'normal',
      repeat: p?.repeat === true,
      volume: typeof p?.volume === 'number' ? Math.max(0, Math.min(100, p.volume)) : DEFAULT_PREFS.volume,
    }
  } catch { /* fall through to default */ }
  return DEFAULT_PREFS
}

const LEAD_CHOICES = [
  { ms: 60_000, label: '1m' },
  { ms: 120_000, label: '2m' },
  { ms: 300_000, label: '5m' },
  { ms: 900_000, label: '15m' },
  { ms: 3_600_000, label: '1h' },
]

const leadLabel = (ms: number) =>
  ms >= 3_600_000 ? `${ms / 3_600_000}h` : `${Math.round(ms / 60_000)}m`

const CHIME_LEVELS: { level: ChimeLevel; color: string; height: number }[] = [
  { level: 'soft', color: '#60a5fa', height: 9 },
  { level: 'normal', color: '#4ade80', height: 14 },
  { level: 'loud', color: '#fb923c', height: 19 },
]

function VolumeBars({ level, onChange }: { level: ChimeLevel; onChange: (l: ChimeLevel) => void }) {
  const idx = CHIME_LEVELS.findIndex(c => c.level === level)
  const color = CHIME_LEVELS[idx]?.color ?? CHIME_LEVELS[1].color
  return (
    <span className="flex items-end gap-[3px]" role="radiogroup" aria-label="Chime volume">
      {CHIME_LEVELS.map((c, i) => (
        <button
          key={c.level}
          onClick={() => onChange(c.level)}
          role="radio"
          aria-checked={c.level === level}
          aria-label={`Chime volume ${c.level}`}
          title={`Chime: ${c.level}`}
          className="cursor-pointer rounded-[1px] w-[6px] transition-colors hover:opacity-80"
          style={{ height: c.height, background: i <= idx ? color : '#2a2d3a' }}
        />
      ))}
    </span>
  )
}

// Every armable event with its time-to-fire; the fire effect and the floating
// alarms widget both read this so they can never drift apart.
function buildAlertTargets(ms: number): { key: string; inMs: number }[] {
  const moonEvents = upcomingMoonEvents(ms)
  const cycle = dayNight(ms)
  return [
    ...[...AIRSHIP_ROUTES, ...FERRY_ROUTES, ...MANACLIPPER_ROUTES, ...BARGE_ROUTES]
      .map(r => ({ key: r.route, inMs: nextDeparture(ms, r).earthMsUntil })),
    ...GUILDS.map(g => ({ key: `${g.name} opens`, inMs: guildStatus(ms, g).nextOpenInMs })),
    { key: 'Full Moon', inMs: moonEvents.nextFullMs - ms },
    { key: 'New Moon', inMs: moonEvents.nextNewMs - ms },
    { key: 'Sunrise', inMs: cycle.sunriseInMs },
    { key: 'Sunset', inMs: cycle.sunsetInMs },
    { key: 'Conquest tally', inMs: lastConquestReset() + 7 * 86_400_000 - ms },
    { key: 'RSE week change', inMs: rseNow(ms).endsEarthMs - ms },
    ...RSE_RACES.map((race, i) => ({
      key: `RSE ${race} week`,
      inMs: (rseSchedule(ms, 2, i).find(w => w.startsEarthMs > ms)?.startsEarthMs ?? ms) - ms,
    })),
    ...itemActivations(ms).map(t => ({ key: t.item.item, inMs: t.nextFutureInMs })),
  ]
}

function fmtLong(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(total / 1440)
  const h = Math.floor((total % 1440) / 60)
  const m = total % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const ENDPOINTS: Record<string, { color: string; icon?: string }> = {
  "San d'Oria": { color: '#c0453a', icon: sandoriaIcon },
  Bastok: { color: '#5b8db8', icon: bastokIcon },
  Windurst: { color: '#8aab7e', icon: windurstIcon },
  Jeuno: { color: '#c4af64' },
  Kazham: { color: '#34d399' },
}

function Endpoint({ name, align }: { name: string; align: 'left' | 'right' }) {
  const meta = ENDPOINTS[name]
  return (
    <span className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {align === 'right' && meta?.icon && (
        <img src={meta.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
      )}
      <span style={{ color: meta?.color ?? '#e2e4ed' }}>{name}</span>
      {align === 'left' && meta?.icon && (
        <img src={meta.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
      )}
    </span>
  )
}

// The big clock ticks on requestAnimationFrame in its own component: a Vana
// second is 40ms real, so the page-wide 250ms tick would jump ~6s at a time.
// Isolating it keeps the rest of the page on the cheap cadence.
function TickingClock() {
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    let id: number
    const loop = () => {
      setNowMs(Date.now())
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
  const t = vanaTime(nowMs)
  return (
    <div className="text-5xl font-semibold text-[#e2e4ed] tabular-nums">
      {pad(t.hour)}:{pad(t.minute)}:{pad(t.second)}
    </div>
  )
}

// Illuminated-fraction moon: outer half-disc on the lit side plus an
// elliptical terminator whose bulge flips between crescent and gibbous.
function MoonIcon({ percent, waxing }: { percent: number; waxing: boolean }) {
  const r = 10
  const f = percent / 100
  const rx = Math.abs(2 * f - 1) * r
  const outerSweep = waxing ? 1 : 0
  const innerSweep = f > 0.5 ? outerSweep : 1 - outerSweep
  const d = `M 12 2 A ${r} ${r} 0 0 ${outerSweep} 12 22 A ${rx} ${r} 0 0 ${innerSweep} 12 2 Z`
  return (
    <svg viewBox="0 0 24 24" className="w-12 h-12 shrink-0" data-testid="moon-svg" aria-hidden>
      <circle cx="12" cy="12" r={r} fill="#0f1117" stroke="#2a2d3a" strokeWidth="1" />
      <path d={d} fill="#e2e4ed" />
    </svg>
  )
}

function AlertBell({ target, armed, onToggle, size = 12 }: {
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

function ScheduleTable({ title, routes, nowMs, open, onToggle, armed, onToggleAlert }: {
  title: string
  routes: ScheduleRoute[]
  nowMs: number
  open: boolean
  onToggle: () => void
  armed: Map<string, number>
  onToggleAlert: (route: string, e: React.MouseEvent) => void
}) {
  return (
    <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 bg-[#1a1d27] text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
      >
        {title}
        <span className={`transition-transform duration-200 leading-none ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
      </button>
      {open && (
      <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-sm table-fixed">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-[#6b7280]">
            <th className="px-4 py-1.5 text-left font-semibold">Route</th>
            <th className="px-4 py-1.5 text-right font-semibold w-28">Departs</th>
            <th className="px-4 py-1.5 text-right font-semibold w-28">In</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {routes.map(r => {
            const dep = nextDeparture(nowMs, r)
            const soon = dep.earthMsUntil < 60_000
            const leaving = dep.earthMsUntil < 180_000
            const [from, to] = r.route.split(' → ')
            return (
              <tr key={r.route} className="border-t border-[#2a2d3a]/60">
                <td className="px-4 py-1.5">
                  {to ? (
                    <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <Endpoint name={from} align="right" />
                      <span className="text-[#6b7280]">→</span>
                      <Endpoint name={to} align="left" />
                    </span>
                  ) : (
                    <span className="block text-center text-[#e2e4ed]">{r.route}</span>
                  )}
                </td>
                <td className={`px-4 py-1.5 text-right tabular-nums ${
                  leaving ? 'animate-pulse text-[#c4af64] font-semibold' : 'text-[#9ca3af]'
                }`}>
                  {dep.vanaClock}
                </td>
                <td className={`px-4 py-1.5 text-right tabular-nums ${soon ? 'text-[#4ade80]' : 'text-[#9ca3af]'}`}>
                  {formatEarthWait(dep.earthMsUntil)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <AlertBell target={r.route} armed={armed.has(r.route)} onToggle={onToggleAlert} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      )}
    </div>
  )
}

const SOURCES: [string, string][] = [
  ['Horizogenes', 'https://horizonffxi.wiki/Horizogenes'],
  ['pyogenes timer', 'https://www.pyogenes.com/ffxi/timer/v2.html'],
  ['go-vanatime', 'https://github.com/pasela/go-vanatime'],
  ['wiki route pages', 'https://horizonffxi.wiki/Airship'],
  ['live weather (wiki)', 'https://horizonffxi.wiki/Special:WeatherForecast'],
]

export function VanaTimers() {
  const now = useNow(250)
  const [rseRace, setRseRace] = useState<SelectOption>(RSE_OPTIONS[0])
  const [prefsInit] = useState(loadPrefs)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(prefsInit.collapsed)
  const [armed, setArmed] = useState<Map<string, number>>(
    () => new Map(prefsInit.armed.map(a => [a.key, a.lead])))
  const [leadPicker, setLeadPicker] = useState<{ target: string; x: number; y: number } | null>(null)
  const [chimeLevel, setChimeLevel] = useState<ChimeLevel>(prefsInit.chimeLevel)
  const [repeatMode, setRepeatMode] = useState<boolean>(prefsInit.repeat)
  const [volume, setVolume] = useState<number>(prefsInit.volume)
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
  }, [prefsInit.volume])

  function persistPrefs(over: Partial<Prefs>) {
    const cur: Prefs = {
      collapsed,
      armed: [...armed.entries()].map(([key, lead]) => ({ key, lead })),
      chimeLevel,
      repeat: repeatMode,
      volume,
    }
    localStorage.setItem(SK, JSON.stringify({ ...cur, ...over }))
  }

  function toggleTable(id: string) {
    setCollapsed(prev => {
      const next = { ...prev, [id]: !prev[id] }
      persistPrefs({ collapsed: next })
      return next
    })
  }

  const armedToArr = (m: Map<string, number>): ArmedAlert[] =>
    [...m.entries()].map(([key, lead]) => ({ key, lead }))

  // Bell click: disarm if armed, otherwise open the lead picker at the cursor.
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
        if (key.startsWith(`${target}:`)) firedRef.current.delete(key)
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

  useEffect(() => {
    if (!leadPicker) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLeadPicker(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leadPicker])

  function changeChime(level: ChimeLevel) {
    setChimeLevel(level)
    persistPrefs({ chimeLevel: level })
  }

  function toggleRepeat() {
    setRepeatMode(prev => {
      persistPrefs({ repeat: !prev })
      return !prev
    })
  }

  function changeVolume(v: number) {
    setVolume(v)
    setChimeVolume(v / 100)
    persistPrefs({ volume: v })
  }

  function dismissAlarm() {
    setAlarm([])
  }

  // Repeat mode: keep ringing while the alarm modal is up.
  useEffect(() => {
    if (alarm.length === 0) return
    const id = setInterval(() => playChime(chimeLevel), 3000)
    return () => clearInterval(id)
  }, [alarm, chimeLevel])
  const ms = now.getTime()
  const v = vanaTime(ms)
  const moon = moonPhase(ms)
  const raceIdx = rseRace.value === 'all' ? undefined : Number(rseRace.value)
  const rseRows = rseSchedule(ms, raceIdx === undefined ? 6 : 4, raceIdx)
  const moonEvents = upcomingMoonEvents(ms)
  const weekday = VANA_WEEKDAYS[v.weekday]
  const dayColor = ELEMENT_COLORS[WEEKDAY_ELEMENTS[v.weekday]]
  const date = `${v.year}-${pad(v.month)}-${pad(v.day)}`

  const items = itemActivations(ms)
  const cycle = dayNight(ms)
  const targets = buildAlertTargets(ms)
  const rseAlertTarget = rseRace.value === 'all'
    ? { key: 'RSE week change' }
    : { key: `RSE ${rseRace.label} week` }

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
      const instance = `${t.key}:${Math.round((ms + t.inMs) / 1000)}`
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

  const fmtDate = (t: number) =>
    new Date(t).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Vana <span className="text-[#c4af64]">Timers</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280]">Next conquest tally</div>
          <div className="text-sm text-[#c4af64] tabular-nums flex items-center justify-end gap-1.5">
            {formatNextReset()}
            <AlertBell target="Conquest tally" armed={armed.has('Conquest tally')} onToggle={toggleAlert} size={11} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[2fr_3fr]">
        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4 text-center">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">Vana'diel time</span>
            <span className="text-xs text-[#6b7280] tabular-nums">{date}</span>
          </div>
          <TickingClock />
          <div className="text-lg font-semibold mt-1.5" style={{ color: dayColor }}>{weekday}</div>
          <div className="text-xs text-[#6b7280] mt-1.5 flex items-center justify-center gap-1.5">
            <span style={{ color: cycle.isNight ? '#60a5fa' : '#fde68a' }}>
              {cycle.isNight ? 'Night' : 'Day'}
            </span>
            <span>
              · {cycle.isNight ? 'sunrise' : 'sunset'} in{' '}
              {formatEarthWait(cycle.isNight ? cycle.sunriseInMs : cycle.sunsetInMs)}
            </span>
            <AlertBell
              target={cycle.isNight ? 'Sunrise' : 'Sunset'}
              armed={armed.has(cycle.isNight ? 'Sunrise' : 'Sunset')}
              onToggle={toggleAlert}
              size={14}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4 flex items-center gap-4">
          <MoonIcon percent={moon.percent} waxing={moon.waxing} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Moon</div>
            <div className="text-lg font-semibold text-[#c4af64]">
              {moon.name} <span className="text-sm font-normal text-[#9ca3af] tabular-nums">{moon.percent}%</span>
            </div>
            <div className="text-xs text-[#9ca3af] mt-1.5 flex items-center gap-1.5">
              <span className="text-[#e2e4ed]">Full Moon</span> {fmtDate(moonEvents.nextFullMs)}
              <span className="text-[#6b7280]">· in {fmtLong(moonEvents.nextFullMs - ms)}</span>
              <AlertBell target="Full Moon" armed={armed.has('Full Moon')} onToggle={toggleAlert} size={11} />
            </div>
            <div className="text-xs text-[#9ca3af] mt-0.5 flex items-center gap-1.5">
              <span className="text-[#e2e4ed]">New Moon</span> {fmtDate(moonEvents.nextNewMs)}
              <span className="text-[#6b7280]">· in {fmtLong(moonEvents.nextNewMs - ms)}</span>
              <AlertBell target="New Moon" armed={armed.has('New Moon')} onToggle={toggleAlert} size={11} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-4 py-2.5 text-sm flex flex-col gap-1 min-w-0 self-start">
          {items.map(({ item, active, nextStartInMs }) => (
            <div key={item.item} className="flex items-center gap-1.5 min-w-0">
              <span className={`font-semibold shrink-0 ${active ? 'text-[#4ade80]' : 'text-[#9ca3af]'}`}>
                {item.item}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#4b5563] shrink-0">{item.kind}</span>
              <InfoTip text={item.note} side="left" className="shrink-0" />
              <span className={`ml-auto shrink-0 tabular-nums ${active ? 'text-[#4ade80]' : 'text-[#6b7280]'}`}>
                {active ? 'active' : `in ${fmtLong(nextStartInMs)}`}
              </span>
              <AlertBell target={item.item} armed={armed.has(item.item)} onToggle={toggleAlert} size={11} />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-4 py-3 flex flex-col justify-center gap-2.5 text-xs text-[#6b7280] self-start">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => playChime(chimeLevel)}
              title="Test the chime"
              aria-label="Test the chime"
              className="cursor-pointer hover:text-[#c4af64] transition-colors"
            >
              <BellIcon size={16} />
            </button>
            <VolumeBars level={chimeLevel} onChange={changeChime} />
            <button
              onClick={toggleRepeat}
              title="Repeat until dismissed"
              aria-label="Repeat alarm until dismissed"
              aria-pressed={repeatMode}
              className={`cursor-pointer transition-colors ${
                repeatMode ? 'text-[#c4af64]' : 'text-[#4b5563] hover:text-[#9ca3af]'
              }`}
            >
              <RepeatIcon size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={e => changeVolume(Number(e.target.value))}
              aria-label="Chime volume"
              title={`Volume ${volume}%`}
              className="forge-slider w-full cursor-pointer"
              style={{ background: `linear-gradient(to right, #c4af64 ${volume}%, #2a2d3a ${volume}%)` }}
            />
            <span className="text-[10px] text-[#9ca3af] tabular-nums w-8 text-right shrink-0">{volume}%</span>
          </div>
        </div>
      </div>

      <ScheduleTable title="Airship schedule" routes={AIRSHIP_ROUTES} nowMs={ms}
        open={!collapsed.airship} onToggle={() => toggleTable('airship')}
        armed={armed} onToggleAlert={toggleAlert} />
      <ScheduleTable title="Selbina · Mhaura ferry" routes={FERRY_ROUTES} nowMs={ms}
        open={!collapsed.ferry} onToggle={() => toggleTable('ferry')}
        armed={armed} onToggleAlert={toggleAlert} />
      <ScheduleTable title="Manaclipper · Bibiki Bay" routes={MANACLIPPER_ROUTES} nowMs={ms}
        open={!collapsed.manaclipper} onToggle={() => toggleTable('manaclipper')}
        armed={armed} onToggleAlert={toggleAlert} />
      <ScheduleTable title="Barge · Carpenters' Landing" routes={BARGE_ROUTES} nowMs={ms}
        open={!collapsed.barge} onToggle={() => toggleTable('barge')}
        armed={armed} onToggleAlert={toggleAlert} />

      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
        <button
          onClick={() => toggleTable('guilds')}
          className="w-full flex items-center justify-between px-4 py-2 bg-[#1a1d27] text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
        >
          Crafting guilds &amp; shops
          <span className={`transition-transform duration-200 leading-none ${!collapsed.guilds ? 'rotate-0' : '-rotate-90'}`}>▾</span>
        </button>
        {!collapsed.guilds && (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm table-fixed">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-4 py-1.5 text-left font-semibold">Guild</th>
              <th className="px-4 py-1.5 text-left font-semibold w-40">Hours</th>
              <th className="px-4 py-1.5 text-right font-semibold w-52">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {GUILDS.map(g => {
              const s = guildStatus(ms, g)
              return (
                <tr key={g.name} className="border-t border-[#2a2d3a]/60">
                  <td className="px-4 py-1.5">
                    <span className="text-[#e2e4ed]">{g.name}</span>
                    <span className="text-xs text-[#6b7280] ml-2 hidden md:inline">{g.cities}</span>
                  </td>
                  <td className="px-4 py-1.5 text-[#9ca3af] tabular-nums whitespace-nowrap">
                    {g.openHour}:00–{g.closeHour}:00
                    <span className="text-[#4b5563] ml-1.5 text-xs">✕ {VANA_WEEKDAYS[g.holiday].replace('day', '')}</span>
                  </td>
                  <td className="px-4 py-1.5 text-right tabular-nums whitespace-nowrap">
                    {s.holiday ? (
                      <span className="text-[#4b5563] italic">holiday today</span>
                    ) : s.open ? (
                      <span className="text-[#4ade80]">open · closes in {formatEarthWait(s.changesInMs)}</span>
                    ) : (
                      <span className="text-[#9ca3af]">opens in {formatEarthWait(s.changesInMs)}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <AlertBell target={`${g.name} opens`} armed={armed.has(`${g.name} opens`)} onToggle={toggleAlert} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        )}
      </div>

      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-0.5 bg-[#1a1d27]">
          <button
            onClick={() => toggleTable('rse')}
            className="flex-1 flex items-center justify-between py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            Race specific equipment
            <span className={`transition-transform duration-200 leading-none ${collapsed.rse ? '-rotate-90' : 'rotate-0'}`}>▾</span>
          </button>
          {!collapsed.rse && (
            <>
              <AlertBell target={rseAlertTarget.key} armed={armed.has(rseAlertTarget.key)} onToggle={toggleAlert} size={11} />
              <Select
                options={RSE_OPTIONS}
                value={rseRace}
                onChange={o => o && setRseRace(o)}
                menuPortalTarget={document.body}
                menuPlacement="top"
                menuPosition="fixed"
                styles={{
                  menu: base => ({ ...base, zIndex: 9999 }),
                  menuPortal: base => ({ ...base, zIndex: 9999 }),
                  menuList: () => ({ maxHeight: 320, overflowY: 'auto' }),
                }}
              />
            </>
          )}
        </div>
        {!collapsed.rse && (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm table-fixed">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-4 py-1.5 text-left font-semibold w-28">Race</th>
              <th className="px-4 py-1.5 text-left font-semibold w-24">Set</th>
              <th className="px-4 py-1.5 text-left font-semibold">Zone</th>
              <th className="px-4 py-1.5 text-right font-semibold w-48">Starts</th>
              <th className="px-4 py-1.5 text-right font-semibold w-24">In</th>
            </tr>
          </thead>
          <tbody>
            {rseRows.map(w => {
              const active = w.startsEarthMs <= ms
              return (
                <tr key={w.startsEarthMs} className={`border-t border-[#2a2d3a]/60 ${active ? 'bg-[#c4af64]/5' : ''}`}>
                  <td className="px-4 py-1.5 text-[#e2e4ed]">{w.race}</td>
                  <td className="px-4 py-1.5 text-[#c4af64]/80">{w.set}</td>
                  <td className="px-4 py-1.5 text-[#9ca3af]">{w.zone}</td>
                  <td className="px-4 py-1.5 text-right text-[#9ca3af] tabular-nums whitespace-nowrap">{fmtDate(w.startsEarthMs)}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums">
                    {active
                      ? <span className="text-[#4ade80]">now</span>
                      : <span className="text-[#9ca3af]">{fmtLong(w.startsEarthMs - ms)}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        )}
      </div>

      {leadPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setLeadPicker(null)} />
          <div
            role="dialog"
            aria-label={`Set alert lead for ${leadPicker.target}`}
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
            .sort((a, b) => (a.inMs ?? Infinity) - (b.inMs ?? Infinity))
            .map(({ key, lead, inMs }) => (
              <div key={key} className="flex items-center gap-1.5 text-xs min-w-0">
                <span className="text-[#c4af64] shrink-0"><BellIcon size={11} /></span>
                <span className="text-[#e2e4ed] truncate">{key}</span>
                <span className="text-[#4b5563] shrink-0">{leadLabel(lead)}</span>
                <span className="ml-auto text-[#9ca3af] tabular-nums shrink-0">
                  {inMs === null ? '—' : inMs < 120_000 ? formatEarthWait(inMs) : fmtLong(inMs)}
                </span>
                <button
                  onClick={() => disarmAlert(key)}
                  aria-label={`Disarm alarm for ${key}`}
                  className="text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}

      <Modal open={alarm.length > 0} onClose={dismissAlarm} title="Departure alert">
        <div className="px-5 py-4 flex flex-col gap-3">
          {alarm.map(route => (
            <div key={route} className="text-sm text-[#e2e4ed]">{route}</div>
          ))}
          <button
            onClick={dismissAlarm}
            className="self-end text-sm px-4 py-1.5 rounded border border-[#c4af64] text-[#c4af64] hover:bg-[#c4af64]/10 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </Modal>

      <div className="text-xs text-[#6b7280] flex flex-wrap gap-x-3 gap-y-1">
        <span>Sources:</span>
        {SOURCES.map(([label, href]) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#c4af64] underline decoration-[#2a2d3a] underline-offset-2"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
