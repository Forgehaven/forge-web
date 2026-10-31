import { STORAGE_KEYS } from '../config/storageKeys'

export type Theme = 'dark' | 'light'

export const getTheme = (): Theme => (localStorage.getItem(STORAGE_KEYS.theme) === 'light' ? 'light' : 'dark')

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme)
  applyTheme(theme)
}
