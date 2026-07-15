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

// Departure schedules in Vana'diel minutes-of-day; minute-exact times from
// the horizonffxi.wiki route pages (Bastok-Jeuno_Airship, Manaclipper,
// Phanauet_Channel etc). Airships repeat every 6 Vana hours, the ferry every
// 8; Manaclipper and barge runs are irregular, hence explicit lists.
export interface ScheduleRoute {
  route: string
  departuresMin: number[]
}

const every = (firstMin: number, intervalMin: number): number[] =>
  Array.from({ length: Math.floor(1440 / intervalMin) }, (_, i) => firstMin + i * intervalMin)

export const AIRSHIP_ROUTES: ScheduleRoute[] = [
  { route: "Jeuno → San d'Oria", departuresMin: every(73, 360) },
  { route: 'Jeuno → Bastok', departuresMin: every(254, 360) },
  { route: 'Jeuno → Windurst', departuresMin: every(163, 360) },
  { route: 'Jeuno → Kazham', departuresMin: every(337, 360) },
  { route: "San d'Oria → Jeuno", departuresMin: every(252, 360) },
  { route: 'Bastok → Jeuno', departuresMin: every(72, 360) },
  { route: 'Windurst → Jeuno', departuresMin: every(343, 360) },
  { route: 'Kazham → Jeuno', departuresMin: every(162, 360) },
]

export const FERRY_ROUTES: ScheduleRoute[] = [
  { route: 'Selbina → Mhaura', departuresMin: every(0, 480) },
  { route: 'Mhaura → Selbina', departuresMin: every(0, 480) },
]

export const MANACLIPPER_ROUTES: ScheduleRoute[] = [
  { route: 'Bibiki Bay → Purgonorgo Isle', departuresMin: [330, 1050] },
  { route: 'Purgonorgo Isle → Bibiki Bay', departuresMin: [555, 1275] },
  { route: 'Maliyakaleya Reef tour', departuresMin: [770] },
  { route: 'Dhalmel Rock tour', departuresMin: [50] },
]

export const BARGE_ROUTES: ScheduleRoute[] = [
  { route: 'South → Central Landing', departuresMin: [50] },
  { route: 'South → North Landing', departuresMin: [610] },
  { route: 'Central → South Landing', departuresMin: [310, 1190] },
  { route: 'North → Central Landing', departuresMin: [1045] },
]

export interface Departure {
  route: string
  vanaClock: string
  earthMsUntil: number
}

export function nextDeparture(earthMs: number, r: ScheduleRoute): Departure {
  const v = vanaMs(earthMs)
  const nowMin = (v % DAY_MS) / MINUTE_MS
  let wait = Infinity
  let depMin = r.departuresMin[0]
  for (const dep of r.departuresMin) {
    const w = ((dep - nowMin) % 1440 + 1440) % 1440
    if (w < wait) {
      wait = w
      depMin = dep
    }
  }
  const hh = String(Math.floor(depMin / 60)).padStart(2, '0')
  const mm = String(depMin % 60).padStart(2, '0')
  return {
    route: r.route,
    vanaClock: `${hh}:${mm}`,
    earthMsUntil: Math.ceil((wait * MINUTE_MS) / SCALE),
  }
}

// RSE rotation ported from the pyogenes timer (credit: pyogenes.com); zone
// names per horizonffxi.wiki. One RSE week = 8 game days.
const RSE_ANCHOR_MS = Date.UTC(2004, 0, 28, 9, 14, 24)
const GAME_DAY_EARTH_MS = DAY_MS / SCALE
const RSE_WEEK_EARTH_MS = 8 * GAME_DAY_EARTH_MS

export const RSE_RACES = [
  'Hume ♂', 'Hume ♀', 'Elvaan ♂', 'Elvaan ♀',
  'Tarutaru ♂', 'Tarutaru ♀', 'Mithra', 'Galka',
] as const

export const RSE_ZONES = ['Gusgen Mines', 'Maze of Shakhrami', "Ordelle's Caves"] as const

// Lv27-33 armor set per race, aligned with RSE_RACES (wiki RSE page).
export const RSE_SETS = [
  'Custom', 'Custom', 'Magna', 'Magna', 'Wonder', 'Wonder', 'Savage', "Elder's",
] as const

