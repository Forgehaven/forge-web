import { useState, useEffect } from 'react'
import { useCityFavourites } from '../../hooks/useCityFavourites'
import { weatherIcon, windDir, WMO, fetchCurrentWeather, type CurrentWeather } from '../../lib/weather'
import { flag, type GeoResult } from '../../lib/geo'

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0f1117] border border-[#2a2d3a] rounded p-3">
      <p className="text-xs text-[#6b7280] mb-1">{label}</p>
      <p className="font-mono text-sm text-[#e2e4ed]">{value}</p>
    </div>
  )
}

export function WeatherLookup() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selected, setSelected] = useState<GeoResult | null>(null)
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const { toggle, isFavourite } = useCityFavourites()

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); return } // eslint-disable-line react-hooks/set-state-in-effect

    setSearchLoading(true)
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`
        )
        const json = await res.json()
        setResults((json.results ?? []).filter((r: GeoResult) => r.timezone))
      } catch {
        setResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => { clearTimeout(id); setSearchLoading(false) }
  }, [query])

  function selectCity(city: GeoResult) {
    setSelected(city)
    setWeather(null)
    setWeatherLoading(true)
    fetchCurrentWeather(city.latitude, city.longitude)
      .then(w => { setWeather(w); setWeatherLoading(false) })
      .catch(() => setWeatherLoading(false))
  }

  function handleQueryChange(val: string) {
    setQuery(val)
    if (selected) { setSelected(null); setWeather(null) }
  }

  const isFav = selected ? isFavourite(selected.id) : false

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Weather Lookup</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Search any city</label>
          <input
            autoFocus
            className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full"
            placeholder="e.g. Halifax, Tokyo, São Paulo…"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
          />
        </div>

        {!query && !selected && (
          <p className="text-xs text-[#6b7280]">
            Search for a city to see current weather conditions.{' '}
            <span className="text-[#c4af64]">★</span> Star a result to pin it to your home page.
          </p>
        )}

        {searchLoading && <p className="text-xs text-[#6b7280]">Searching…</p>}

        {!searchLoading && query && !selected && results.length === 0 && (
          <p className="text-xs text-[#6b7280]">No cities found for "{query}"</p>
        )}

        {!selected && results.length > 0 && (
          <div className="flex flex-col divide-y divide-[#2a2d3a]">
            {results.map(r => (
              <div
                key={r.id}
                className="py-3 flex items-center gap-3 cursor-pointer hover:bg-[#0f1117] -mx-6 px-6 transition-colors"
                onClick={() => selectCity(r)}
              >
                <span className="text-2xl leading-none shrink-0">{flag(r.country_code)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e2e4ed]">
                    {r.name}
                    <span className="text-[#6b7280] font-normal ml-1.5">
                      {[r.admin1, r.country].filter(Boolean).join(', ')}
                    </span>
                  </p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{r.timezone}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggle(r) }}
                  className={`text-base cursor-pointer transition-colors shrink-0 ${isFavourite(r.id) ? 'text-[#c4af64]' : 'text-[#3a3d4a] hover:text-[#6b7280]'}`}
                  aria-label={isFavourite(r.id) ? 'Remove from home' : 'Pin to home'}
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelected(null); setWeather(null) }}
                  className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <div>
                  <span className="text-sm font-medium text-[#e2e4ed]">{flag(selected.country_code)} {selected.name}</span>
                  <span className="text-xs text-[#6b7280] ml-1.5">
                    {[selected.admin1, selected.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggle(selected)}
                className={`text-base cursor-pointer transition-colors ${isFav ? 'text-[#c4af64]' : 'text-[#3a3d4a] hover:text-[#6b7280]'}`}
                aria-label={isFav ? 'Remove from home' : 'Pin to home'}
              >
                ★
              </button>
            </div>

            {weatherLoading && <p className="text-xs text-[#6b7280]">Loading weather…</p>}

            {weather && (
              <>
                <div className="flex items-center gap-4 pt-1 border-t border-[#2a2d3a]">
                  <p className="text-5xl font-mono text-[#c4af64]">{Math.round(weather.temperature_2m)}°C</p>
                  <div>
                    <p className="text-sm text-[#e2e4ed]">
                      {weatherIcon(weather.weather_code)} {WMO[weather.weather_code] ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      Feels like {Math.round(weather.apparent_temperature)}°C
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <StatBox label="Humidity"     value={`${weather.relative_humidity_2m}%`} />
                  <StatBox label="Wind"          value={`${Math.round(weather.wind_speed_10m)} km/h ${windDir(weather.wind_direction_10m)}`} />
                  <StatBox label="UV Index"      value={String(Math.round(weather.uv_index ?? 0))} />
                  <StatBox label="Pressure"      value={`${Math.round(weather.surface_pressure)} hPa`} />
                  <StatBox label="Precipitation" value={`${weather.precipitation} mm/h`} />
                  <StatBox label="Cloud Cover"   value={`${weather.cloud_cover}%`} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
