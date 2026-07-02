import { STORAGE_KEYS } from '../../../../config/storageKeys'

// Per-user flags (local-only - unlike station fees, these are per player).
// Premium (defaults to true) drives the 4%/8% sales tax; focus (defaults to
// false) switches Best Value to the focus return rates (43.5/53.9/47.9%).
export function loadPremium(): boolean {
  return localStorage.getItem(STORAGE_KEYS.albionPremium) !== 'false'
}

export function savePremium(premium: boolean): void {
  localStorage.setItem(STORAGE_KEYS.albionPremium, String(premium))
}

export function loadFocus(): boolean {
  return localStorage.getItem(STORAGE_KEYS.albionFocus) === 'true'
}

export function saveFocus(focus: boolean): void {
  localStorage.setItem(STORAGE_KEYS.albionFocus, String(focus))
}

export function loadDefaultCity(): string {
  return localStorage.getItem(STORAGE_KEYS.albionDefaultCity) || 'Bridgewatch'
}

export function saveDefaultCity(city: string): void {
  localStorage.setItem(STORAGE_KEYS.albionDefaultCity, city)
}

// How materials are acquired: 'sell' = pay the lowest sell order (instant),
// 'buy' = place buy orders at the current top bid and wait (cheaper).
export type MatSource = 'sell' | 'buy'

export function loadMatSource(): MatSource {
  return localStorage.getItem(STORAGE_KEYS.albionMatSource) === 'buy' ? 'buy' : 'sell'
}

export function saveMatSource(source: MatSource): void {
  localStorage.setItem(STORAGE_KEYS.albionMatSource, source)
}

// Which craft cost the profit columns use: the fully optimized tree, or just the
// top-level (base) materials for crafters who skip the sub-refining.
export type CraftStrategy = 'optimized' | 'base'

export function loadCraftStrategy(): CraftStrategy {
  return localStorage.getItem(STORAGE_KEYS.albionCraftStrategy) === 'base' ? 'base' : 'optimized'
}

export function saveCraftStrategy(strategy: CraftStrategy): void {
  localStorage.setItem(STORAGE_KEYS.albionCraftStrategy, strategy)
}
