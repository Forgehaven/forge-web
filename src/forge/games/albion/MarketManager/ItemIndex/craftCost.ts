import type { CraftAnalysis, CraftMaterial, RecipeNode } from './types'

// Market acquisition cost of an item (what you pay to BUY one): the lowest sell-order price.
// Returns null when no price is known (can't buy / can't craft through it).
export type PriceOf = (id: string) => number | null

// Effective quantity after the crafting resource-return rate (you get some materials back).
function adj(count: number, returnRate: number): number {
  return count * (1 - returnRate)
}

export type AcquireMode = 'buy' | 'craft' | 'upgrade'

// Cheapest of buy-at-market / craft-from-children / transmute-from-the-level-below, with the
// winning mode. Cost is null when no route has known prices. Exported for the recipe-tree
// card, which expands or collapses nodes based on the winning mode.
export function bestMode(node: RecipeNode, priceOf: PriceOf, rr: number): { mode: AcquireMode; cost: number | null } {
  let mode: AcquireMode = 'buy'
  let cost = priceOf(node.item_id)
  const craft = craftOptimal(node, priceOf, rr)
  if (craft != null && (cost == null || craft < cost)) {
    mode = 'craft'
    cost = craft
  }
  const up = upgradeOptimal(node, priceOf, rr)
  if (up != null && (cost == null || up < cost)) {
    mode = 'upgrade'
    cost = up
  }
  return { mode, cost }
}

function acquireOptimal(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  return bestMode(node, priceOf, rr).cost
}

// Craft one unit from optimally-acquired materials: flat silver fee + children, divided by the
// batch size for recipes that produce several units per craft.
function craftOptimal(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  if (!node.craftable || node.recipe.length === 0) return null
  let sum = node.silver ?? 0
  for (const child of node.recipe) {
    const c = acquireOptimal(child, priceOf, rr)
    if (c == null) return null
    sum += c * adj(child.count ?? 1, rr)
  }
  return sum / (node.amount ?? 1)
}

// Produce one unit by transmuting the enchant level below: acquire it, then pay the upgrade
// materials at market. No crafting station involved, so no return rate on the materials.
function upgradeOptimal(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  const up = node.upgrade
  if (!up) return null
  let sum = acquireOptimal(up.from, priceOf, rr)
  if (sum == null) return null
  for (const mat of up.materials) {
    const p = priceOf(mat.item_id)
    if (p == null) return null
    sum += p * mat.count
  }
  return sum
}

// Craft the node buying ALL direct children at market (no sub-crafting).
function craftFullBuy(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  if (!node.craftable || node.recipe.length === 0) return null
  let sum = node.silver ?? 0
  for (const child of node.recipe) {
    const c = priceOf(child.item_id)
    if (c == null) return null
    sum += c * adj(child.count ?? 1, rr)
  }
  return sum / (node.amount ?? 1)
}

// Acquire a node by refining everything craftable from raw (never buy an intermediate).
function acquireFullCraft(node: RecipeNode, priceOf: PriceOf, rr: number): number | null {
  if (!node.craftable || node.recipe.length === 0) return priceOf(node.item_id)
  let sum = node.silver ?? 0
  for (const child of node.recipe) {
    const c = acquireFullCraft(child, priceOf, rr)
    if (c == null) return null
    sum += c * adj(child.count ?? 1, rr)
  }
  return sum / (node.amount ?? 1)
}

function craftMaterials(node: RecipeNode, priceOf: PriceOf, rr: number): CraftMaterial[] {
  return node.recipe.map(child => {
    const { mode, cost } = bestMode(child, priceOf, rr)
    return {
      id: child.item_id,
      name: child.name || child.item_id,
      count: child.count ?? 1,
      mode,
      unitCost: cost,
      subtotal: cost == null ? null : cost * adj(child.count ?? 1, rr),
    }
  })
}

function baseMaterials(node: RecipeNode, priceOf: PriceOf, rr: number): CraftMaterial[] {
  return node.recipe.map(child => {
    const p = priceOf(child.item_id)
    return {
      id: child.item_id,
      name: child.name || child.item_id,
      count: child.count ?? 1,
      mode: 'buy' as const,
      unitCost: p,
      subtotal: p == null ? null : p * adj(child.count ?? 1, rr),
    }
  })
}

function upgradeMaterials(node: RecipeNode, priceOf: PriceOf, rr: number): CraftMaterial[] {
  const up = node.upgrade!
  const from = bestMode(up.from, priceOf, rr)
  const lines: CraftMaterial[] = [{
    id: up.from.item_id,
    name: up.from.name || up.from.item_id,
    count: 1,
    mode: from.mode,
    unitCost: from.cost,
    subtotal: from.cost,
  }]
  for (const mat of up.materials) {
    const p = priceOf(mat.item_id)
    lines.push({
      id: mat.item_id,
      name: mat.name || mat.item_id,
      count: mat.count,
      mode: 'buy',
      unitCost: p,
      subtotal: p == null ? null : p * mat.count,
    })
  }
  return lines
}

