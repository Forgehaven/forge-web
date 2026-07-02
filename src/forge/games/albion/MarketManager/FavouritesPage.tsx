import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../auth/authContext'
import { useLayoutOverride } from '../../../../components/LayoutOverride'
import { useItemFavourites } from '../../../../hooks/useItemFavourites'
import { DEFAULT_CITY, DEFAULT_QUALITY } from '../constants'
import { MarketManagerSidebar } from './MarketManagerSidebar'
import { MarketManagerBottomBar } from './MarketManagerBottomBar'
import { useEnrichedRows, type BaseItem } from './ItemIndex/useEnrichedRows'
import { buildItemColumns } from './ItemIndex/itemColumns'
import { ItemTable } from './ItemIndex/ItemTable'
import { ItemFilters } from './ItemIndex/ItemFilters'
import { PercentField } from './ItemIndex/PercentField'

export function FavouritesPage() {
  const { isAuthenticated } = useAuth()
  const { setSidebar, setBottomBar } = useLayoutOverride()
  const { items: favourites, isFavourite, toggle } = useItemFavourites()

  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [location, setLocation] = useState(DEFAULT_CITY)
  const [returnPct, setReturnPct] = useState(15)
  const [taxPct, setTaxPct] = useState(6.5)

  useEffect(() => {
    if (isAuthenticated) {
      setSidebar(MarketManagerSidebar)
      setBottomBar(MarketManagerBottomBar)
    } else {
      setSidebar(null)
      setBottomBar(null)
    }
    return () => { setSidebar(null); setBottomBar(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const baseItems = useMemo<BaseItem[]>(
    () => favourites.map(f => ({ id: f.id, name: f.name, tier: f.tier, enchant: f.enchant })),
    [favourites],
  )

  const { rows, fetchedAt, priceError } = useEnrichedRows(baseItems, location, quality, returnPct / 100)

  const columns = useMemo(
    () => buildItemColumns({
      isFavourite,
      onToggleFav: row => toggle({ id: row.id, name: row.name, tier: row.tier, enchant: row.enchant }),
      quality,
      showCraft: true,
      taxRate: taxPct / 100,
      returnRate: returnPct / 100,
    }),
    [isFavourite, toggle, quality, taxPct, returnPct],
  )

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-4 select-none">
      <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
        Albion Online <span className="text-[#c4af64]">Favourites</span>
      </h1>

      <div className="flex flex-wrap items-end gap-3">
        <ItemFilters
          showCatalogFilters={false}
          tier=""
          onTier={() => {}}
          enchant=""
          onEnchant={() => {}}
          quality={quality}
          onQuality={setQuality}
          location={location}
          onLocation={setLocation}
        />
        <PercentField label="Return %" value={returnPct} onChange={setReturnPct} />
        <PercentField label="Tax %" value={taxPct} onChange={setTaxPct} />
      </div>

      {fetchedAt && (
        <p className="text-xs text-[#6b7280]">
          prices updated {fetchedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          {priceError && <span className="text-red-400"> · prices unavailable</span>}
        </p>
      )}

      <ItemTable
        rows={rows}
        columns={columns}
        empty="No favourites yet - star items in the Item Index."
        footer={`${rows.length} favourite${rows.length === 1 ? '' : 's'}`}
      />
    </div>
  )
}
