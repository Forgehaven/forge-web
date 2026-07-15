import { describe, it, expect } from 'vitest'
import {
  vanaTime, moonPhase, nextDeparture, formatEarthWait,
  rseNow, rseSchedule, upcomingMoonEvents, itemActivations, dayNight, guildStatus, GUILDS,
  VANA_WEEKDAYS, AIRSHIP_ROUTES, FERRY_ROUTES, MANACLIPPER_ROUTES, BARGE_ROUTES,
} from './vanaTime'

// Golden vectors from the go-vanatime README (the reference implementation
// credited by Horizogenes), re-verified by hand.
const V1 = Date.UTC(2018, 3, 29, 12, 7, 12) // 2018-04-29 21:07:12 JST
const V2 = V1 + (3 * 86_400_000) / 25       // +3 Vana days
const V3 = Date.UTC(2018, 10, 5, 12, 58, 25, 119) // 2018-11-05 21:58:25.119 JST

describe('vanaTime', () => {
  it('converts V1: 1300-02-03 00:00:00 Firesday', () => {
    const v = vanaTime(V1)
    expect(v).toEqual({
      year: 1300, month: 2, day: 3, weekday: 0, hour: 0, minute: 0, second: 0,
    })
    expect(VANA_WEEKDAYS[v.weekday]).toBe('Firesday')
  })

  it('converts V2: 1300-02-06 00:00:00 Windsday', () => {
    const v = vanaTime(V2)
    expect([v.year, v.month, v.day, v.weekday]).toEqual([1300, 2, 6, 3])
  })

  it('converts V3: 1313-04-13 21:20:27 Lightsday', () => {
    const v = vanaTime(V3)
    expect(v).toEqual({
      year: 1313, month: 4, day: 13, weekday: 6, hour: 21, minute: 20, second: 27,
    })
  })

  it('weekday wraps Darksday back to Firesday', () => {
    const v1 = vanaTime(V1)
    expect(v1.weekday).toBe(0)
    const oneVanaDayEarlier = V1 - 86_400_000 / 25
    expect(vanaTime(oneVanaDayEarlier).weekday).toBe(7)
  })
})

describe('moonPhase', () => {
  it('V1 is Waning Gibbous 76%', () => {
    expect(moonPhase(V1)).toEqual({ percent: 76, name: 'Waning Gibbous', waxing: false })
  })

  it('V2 is Waning Gibbous 69%', () => {
    expect(moonPhase(V2)).toEqual({ percent: 69, name: 'Waning Gibbous', waxing: false })
  })

  it('V3 is Waxing Crescent 33%', () => {
    expect(moonPhase(V3)).toEqual({ percent: 33, name: 'Waxing Crescent', waxing: true })
  })

  it('full moon peaks at 100% mid-cycle', () => {
    // V1 cycle position is 52; full moon peak is at position 42, 10 Vana days earlier.
    const peak = V1 - (10 * 86_400_000) / 25
    expect(moonPhase(peak)).toEqual({ percent: 100, name: 'Full Moon', waxing: false })
  })
})

describe('nextDeparture', () => {
  // V1 is exactly Vana 00:00, so waits are the schedules' first departures
  // (times from the horizonffxi.wiki route pages).
  it('computes airship waits from Vana midnight', () => {
    const sandy = nextDeparture(V1, AIRSHIP_ROUTES[0])
    expect(sandy.vanaClock).toBe('01:13')
    expect(sandy.earthMsUntil).toBe((73 * 60_000) / 25)
    const bastok = nextDeparture(V1, AIRSHIP_ROUTES[1])
    expect(bastok.vanaClock).toBe('04:14')
    const windy = nextDeparture(V1, AIRSHIP_ROUTES[6])
    expect(windy.vanaClock).toBe('05:43')
  })

  it('ferry departing exactly now shows zero wait', () => {
    const ferry = nextDeparture(V1, FERRY_ROUTES[0])
    expect(ferry.vanaClock).toBe('00:00')
    expect(ferry.earthMsUntil).toBe(0)
  })

  it('wraps departures across Vana midnight', () => {
    // 23:00 Vana: next Kazham -> Jeuno run (02:42 pattern) is tomorrow 02:42.
    const at2300 = V1 + (23 * 60 * 60_000) / 25
    const kazham = nextDeparture(at2300, AIRSHIP_ROUTES[7])
    expect(kazham.vanaClock).toBe('02:42')
  })
})

describe('irregular schedules', () => {
  it('manaclipper and barge next departures from Vana midnight', () => {
    expect(nextDeparture(V1, MANACLIPPER_ROUTES[0]).vanaClock).toBe('05:30')
    expect(nextDeparture(V1, MANACLIPPER_ROUTES[1]).vanaClock).toBe('09:15')
    expect(nextDeparture(V1, MANACLIPPER_ROUTES[3]).vanaClock).toBe('00:50')
    expect(nextDeparture(V1, BARGE_ROUTES[0]).vanaClock).toBe('00:50')
    expect(nextDeparture(V1, BARGE_ROUTES[2]).vanaClock).toBe('05:10')
    expect(nextDeparture(V1, BARGE_ROUTES[3]).vanaClock).toBe('17:25')
  })

  it('picks the nearest of multiple departures', () => {
    // Vana 06:00: Central -> South departures are 05:10 and 19:50; next is 19:50.
    const at0600 = V1 + (6 * 3_600_000) / 25
    expect(nextDeparture(at0600, BARGE_ROUTES[2]).vanaClock).toBe('19:50')
  })
})

