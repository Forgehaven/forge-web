import type { RecipeNode } from '../shared/crafting/types'
import { parseTier, parseEnchant } from '../shared/crafting/itemMeta'
import { itemEcon, itemCategory, stationLabel } from '../shared/crafting/craftEconomics'

// A price-free item row for the universal Item Index / Favourites tables. Everything here is
// derived from the item id + its recipe (no market prices). Your Cost / Margin land in Piece 2
// once user-entered prices exist.
export interface CraftRow {
  id: string
  name: string
  tier: number
  enchant: number
  station: string | null    // station-type value (forge, refining, ...); null = not made at a station
  stationName: string       // display label for the Station column
  category: string          // coarse category (Armour, Warrior Weapon, Resource, ...)
  recipe: RecipeNode | null // for the Materials (BOM) column; loaded lazily per visible page
  craftable: boolean        // has a crafting station (from the id, so it filters without a recipe)
}

export function buildCraftRow(item: { id: string; name: string }, recipe: RecipeNode | null): CraftRow {
  const econ = itemEcon(item.id)
  return {
    id: item.id,
    name: item.name,
    tier: parseTier(item.id),
    enchant: parseEnchant(item.id),
    station: econ?.station ?? null,
    stationName: econ ? stationLabel(econ.station) : '',
    category: itemCategory(item.id),
    recipe,
    craftable: econ != null,
  }
}

export interface CraftFilterState {
  tier: string                       // '' = all, else '1'..'8'
  enchant: string                    // '' = all, else '0'..'4'
  category: string                   // '' = all
  station: string                    // '' = all (matches stationName)
  craftable: 'any' | 'yes' | 'no'
  favOnly: boolean
}

export const EMPTY_FILTERS: CraftFilterState = {
  tier: '', enchant: '', category: '', station: '', craftable: 'any', favOnly: false,
}

export function matchesFilters(
  row: CraftRow,
  f: CraftFilterState,
  isFavourite: (id: string) => boolean,
): boolean {
  if (f.tier && row.tier !== Number(f.tier)) return false
  if (f.enchant && row.enchant !== Number(f.enchant)) return false
  if (f.category && row.category !== f.category) return false
  if (f.station && row.stationName !== f.station) return false
  if (f.craftable === 'yes' && !row.craftable) return false
  if (f.craftable === 'no' && row.craftable) return false
  if (f.favOnly && !isFavourite(row.id)) return false
  return true
}
