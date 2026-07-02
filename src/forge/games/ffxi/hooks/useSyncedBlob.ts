import { useCallback, useEffect, useRef } from 'react'
import type { Envelope } from '../../../../lib/api'
import type { ToolBlob } from '../api'

type Pending<T> = { data: T; save: (data: T) => Promise<unknown> }

// Server-side tool-blob sync: loads when `key` (character id / tool slug)
// becomes available or changes, exposes a debounced save that flushes on
// unmount. Pass null load/save when logged out - the hook goes inert and the
// tool stays on its localStorage path.
//
// Safety invariants:
// - A pending save is bound to the saver that was current when it was
//   scheduled, and is flushed the moment `key` changes, so an edit made for
//   character A can never be written to character B.
// - scheduleSave is a no-op until the load for the CURRENT key has resolved,
//   so an edit made while the blob is still in flight can't overwrite the
//   server copy with stale local state.
export function useSyncedBlob<T>({
  key,
  load,
  save,
  onLoaded,
  debounceMs = 1000,
}: {
  key: string | null
  load: (() => Promise<Envelope<ToolBlob<T>>>) | null
  save: ((data: T) => Promise<unknown>) | null
  onLoaded: (data: T | null) => void
  debounceMs?: number
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Pending<T> | null>(null)
  const readyKey = useRef<string | null>(null)
  const loadRef = useRef(load)
  const saveRef = useRef(save)
  const keyRef = useRef(key)
  const onLoadedRef = useRef(onLoaded)

  const flushPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const p = pending.current
    pending.current = null
    if (p) p.save(p.data)
  }, [])

  // Keep refs fresh without retriggering the load effect below (declared
  // first, so it runs before the load effect on every commit).
  useEffect(() => {
    loadRef.current = load
    saveRef.current = save
    onLoadedRef.current = onLoaded
  })

  useEffect(() => {
    if (keyRef.current !== key) {
      // Key switch: send any unsent edit to the OLD key's saver before the
      // new character's data starts loading.
      flushPending()
      keyRef.current = key
      readyKey.current = null
    }
    const loader = loadRef.current
    if (!key || !loader) return
    let cancelled = false
    loader().then(res => {
      if (cancelled) return
      if (res.status !== 'ok') {
        // Blob unreadable (e.g. character deleted elsewhere): blank slate
        // rather than showing the previous character's data under this key.
        onLoadedRef.current(null)
        return
      }
      readyKey.current = key
      const data = res.payload.data
      const empty = !data || Object.keys(data).length === 0
      onLoadedRef.current(empty ? null : data)
    }).catch(() => { /* offline - keep whatever is on screen, saves stay gated */ })
    return () => { cancelled = true }
  }, [key, flushPending])

  const scheduleSave = useCallback((data: T) => {
    const saver = saveRef.current
    if (!saver) return
    if (readyKey.current === null || readyKey.current !== keyRef.current) return
    pending.current = { data, save: saver }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      const p = pending.current
      pending.current = null
      if (p) p.save(p.data)
    }, debounceMs)
  }, [debounceMs])

  // Flush an unsent edit instead of dropping it when the page unmounts.
  useEffect(() => () => { flushPending() }, [flushPending])

  return { scheduleSave }
}
