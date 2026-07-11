import { useMemo, useState } from 'react'
import { useItemFavourites } from '../../../../hooks/useItemFavourites'
import { useItemRecipes } from '../shared/crafting/useItemRecipes'
import {
  buildCraftRow, matchesFilters, EMPTY_FILTERS,
  type CraftRow, type CraftFilterState,
} from '../ItemIndex/craftRows'
import { CraftFilters } from '../ItemIndex/CraftFilters'
import { CraftTable } from '../ItemIndex/CraftTable'

// Favourite Items is the Item Index scoped to the user's starred items. Same price-free table;
// the source is the local favourites list instead of a live search.
export function FavouritesPage() {
  const { items: favourites, isFavourite, toggle } = useItemFavourites()
  const ids = useMemo(() => favourites.map(f => f.id), [favourites])
  const { recipes } = useItemRecipes(ids)
  const [filters, setFilters] = useState<CraftFilterState>(EMPTY_FILTERS)

  const rows = useMemo<CraftRow[]>(
    () => favourites.map(f => buildCraftRow(f, recipes.get(f.id) ?? null)),
    [favourites, recipes],
  )
  const categories = useMemo(() => [...new Set(rows.map(r => r.category))].sort(), [rows])
  const stations = useMemo(
    () => [...new Set(rows.filter(r => r.station).map(r => r.stationName))].sort(),
    [rows],
  )
  const filtered = useMemo(
    () => rows.filter(r => matchesFilters(r, filters, isFavourite)),
    [rows, filters, isFavourite],
  )

  function patch(p: Partial<CraftFilterState>) {
    setFilters(f => ({ ...f, ...p }))
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full h-full flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
        Albion Online <span className="text-[#c4af64]">Favourite Items</span>
      </h1>

      <div className="flex flex-wrap items-end gap-3">
        <CraftFilters filters={filters} onChange={patch} categories={categories} stations={stations} hideFavToggle />
      </div>

      <div className="flex-1 min-h-0">
        {filtered.length > 0 ? (
          <CraftTable
            rows={filtered}
            isFavourite={isFavourite}
            onToggleFav={row => toggle({ id: row.id, name: row.name, tier: row.tier, enchant: row.enchant })}
            footer={`${filtered.length} favourite${filtered.length === 1 ? '' : 's'}`}
          />
        ) : (
          <p className="text-sm text-[#6b7280]">No favourites yet - star items in the Item Index.</p>
        )}
      </div>
    </div>
  )
}
