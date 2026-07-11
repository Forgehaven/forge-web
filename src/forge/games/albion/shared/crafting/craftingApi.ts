import { albionFetch } from '../api'
import type { AlbionItem, CraftSettingsPayload, RecipeNode } from './types'

// Price-free data access for the universal crafting tools: the full item list, recipes (bill of
// materials), and the shared station-fee settings. None of these return live market prices -
// user prices live in the per-user store (see userStore).
type Envelope<T> = { status: 'ok'; payload: T } | { status: 'error'; message: string }

// GET /game/albion/items?limit=0  → every tradeable item, uncapped. The universal Item Index
// loads this once and searches/filters/paginates client-side.
export async function fetchAllItems(): Promise<Envelope<AlbionItem[]>> {
  return albionFetch<AlbionItem[]>('/game/albion/items?limit=0')
}

// Batch GET /game/albion/recipes/{ids} - chunked at 50 ids per request (URL-length safe,
// server caps at 100). Per-chunk failures are tolerated (those items just get no recipe).
// useItemRecipes caches results by id, so each is fetched at most once per session.
const RECIPE_CHUNK = 50

export async function fetchRecipes(itemIds: string[]): Promise<Envelope<RecipeNode[]>> {
  if (itemIds.length === 0) return { status: 'ok', payload: [] }
  const chunks: string[][] = []
  for (let i = 0; i < itemIds.length; i += RECIPE_CHUNK) {
    chunks.push(itemIds.slice(i, i + RECIPE_CHUNK))
  }
  const results = await Promise.all(chunks.map(chunk =>
    albionFetch<RecipeNode[]>(
      `/game/albion/recipes/${chunk.map(encodeURIComponent).join(',')}`,
    ),
  ))
  const nodes: RecipeNode[] = []
  for (const res of results) {
    if (res.status === 'ok') nodes.push(...res.payload)
  }
  return { status: 'ok', payload: nodes }
}

// GET /game/albion/craft-settings - community-shared station fees + return-rate inputs
// (no prices), read as the base defaults. Per-user edits live in settings/craftSettings.ts.
export async function fetchCraftSettings(): Promise<Envelope<CraftSettingsPayload>> {
  return albionFetch<CraftSettingsPayload>('/game/albion/craft-settings')
}
