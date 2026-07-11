import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from '../../../../../config/storageKeys'

// Per-user Albion prices for the universal crafting tools, keyed "itemId|city|quality".
// localStorage-first; Piece 3 swaps this to the server when logged in (same interface). One
// upserted value per key - no history - so bots/volume can never bloat storage.
const KEY = STORAGE_KEYS.albionUserPrices

export type PriceMap = Record<string, number>

function loadAll(): PriceMap {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return raw && typeof raw === 'object' ? (raw as PriceMap) : {}
  } catch {
    return {}
  }
}

let cache: PriceMap = loadAll()
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function keyOf(itemId: string, city: string, quality: number): string {
  return `${itemId}|${city}|${quality}`
}

// Read a single price straight from the store (non-reactive). For reactive reads in a
// component, take the map from useUserPrices() and use priceFrom().
export function getPrice(itemId: string, city: string, quality: number): number | null {
  return priceFrom(cache, itemId, city, quality)
}

export function priceFrom(map: PriceMap, itemId: string, city: string, quality: number): number | null {
  const v = map[keyOf(itemId, city, quality)]
  return typeof v === 'number' ? v : null
}

// Upsert a single price. A null / non-positive value clears it (never store a 0 or NaN).
export function setPrice(itemId: string, city: string, quality: number, value: number | null): void {
  const k = keyOf(itemId, city, quality)
  const next = { ...cache }
  if (value == null || !Number.isFinite(value) || value <= 0) delete next[k]
  else next[k] = value
  cache = next
  localStorage.setItem(KEY, JSON.stringify(cache))
  emit()
}

// Live snapshot of the whole price map; re-renders subscribers on any change. Use as a memo
// dependency for priceOf-derived values.
export function useUserPrices(): PriceMap {
  return useSyncExternalStore(subscribe, () => cache)
}

// Store plumbing for the server-sync layer (settings/sync.ts).
export function subscribePrices(cb: () => void): () => void {
  return subscribe(cb)
}

export function getPriceMap(): PriceMap {
  return cache
}

// Replace the whole map from a server blob. Does not touch the server (the sync layer guards
// against echoing this straight back).
export function replacePrices(map: PriceMap): void {
  cache = { ...map }
  localStorage.setItem(KEY, JSON.stringify(cache))
  emit()
}
