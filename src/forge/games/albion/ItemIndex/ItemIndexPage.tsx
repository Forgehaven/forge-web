import { useMemo, useState } from 'react'
import { useItemFavourites } from '../../../../hooks/useItemFavourites'
import { useAllItems } from '../shared/crafting/useAllItems'
import { useItemRecipes } from '../shared/crafting/useItemRecipes'
import {
  buildCraftRow, matchesFilters, EMPTY_FILTERS,
  type CraftRow, type CraftFilterState,
} from './craftRows'
import { CraftFilters } from './CraftFilters'
import { CraftTable } from './CraftTable'

const PAGE_SIZE = 50

export function ItemIndexPage() {
  const { items: allItems, loading, error } = useAllItems()
  const { isFavourite, toggle } = useItemFavourites()
  const [filters, setFilters] = useState<CraftFilterState>(EMPTY_FILTERS)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  // Every item, built once (price-free fields from the id) and name-sorted. Filtering below
  // preserves this order, so we never re-sort the whole list per keystroke.
  const allRows = useMemo<CraftRow[]>(
    () => allItems.map(it => buildCraftRow(it, null)).sort((a, b) => a.name.localeCompare(b.name)),
    [allItems],
  )
  const categories = useMemo(() => [...new Set(allRows.map(r => r.category))].sort(), [allRows])
  const stations = useMemo(
    () => [...new Set(allRows.filter(r => r.station).map(r => r.stationName))].sort(),
    [allRows],
  )

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => allRows.filter(r =>
      (!q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) &&
      matchesFilters(r, filters, isFavourite),
    ),
    [allRows, q, filters, isFavourite],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () => filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE),
    [filtered, current],
  )

  // Recipes only for the visible page - the Materials (BOM) column loads lazily as you page.
  const pageIds = useMemo(() => pageRows.map(r => r.id), [pageRows])
  const { recipes } = useItemRecipes(pageIds)
  const rows = useMemo(
    () => pageRows.map(r => ({ ...r, recipe: recipes.get(r.id) ?? null })),
    [pageRows, recipes],
  )

  function patch(p: Partial<CraftFilterState>) {
    setFilters(f => ({ ...f, ...p }))
    setPage(0)
  }
  function onQuery(v: string) {
    setQuery(v)
    setPage(0)
  }

  const from = filtered.length === 0 ? 0 : current * PAGE_SIZE + 1
  const to = Math.min(filtered.length, current * PAGE_SIZE + PAGE_SIZE)
  const pageBtn = 'px-3 py-1.5 rounded text-sm font-medium bg-[#1a1d27] border border-[#2a2d3a] text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a] disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors'

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full h-full flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
        Albion Online <span className="text-[#c4af64]">Item Index</span>
      </h1>
      <p className="text-xs text-[#6b7280]">
        Every tradeable item - search or filter to narrow, then open one to enter your own prices
        and see the craft tree, cost and margin. Materials load per page.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#6b7280] uppercase tracking-widest">Search</label>
          <input
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Item name..."
            className="bg-[#1a1d27] border border-[#2a2d3a] rounded px-3 py-1.5 text-sm text-[#e2e4ed] focus:border-[#c4af64] outline-none w-56"
          />
        </div>
        <CraftFilters filters={filters} onChange={patch} categories={categories} stations={stations} />
      </div>

      <div className="flex-1 min-h-0">
        {loading && allRows.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Loading items...</p>
        ) : error ? (
          <p className="text-sm text-red-400">Failed to load items: {error}</p>
        ) : rows.length > 0 ? (
          <CraftTable
            rows={rows}
            isFavourite={isFavourite}
            onToggleFav={row => toggle({ id: row.id, name: row.name, tier: row.tier, enchant: row.enchant })}
            footer={`showing ${from}-${to} of ${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
          />
        ) : (
          <p className="text-sm text-[#6b7280]">No items match your filters.</p>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button className={pageBtn} disabled={current === 0} onClick={() => setPage(current - 1)}>‹ Prev</button>
          <span className="text-[#9ca3af]">Page {current + 1} of {pageCount}</span>
          <button className={pageBtn} disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>Next ›</button>
        </div>
      )}
    </div>
  )
}
