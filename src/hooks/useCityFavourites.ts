import { useState } from 'react'

export type CityFavourite = {
  id: number
  name: string
  country_code: string
  country: string
  admin1?: string
  timezone: string
  latitude?: number
  longitude?: number
}

const KEY = 'forgetools_city_favourites'

function load(): CityFavourite[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useCityFavourites() {
  const [cities, setCities] = useState<CityFavourite[]>(load)

  function toggle(city: CityFavourite) {
    setCities(prev => {
      const next = prev.some(c => c.id === city.id)
        ? prev.filter(c => c.id !== city.id)
        : [...prev, city]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  function isFavourite(id: number) {
    return cities.some(c => c.id === id)
  }

  return { cities, toggle, isFavourite }
}
