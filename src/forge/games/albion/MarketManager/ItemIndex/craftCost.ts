import type { CraftAnalysis, CraftMaterial, RecipeNode } from './types'

// Market acquisition cost of an item (what you pay to BUY one): the lowest sell-order price.
// Returns null when no price is known (can't buy / can't craft through it).
export type PriceOf = (id: string) => number | null

// Effective quantity after the crafting resource-return rate (you get some materials back).
function adj(count: number, returnRate: number): number {
  return count * (1 - returnRate)
}

// Cheapest way to ACQUIRE one node: min(buy at market, craft from its best children).
function acquireOptimal(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  const buy = priceOf(node.item_id)
  if (!node.craftable || node.recipe.length === 0) return buy
  const craft = craftOptimal(node, priceOf, rr)
  if (buy == null) return craft
  if (craft == null) return buy
  return Math.min(buy, craft)
}

function craftOptimal(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  let sum = 0
  for (const child of node.recipe) {
    const c = acquireOptimal(child, priceOf, rr)
    if (c == null) return null
    sum += c * adj(child.count ?? 1, rr)
  }
  return sum
}

// Craft the node buying ALL direct children at market (no sub-crafting).
function craftFullBuy(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  let sum = 0
  for (const child of node.recipe) {
    const c = priceOf(child.item_id)
    if (c == null) return null
    sum += c * adj(child.count ?? 1, rr)
  }
  return sum
}

// Acquire a node by refining everything craftable from raw (never buy an intermediate).
function acquireFullCraft(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  if (!node.craftable || node.recipe.length === 0) return priceOf(node.item_id)
  let sum = 0
  for (const child of node.recipe) {
    const c = acquireFullCraft(child, priceOf, rr)
    if (c == null) return null
    sum += c * adj(child.count ?? 1, rr)
  }
  return sum
}

// Full craft-cost analysis for an item we intend to craft (so the item itself is always
// crafted; only its materials are buy-vs-craft). Returns null if the item has no recipe.
export function analyzeCraft(
  node: RecipeNode | undefined,
  priceOf: PriceOf,
  returnRate: number,
): CraftAnalysis | null {
  if (!node || !node.craftable || node.recipe.length === 0) return null

  const materials: CraftMaterial[] = node.recipe.map(child => {
    const buy = priceOf(child.item_id)
    const craft = child.craftable && child.recipe.length > 0 ? craftOptimal(child, priceOf, returnRate) : null
    let mode: 'buy' | 'craft' = 'buy'
    let unitCost = buy
    if (craft != null && (buy == null || craft < buy)) {
      mode = 'craft'
      unitCost = craft
    }
    return {
      id: child.item_id,
      count: child.count ?? 1,
      mode,
      unitCost,
      subtotal: unitCost == null ? null : unitCost * adj(child.count ?? 1, returnRate),
    }
  })

  return {
    optimal: craftOptimal(node, priceOf, returnRate),
    fullBuy: craftFullBuy(node, priceOf, returnRate),
    fullCraft: acquireFullCraft(node, priceOf, returnRate),
    materials,
  }
}

// Profit = post-tax revenue − craft cost. null when either side is unknown.
export function profit(revenue: number | null | undefined, craftCost: number | null | undefined, taxRate: number): number | null {
  if (revenue == null || craftCost == null) return null
  return revenue * (1 - taxRate) - craftCost
}

// Every item id in a recipe tree - used to batch the price request.
export function collectRecipeIds(node: RecipeNode, into: Set<string>): void {
  into.add(node.item_id)
  for (const child of node.recipe) collectRecipeIds(child, into)
}
