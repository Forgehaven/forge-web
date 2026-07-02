import { STORAGE_KEYS } from '../../../config/storageKeys'

// The character selection is shared across FFXI tools via localStorage so
// switching tools keeps the same character.
export function loadSelectedCharId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ffxiSelectedChar)
}

export function storeSelectedCharId(id: string) {
  localStorage.setItem(STORAGE_KEYS.ffxiSelectedChar, id)
}
