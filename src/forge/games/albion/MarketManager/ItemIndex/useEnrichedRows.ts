import { useMemo } from 'react'
import { useItemRecipes } from './useItemRecipes'
import { useItemPrices, priceKey } from './useItemPrices'
import { analyzeCraft, collectRecipeIds, type PriceOf } from './craftCost'
import type { ItemRow } from './types'

export interface BaseItem {
  id: string
  name: string
  tier: number
  enchant: number
}

interface EnrichedResult {
  rows: ItemRow[]
  fetchedAt: Date | null
  priceError: string | null
}

// Turns a list of base items into fully-priced ItemRows with craft analysis. Shared by the
// Item Index and Favourites pages. Fetches recipes for the items, prices every node across the
// recipe trees (materials at quality 1, finished items at the selected quality), then runs the
// buy-vs-craft cost analysis per row.
export function useEnrichedRows(
  items: BaseItem[],
  location: string,
  quality: number,
  returnRate: number,
): EnrichedResult {
  const ids = useMemo(() => items.map(i => i.id), [items])
  const { recipes } = useItemRecipes(ids)

  const allIds = useMemo(() => {
    const set = new Set<string>(ids)
    for (const node of recipes.values()) collectRecipeIds(node, set)
    return [...set]
  }, [ids, recipes])

  const qualities = useMemo(() => Array.from(new Set([quality, 1])), [quality])
  const { prices, fetchedAt, error } = useItemPrices(allIds, location, qualities)

  const rows = useMemo<ItemRow[]>(() => {
    // Materials always priced at quality 1; the finished item at the selected quality.
    const priceOf: PriceOf = id => prices.get(priceKey(id, location, 1))?.sell_price_min ?? null
    return items.map(b => ({
      ...b,
      price: prices.get(priceKey(b.id, location, quality)) ?? null,
      craft: analyzeCraft(recipes.get(b.id), priceOf, returnRate),
    }))
  }, [items, recipes, prices, location, quality, returnRate])

  return { rows, fetchedAt, priceError: error }
}
