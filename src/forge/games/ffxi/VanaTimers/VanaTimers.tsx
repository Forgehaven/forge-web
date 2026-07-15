import { useEffect, useState } from 'react'
import { useNow } from '../../../../hooks/useNow'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { playChime, type ChimeLevel } from '../../../../lib/chime'
import { BellIcon, RepeatIcon } from '../../../../components/Icons'
import { InfoTip } from '../../../../components/InfoTip'
import { AlertBell } from '../../../../components/alarms/AlarmProvider'
import { useAlarmSource } from '../../../../components/alarms/alarmContext'
import { ELEMENT_COLORS, type Element } from '../data/elements'
import fireIcon from '../data/elements/FireIcon.png'
import iceIcon from '../data/elements/IceIcon.png'
import windIcon from '../data/elements/WindIcon.png'
import earthIcon from '../data/elements/EarthIcon.png'
import lightningIcon from '../data/elements/LightningIcon.png'
import waterIcon from '../data/elements/WaterIcon.png'
import lightIcon from '../data/elements/LightIcon.png'
import darkIcon from '../data/elements/DarkIcon.png'
import { formatNextReset } from '../conquest'
import sandoriaIcon from '../data/SandoriaIcon.png'
import bastokIcon from '../data/BastokIcon.png'
import windurstIcon from '../data/WindurstIcon.png'
import { Select, type SelectOption } from '../../../../components/Select'
import {
  vanaTime, moonPhase, nextDeparture, formatEarthWait,
  rseSchedule, upcomingMoonEvents, itemActivations, dayNight,
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

// In-game element icons (horizonffxi.wiki), keyed to the weekday's element.
const ELEMENT_ICONS: Record<Element, string> = {
  Fire: fireIcon, Ice: iceIcon, Wind: windIcon, Earth: earthIcon,
  Lightning: lightningIcon, Water: waterIcon, Light: lightIcon, Dark: darkIcon,
}

const SK = STORAGE_KEYS.ffxiVanaTimers

function loadCollapsed(): Record<string, boolean> {
  try {
    const p = JSON.parse(localStorage.getItem(SK) ?? '')
    if (p?.collapsed && typeof p.collapsed === 'object') return p.collapsed
  } catch { /* fall through to default */ }
  return { barge: true }
}

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
  const str = `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`
  return (
    <div className="text-5xl font-semibold text-[#e2e4ed] flex justify-center" data-testid="vana-clock">
      {str.split('').map((c, i) => (
        <span key={i} className={`text-center ${c === ':' ? 'w-[0.28em]' : 'w-[0.54em]'}`}>{c}</span>
      ))}
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

function ScheduleTable({ title, routes, nowMs, open, onToggle, isArmed, onToggleAlert }: {
  title: string
  routes: ScheduleRoute[]
  nowMs: number
  open: boolean
  onToggle: () => void
  isArmed: (route: string) => boolean
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
                  <AlertBell target={r.route} armed={isArmed(r.route)} onToggle={onToggleAlert} />
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
  const alarms = useAlarmSource('ffxi')
  const [rseRace, setRseRace] = useState<SelectOption>(RSE_OPTIONS[0])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed)

  function toggleTable(id: string) {
    setCollapsed(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(SK, JSON.stringify({ collapsed: next }))
      return next
    })
  }

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
  const rseAlertName = rseRace.value === 'all' ? 'RSE week change' : `RSE ${rseRace.label} week`

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
            <AlertBell target="Conquest tally" armed={alarms.has('Conquest tally')} onToggle={alarms.toggle} size={14} />
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
          <div className="text-lg font-semibold mt-1.5 flex items-center justify-center gap-2" style={{ color: dayColor }}>
            <img src={ELEMENT_ICONS[WEEKDAY_ELEMENTS[v.weekday]]} alt="" className="w-4 h-4 object-contain" />
            {weekday}
            <img src={ELEMENT_ICONS[WEEKDAY_ELEMENTS[v.weekday]]} alt="" className="w-4 h-4 object-contain" />
          </div>
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
              armed={alarms.has(cycle.isNight ? 'Sunrise' : 'Sunset')}
              onToggle={alarms.toggle}
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
              <AlertBell target="Full Moon" armed={alarms.has('Full Moon')} onToggle={alarms.toggle} size={11} />
            </div>
            <div className="text-xs text-[#9ca3af] mt-0.5 flex items-center gap-1.5">
              <span className="text-[#e2e4ed]">New Moon</span> {fmtDate(moonEvents.nextNewMs)}
              <span className="text-[#6b7280]">· in {fmtLong(moonEvents.nextNewMs - ms)}</span>
              <AlertBell target="New Moon" armed={alarms.has('New Moon')} onToggle={alarms.toggle} size={11} />
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
              <AlertBell target={item.item} armed={alarms.has(item.item)} onToggle={alarms.toggle} size={11} />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-4 py-3 flex flex-col justify-center gap-2.5 text-xs text-[#6b7280] self-start">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => playChime(alarms.chimeLevel)}
              title="Test the chime"
              aria-label="Test the chime"
              className="cursor-pointer hover:text-[#c4af64] transition-colors"
            >
              <BellIcon size={16} />
            </button>
            <VolumeBars level={alarms.chimeLevel} onChange={alarms.setChime} />
            <button
              onClick={alarms.toggleRepeat}
              title="Repeat until dismissed"
              aria-label="Repeat alarm until dismissed"
              aria-pressed={alarms.repeatMode}
              className={`cursor-pointer transition-colors ${
                alarms.repeatMode ? 'text-[#c4af64]' : 'text-[#4b5563] hover:text-[#9ca3af]'
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
              value={alarms.volume}
              onChange={e => alarms.setVolume(Number(e.target.value))}
              aria-label="Chime volume"
              title={`Volume ${alarms.volume}%`}
              className="forge-slider w-full cursor-pointer"
              style={{ background: `linear-gradient(to right, #c4af64 ${alarms.volume}%, #2a2d3a ${alarms.volume}%)` }}
            />
            <span className="text-[10px] text-[#9ca3af] tabular-nums w-8 text-right shrink-0">{alarms.volume}%</span>
          </div>
        </div>
      </div>

      <ScheduleTable title="Airship schedule" routes={AIRSHIP_ROUTES} nowMs={ms}
        open={!collapsed.airship} onToggle={() => toggleTable('airship')}
        isArmed={alarms.has} onToggleAlert={alarms.toggle} />
      <ScheduleTable title="Selbina · Mhaura ferry" routes={FERRY_ROUTES} nowMs={ms}
        open={!collapsed.ferry} onToggle={() => toggleTable('ferry')}
        isArmed={alarms.has} onToggleAlert={alarms.toggle} />
      <ScheduleTable title="Manaclipper · Bibiki Bay" routes={MANACLIPPER_ROUTES} nowMs={ms}
        open={!collapsed.manaclipper} onToggle={() => toggleTable('manaclipper')}
        isArmed={alarms.has} onToggleAlert={alarms.toggle} />
      <ScheduleTable title="Barge · Carpenters' Landing" routes={BARGE_ROUTES} nowMs={ms}
        open={!collapsed.barge} onToggle={() => toggleTable('barge')}
        isArmed={alarms.has} onToggleAlert={alarms.toggle} />

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
                    <AlertBell target={`${g.name} opens`} armed={alarms.has(`${g.name} opens`)} onToggle={alarms.toggle} />
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
              <AlertBell target={rseAlertName} armed={alarms.has(rseAlertName)} onToggle={alarms.toggle} size={14} />
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
