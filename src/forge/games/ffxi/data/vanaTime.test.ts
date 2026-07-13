import { describe, it, expect } from 'vitest'
import {
  vanaTime, moonPhase, nextDeparture, formatEarthWait,
  VANA_WEEKDAYS, AIRSHIP_ROUTES, FERRY_ROUTES,
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

describe('formatEarthWait', () => {
  it('formats minutes and seconds', () => {
    expect(formatEarthWait(168_000)).toBe('2m 48s')
    expect(formatEarthWait(9_000)).toBe('9s')
    expect(formatEarthWait(0)).toBe('0s')
  })
})
