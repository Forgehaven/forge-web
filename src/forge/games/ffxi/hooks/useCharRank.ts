import { useEffect, useState } from 'react'
import { fetchChar } from '../api'

// Live nation-rank lookup for a registered character. Rank changes as
// characters complete rank-up missions, so it is fetched per character
// (backend caches ok lookups) instead of stored anywhere.
export function useCharRank(name: string | null): string | null {
  const [charRank, setCharRank] = useState<{ name: string; rank: string } | null>(null)

  useEffect(() => {
    if (!name) return
    let cancelled = false
    fetchChar(name)
      .then(res => {
        if (!cancelled && res.status === 'ok' && res.payload.rank) {
          setCharRank({ name, rank: res.payload.rank })
        }
      })
      .catch(() => { /* rank stays unknown */ })
    return () => { cancelled = true }
  }, [name])

  return charRank && charRank.name === name ? charRank.rank : null
}
