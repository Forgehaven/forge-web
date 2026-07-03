import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../../auth/authContext'
import { useLayoutOverride } from '../../../../components/LayoutOverride'
import { DataTable, type Column } from '../../../../components/DataTable'
import { CITIES, QUALITIES } from '../constants'
import { ItemIcon } from '../ItemIcon'
import { MarketManagerSidebar } from './MarketManagerSidebar'
import { MarketManagerBottomBar } from './MarketManagerBottomBar'
import { usePricesWS } from './usePricesWS'
import {
  loadBvScope, loadCraftStrategy, loadFocus, loadMatSource, loadPremium,
  saveBvScope, saveCraftStrategy, saveMatSource, usePref, usePrefsVersion,
  type BvScope,
} from './premium'
import { DataFreshness, ScanDot } from './DataFreshness'
import { StrategyToggles, ToggleGroup } from './ItemIndex/StrategyToggles'
import { fetchBestValue } from './ItemIndex/albionItemsApi'
import type { BestValuePayload, BestValueRow } from './ItemIndex/types'

function fmt(n: number | null | undefined): string {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('en-US')
}

function cityLabel(city: string): string {
  return CITIES.find(c => c.value === city)?.label ?? city
}

// Top 50 (item, city) pairs across every city by return on materials, computed server-side:
// raw mats bought at Normal quality in the city, the item crafted (or transmuted up) at the
// optimized cost, resold in the same city. Refetches on every poller cycle via the prices WS.
export function BestValuePage() {
  const { isAuthenticated } = useAuth()
  const { setSidebar, setBottomBar } = useLayoutOverride()

  const [payload, setPayload] = useState<BestValuePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  // Live prefs: the Craft Settings modal (or another page's toggles) updates these too.
  const matSource = usePref(loadMatSource)
  const strategy = usePref(loadCraftStrategy)
  const scope = usePref(loadBvScope)
  // premium/focus are read inside the fetch - refetch when the modal flips them.
  const prefsVersion = usePrefsVersion()

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

  useEffect(() => {
    let cancelled = false

    async function load() {
      const result = await fetchBestValue(loadPremium(), loadFocus(), matSource, strategy, scope)
      if (cancelled) return
      if (result.status === 'ok') {
        setPayload(result.payload)
        setError(null)
      } else {
        setError(result.message)
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [tick, matSource, strategy, scope, prefsVersion])

  // Server result is TTL-cached in memory - refetching on every poller cycle is cheap.
  usePricesWS(useCallback(() => setTick(t => t + 1), []))

  const columns: Column<BestValueRow>[] = [
    {
      key: 'name',
      label: 'Item',
      sortKey: r => r.name,
      render: row => (
        <span className="flex items-center gap-2">
          <ItemIcon uniqueName={row.item_id} size={32} />
          <Link
            to={`/games/albion/market-manager/item/${encodeURIComponent(row.item_id)}?quality=${row.quality}&city=${encodeURIComponent(row.city)}`}
            className="text-[#e2e4ed] hover:text-[#c4af64] transition-colors"
          >
            {row.name}
          </Link>
        </span>
      ),
    },
    {
      key: 'tier',
      label: 'Tier',
      sortKey: r => r.tier * 10 + r.enchant,
      render: row => (
        <span className="text-[#9ca3af]">T{row.tier}{row.enchant > 0 ? `.${row.enchant}` : ''}</span>
      ),
    },
    {
      key: 'quality',
      label: 'Quality',
      sortKey: r => r.quality,
      render: row => (
        <span className="text-[#9ca3af]">
          Q{row.quality} · {QUALITIES.find(q => q.value === row.quality)?.label ?? ''}
        </span>
      ),
    },
    {
      key: 'city',
      label: 'City',
      sortKey: r => r.city,
      render: row => <span className="text-[#9ca3af]">{cityLabel(row.city)}</span>,
    },
    {
      key: 'sell',
      label: 'Sell (min)',
      title: 'Dot = when a player last scanned this market in game (per item + town)',
      sortKey: r => r.sell_price_min,
      render: row => (
        <span className="flex items-center gap-1.5">
          <ScanDot
            dataAt={row.data_at ? new Date(row.data_at) : null}
            fetchedAt={payload ? new Date(payload.computed_at) : null}
          />
          <span className="text-[#c4af64] font-medium">{fmt(row.sell_price_min)}</span>
        </span>
      ),
    },
    {
      key: 'base',
      label: 'Craft (base)',
      title: 'Top-level recipe materials bought at current market prices - no sub-crafting',
      sortKey: r => r.craft_cost_base ?? Number.POSITIVE_INFINITY,
      render: row => <span className="text-[#9ca3af]">{fmt(row.craft_cost_base)}</span>,
    },
    {
      key: 'optimized',
      label: 'Craft (optimized)',
      title: 'Cheapest mix of buy / craft / upgrade across the whole recipe tree',
      sortKey: r => r.craft_cost_optimized,
      render: row => <span className="text-[#e2e4ed]">{fmt(row.craft_cost_optimized)}</span>,
    },
    {
      key: 'profit',
      label: 'Profit',
      sortKey: r => r.profit,
      render: row => {
        const cls = row.profit > 0 ? 'text-green-400' : row.profit < 0 ? 'text-red-400' : 'text-[#6b7280]'
        return <span className={cls}>{row.profit > 0 ? '+' : ''}{fmt(row.profit)}</span>
      },
    },
    {
      key: 'return',
      label: 'Return %',
      sortKey: r => r.return_pct,
      render: row => {
        const cls = row.return_pct > 0 ? 'text-green-400' : 'text-red-400'
        return <span className={`${cls} font-semibold`}>{row.return_pct > 0 ? '+' : ''}{row.return_pct.toFixed(1)}%</span>
      },
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto w-full h-full flex flex-col gap-4 select-none">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Albion Online <span className="text-[#c4af64]">Best Value</span>
          </h1>
          <p className="text-xs text-[#6b7280] mt-1">
            Top 50 returns across every city: buy mats, craft (or transmute up), resell in the same city.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <ToggleGroup<BvScope>
            label="Items"
            value={scope}
            options={[['craftable', 'Craftable Items'], ['all', 'All Items']]}
            onChange={saveBvScope}
          />
          <StrategyToggles
            matSource={matSource}
            onMatSource={saveMatSource}
            strategy={strategy}
            onStrategy={saveCraftStrategy}
          />
          {payload && (
            <span className="text-xs text-[#6b7280]">
              computed {new Date(payload.computed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              <DataFreshness
                dataAt={payload.data_updated_at ? new Date(payload.data_updated_at) : null}
                fetchedAt={new Date(payload.computed_at)}
              />
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {error ? (
          <p className="text-sm text-red-400 text-center py-10">Failed to load best value: {error}</p>
        ) : loading && !payload ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#c4af64] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payload && payload.rows.length === 0 ? (
          <p className="text-sm text-[#6b7280] text-center py-10">No craftable items with market data yet.</p>
        ) : payload ? (
          <DataTable
            columns={columns}
            data={payload.rows}
            rowKey={r => `${r.item_id}|${r.city}`}
            defaultSort="return"
            defaultSortDir="desc"
            footer={`${payload.rows.length} rows · ${scope === 'craftable' ? 'station-crafted items only' : 'all items'} · mats at ${matSource === 'buy' ? 'buy-order' : 'instant-buy'} prices, ${strategy} craft cost, Normal quality, per row's city`}
            fill
          />
        ) : null}
      </div>
    </div>
  )
}
