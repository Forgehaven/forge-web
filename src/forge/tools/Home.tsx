import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCityFavourites } from '../../hooks/useCityFavourites'
import { useIPInfo } from '../../hooks/useIPInfo'
import { useNow } from '../../hooks/useNow'
import { weatherIcon, windDir, WMO, fetchCurrentWeather, type CurrentWeather } from '../../lib/weather'
import { flag, haversineKm, bearingDeg, formatDist } from '../../lib/geo'

function formatTime(tz: string, date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function getOffset(tz: string, date: Date): string {
  return (
    new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find(p => p.type === 'timeZoneName')?.value ?? ''
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-[#6b7280]">
      <span className="text-[#3a3d4a]">{label}</span> {value}
    </span>
  )
}

export function Home() {
  const now = useNow()
  const { cities, toggle } = useCityFavourites()
  const [pendingRemove, setPendingRemove] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [weather, setWeather] = useState<Record<number, CurrentWeather>>({})
  const fetchedIds = useRef<string>('')
  const { data: ipData } = useIPInfo()

  useEffect(() => {
    const eligible = cities.filter(c => c.latitude != null && c.longitude != null)
    const key = eligible.map(c => c.id).join(',')
    if (!eligible.length || key === fetchedIds.current) return
    fetchedIds.current = key

    Promise.all(
      eligible.map(async c => {
        try {
          const w = await fetchCurrentWeather(c.latitude!, c.longitude!)
          return { id: c.id, w }
        } catch {
          return null
        }
      })
    ).then(results => {
      setWeather(prev => {
        const next = { ...prev }
        results.forEach(r => { if (r) next[r.id] = r.w })
        return next
      })
    })
  }, [cities])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center select-none">

      {cities.length > 0 && (
        <div className="w-full max-w-md mb-10">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg divide-y divide-[#2a2d3a]">
            {cities.map(c => {
              const w = weather[c.id]
              const isExpanded = expandedId === c.id

              return (
                <div key={c.id}>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-lg leading-none shrink-0">{flag(c.country_code)}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-[#e2e4ed]">{c.name}</p>
                      <p className="text-xs text-[#6b7280]">
                        {[c.admin1, c.country].filter(Boolean).join(', ')} · {getOffset(c.timezone, now)}
                      </p>
                    </div>

                    {(w != null || (ipData && c.latitude != null)) && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="flex flex-col items-end shrink-0 gap-0.5 cursor-pointer group"
                        aria-label={isExpanded ? 'Collapse weather' : 'Expand weather'}
                      >
                        {w != null && (
                          <span className="text-xs text-[#6b7280] tabular-nums group-hover:text-[#9ca3af] transition-colors">
                            {weatherIcon(w.weather_code)} {Math.round(w.temperature_2m)}°C
                            <span
                              className="ml-1 inline-block transition-transform duration-200 text-[#3a3d4a]"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            >
                              ▾
                            </span>
                          </span>
                        )}
                        {ipData && c.latitude != null && c.longitude != null && (() => {
                          const deg = bearingDeg(ipData.latitude, ipData.longitude, c.latitude!, c.longitude!)
                          const dist = haversineKm(ipData.latitude, ipData.longitude, c.latitude!, c.longitude!)
                          return (
                            <span className="text-xs text-[#3a3d4a] tabular-nums group-hover:text-[#6b7280] transition-colors">
                              <span className="inline-block" style={{ transform: `rotate(${deg}deg)` }}>↑</span>
                              {' '}{formatDist(dist)}
                            </span>
                          )
                        })()}
                      </button>
                    )}

                    <p className="font-mono text-sm text-[#c4af64] tabular-nums shrink-0">
                      {formatTime(c.timezone, now)}
                    </p>
                    {pendingRemove === c.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-[#6b7280]">Remove?</span>
                        <button
                          onClick={() => { toggle(c); setPendingRemove(null) }}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          aria-label="Confirm remove"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setPendingRemove(null)}
                          className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
                          aria-label="Cancel"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPendingRemove(c.id)}
                        className="text-[#3a3d4a] hover:text-[#6b7280] transition-colors cursor-pointer text-sm shrink-0"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {isExpanded && w != null && (
                    <div className="px-4 pb-3 pt-1 border-t border-[#2a2d3a] bg-[#0f1117] text-left">
                      <p className="text-xs text-[#9ca3af] mb-2">
                        {weatherIcon(w.weather_code)} {WMO[w.weather_code] ?? 'Unknown'} · feels like {Math.round(w.apparent_temperature)}°C
                      </p>
                      <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                        <StatPill label="Wind" value={`${Math.round(w.wind_speed_10m)} km/h ${windDir(w.wind_direction_10m)}`} />
                        <StatPill label="Humidity" value={`${w.relative_humidity_2m}%`} />
                        <StatPill label="UV" value={String(Math.round(w.uv_index ?? 0))} />
                        <StatPill label="Cloud" value={`${w.cloud_cover}%`} />
                        <StatPill label="Pressure" value={`${Math.round(w.surface_pressure)} hPa`} />
                        <StatPill label="Precip" value={`${w.precipitation} mm/h`} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <img
        src="/images/logo.png"
        alt="Forgehaven"
        className="w-16 h-16 mb-5 opacity-40"
      />
      <h1 className="text-2xl font-semibold text-[#e2e4ed] mb-2 tracking-wide">
        Forge<span className="text-[#c4af64]">Tools</span>
      </h1>
      <p className="text-sm text-[#6b7280]">Pick a tool from the sidebar to get started.</p>
      <p className="text-xs text-[#3a3d4a] mt-4 leading-relaxed">
        Everything runs locally in your browser — no data is sent to any server.
      </p>
      {cities.length === 0 && (
        <p className="text-xs text-[#3a3d4a] mt-2">
          Pin a city from{' '}
          <Link to="/tools/timezone-lookup" className="hover:text-[#6b7280] transition-colors underline underline-offset-2">
            City Time Zones
          </Link>
          {' '}or{' '}
          <Link to="/tools/weather" className="hover:text-[#6b7280] transition-colors underline underline-offset-2">
            Weather Lookup
          </Link>
          {' '}to show a world clock here.
        </p>
      )}
    </div>
  )
}