export interface RseWeek {
  race: string
  set: string
  zone: string
  startsEarthMs: number
  endsEarthMs: number
}

function rseWeek(week: number): RseWeek {
  const raceIdx = ((week % 8) + 8) % 8
  return {
    race: RSE_RACES[raceIdx],
    set: RSE_SETS[raceIdx],
    zone: RSE_ZONES[((week % 3) + 3) % 3],
    startsEarthMs: RSE_ANCHOR_MS + week * RSE_WEEK_EARTH_MS,
    endsEarthMs: RSE_ANCHOR_MS + (week + 1) * RSE_WEEK_EARTH_MS,
  }
}

export function rseNow(earthMs: number): RseWeek {
  return rseWeek(Math.floor((earthMs - RSE_ANCHOR_MS) / RSE_WEEK_EARTH_MS))
}

export function rseSchedule(earthMs: number, n: number, raceIdx?: number): RseWeek[] {
  const current = Math.floor((earthMs - RSE_ANCHOR_MS) / RSE_WEEK_EARTH_MS)
  const weeks: RseWeek[] = []
  for (let w = current; weeks.length < n; w++) {
    if (raceIdx === undefined || ((w % 8) + 8) % 8 === raceIdx) weeks.push(rseWeek(w))
  }
  return weeks
}

function earthMsAtVanaDay(day: number): number {
  return EARTH_BASE_MS + (day * DAY_MS - 885 * YEAR_MS) / SCALE
}

export interface MoonEvents {
  nextFullMs: number
  nextNewMs: number
}

export function upcomingMoonEvents(earthMs: number): MoonEvents {
  const days = Math.floor(vanaMs(earthMs) / DAY_MS)
  const pos = (days + 8) % MOON_CYCLE_DAYS
  const toFull = (42 - pos + MOON_CYCLE_DAYS) % MOON_CYCLE_DAYS || MOON_CYCLE_DAYS
  const toNew = (0 - pos + MOON_CYCLE_DAYS) % MOON_CYCLE_DAYS || MOON_CYCLE_DAYS
  return {
    nextFullMs: earthMsAtVanaDay(days + toFull),
    nextNewMs: earthMsAtVanaDay(days + toNew),
  }
}

// Crafting guild hours + weekly holidays (horizonffxi.wiki guild pages;
// Alchemists' holiday cross-checked against era sources - the wiki page has a
// copy-paste typo). Hours are Vana'diel; holiday = weekday index the guild is
// closed all day.
export interface Guild {
  name: string
  cities: string
  openHour: number
  closeHour: number
  holiday: number
}

export const GUILDS: Guild[] = [
  { name: 'Alchemists', cities: 'Bastok', openHour: 8, closeHour: 23, holiday: 6 },
  { name: 'Blacksmiths', cities: "Bastok · San d'Oria · Mhaura", openHour: 8, closeHour: 23, holiday: 2 },
  { name: 'Boneworkers', cities: 'Windurst', openHour: 8, closeHour: 23, holiday: 3 },
  { name: 'Carpenters', cities: "San d'Oria", openHour: 6, closeHour: 21, holiday: 0 },
  { name: 'Weavers', cities: 'Windurst · Selbina', openHour: 6, closeHour: 21, holiday: 0 },
  { name: 'Culinarians', cities: 'Windurst', openHour: 5, closeHour: 20, holiday: 7 },
  { name: 'Fishermen', cities: 'Windurst · Selbina', openHour: 3, closeHour: 18, holiday: 5 },
  { name: 'Goldsmiths', cities: 'Bastok · Mhaura', openHour: 8, closeHour: 23, holiday: 4 },
  { name: 'Tanners', cities: "San d'Oria", openHour: 3, closeHour: 18, holiday: 4 },
]

export interface GuildStatus {
  open: boolean
  holiday: boolean
  changesInMs: number
  nextOpenInMs: number
}

