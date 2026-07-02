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
