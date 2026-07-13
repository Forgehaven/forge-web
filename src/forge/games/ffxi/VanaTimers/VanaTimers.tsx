import { useState } from 'react'
import { useNow } from '../../../../hooks/useNow'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { ELEMENT_COLORS } from '../data/elements'
import { formatNextReset } from '../conquest'
import sandoriaIcon from '../data/SandoriaIcon.png'
import bastokIcon from '../data/BastokIcon.png'
import windurstIcon from '../data/WindurstIcon.png'
import { Select, type SelectOption } from '../../../../components/Select'
import {
  vanaTime, moonPhase, nextDeparture, formatEarthWait,
  rseSchedule, upcomingMoonEvents, itemsForDay, DAY_ITEMS,
  VANA_WEEKDAYS, WEEKDAY_ELEMENTS, RSE_RACES,
  AIRSHIP_ROUTES, FERRY_ROUTES, MANACLIPPER_ROUTES, BARGE_ROUTES,
  type ScheduleRoute,
} from '../data/vanaTime'

const RSE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All races' },
  ...RSE_RACES.map((r, i) => ({ value: String(i), label: r })),
]

const pad = (n: number) => String(n).padStart(2, '0')

const SK = STORAGE_KEYS.ffxiVanaTimers

function loadCollapsed(): Record<string, boolean> {
  try {
    const parsed = JSON.parse(localStorage.getItem(SK) ?? '')
    if (parsed && typeof parsed.collapsed === 'object') return parsed.collapsed
  } catch { /* fall through to default */ }
  return { barge: true }
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

function ScheduleTable({ title, routes, nowMs, open, onToggle }: {
  title: string
  routes: ScheduleRoute[]
  nowMs: number
  open: boolean
  onToggle: () => void
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
      <table className="w-full min-w-[420px] text-sm table-fixed">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-[#6b7280]">
            <th className="px-4 py-1.5 text-left font-semibold">Route</th>
            <th className="px-4 py-1.5 text-right font-semibold w-28">Departs</th>
            <th className="px-4 py-1.5 text-right font-semibold w-28">In</th>
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
  const clock = `${pad(v.hour)}:${pad(v.minute)}:${pad(v.second)}`
  const date = `${v.year}-${pad(v.month)}-${pad(v.day)}`

  const todayItems = itemsForDay(v.weekday)
  const nextItem = DAY_ITEMS.map(item => {
    const deltaDays = (item.weekday - v.weekday + 8) % 8 || 8
    const minsLeftToday = 1440 - (v.hour * 60 + v.minute)
    return { item, earthMs: (((deltaDays - 1) * 1440 + minsLeftToday) * 60_000) / 25 }
  }).sort((a, b) => a.earthMs - b.earthMs)[0]

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
          <div className="text-sm text-[#c4af64] tabular-nums">{formatNextReset()}</div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[2fr_3fr]">
        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Vana'diel time</div>
          <div className="text-5xl font-semibold text-[#e2e4ed] tabular-nums">{clock}</div>
          <div className="text-sm text-[#9ca3af] mt-1.5 tabular-nums">
            {date}
            <span className="ml-2 text-lg font-semibold" style={{ color: dayColor }}>{weekday}</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4 flex items-center gap-4">
          <MoonIcon percent={moon.percent} waxing={moon.waxing} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Moon</div>
            <div className="text-lg font-semibold text-[#c4af64]">
              {moon.name} <span className="text-sm font-normal text-[#9ca3af] tabular-nums">{moon.percent}%</span>
            </div>
            <div className="text-xs text-[#9ca3af] mt-1.5">
              <span className="text-[#e2e4ed]">Full Moon</span> {fmtDate(moonEvents.nextFullMs)}
              <span className="text-[#6b7280]"> · in {fmtLong(moonEvents.nextFullMs - ms)}</span>
            </div>
            <div className="text-xs text-[#9ca3af] mt-0.5">
              <span className="text-[#e2e4ed]">New Moon</span> {fmtDate(moonEvents.nextNewMs)}
              <span className="text-[#6b7280]"> · in {fmtLong(moonEvents.nextNewMs - ms)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-4 py-2.5 text-sm">
        {todayItems.length > 0 ? (
          todayItems.map(i => (
            <div key={i.item}>
              <span className="text-[#4ade80] font-semibold">{i.item}</span>
              <span className="text-[#9ca3af]"> usable today · {i.note}</span>
            </div>
          ))
        ) : (
          <div className="text-[#6b7280]">
            {nextItem.item.item} · {VANA_WEEKDAYS[nextItem.item.weekday]} in {fmtLong(nextItem.earthMs)}
          </div>
        )}
      </div>

      <ScheduleTable title="Airship schedule" routes={AIRSHIP_ROUTES} nowMs={ms}
        open={!collapsed.airship} onToggle={() => toggleTable('airship')} />
      <ScheduleTable title="Selbina · Mhaura ferry" routes={FERRY_ROUTES} nowMs={ms}
        open={!collapsed.ferry} onToggle={() => toggleTable('ferry')} />
      <ScheduleTable title="Manaclipper · Bibiki Bay" routes={MANACLIPPER_ROUTES} nowMs={ms}
        open={!collapsed.manaclipper} onToggle={() => toggleTable('manaclipper')} />
      <ScheduleTable title="Barge · Carpenters' Landing" routes={BARGE_ROUTES} nowMs={ms}
        open={!collapsed.barge} onToggle={() => toggleTable('barge')} />

      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-1.5 bg-[#1a1d27]">
          <button
            onClick={() => toggleTable('rse')}
            className="flex-1 flex items-center justify-between py-0.5 text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            Race specific equipment
            <span className={`transition-transform duration-200 leading-none ${collapsed.rse ? '-rotate-90' : 'rotate-0'}`}>▾</span>
          </button>
          {!collapsed.rse && (
            <Select options={RSE_OPTIONS} value={rseRace} onChange={o => o && setRseRace(o)} />
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
