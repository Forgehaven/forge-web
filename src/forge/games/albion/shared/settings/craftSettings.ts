import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from '../../../../../config/storageKeys'

export type MatSource = 'sell' | 'buy'
export type CraftStrategy = 'optimized' | 'base'

// Per-user craft settings for the universal crafting tools. localStorage-first; synced to the
// account when logged in (settings/sync.ts -> /game/albion/user/craft-settings). Replaces the
// Market Manager's split of per-user prefs (premium.ts) + a global shared station-fee blob:
// here everything, station fees included, is the individual user's own.
export interface UserCraftSettings {
  premium: boolean
  focus: boolean
  defaultCity: string
  matSource: MatSource
  craftStrategy: CraftStrategy
  // city -> station type -> flat silver per 100 nutrition
  stationFees: Record<string, Record<string, number>>
}

export const DEFAULT_CRAFT_SETTINGS: UserCraftSettings = {
  premium: true,
  focus: false,
  defaultCity: 'Bridgewatch',
  matSource: 'sell',
  craftStrategy: 'optimized',
  stationFees: {},
}

const KEY = STORAGE_KEYS.albionUserCraftSettings

function normalize(raw: Partial<UserCraftSettings> | null): UserCraftSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CRAFT_SETTINGS }
  return {
    ...DEFAULT_CRAFT_SETTINGS,
    ...raw,
    stationFees: raw.stationFees ?? {},
  }
}

function load(): UserCraftSettings {
  try {
    return normalize(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return { ...DEFAULT_CRAFT_SETTINGS }
  }
}

let cache: UserCraftSettings = load()
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function getCraftSettings(): UserCraftSettings {
  return cache
}

function commit(next: UserCraftSettings): void {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(cache))
  emit()
}

export function patchCraftSettings(patch: Partial<UserCraftSettings>): void {
  commit({ ...cache, ...patch })
}

export function setStationFee(city: string, station: string, value: number): void {
  const cityFees = { ...(cache.stationFees[city] ?? {}) }
  if (!value || value <= 0) delete cityFees[station]
  else cityFees[station] = value
  commit({ ...cache, stationFees: { ...cache.stationFees, [city]: cityFees } })
}

export function stationFeeValue(settings: UserCraftSettings, city: string, station: string): number {
  return settings.stationFees[city]?.[station] ?? 0
}

export function useUserCraftSettings(): UserCraftSettings {
  return useSyncExternalStore(subscribe, () => cache)
}

// Sync plumbing (settings/sync.ts).
export function subscribeCraftSettings(cb: () => void): () => void {
  return subscribe(cb)
}

// Replace the whole settings object from a server blob (does not re-save to the server; the
// sync layer guards against echoing this straight back).
export function replaceCraftSettings(data: Partial<UserCraftSettings>): void {
  commit(normalize(data))
}
