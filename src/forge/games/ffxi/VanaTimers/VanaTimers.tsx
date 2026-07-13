import { useNow } from '../../../../hooks/useNow'
import { ProgressBar } from '../../../../components/UI'
import { ELEMENT_COLORS } from '../data/elements'
import { formatNextReset } from '../conquest'
import {
  vanaTime, moonPhase, nextDeparture, formatEarthWait,
  VANA_WEEKDAYS, WEEKDAY_ELEMENTS, AIRSHIP_ROUTES, FERRY_ROUTES,
  type ScheduleRoute,
} from '../data/vanaTime'

const pad = (n: number) => String(n).padStart(2, '0')

function ScheduleTable({ title, routes, nowMs }: {
  title: string
  routes: ScheduleRoute[]
  nowMs: number
}) {
  return (
    <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
      <div className="px-4 py-2 bg-[#1a1d27] text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af]">
        {title}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-[#6b7280]">
            <th className="px-4 py-1.5 text-left font-semibold">Route</th>
            <th className="px-4 py-1.5 text-right font-semibold">Departs</th>
            <th className="px-4 py-1.5 text-right font-semibold">In</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(r => {
            const dep = nextDeparture(nowMs, r)
            const soon = dep.earthMsUntil < 60_000
            return (
              <tr key={r.route} className="border-t border-[#2a2d3a]/60">
                <td className="px-4 py-1.5 text-[#e2e4ed]">{r.route}</td>
                <td className="px-4 py-1.5 text-right text-[#9ca3af] tabular-nums">{dep.vanaClock}</td>
                <td className={`px-4 py-1.5 text-right tabular-nums ${soon ? 'text-[#4ade80]' : 'text-[#9ca3af]'}`}>
                  {formatEarthWait(dep.earthMsUntil)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function VanaTimers() {
  const now = useNow(250)
  const ms = now.getTime()
  const v = vanaTime(ms)
  const moon = moonPhase(ms)
  const weekday = VANA_WEEKDAYS[v.weekday]
  const dayColor = ELEMENT_COLORS[WEEKDAY_ELEMENTS[v.weekday]]
  const clock = `${pad(v.hour)}:${pad(v.minute)}:${pad(v.second)}`
  const date = `${v.year}-${pad(v.month)}-${pad(v.day)}`

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

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Vana'diel time</div>
          <div className="text-3xl font-semibold text-[#e2e4ed] tabular-nums">{clock}</div>
          <div className="text-sm text-[#9ca3af] mt-1 tabular-nums">
            {date}
            <span className="ml-2 font-semibold" style={{ color: dayColor }}>{weekday}</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4 flex flex-col justify-center">
          <ProgressBar
            label={`${moon.name} · ${moon.waxing ? 'waxing' : 'waning'}`}
            pct={moon.percent / 100}
          />
        </div>
      </div>

      <ScheduleTable title="Airship schedule" routes={AIRSHIP_ROUTES} nowMs={ms} />
      <ScheduleTable title="Selbina · Mhaura ferry" routes={FERRY_ROUTES} nowMs={ms} />
    </div>
  )
}
