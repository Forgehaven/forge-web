import { describe, expect, it } from 'vitest'
import { assignColumns } from './assignColumns'

describe('assignColumns', () => {
  it('fills the lightest column in order', () => {
    const items = [{ id: 'a', weight: 10 }, { id: 'b', weight: 3 }, { id: 'c', weight: 3 }, { id: 'd', weight: 5 }]
    expect(assignColumns(items, 2).map(c => c.map(i => i.id))).toEqual([['a'], ['b', 'c', 'd']])
    expect(assignColumns(items, 1)[0]).toHaveLength(4)
  })

  it('uses the widest placement that fits, else greedy in array order', () => {
    const items = [
      { id: 'a', weight: 1, place: { 2: [0, 1], 3: [0, 0] } },
      { id: 'b', weight: 9, place: { 2: [1, 0], 3: [2, 0] } },
      { id: 'c', weight: 1, place: { 2: [0, 0], 3: [1, 0] } },
    ] as { id: string; weight: number; place: Record<number, [number, number]> }[]
    const ids = (cols: number) => assignColumns(items, cols).map(c => c.map(i => i.id))
    expect(ids(2)).toEqual([['c', 'a'], ['b']])
    expect(ids(3)).toEqual([['a'], ['c'], ['b']])
    expect(ids(5)).toEqual([['a'], ['c'], ['b']])
    expect(ids(1)).toEqual([['a', 'b', 'c']])
  })
})
