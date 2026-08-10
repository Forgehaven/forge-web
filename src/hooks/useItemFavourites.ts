import { STORAGE_KEYS } from '../config/storageKeys'
import { useLocalList } from './useLocalList'

// Snapshot of the display fields at star-time so the Favourites page can render labels
// without a lookup. Prices are always re-fetched live by id. Shape mirrors useCityFavourites.
export interface ItemFavourite {
  id: string // Albion UniqueName
  name: string
  tier: number
  enchant: number
}

export function useItemFavourites() {
  const { items, toggle, has: isFavourite } = useLocalList<ItemFavourite, string>(STORAGE_KEYS.albionItemFavourites, i => i.id)
  return { items, toggle, isFavourite }
}