export function guildStatus(earthMs: number, g: Guild): GuildStatus {
  const v = vanaMs(earthMs)
  const dayIdx = Math.floor(v / DAY_MS)
  const weekday = dayIdx % 8
  const holiday = weekday === g.holiday
  const hour = (v % DAY_MS) / HOUR_MS
  const open = !holiday && hour >= g.openHour && hour < g.closeHour

  let nextOpenInMs = 0
  for (let d = 0; d <= 8; d++) {
    if ((dayIdx + d) % 8 === g.holiday) continue
    const openV = (dayIdx + d) * DAY_MS + g.openHour * HOUR_MS
    if (openV > v) {
      nextOpenInMs = Math.ceil((openV - v) / SCALE)
      break
    }
  }

  const changesInMs = open
    ? Math.ceil((dayIdx * DAY_MS + g.closeHour * HOUR_MS - v) / SCALE)
    : nextOpenInMs
  return { open, holiday, changesInMs, nextOpenInMs }
}

// Day/night cycle: day is 06:00-18:00 Vana time.
export interface DayNight {
  isNight: boolean
  sunriseInMs: number
  sunsetInMs: number
}

export function dayNight(earthMs: number): DayNight {
  const v = vanaMs(earthMs)
  const dayStart = Math.floor(v / DAY_MS) * DAY_MS
  const hour = (v % DAY_MS) / HOUR_MS
  const sunriseV = hour < 6 ? dayStart + 6 * HOUR_MS : dayStart + 30 * HOUR_MS
  const sunsetV = hour < 18 ? dayStart + 18 * HOUR_MS : dayStart + 42 * HOUR_MS
  return {
    isNight: hour < 6 || hour >= 18,
    sunriseInMs: Math.ceil((sunriseV - v) / SCALE),
    sunsetInMs: Math.ceil((sunsetV - v) / SCALE),
  }
}

// Items whose effect is gated by the Vana'diel weekday or moon phase
// (Horizon Era+ rules / era latents).
export interface TimedItem {
  item: string
  note: string
  kind: 'consumable' | 'equipment'
  trigger: { type: 'weekday'; weekday: number } | { type: 'moonPhase'; name: string }
}

export const TIMED_ITEMS: TimedItem[] = [
  {
    item: 'Movalpolos Water', kind: 'consumable',
    note: 'Refresh procs while MP% is below the current moon %',
    trigger: { type: 'weekday', weekday: 6 },
  },
  {
    item: 'Treat Staff', kind: 'equipment',
    note: 'Warp latent active at Night',
    trigger: { type: 'weekday', weekday: 7 },
  },
  {
    item: 'Amood', kind: 'equipment',
    note: 'Club (DMG 58 / 59 on +1): the "occasionally attacks twice" latent is only active during the First Quarter Moon, waxing 40-55%',
    trigger: { type: 'moonPhase', name: 'First Quarter' },
  },
]

export interface ItemActivation {
  item: TimedItem
  active: boolean
  nextStartInMs: number
  nextFutureInMs: number
}

function phaseNameAt(day: number): string {
  return MOON_PHASE_NAMES[Math.floor((day + 12) / 7) % 12]
}

export function itemActivations(earthMs: number): ItemActivation[] {
  const v = vanaMs(earthMs)
  const day = Math.floor(v / DAY_MS)
  const weekday = day % 8

  const rows = TIMED_ITEMS.map(item => {
    let active: boolean
    let nextStartDay: number
    let nextFutureDay: number
    if (item.trigger.type === 'weekday') {
      const delta = (item.trigger.weekday - weekday + 8) % 8
      active = delta === 0
      nextStartDay = day + delta
      nextFutureDay = day + (delta === 0 ? 8 : delta)
    } else {
      const name = item.trigger.name
      active = phaseNameAt(day) === name
      let start = 0
      for (let d = 1; d <= MOON_CYCLE_DAYS + 7; d++) {
        if (phaseNameAt(day + d) === name && phaseNameAt(day + d - 1) !== name) {
          start = day + d
          break
        }
      }
      nextStartDay = active ? day : start
      nextFutureDay = start
    }
    return {
      item,
      active,
      nextStartInMs: active ? 0 : Math.max(0, earthMsAtVanaDay(nextStartDay) - earthMs),
      nextFutureInMs: Math.max(0, earthMsAtVanaDay(nextFutureDay) - earthMs),
    }
  })

  return rows.sort((a, b) =>
    Number(b.active) - Number(a.active) || a.nextStartInMs - b.nextStartInMs)
}

export function formatEarthWait(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
