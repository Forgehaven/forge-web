import type { Element } from './elements'

// Vana'diel time math ported from pasela/go-vanatime (MIT), the library line
// credited by the wiki's Horizogenes page. Vana'diel runs 25x Earth speed;
// C.E. 2002-01-01 00:00 JST = Vana'diel year 0886 boundary.
const SCALE = 25
const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000
const MONTH_MS = 30 * DAY_MS
const YEAR_MS = 360 * DAY_MS
const EARTH_BASE_MS = 1_009_810_800_000
const MOON_CYCLE_DAYS = 84

export const VANA_WEEKDAYS = [
  'Firesday', 'Earthsday', 'Watersday', 'Windsday',
  'Iceday', 'Lightningday', 'Lightsday', 'Darksday',
] as const

export const WEEKDAY_ELEMENTS: Element[] = [
  'Fire', 'Earth', 'Water', 'Wind', 'Ice', 'Lightning', 'Light', 'Dark',
]

const MOON_PHASE_NAMES = [
  'New Moon', 'Waxing Crescent', 'Waxing Crescent', 'First Quarter',
  'Waxing Gibbous', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous',
  'Waning Gibbous', 'Last Quarter', 'Waning Crescent', 'Waning Crescent',
]

export interface VanaDate {
  year: number
  month: number
  day: number
  weekday: number
  hour: number
  minute: number
  second: number
}

function vanaMs(earthMs: number): number {
  return (earthMs - EARTH_BASE_MS) * SCALE + 885 * YEAR_MS
}

export function vanaTime(earthMs: number): VanaDate {
  const v = vanaMs(earthMs)
  const yearDay = v % YEAR_MS
  const timeOfDay = v % DAY_MS
  return {
    year: Math.floor(v / YEAR_MS) + 1,
    month: Math.floor(yearDay / MONTH_MS) + 1,
    day: Math.floor((yearDay % MONTH_MS) / DAY_MS) + 1,
    weekday: Math.floor(v / DAY_MS) % 8,
    hour: Math.floor(timeOfDay / HOUR_MS),
    minute: Math.floor((timeOfDay % HOUR_MS) / MINUTE_MS),
    second: Math.floor((timeOfDay % MINUTE_MS) / 1000),
  }
}

export interface MoonState {
  percent: number
  name: string
  waxing: boolean
}

export function moonPhase(earthMs: number): MoonState {
  const days = Math.floor(vanaMs(earthMs) / DAY_MS)
  const cyclePos = (days + 8) % MOON_CYCLE_DAYS
  const raw = Math.round(cyclePos * (200 / MOON_CYCLE_DAYS))
  return {
    percent: raw > 100 ? 200 - raw : raw,
    name: MOON_PHASE_NAMES[Math.floor((days + 12) / 7) % 12],
    waxing: cyclePos < MOON_CYCLE_DAYS / 2,
  }
}

// Departure schedules in Vana'diel minutes-of-day. Airships run every 6 Vana
// hours, the Selbina-Mhaura ferry every 8; minute-exact times from the
// horizonffxi.wiki route pages (Bastok-Jeuno_Airship etc).
export interface ScheduleRoute {
  route: string
  firstMin: number
  intervalMin: number
}

const AIRSHIP_INTERVAL = 360
const FERRY_INTERVAL = 480

export const AIRSHIP_ROUTES: ScheduleRoute[] = [
  { route: "Jeuno → San d'Oria", firstMin: 73, intervalMin: AIRSHIP_INTERVAL },
  { route: 'Jeuno → Bastok', firstMin: 254, intervalMin: AIRSHIP_INTERVAL },
  { route: 'Jeuno → Windurst', firstMin: 163, intervalMin: AIRSHIP_INTERVAL },
  { route: 'Jeuno → Kazham', firstMin: 337, intervalMin: AIRSHIP_INTERVAL },
  { route: "San d'Oria → Jeuno", firstMin: 252, intervalMin: AIRSHIP_INTERVAL },
  { route: 'Bastok → Jeuno', firstMin: 72, intervalMin: AIRSHIP_INTERVAL },
  { route: 'Windurst → Jeuno', firstMin: 343, intervalMin: AIRSHIP_INTERVAL },
  { route: 'Kazham → Jeuno', firstMin: 162, intervalMin: AIRSHIP_INTERVAL },
]

export const FERRY_ROUTES: ScheduleRoute[] = [
  { route: 'Selbina → Mhaura', firstMin: 0, intervalMin: FERRY_INTERVAL },
  { route: 'Mhaura → Selbina', firstMin: 0, intervalMin: FERRY_INTERVAL },
]

export interface Departure {
  route: string
  vanaClock: string
  earthMsUntil: number
}

export function nextDeparture(earthMs: number, r: ScheduleRoute): Departure {
  const v = vanaMs(earthMs)
  const nowMin = (v % DAY_MS) / MINUTE_MS
  const wait = ((r.firstMin - nowMin) % r.intervalMin + r.intervalMin) % r.intervalMin
  const depMin = (nowMin + wait) % 1440
  const hh = String(Math.floor(depMin / 60)).padStart(2, '0')
  const mm = String(Math.floor(depMin % 60)).padStart(2, '0')
  return {
    route: r.route,
    vanaClock: `${hh}:${mm}`,
    earthMsUntil: Math.ceil((wait * MINUTE_MS) / SCALE),
  }
}

export function formatEarthWait(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
