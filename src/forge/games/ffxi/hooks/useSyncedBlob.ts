import { useCallback, useEffect, useRef } from 'react'
import type { Envelope } from '../../../../lib/api'
import type { PutResult, ToolBlob } from '../api'

type Saver<T> = (data: T, baseUpdatedAt: string | null) => Promise<Envelope<PutResult>>
type Pending<T> = { data: T; key: string; save: Saver<T> }

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
// - Saves carry the blob's last seen updated_at; a 'conflict' reply (another
//   device wrote first) means server wins: the returned blob is fed back
//   through onLoaded and the local write is dropped.
export function useSyncedBlob<T>({
  key,
  load,
  save,
  onLoaded,
  debounceMs = 1000,
}: {
  key: string | null
  load: (() => Promise<Envelope<ToolBlob<T>>>) | null
  save: Saver<T> | null
  onLoaded: (data: T | null) => void
  debounceMs?: number
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Pending<T> | null>(null)
  const readyKey = useRef<string | null>(null)
  const baseUpdatedAt = useRef<string | null>(null)
  const loadRef = useRef(load)
  const saveRef = useRef(save)
  const keyRef = useRef(key)
  const onLoadedRef = useRef(onLoaded)

  const runSave = useCallback((p: Pending<T>) => {
    p.save(p.data, baseUpdatedAt.current)
      .then(res => {
        if (!res || keyRef.current !== p.key) return
        if (res.status === 'ok') {
          baseUpdatedAt.current = res.payload?.updated_at ?? null
        } else if (res.message === 'conflict') {
          const server = res.payload as
            | { data?: T | null; updated_at?: string | null }
            | undefined
          baseUpdatedAt.current = server?.updated_at ?? null
          const data = server?.data
          const empty = !data || Object.keys(data).length === 0
          onLoadedRef.current(empty ? null : data)
        }
      })
      .catch(() => { /* offline - edit stays local */ })
  }, [])

  const flushPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const p = pending.current
    pending.current = null
    if (p) runSave(p)
  }, [runSave])

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
      baseUpdatedAt.current = null
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
      baseUpdatedAt.current = res.payload.updated_at ?? null
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
    pending.current = { data, key: readyKey.current, save: saver }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      const p = pending.current
      pending.current = null
      if (p) runSave(p)
    }, debounceMs)
  }, [debounceMs, runSave])

  // Flush an unsent edit instead of dropping it when the page unmounts.
  useEffect(() => () => { flushPending() }, [flushPending])

  return { scheduleSave }
}
