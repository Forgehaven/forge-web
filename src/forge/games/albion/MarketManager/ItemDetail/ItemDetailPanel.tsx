import { useMemo, useState, type ReactNode } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ItemIcon } from '../../ItemIcon'
import { QUALITIES } from '../../constants'
import { chartTicks, tickLabel } from '../chartTicks'
import { utcDate } from '../../../../../utils/date'
import { useLiveItemPrices, priceKey } from '../ItemIndex/useItemPrices'
import { useItemRecipes } from '../ItemIndex/useItemRecipes'
import { parseTier, parseEnchant, withTier, withEnchant, tierLabel } from '../ItemIndex/itemMeta'
import { analyzeCraft, collectRecipeIds, profit, type PriceOf } from '../ItemIndex/craftCost'
import { PercentField } from '../ItemIndex/PercentField'
import { useItemHistory } from './useItemHistory'
import { useItemName } from './useItemName'
import { RecipeTreeCard } from './RecipeTreeCard'

const QUALITY_COLORS: Record<number, string> = {
  1: '#9ca3af',
  2: '#4ade80',
  3: '#60a5fa',
  4: '#a78bfa',
  5: '#c4af64',
}

const MODE_COLORS: Record<string, string> = {
  buy: 'text-[#6b7280]',
  craft: 'text-[#60a5fa]',
  upgrade: 'text-[#a78bfa]',
}

const PERIODS = [
  { hours: 24, label: '24H', timeScale: 1 },
  { hours: 168, label: '7D', timeScale: 1 },
  { hours: 720, label: '30D', timeScale: 24 },
]

const TIERS = [1, 2, 3, 4, 5, 6, 7, 8]
const ENCHANTS = [0, 1, 2, 3, 4]
const ALL_QUALITIES = [1, 2, 3, 4, 5]

function fmt(n: number | null | undefined): string {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('en-US')
}

interface ChartPoint {
  time: number
  [key: `q${number}`]: number | undefined
}

function HistoryTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) {
  if (!active || !payload?.length || label == null) return null
  const d = new Date(label)
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded px-3 py-2 text-xs space-y-1 shadow-lg">
      <p className="text-[#6b7280]">
        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
        {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  )
}

function VariantButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-[#c4af64] text-white'
          : 'bg-[#1a1d27] text-[#9ca3af] border border-[#2a2d3a] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
      }`}
    >
      {children}
    </button>
  )
}

// Self-contained item dashboard: variant switchers, per-quality market prices + history chart,
// craft economics, and a quantity-scaled shopping list. Rendered one-up on the detail route and
// two-up on the compare route, so everything it needs rides on props.
export function ItemDetailPanel({
  itemId,
  quality,
  city,
  onItemId,
  onQuality,
  actions,
}: {
  itemId: string
  quality: number
  city: string
  onItemId: (id: string) => void
  onQuality: (q: number) => void
  actions?: ReactNode
}) {
  const [period, setPeriod] = useState(PERIODS[1])
  const [returnPct, setReturnPct] = useState(15)
  const [taxPct, setTaxPct] = useState(6.5)

  const fetchedName = useItemName(itemId)
  const tier = parseTier(itemId)
  const enchant = parseEnchant(itemId)

  const { recipes } = useItemRecipes([itemId])
  const recipe = recipes.get(itemId)
  // The recipe payload carries the server-annotated localized name - prefer it, fall back to
  // the search lookup, then the raw id while both load.
  const name = recipe?.name || fetchedName

  const allIds = useMemo(() => {
    const set = new Set<string>([itemId])
    if (recipe) collectRecipeIds(recipe, set)
    return [...set]
  }, [itemId, recipe])

  const { prices, fetchedAt } = useLiveItemPrices(allIds, city, ALL_QUALITIES)
  const { series, loading: historyLoading, error: historyError } = useItemHistory(itemId, city, period.timeScale)

  // Materials price at quality 1; a 0 from the price API means "no data", not free.
  const priceOf: PriceOf = useMemo(
    () => id => prices.get(priceKey(id, city, 1))?.sell_price_min || null,
    [prices, city],
  )

  const analysis = useMemo(
    () => analyzeCraft(recipe, priceOf, returnPct / 100),
    [recipe, priceOf, returnPct],
  )

  const chartData = useMemo<ChartPoint[]>(() => {
    // Window is anchored to the newest data point (not the wall clock), so a stale market
    // still draws a full chart.
    let latest = 0
    for (const s of series) {
      for (const p of s.data) {
        latest = Math.max(latest, utcDate(p.timestamp).getTime())
      }
    }
    const cutoff = latest - period.hours * 3_600_000
    const byTime = new Map<number, ChartPoint>()
    for (const s of series) {
      for (const p of s.data) {
        const time = utcDate(p.timestamp).getTime()
        if (time < cutoff) continue
        const point = byTime.get(time) ?? { time }
        point[`q${s.quality}`] = p.avg_price
        byTime.set(time, point)
      }
    }
    return [...byTime.values()].sort((a, b) => a.time - b.time)
  }, [series, period])

  const ticks = useMemo(() => chartTicks(chartData.map(p => p.time), period.hours), [chartData, period])
  const chartedQualities = useMemo(
    () => ALL_QUALITIES.filter(q => series.some(s => s.quality === q && s.data.length > 0)),
    [series],
  )

  const sell = prices.get(priceKey(itemId, city, quality))?.sell_price_min || null
  const buy = prices.get(priceKey(itemId, city, quality))?.buy_price_max || null
  const profitSell = profit(sell, analysis?.optimal, taxPct / 100)

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ItemIcon uniqueName={itemId} size={56} quality={quality} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[#e2e4ed] truncate">{name || itemId}</h2>
          <p className="text-xs text-[#6b7280]">
            T{tier}{enchant > 0 ? `.${enchant}` : ''} · {QUALITIES.find(q => q.value === quality)?.label} · {city}
          </p>
        </div>
        {actions}
      </div>

      {/* Variant switchers */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#6b7280] uppercase tracking-widest w-14">Tier</span>
          {TIERS.map(t => (
            <VariantButton key={t} active={t === tier} onClick={() => onItemId(withTier(itemId, t))}>
              T{t}
            </VariantButton>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#6b7280] uppercase tracking-widest w-14">Enchant</span>
          {ENCHANTS.map(e => (
            <VariantButton key={e} active={e === enchant} onClick={() => onItemId(withEnchant(itemId, e))}>
              .{e}
            </VariantButton>
          ))}
        </div>
      </div>

      {/* Per-quality market prices; click selects the quality the stats below use */}
      <div className="grid grid-cols-5 gap-2">
        {QUALITIES.map(q => {
          const p = prices.get(priceKey(itemId, city, q.value))?.sell_price_min || null
          const active = q.value === quality
          return (
            <button
              key={q.value}
              onClick={() => onQuality(q.value)}
              className={`rounded-lg border p-2 text-left cursor-pointer transition-colors ${
                active ? 'border-[#c4af64] bg-[#c4af64]/10' : 'border-[#2a2d3a] bg-[#1a1d27] hover:border-[#3a3d4a]'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider truncate" style={{ color: QUALITY_COLORS[q.value] }}>
                {q.label}
              </p>
              <p className={`text-sm font-semibold ${p != null ? 'text-[#e2e4ed]' : 'text-[#6b7280]'}`}>{fmt(p)}</p>
            </button>
          )
        })}
      </div>

      {/* History chart - one line per quality */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-medium text-[#9ca3af] tracking-wide uppercase">Price History</h3>
          <div className="flex items-center gap-1.5">
            {PERIODS.map(p => (
              <VariantButton key={p.label} active={p.label === period.label} onClick={() => setPeriod(p)}>
                {p.label}
              </VariantButton>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3 text-xs text-[#6b7280] flex-wrap">
          {chartedQualities.map(q => (
            <span key={q} className="flex items-center gap-1">
              <span className="w-3 h-0.5 rounded" style={{ background: QUALITY_COLORS[q] }} />
              {QUALITIES.find(x => x.value === q)?.label}
            </span>
          ))}
        </div>
        {historyError ? (
          <p className="text-sm text-red-400 text-center py-10">Failed to load history: {historyError}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-[#6b7280] text-center py-10">
            {historyLoading ? 'Loading history…' : 'No price history for this window.'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis
                dataKey="time"
                scale="time" type="number"
                domain={['dataMin', 'dataMax']}
                ticks={ticks}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(t: number) => tickLabel(t, period.hours)}
                axisLine={{ stroke: '#2a2d3a' }}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(v: number) => fmt(v)}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<HistoryTooltip />} />
              {chartedQualities.map(q => (
                <Line
                  key={q}
                  type="monotone"
                  dataKey={`q${q}`}
                  stroke={QUALITY_COLORS[q]}
                  strokeWidth={q === quality ? 2 : 1.25}
                  dot={false}
                  name={QUALITIES.find(x => x.value === q)?.label}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Economics */}
      <div className="flex flex-wrap items-end gap-3">
        <PercentField label="Return %" value={returnPct} onChange={setReturnPct} />
        <PercentField label="Tax %" value={taxPct} onChange={setTaxPct} />
        {fetchedAt && (
          <span className="text-xs text-[#6b7280] pb-1.5">
            prices updated {fetchedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <StatCard label="Sell (min)" value={fmt(sell)} />
        <StatCard label="Buy (max)" value={fmt(buy)} />
        <StatCard label="Craft (base)" value={fmt(analysis?.fullBuy)} title="Top-level recipe materials bought at current market prices - no sub-crafting" />
        <StatCard label="Craft (optimized)" value={fmt(analysis?.optimal)} title="Cheapest mix of buy / craft / upgrade across the whole recipe tree" gold />
        <StatCard
          label="Profit (sell)"
          value={profitSell == null ? '-' : `${profitSell > 0 ? '+' : ''}${fmt(profitSell)}`}
          tone={profitSell == null ? undefined : profitSell > 0 ? 'green' : 'red'}
        />
      </div>

      {/* Craft breakdown: base (all bought) vs optimized (buy/craft/upgrade mix) */}
      {analysis && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-[#9ca3af] tracking-wide uppercase">Base Materials</h3>
              <span className="font-mono text-[#9ca3af]">{fmt(analysis.fullBuy)}</span>
            </div>
            {analysis.baseMaterials.map(m => (
              <div key={m.id} className="flex justify-between gap-3">
                <span className="text-[#9ca3af] truncate">{m.count}× {tierLabel(m.id)} {m.name}</span>
                <span className="font-mono text-[#e2e4ed] shrink-0">{fmt(m.subtotal)}</span>
              </div>
            ))}
            <p className="text-[10px] text-[#6b7280] pt-0.5">top-level recipe materials bought at market</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-[#9ca3af] tracking-wide uppercase">Optimized Materials</h3>
              <span className="font-mono text-[#c4af64]">{fmt(analysis.optimal)}</span>
            </div>
            {analysis.materials.map(m => (
              <div key={m.id} className="flex justify-between gap-3">
                <span className="text-[#9ca3af] truncate">{m.count}× {tierLabel(m.id)} {m.name}</span>
                <span className="font-mono text-right shrink-0">
                  <span className={MODE_COLORS[m.mode]}>{m.mode}</span>{' '}
                  <span className="text-[#e2e4ed]">{fmt(m.subtotal)}</span>
                </span>
              </div>
            ))}
            {analysis.silver > 0 && (
              <p className="text-[10px] text-[#6b7280] pt-0.5">+ {fmt(analysis.silver)} silver crafting fee</p>
            )}
            {analysis.amount > 1 && (
              <p className="text-[10px] text-[#6b7280] pt-0.5">per unit · crafts {analysis.amount} at once</p>
            )}
          </div>
        </div>
      )}

      {/* Crafting tree flowchart with the aggregated shopping list beside it */}
      {recipe && recipe.craftable && recipe.recipe.length > 0 && (
        <RecipeTreeCard
          recipe={recipe}
          priceOf={priceOf}
          rr={returnPct / 100}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, title, gold, tone }: { label: string; value: string; title?: string; gold?: boolean; tone?: 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-green-400' : tone === 'red' ? 'text-red-400' : gold ? 'text-[#c4af64]' : 'text-[#e2e4ed]'
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-3" title={title}>
      <p className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-base font-semibold ${color}`}>{value}</p>
    </div>
  )
}
