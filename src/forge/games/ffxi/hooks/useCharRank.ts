import { useEffect, useState } from 'react'
import { fetchChar } from '../api'

export interface CharLive {
  rank: string | null
  jobs: Record<string, number> | null
}

// Live armoury lookup for a registered character (rank + job levels), fetched
// per character instead of stored (backend caches ok lookups). An all-zero
// jobs map means the character is /anon; consumers decide how to handle it.
export function useCharLive(name: string | null): CharLive {
  const [live, setLive] = useState<{ name: string; rank: string | null; jobs: Record<string, number> | null } | null>(null)

  useEffect(() => {
    if (!name) return
    let cancelled = false
    fetchChar(name)
      .then(res => {
        if (!cancelled && res.status === 'ok') {
          setLive({ name, rank: res.payload.rank ?? null, jobs: res.payload.jobs ?? null })
        }
      })
      .catch(() => { /* rank/jobs stay unknown */ })
    return () => { cancelled = true }
  }, [name])

  return live && live.name === name
    ? { rank: live.rank, jobs: live.jobs }
    : { rank: null, jobs: null }
}

export function useCharRank(name: string | null): string | null {
  return useCharLive(name).rank
}
