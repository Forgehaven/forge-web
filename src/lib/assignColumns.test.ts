import { describe, expect, it } from 'vitest'
import { assignColumns } from './assignColumns'

describe('assignColumns', () => {
  it('fills the lightest column in order', () => {
    const items = [{ id: 'a', weight: 10 }, { id: 'b', weight: 3 }, { id: 'c', weight: 3 }, { id: 'd', weight: 5 }]
    expect(assignColumns(items, 2).map(c => c.map(i => i.id))).toEqual([['a'], ['b', 'c', 'd']])
    expect(assignColumns(items, 1)[0]).toHaveLength(4)
  })

  it('keeps fixed columns when they fit, else falls back to greedy', () => {
    const items = [{ id: 'a', weight: 1, col: 0 }, { id: 'b', weight: 9, col: 1 }, { id: 'c', weight: 1, col: 0 }]
    expect(assignColumns(items, 2).map(c => c.map(i => i.id))).toEqual([['a', 'c'], ['b']])
    expect(assignColumns(items, 4)).toHaveLength(2)
    expect(assignColumns(items, 1)[0].map(i => i.id)).toEqual(['a', 'b', 'c'])
  })
})
