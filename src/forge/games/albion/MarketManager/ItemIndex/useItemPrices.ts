import { useEffect, useState } from 'react'
import { fetchItemPrices } from './albionItemsApi'
import type { RawItemPrice } from './types'

// Backend caches prices for 120s, so polling faster gains nothing.
const POLL_MS = 120_000

export function priceKey(itemId: string, city: string, quality: number): string {
  return `${itemId}|${city}|${quality}`
}

interface UseItemPricesResult {
  prices: Map<string, RawItemPrice> // keyed by priceKey(item_id, city, quality)
  fetchedAt: Date | null
  loading: boolean
  error: string | null
}

// Live prices for a batch of item ids at one location across one or more qualities, polled
// every 120s (mirrors useGoldPrice). Re-fetches whenever the id batch, location, or qualities
// change. Multiple qualities let us price materials at quality 1 while the finished item uses
// the selected quality.
export function useItemPrices(
  itemIds: string[],
  location: string,
  qualities: number[],
): UseItemPricesResult {
  const [prices, setPrices] = useState<Map<string, RawItemPrice>>(new Map())
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable, order-independent keys for the deps.
  const idsKey = [...itemIds].sort().join(',')
  const qualKey = [...qualities].sort().join(',')

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (itemIds.length === 0) {
        setPrices(new Map())
        setFetchedAt(null)
        setLoading(false)
        return
      }
      setLoading(true)
      const result = await fetchItemPrices(itemIds, [location], qualities)
      if (cancelled) return
      if (result.status === 'ok') {
        const map = new Map<string, RawItemPrice>()
        for (const p of result.payload) map.set(priceKey(p.item_id, p.city, p.quality), p)
        setPrices(map)
        setFetchedAt(new Date())
        setError(null)
      } else {
        setError(result.message)
      }
      setLoading(false)
    }

    run()
    const interval = setInterval(run, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, location, qualKey])

  return { prices, fetchedAt, loading, error }
}
