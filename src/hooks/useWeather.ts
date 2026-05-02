import useSWR from 'swr'
import { weatherIcon, weatherDescription, windDir } from '../lib/weather'

interface WeatherResponse {
  current: {
    temperature_2m: number
    weather_code: number
    wind_speed_10m: number
    wind_direction_10m: number
    relative_humidity_2m: number
    uv_index: number
    cloud_cover: number
  }
}

export interface WeatherData {
  summary: string
  wind: string
  humidity: string
  uv: string
  cloud: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const FIELDS = 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,uv_index,cloud_cover'

export function useWeather(lat: number | null, lon: number | null) {
  const url = lat != null && lon != null
    ? `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${FIELDS}&temperature_unit=celsius`
    : null

  const { data, error } = useSWR<WeatherResponse>(url, fetcher, {
    refreshInterval: 600_000,
    revalidateOnFocus: false,
  })

  if (url === null) return { weather: null, loading: false, error: false }
  if (!data) return { weather: null, loading: !error, error: !!error }

  const { temperature_2m, weather_code, wind_speed_10m, wind_direction_10m, relative_humidity_2m, uv_index, cloud_cover } = data.current

  const weather: WeatherData = {
    summary: `${weatherIcon(weather_code)} ${weatherDescription(weather_code)} ${Math.round(temperature_2m)}°C`,
    wind: `${Math.round(wind_speed_10m)} km/h ${windDir(wind_direction_10m)}`,
    humidity: `${relative_humidity_2m}%`,
    uv: `${Math.round(uv_index ?? 0)}`,
    cloud: `${cloud_cover}%`,
  }

  return { weather, loading: false, error: false }
}
