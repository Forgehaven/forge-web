import { STORAGE_KEYS } from '../config/storageKeys'
import { useLocalList } from './useLocalList'

export function useFavourites() {
  const { items: favourites, toggle, has: isFavourite } = useLocalList<string, string>(STORAGE_KEYS.favourites, p => p)
  return { favourites, toggle, isFavourite }
}
