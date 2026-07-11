import { useEffect, useState } from 'react'
import { fetchAllItems } from './craftingApi'
import type { AlbionItem } from './types'

// The full tradeable-item list is static, so cache it at module scope and share one in-flight
// request across every mount. The Item Index filters/paginates this client-side.
let cache: AlbionItem[] | null = null
let inflight: Promise<AlbionItem[]> | null = null

export function useAllItems(): { items: AlbionItem[]; loading: boolean; error: string | null } {
  const [items, setItems] = useState<AlbionItem[]>(cache ?? [])
  const [loading, setLoading] = useState(cache == null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    if (!inflight) {
      inflight = fetchAllItems().then(res => {
        if (res.status !== 'ok') throw new Error(res.message)
        cache = res.payload
        return res.payload
      })
    }
    inflight.then(data => {
      if (cancelled) return
      setItems(data)
      setLoading(false)
    }).catch(err => {
      if (cancelled) return
      inflight = null // let a later mount retry
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return { items, loading, error }
}
