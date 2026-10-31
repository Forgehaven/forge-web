import { useEffect, useState } from 'react'
import { useAuth } from '../../../../auth/authContext'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { getFavourites, putFavourites } from '../api'

const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.uwFavourites) ?? '[]') } catch { return [] }
}
const write = (items: string[]) => {
  try { localStorage.setItem(STORAGE_KEYS.uwFavourites, JSON.stringify(items)) } catch { /* private mode */ }
}

// Starred Rules Compendium entries: kept in this browser, and merged with the
// account's list when logged in.
export function useCompendiumFavourites() {
  const { isAuthenticated } = useAuth()
  const [favs, setFavs] = useState(read)

  useEffect(() => {
    if (!isAuthenticated) return
    getFavourites().then(res => {
      if (res.status !== 'ok') return
      const merged = [...new Set([...res.payload, ...read()])]
      if (merged.length !== res.payload.length) putFavourites(merged).catch(() => {})
      write(merged)
      setFavs(merged)
    }).catch(() => {})
  }, [isAuthenticated])

  const toggle = (key: string) => {
    const next = favs.includes(key) ? favs.filter(k => k !== key) : [...favs, key]
    write(next)
    setFavs(next)
    if (isAuthenticated) putFavourites(next).catch(() => {})
  }

  return { favs, toggle }
}
