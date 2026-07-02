import { albionFetch } from '../../api'
import type { AlbionItem, RawItemPrice, RecipeNode } from './types'

// Single data-access layer for the Item Index. Every hook calls only these three functions.
type Envelope<T> = { status: 'ok'; payload: T } | { status: 'error'; message: string }

// GET /game/albion/items?query=  (no query → first 100; query → up to 50 matches)
export async function searchItems(query: string): Promise<Envelope<AlbionItem[]>> {
  const q = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ''
  return albionFetch<AlbionItem[]>(`/game/albion/items${q}`)
}

// GET /game/albion/prices/{ids}?locations=&qualities=
export async function fetchItemPrices(
  itemIds: string[],
  locations: string[],
  qualities: number[],
): Promise<Envelope<RawItemPrice[]>> {
  const ids = itemIds.map(encodeURIComponent).join(',')
  const loc = encodeURIComponent(locations.join(','))
  const qual = encodeURIComponent(qualities.join(','))
  return albionFetch<RawItemPrice[]>(`/game/albion/prices/${ids}?locations=${loc}&qualities=${qual}`)
}

// No batch recipe endpoint yet - fan out to the singular GET /game/albion/recipe/{item_id}
// with a concurrency cap. Per-item failures are tolerated (that item just gets no recipe).
// useItemRecipes caches results by id, so each is fetched at most once per session.
const RECIPE_FANOUT = 8

export async function fetchRecipes(itemIds: string[]): Promise<Envelope<RecipeNode[]>> {
  if (itemIds.length === 0) return { status: 'ok', payload: [] }
  const nodes: RecipeNode[] = []
  let next = 0
  async function worker() {
    while (next < itemIds.length) {
      const id = itemIds[next++]
      const res = await albionFetch<RecipeNode>(`/game/albion/recipe/${encodeURIComponent(id)}`)
      if (res.status === 'ok') nodes.push(res.payload)
    }
  }
  await Promise.all(Array.from({ length: Math.min(RECIPE_FANOUT, itemIds.length) }, worker))
  return { status: 'ok', payload: nodes }
}
