import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../../auth/authContext'
import { useLayoutOverride } from '../../../../components/LayoutOverride'
import { DataTable, type Column } from '../../../../components/DataTable'
import { CITIES } from '../constants'
import { ItemIcon } from '../ItemIcon'
import { MarketManagerSidebar } from './MarketManagerSidebar'
import { MarketManagerBottomBar } from './MarketManagerBottomBar'
import { usePricesWS } from './usePricesWS'
import { loadFocus, loadPremium } from './premium'
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
      const result = await fetchBestValue(loadPremium(), loadFocus())
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
  }, [tick])

  // Server result is TTL-cached in memory - refetching on every poller cycle is cheap.
  usePricesWS(useCallback(() => setTick(t => t + 1), []))

  const columns: Column<BestValueRow>[] = [
    {
      key: 'name',
      label: 'Item',
      sortKey: r => r.name,
      render: row => (
        <span className="flex items-center gap-2">
          <ItemIcon uniqueName={row.item_id} size={32} quality={row.quality} />
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
      key: 'city',
      label: 'City',
      sortKey: r => r.city,
      render: row => <span className="text-[#9ca3af]">{cityLabel(row.city)}</span>,
    },
    {
      key: 'sell',
      label: 'Sell (min)',
      sortKey: r => r.sell_price_min,
      render: row => <span className="text-[#c4af64] font-medium">{fmt(row.sell_price_min)}</span>,
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
    <div className="p-6 max-w-7xl mx-auto w-full space-y-4 select-none">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Albion Online <span className="text-[#c4af64]">Best Value</span>
          </h1>
          <p className="text-xs text-[#6b7280] mt-1">
            Top 50 returns across every city: buy mats, craft (or transmute up), resell in the same city.
          </p>
        </div>
        {payload && (
          <span className="text-xs text-[#6b7280]">
            computed {new Date(payload.computed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        )}
      </div>

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
          footer={`${payload.rows.length} rows · materials priced at Normal quality in each row's city`}
        />
      ) : null}
    </div>
  )
}
