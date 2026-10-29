import { describe, it, expect } from 'vitest'
import { assaultTags } from './assaultTags'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 9, 1)

describe('assaultTags', () => {
  it('starts full with no timer', () => {
    expect(assaultTags([], 3, T0)).toEqual({ stock: 3, nextAt: null, fullAt: null })
  })

  it('regenerates one tag per day from the first draw out of a full stock', () => {
    // Three draws in an hour empties the stock; the timer runs from the first.
    const draws = [T0, T0 + 3_600_000, T0 + 7_200_000]
    expect(assaultTags(draws, 3, T0 + 7_200_000)).toEqual({ stock: 0, nextAt: T0 + DAY, fullAt: T0 + 3 * DAY })
    // 1.5 days later one tag is back and the next one is due at day 2.
    expect(assaultTags(draws, 3, T0 + 1.5 * DAY)).toEqual({ stock: 1, nextAt: T0 + 2 * DAY, fullAt: T0 + 3 * DAY })
    // Fully restocked after three days; timer stops.
    expect(assaultTags(draws, 3, T0 + 3 * DAY)).toEqual({ stock: 3, nextAt: null, fullAt: null })
  })

  it('keeps the timer when drawing from a partial stock', () => {
    const draws = [T0, T0 + 2 * DAY]
    // Day 2: the first tag regenerated at day 1 (stock 3), then one more drawn -> timer restarts at day 2.
    expect(assaultTags(draws, 3, T0 + 2 * DAY + 1).nextAt).toBe(T0 + 3 * DAY)
  })
})
