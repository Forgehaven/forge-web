import { albionFetch } from '../../api'
import type {
  AlbionItem, BestValuePayload, CraftSettings, CraftSettingsPayload,
  RawHistorySeries, RawItemPrice, RecipeNode,
} from './types'

// Single data-access layer for the Item Index. Every hook calls only these three functions.
type Envelope<T> = { status: 'ok'; payload: T } | { status: 'error'; message: string }

// GET /game/albion/items?query=  (no query → first 100; query → up to 50 matches)
export async function searchItems(query: string): Promise<Envelope<AlbionItem[]>> {
  const q = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ''
  return albionFetch<AlbionItem[]>(`/game/albion/items${q}`)
}

// GET /game/albion/items/by-category/{slug}  (slug from marketCategories.ts, e.g. "refining/ore")
export async function fetchCategoryItems(slug: string): Promise<Envelope<AlbionItem[]>> {
  const path = slug.split('/').map(encodeURIComponent).join('/')
  return albionFetch<AlbionItem[]>(`/game/albion/items/by-category/${path}`)
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

// GET /game/albion/prices/history/{id}?locations=&qualities=&time-scale=
// Always requests every quality - the detail chart draws one line per quality level.
export async function fetchItemHistory(
  itemId: string,
  location: string,
  timeScale: number,
): Promise<Envelope<RawHistorySeries[]>> {
  const id = encodeURIComponent(itemId)
  const loc = encodeURIComponent(location)
  return albionFetch<RawHistorySeries[]>(
    `/game/albion/prices/history/${id}?locations=${loc}&qualities=1,2,3,4,5&time-scale=${timeScale}`,
  )
}

// GET /game/albion/best-value - server-side sweep across every city, cached 120s. Rows are
// (item, city) pairs ranked overall. `premium` drives the sales tax (4% vs 8%), `focus` the
// focus return rates; both bonus-aware server-side.
export async function fetchBestValue(
  premium: boolean,
  focus: boolean,
): Promise<Envelope<BestValuePayload>> {
  return albionFetch<BestValuePayload>(
    `/game/albion/best-value?premium=${premium}&focus=${focus}`,
  )
}

// GET/PUT /game/albion/craft-settings - community-shared (everyone sees the same values).
export async function fetchCraftSettings(): Promise<Envelope<CraftSettingsPayload>> {
  return albionFetch<CraftSettingsPayload>('/game/albion/craft-settings')
}

export async function putCraftSettings(settings: CraftSettings): Promise<Envelope<null>> {
  return albionFetch<null>('/game/albion/craft-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
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
