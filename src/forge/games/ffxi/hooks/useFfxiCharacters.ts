import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useAuth } from '../../../../auth/authContext'
import {
  deleteCharacter, listCharacters, registerCharacter, type FfxiCharacter,
} from '../api'

// Module-level store so every consumer (LoginModal registration, SpellTracker
// dropdown, ClammingTracker dropdown) sees the same list instantly - a
// character added in the account modal appears in open tools without a reload.
type Store = { characters: FfxiCharacter[]; loading: boolean }

let store: Store = { characters: [], loading: false }
let fetched = false
const listeners = new Set<() => void>()

function setStore(next: Partial<Store>) {
  store = { ...store, ...next }
  listeners.forEach(l => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function getSnapshot() {
  return store
}

// Registered HorizonXI characters for the logged-in account (max 3 - the
// HorizonXI per-account character limit; the backend enforces it).
export function useFfxiCharacters() {
  const { isAuthenticated } = useAuth()
  const { characters, loading } = useSyncExternalStore(subscribe, getSnapshot)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      fetched = false
      if (store.characters.length || store.loading) {
        setStore({ characters: [], loading: false })
      }
      return
    }
    if (fetched) return
    fetched = true
    setStore({ loading: true })
    listCharacters().then(res => {
      if (res.status === 'ok') {
        setStore({ loading: false, characters: res.payload })
      } else {
        // Failed fetch must not latch sync off for the whole SPA session:
        // let the next consumer mount retry.
        fetched = false
        setStore({ loading: false })
      }
    }).catch(() => {
      fetched = false
      setStore({ loading: false })
    })
  }, [isAuthenticated])

  const register = useCallback(async (name: string): Promise<boolean> => {
    setError(null)
    try {
      const res = await registerCharacter(name)
      if (res.status === 'error') {
        setError(res.message)
        return false
      }
      setStore({ characters: [...store.characters, res.payload] })
      return true
    } catch {
      setError('Network error, please try again')
      return false
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    try {
      const res = await deleteCharacter(id)
      if (res.status === 'ok') {
        setStore({ characters: store.characters.filter(c => c.id !== id) })
      }
    } catch { /* leave the list unchanged; user can retry */ }
  }, [])

  return { characters, loading, error, register, remove }
}