describe('rse', () => {
  const ANCHOR = Date.UTC(2004, 0, 28, 9, 14, 24)
  const WEEK = (8 * 86_400_000) / 25

  it('anchor week is Hume M at Gusgen Mines', () => {
    const w = rseNow(ANCHOR + 3_600_000)
    expect(w.race).toBe('Hume ♂')
    expect(w.zone).toBe('Gusgen Mines')
    expect(w.endsEarthMs).toBe(ANCHOR + WEEK)
  })

  it('rotates race mod 8 and zone mod 3', () => {
    expect(rseNow(ANCHOR + WEEK + 1).race).toBe('Hume ♀')
    expect(rseNow(ANCHOR + WEEK + 1).zone).toBe('Maze of Shakhrami')
    expect(rseNow(ANCHOR + 8 * WEEK + 1).race).toBe('Hume ♂')
    expect(rseNow(ANCHOR + 8 * WEEK + 1).zone).toBe("Ordelle's Caves")
  })

  it('schedule lists current week onward', () => {
    const rows = rseSchedule(ANCHOR + 1, 3)
    expect(rows.map(w => w.race)).toEqual(['Hume ♂', 'Hume ♀', 'Elvaan ♂'])
  })

  it('schedule filtered by race recurs every 8 weeks with rotating zones', () => {
    const rows = rseSchedule(ANCHOR + 1, 3, 0)
    expect(rows.map(w => w.race)).toEqual(['Hume ♂', 'Hume ♂', 'Hume ♂'])
    expect(rows.map(w => w.zone)).toEqual(['Gusgen Mines', "Ordelle's Caves", 'Maze of Shakhrami'])
    expect(rows[1].startsEarthMs - rows[0].startsEarthMs).toBe(8 * WEEK)
  })
})

describe('upcomingMoonEvents', () => {
  it('from V1 (cycle pos 52): new in 32 game days, full in 74', () => {
    const ev = upcomingMoonEvents(V1)
    const gameDay = 86_400_000 / 25
    expect(ev.nextNewMs - V1).toBe(32 * gameDay)
    expect(ev.nextFullMs - V1).toBe(74 * gameDay)
    expect(moonPhase(ev.nextNewMs).percent).toBe(0)
    expect(moonPhase(ev.nextFullMs).percent).toBe(100)
  })
})

describe('guildStatus', () => {
  const VANA_HOUR_EARTH = 3_600_000 / 25
  const fishermen = GUILDS.find(g => g.name === 'Fishermen')!
  const carpenters = GUILDS.find(g => g.name === 'Carpenters')!

  it('V1 is Firesday midnight: Carpenters on holiday, next open Earthsday 6:00', () => {
    const s = guildStatus(V1, carpenters)
    expect(s.holiday).toBe(true)
    expect(s.open).toBe(false)
    expect(s.nextOpenInMs).toBe(30 * VANA_HOUR_EARTH)
  })

  it('Fishermen closed at Vana midnight, opens in 3 Vana hours', () => {
    const s = guildStatus(V1, fishermen)
    expect(s).toEqual({ open: false, holiday: false, changesInMs: 3 * VANA_HOUR_EARTH, nextOpenInMs: 3 * VANA_HOUR_EARTH })
  })

  it('Fishermen open at Vana noon, closes in 6 Vana hours', () => {
    const s = guildStatus(V1 + 12 * VANA_HOUR_EARTH, fishermen)
    expect(s.open).toBe(true)
    expect(s.changesInMs).toBe(6 * VANA_HOUR_EARTH)
  })
})

describe('dayNight', () => {
  const VH = 3_600_000 / 25

  it('V1 Vana midnight is night; sunrise in 6 Vana hours, sunset in 18', () => {
    expect(dayNight(V1)).toEqual({ isNight: true, sunriseInMs: 6 * VH, sunsetInMs: 18 * VH })
  })

  it('Vana noon is day with sunset in 6 Vana hours', () => {
    const s = dayNight(V1 + 12 * VH)
    expect(s.isNight).toBe(false)
    expect(s.sunsetInMs).toBe(6 * VH)
  })
})

describe('itemActivations', () => {
  const GAME_DAY = 86_400_000 / 25

  it('V1 (Firesday) sorts by next activation: Movalpolos 6d, Treat Staff 7d, Amood 49d', () => {
    const rows = itemActivations(V1)
    expect(rows.map(r => r.item.item)).toEqual(['Movalpolos Water', 'Treat Staff', 'Amood'])
    expect(rows.map(r => r.nextStartInMs)).toEqual([6 * GAME_DAY, 7 * GAME_DAY, 49 * GAME_DAY])
    expect(rows.every(r => !r.active)).toBe(true)
  })

  it('active item sorts first with next future occurrence a week out', () => {
    const lightsday = V1 + 6 * GAME_DAY
    const rows = itemActivations(lightsday)
    expect(rows[0].item.item).toBe('Movalpolos Water')
    expect(rows[0].active).toBe(true)
    expect(rows[0].nextStartInMs).toBe(0)
    expect(rows[0].nextFutureInMs).toBe(8 * GAME_DAY)
  })
})

describe('formatEarthWait', () => {
  it('formats minutes and seconds', () => {
    expect(formatEarthWait(168_000)).toBe('2m 48s')
    expect(formatEarthWait(9_000)).toBe('9s')
    expect(formatEarthWait(0)).toBe('0s')
  })
})
