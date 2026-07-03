import { describe, it, expect } from 'vitest'
import { utcDate } from './date'

describe('utcDate', () => {
  it('reads a naive lake timestamp as UTC (appends Z)', () => {
    expect(utcDate('2026-07-03T14:00:00').getTime()).toBe(Date.UTC(2026, 6, 3, 14, 0, 0))
  })

  it('keeps an explicit Z timestamp', () => {
    expect(utcDate('2026-07-03T14:00:00Z').getTime()).toBe(Date.UTC(2026, 6, 3, 14, 0, 0))
  })

  it('keeps a numeric +00:00 offset without doubling the zone (not NaN)', () => {
    // Best Value's computed_at is tz-aware isoformat -> ends with +00:00, not Z.
    const d = utcDate('2026-07-03T14:00:00.500000+00:00')
    expect(Number.isNaN(d.getTime())).toBe(false)
    expect(d.getTime()).toBe(Date.UTC(2026, 6, 3, 14, 0, 0, 500))
  })

  it('honors a non-UTC offset', () => {
    // 14:00 at -05:00 == 19:00 UTC
    expect(utcDate('2026-07-03T14:00:00-05:00').getTime()).toBe(Date.UTC(2026, 6, 3, 19, 0, 0))
  })
})