// Full production-cost analysis for an item we intend to MAKE (craft or transmute up - never
// plain buy; only its materials are buy-vs-craft-vs-upgrade). Returns null if the item has
// neither a recipe nor an upgrade path.
export function analyzeCraft(
  node: RecipeNode | undefined,
  priceOf: PriceOf,
  returnRate: number,
): CraftAnalysis | null {
  if (!node) return null
  const hasRecipe = node.craftable && node.recipe.length > 0
  if (!hasRecipe && !node.upgrade) return null

  const craft = craftOptimal(node, priceOf, returnRate)
  const upgrade = upgradeOptimal(node, priceOf, returnRate)
  const viaUpgrade = upgrade != null && (craft == null || upgrade < craft)

  return {
    optimal: viaUpgrade ? upgrade : craft,
    fullBuy: craftFullBuy(node, priceOf, returnRate),
    fullCraft: acquireFullCraft(node, priceOf, returnRate),
    materials: viaUpgrade
      ? upgradeMaterials(node, priceOf, returnRate)
      : craftMaterials(node, priceOf, returnRate),
    baseMaterials: baseMaterials(node, priceOf, returnRate),
    silver: node.silver ?? 0,
    amount: node.amount ?? 1,
  }
}

// Profit = post-tax revenue − craft cost. null when either side is unknown.
export function profit(revenue: number | null | undefined, craftCost: number | null | undefined, taxRate: number): number | null {
  if (revenue == null || craftCost == null) return null
  return revenue * (1 - taxRate) - craftCost
}

// Every item id in a recipe tree (upgrade paths included) - used to batch the price request.
export function collectRecipeIds(node: RecipeNode, into: Set<string>): void {
  into.add(node.item_id)
  for (const child of node.recipe) collectRecipeIds(child, into)
  if (node.upgrade) {
    collectRecipeIds(node.upgrade.from, into)
    for (const mat of node.upgrade.materials) into.add(mat.item_id)
  }
}

export interface ShoppingLine {
  id: string
  name: string
  count: number // expected units to buy for ONE finished item (return rate applied)
  unitCost: number | null
}

// What to actually buy at market to produce one unit of the item along the optimal
// buy-vs-craft-vs-upgrade path, plus the total flat silver in crafting fees. Multiply the
// counts by the desired quantity and round up.
export function shoppingList(
  node: RecipeNode,
  priceOf: PriceOf,
  rr: number,
): { lines: ShoppingLine[]; silver: number } {
  const acc = new Map<string, ShoppingLine>()
  let silver = 0

  function buyLine(id: string, name: string, count: number, unitCost: number | null) {
    const line = acc.get(id)
    if (line) line.count += count
    else acc.set(id, { id, name, count, unitCost })
  }

  function produce(n: RecipeNode, units: number) {
    const craft = craftOptimal(n, priceOf, rr)
    const up = upgradeOptimal(n, priceOf, rr)
    if (up != null && (craft == null || up < craft)) {
      visit(n.upgrade!.from, units)
      for (const mat of n.upgrade!.materials) {
        buyLine(mat.item_id, mat.name || mat.item_id, mat.count * units, priceOf(mat.item_id))
      }
      return
    }
    const crafts = units / (n.amount ?? 1)
    silver += (n.silver ?? 0) * crafts
    for (const child of n.recipe) {
      visit(child, adj(child.count ?? 1, rr) * crafts)
    }
  }

  function visit(n: RecipeNode, units: number) {
    const { mode } = bestMode(n, priceOf, rr)
    if (mode === 'buy') buyLine(n.item_id, n.name || n.item_id, units, priceOf(n.item_id))
    else produce(n, units)
  }

  produce(node, 1)
  return { lines: [...acc.values()], silver }
}

// Same shape as shoppingList, but along the FULL-CRAFT path: every refinable node is refined
// from raw, so the buys are the raw leaves only (plus accumulated silver fees). Transmute
// recipes (flat silver fee on the recipe - raw/refined resource tier-ups) stay buys: the
// full tree is the refining chain, not the transmutator.
export function shoppingListFullCraft(
  node: RecipeNode,
  priceOf: PriceOf,
  rr: number,
): { lines: ShoppingLine[]; silver: number } {
  const acc = new Map<string, ShoppingLine>()
  let silver = 0

  function walk(n: RecipeNode, units: number) {
    if (!n.craftable || n.recipe.length === 0 || (n.silver ?? 0) > 0) {
      const line = acc.get(n.item_id)
      if (line) line.count += units
      else acc.set(n.item_id, { id: n.item_id, name: n.name || n.item_id, count: units, unitCost: priceOf(n.item_id) })
      return
    }
    const crafts = units / (n.amount ?? 1)
    silver += (n.silver ?? 0) * crafts
    for (const child of n.recipe) {
      walk(child, adj(child.count ?? 1, rr) * crafts)
    }
  }

  const crafts = 1 / (node.amount ?? 1)
  silver += (node.silver ?? 0) * crafts
  for (const child of node.recipe) {
    walk(child, adj(child.count ?? 1, rr) * crafts)
  }
  return { lines: [...acc.values()], silver }
}
