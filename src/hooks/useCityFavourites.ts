import { STORAGE_KEYS } from '../config/storageKeys'
import { useLocalList } from './useLocalList'

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

export function useCityFavourites() {
  const { items: cities, toggle, has: isFavourite, move } = useLocalList<CityFavourite, number>(STORAGE_KEYS.cityFavourites, c => c.id)
  return { cities, toggle, isFavourite, move }
}
