import { useState, useEffect } from 'react'
import { useCityFavourites } from '../../../hooks/useCityFavourites'
import { useNow } from '../../../hooks/useNow'
import { flagUrl, type GeoResult } from '../../../lib/geo'
import { API_URLS } from '../../../config/apiUrls'

function getOffset(tz: string, date: Date): string {
  return (
    new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find(p => p.type === 'timeZoneName')?.value ?? ''
  )
}

function formatTime(tz: string, date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDate(tz: string, date: Date): string {
  return date.toLocaleDateString('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function TimeZoneLookup() {
  const now = useNow()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const { toggle, isFavourite } = useCityFavourites()

  // Debounced city search
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); return } // eslint-disable-line react-hooks/set-state-in-effect

    setLoading(true)
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URLS.geocoding}?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`
        )
        const json = await res.json()
        setResults((json.results ?? []).filter((r: GeoResult) => r.timezone))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { clearTimeout(id); setLoading(false) }
  }, [query])

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-forge-text mb-6">City Time Zones</h1>

      <div className="bg-forge-surface border border-forge-border rounded-lg p-6 flex flex-col gap-4">

        <div>
          <label className="block text-xs text-forge-muted mb-1">Search any city</label>
          <input
            autoFocus
            className="bg-forge-bg border border-forge-border text-forge-text rounded px-3 py-2 text-sm focus:outline-none focus:border-forge-accent w-full"
            placeholder="e.g. Halifax, Tokyo, São Paulo…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {!query && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-forge-muted">Start typing to look up any city's time zone.</p>
            <p className="text-xs text-forge-muted">
              <span className="text-forge-accent">★</span> Star a result to pin it to the home page.
            </p>
          </div>
        )}

        {loading && (
          <p className="text-xs text-forge-muted">Searching…</p>
        )}

        {!loading && query && results.length === 0 && (
          <p className="text-xs text-forge-muted">No cities found for "{query}"</p>
        )}

        {results.length > 0 && (
          <div className="flex flex-col divide-y divide-forge-border">
            {results.map(r => {
              const isFav = isFavourite(r.id)
              return (
                <div key={r.id} className="py-3 flex items-start gap-3">
                  <img src={flagUrl(r.country_code)} alt={r.country_code} className="w-5 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forge-text">
                      {r.name}
                      <span className="text-forge-muted font-normal ml-1.5">
                        {[r.admin1, r.country].filter(Boolean).join(', ')}
                      </span>
                    </p>
                    <p className="font-mono text-xs text-forge-accent mt-0.5">{r.timezone}</p>
                    <p className="text-xs text-forge-muted mt-0.5">
                      {getOffset(r.timezone, now)} · {formatDate(r.timezone, now)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-mono text-lg text-forge-text tabular-nums">
                      {formatTime(r.timezone, now)}
                    </p>
                    <button
                      onClick={() => toggle(r)}
                      className={`text-base cursor-pointer transition-colors ${isFav ? 'text-forge-accent' : 'text-forge-line hover:text-forge-muted'}`}
                      aria-label={isFav ? 'Remove from home' : 'Pin to home'}
                    >
                      ★
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
