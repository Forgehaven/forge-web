import { describe, it, expect } from 'vitest'
import { analyzeCraft, profit, collectRecipeIds, type PriceOf } from './craftCost'
import type { RecipeNode } from './types'

// X ← 2× M ; M ← 3× R (raw). Lets buy-vs-craft of M diverge.
const raw = (id: string, count?: number): RecipeNode => ({ item_id: id, craftable: false, recipe: [], count })
const M = (count: number): RecipeNode => ({ item_id: 'M', craftable: true, count, recipe: [raw('R', 3)] })
const X: RecipeNode = { item_id: 'X', craftable: true, recipe: [M(2)] }

const priceOfWith = (map: Record<string, number>): PriceOf => id => (id in map ? map[id] : null)

describe('analyzeCraft', () => {
  it('crafts the intermediate when that is cheaper (optimal === full-craft)', () => {
    const a = analyzeCraft(X, priceOfWith({ M: 100, R: 20 }), 0)!
    expect(a.fullBuy).toBe(200) // buy 2× M @100
    expect(a.fullCraft).toBe(120) // craft M from 3× R@20 → 60, ×2
    expect(a.optimal).toBe(120) // min(buy 100, craft 60) ×2
    expect(a.materials[0]).toMatchObject({ id: 'M', count: 2, mode: 'craft', subtotal: 120 })
  })

  it('buys the intermediate when that is cheaper (optimal === full-buy)', () => {
    const a = analyzeCraft(X, priceOfWith({ M: 50, R: 20 }), 0)!
    expect(a.fullBuy).toBe(100)
    expect(a.fullCraft).toBe(120)
    expect(a.optimal).toBe(100)
    expect(a.materials[0]).toMatchObject({ mode: 'buy', unitCost: 50 })
  })

  it('applies the return rate to material quantities', () => {
    const a = analyzeCraft(X, priceOfWith({ M: 50, R: 20 }), 0.2)!
    expect(a.fullBuy).toBeCloseTo(50 * 2 * 0.8) // 80
  })

  it('returns null when a material price is missing', () => {
    const a = analyzeCraft(X, priceOfWith({ M: 50 }), 0)! // R unknown
    expect(a.optimal).toBe(100) // can still buy M
    expect(a.fullCraft).toBeNull() // can't refine without R price
  })

  it('returns null for a non-craftable or unknown item', () => {
    expect(analyzeCraft(raw('Z'), priceOfWith({}), 0)).toBeNull()
    expect(analyzeCraft(undefined, priceOfWith({}), 0)).toBeNull()
  })
})

describe('profit', () => {
  it('is post-tax revenue minus craft cost', () => {
    expect(profit(1000, 120, 0.065)).toBeCloseTo(1000 * 0.935 - 120)
  })
  it('is null when either side is unknown', () => {
    expect(profit(null, 120, 0)).toBeNull()
    expect(profit(1000, null, 0)).toBeNull()
  })
})

describe('collectRecipeIds', () => {
  it('gathers every node id in the tree', () => {
    const set = new Set<string>()
    collectRecipeIds(X, set)
    expect([...set].sort()).toEqual(['M', 'R', 'X'])
  })
})
