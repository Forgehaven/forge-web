import { useState } from 'react'
import useSWR from 'swr'
import { weatherIcon, weatherDescription, windDir } from '../lib/weather'
import { useTempUnit, formatTemp, formatWind, formatPressure, formatPrecip } from './useTempUnit'
import { API_URLS, POLL_INTERVALS } from '../config/apiUrls'

interface WeatherResponse {
  current: {
    temperature_2m: number
    weather_code: number
    wind_speed_10m: number
    wind_direction_10m: number
    relative_humidity_2m: number
    uv_index: number
    cloud_cover: number
    surface_pressure: number
    precipitation: number
  }
}

export interface WeatherData {
  summary: string
  wind: string
  humidity: string
  uv: string
  cloud: string
  pressure: string
  precipitation: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const FIELDS = 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,uv_index,cloud_cover,surface_pressure,precipitation'

export function useWeather(lat: number | null, lon: number | null) {
  const [unit] = useTempUnit()
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  const url = lat != null && lon != null
    ? `${API_URLS.weather}?latitude=${lat}&longitude=${lon}&current=${FIELDS}&temperature_unit=celsius`
    : null

  const { data, error } = useSWR<WeatherResponse>(url, fetcher, {
    refreshInterval: POLL_INTERVALS.weather,
    revalidateOnFocus: false,
    onSuccess: () => setFetchedAt(new Date()),
  })

  if (url === null) return { weather: null, loading: false, error: false, fetchedAt: null, apiUrl: null }
  if (!data) return { weather: null, loading: !error, error: !!error, fetchedAt: null, apiUrl: url }

  const { temperature_2m, weather_code, wind_speed_10m, wind_direction_10m, relative_humidity_2m, uv_index, cloud_cover, surface_pressure, precipitation } = data.current

  const weather: WeatherData = {
    summary: `${weatherIcon(weather_code)} ${weatherDescription(weather_code)} ${formatTemp(temperature_2m, unit)}`,
    wind: formatWind(wind_speed_10m, windDir(wind_direction_10m), unit),
    humidity: `${relative_humidity_2m}%`,
    uv: `${Math.round(uv_index ?? 0)}`,
    cloud: `${cloud_cover}%`,
    pressure: formatPressure(surface_pressure, unit),
    precipitation: formatPrecip(precipitation, unit),
  }

  return { weather, loading: false, error: false, fetchedAt, apiUrl: url }
}
