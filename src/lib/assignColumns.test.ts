import { describe, expect, it } from 'vitest'
import { assignColumns } from './assignColumns'

describe('assignColumns', () => {
  it('fills the lightest column in order', () => {
    const items = [{ id: 'a', weight: 10 }, { id: 'b', weight: 3 }, { id: 'c', weight: 3 }, { id: 'd', weight: 5 }]
    expect(assignColumns(items, 2).map(c => c.map(i => i.id))).toEqual([['a'], ['b', 'c', 'd']])
    expect(assignColumns(items, 1)[0]).toHaveLength(4)
  })
})
