import useSWR from 'swr'
import { weatherIcon, weatherDescription } from '../lib/weather'

interface WeatherResponse {
  current: {
    temperature_2m: number
    weather_code: number
  }
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useWeather(lat: number | null, lon: number | null) {
  const url = lat != null && lon != null
    ? `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`
    : null

  const { data, error } = useSWR<WeatherResponse>(url, fetcher, {
    refreshInterval: 600_000,
    revalidateOnFocus: false,
  })

  if (url === null) return { weather: null, loading: false, error: false }
  if (!data) return { weather: null, loading: !error, error: !!error }

  const { temperature_2m, weather_code } = data.current
  return {
    weather: `${weatherIcon(weather_code)} ${weatherDescription(weather_code)} ${Math.round(temperature_2m)}°C`,
    loading: false,
    error: false,
  }
}
