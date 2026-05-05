import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCityFavourites } from '../../hooks/useCityFavourites'
import { useIPInfo } from '../../hooks/useIPInfo'
import { useNow } from '../../hooks/useNow'
import { weatherIcon, windDir, WMO, fetchCurrentWeather, buildWeatherUrl, type CurrentWeather } from '../../lib/weather'
import { FetchedAtLink } from '../../components/FetchedAtLink'
import { useTempUnit, formatTemp, formatWind, formatPressure, formatPrecip, formatDist } from '../../hooks/useTempUnit'
import { flagUrl, haversineKm, bearingDeg } from '../../lib/geo'
import { GripIcon, SortIcon } from '../../components/Icons'
import { StatPill } from '../../components/UI'
import { ConfirmButton } from '../../components/ConfirmButton'

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


export function ToolsHome() {
  const now = useNow()
  const [unit] = useTempUnit()
  const { cities, toggle, move } = useCityFavourites()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [weather, setWeather] = useState<Record<number, CurrentWeather>>({})
  const [weatherFetchedAt, setWeatherFetchedAt] = useState<Record<number, Date>>({})
  const fetchedIds = useRef<string>('')
  const { data: ipData } = useIPInfo()
  const [rearranging, setRearranging] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    const eligible = cities.filter(c => c.latitude != null && c.longitude != null)
    const key = eligible.map(c => c.id).join(',')
    if (!eligible.length || key === fetchedIds.current) return
    fetchedIds.current = key

    const fetchedAt = new Date()
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
      setWeatherFetchedAt(prev => {
        const next = { ...prev }
        results.forEach(r => { if (r) next[r.id] = fetchedAt })
        return next
      })
    })
  }, [cities])

  function enterRearrange() {
    setExpandedId(null)
    setRearranging(true)
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(index: number) {
    if (dragIndex !== null && dragIndex !== index) {
      move(dragIndex, index)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full min-h-[60vh] text-center select-none">

      {cities.length > 0 && (
        <div className="w-full max-w-md mb-10">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg divide-y divide-[#2a2d3a] overflow-hidden">
            {cities.map((c, index) => {
              const w = weather[c.id]
              const isExpanded = expandedId === c.id
              const isDragging = dragIndex === index
              const isDragOver = dragOverIndex === index && dragIndex !== index

              return (
                <div
                  key={c.id}
                  draggable={rearranging}
                  onDragStart={rearranging ? () => handleDragStart(index) : undefined}
                  onDragOver={rearranging ? e => handleDragOver(e, index) : undefined}
                  onDrop={rearranging ? () => handleDrop(index) : undefined}
                  onDragEnd={rearranging ? handleDragEnd : undefined}
                  className={`transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'} ${isDragOver ? 'border-t-2 border-t-[#c4af64]/50' : ''}`}
                >
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    {rearranging ? (
                      <span className="shrink-0 cursor-grab active:cursor-grabbing"><GripIcon /></span>
                    ) : (
                      <img src={flagUrl(c.country_code)} alt={c.country_code} className="w-5 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-[#e2e4ed]">{c.name}</p>
                      {!rearranging && (
                        <p className="text-xs text-[#6b7280]">
                          {[c.admin1, c.country].filter(Boolean).join(', ')} · {getOffset(c.timezone, now)}
                        </p>
                      )}
                      {rearranging && (
                        <p className="text-xs text-[#3a3d4a]">
                          {[c.admin1, c.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>

                    {rearranging ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => index > 0 && move(index, index - 1)}
                          disabled={index === 0}
                          className="text-[#3a3d4a] hover:text-[#c4af64] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer text-base leading-none px-1"
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => index < cities.length - 1 && move(index, index + 1)}
                          disabled={index === cities.length - 1}
                          className="text-[#3a3d4a] hover:text-[#c4af64] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer text-base leading-none px-1"
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    ) : (
                      <>
                        {(w != null || (ipData && c.latitude != null)) && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            className="flex flex-col items-end shrink-0 gap-0.5 cursor-pointer group"
                            aria-label={isExpanded ? 'Collapse weather' : 'Expand weather'}
                          >
                            {w != null && (
                              <span className="text-xs text-[#6b7280] tabular-nums group-hover:text-[#9ca3af] transition-colors">
                                {weatherIcon(w.weather_code)} {formatTemp(w.temperature_2m, unit)}
                                <span
                                  className="ml-1 inline-block transition-transform duration-200 text-[#3a3d4a]"
                                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
                                  ▾
                                </span>
                              </span>
                            )}
                            {ipData && c.latitude != null && c.longitude != null && (() => {
                              const dist = haversineKm(ipData.latitude, ipData.longitude, c.latitude!, c.longitude!)
                              if (dist < 50) return (
                                <span className="text-xs text-[#c4af64]/50 italic">you're here</span>
                              )
                              const deg = bearingDeg(ipData.latitude, ipData.longitude, c.latitude!, c.longitude!)
                              return (
                                <span className="text-xs text-[#c4af64]/50 tabular-nums group-hover:text-[#c4af64]/80 transition-colors">
                                  <span className="inline-block" style={{ transform: `rotate(${deg}deg)` }}>↑</span>
                                  {' '}{formatDist(dist, unit)}
                                </span>
                              )
                            })()}
                          </button>
                        )}

                        <p className="font-mono text-sm text-[#c4af64] tabular-nums shrink-0">
                          {formatTime(c.timezone, now)}
                        </p>
                        <ConfirmButton
                          label="×"
                          confirmPrompt="Remove?"
                          confirmLabel="✓"
                          cancelLabel="✗"
                          onConfirm={() => toggle(c)}
                          className="text-[#3a3d4a] hover:text-[#6b7280] transition-colors cursor-pointer text-sm shrink-0"
                        />
                      </>
                    )}
                  </div>

                  {isExpanded && w != null && !rearranging && (
                    <div className="px-4 pb-3 pt-1 border-t border-[#2a2d3a] bg-[#0f1117] text-left">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs text-[#9ca3af]">
                          {weatherIcon(w.weather_code)} {WMO[w.weather_code] ?? 'Unknown'} · feels like {formatTemp(w.apparent_temperature, unit)}
                        </p>
                        {weatherFetchedAt[c.id] && c.latitude != null && c.longitude != null && (
                          <FetchedAtLink
                            date={weatherFetchedAt[c.id]}
                            url={buildWeatherUrl(c.latitude, c.longitude)}
                            className="shrink-0 ml-3"
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                        <StatPill label="Wind" value={formatWind(w.wind_speed_10m, windDir(w.wind_direction_10m), unit)} />
                        <StatPill label="Humidity" value={`${w.relative_humidity_2m}%`} />
                        <StatPill label="UV" value={String(Math.round(w.uv_index ?? 0))} />
                        <StatPill label="Cloud" value={`${w.cloud_cover}%`} />
                        <StatPill label="Pressure" value={formatPressure(w.surface_pressure, unit)} />
                        <StatPill label="Precip" value={formatPrecip(w.precipitation, unit)} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {cities.length > 1 && (
            <div className="flex justify-end mt-2">
              <button
                onClick={() => rearranging ? setRearranging(false) : enterRearrange()}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  rearranging
                    ? 'text-[#c4af64] hover:text-[#c4af64]/80'
                    : 'text-[#3a3d4a] hover:text-[#6b7280]'
                }`}
              >
                {rearranging ? (
                  <>✓ done</>
                ) : (
                  <><SortIcon /> reorder</>
                )}
              </button>
            </div>
          )}
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
          {' '}to show a clock and weather here.
        </p>
      )}
    </div>
  )
}
