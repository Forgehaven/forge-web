import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../../auth/authContext'
import { CITIES, QUALITIES, DEFAULT_QUALITY } from '../shared/constants'
import { ItemIcon } from '../shared/ItemIcon'
import { useItemRecipes } from '../shared/crafting/useItemRecipes'
import { RecipeTreeCard } from '../shared/crafting/RecipeTreeCard'
import {
  analyzeCraft, strategyCost, profit,
  type CraftStrategy3, type PriceOf, type ReturnRateOf,
} from '../shared/crafting/craftCost'
import {
  returnRateFor, userStationFee, salesTaxRate,
  itemEcon, itemCategory, stationLabel,
} from '../shared/crafting/craftEconomics'
import { parseTier, tierLabel, isResource } from '../shared/crafting/itemMeta'
import { useUserCraftSettings } from '../shared/settings/craftSettings'
import { fmt } from '../shared/crafting/marketFormat'
import { priceFrom, setPrice, useUserPrices } from '../shared/prices/userStore'
import type { RecipeNode } from '../shared/crafting/types'

const SELECT = 'bg-[#1a1d27] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-[#e2e4ed] focus:border-[#c4af64] outline-none cursor-pointer'
const PRICE_INPUT = 'w-28 bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1 text-sm text-right text-[#e2e4ed] focus:border-[#c4af64] outline-none'

const STRATEGIES: { value: CraftStrategy3; label: string }[] = [
  { value: 'optimized', label: 'Optimized' },
  { value: 'base', label: 'Base mats' },
  { value: 'full', label: 'Full craft' },
]

// Every material id (with its display name) you would buy along the recipe tree - the root
// item is excluded (you sell that, not buy it). Insertion order follows the tree.
function collectMaterials(node: RecipeNode, acc: Map<string, string>): void {
  for (const child of node.recipe) {
    acc.set(child.item_id, child.name || child.item_id)
    collectMaterials(child, acc)
  }
  if (node.upgrade) {
    acc.set(node.upgrade.from.item_id, node.upgrade.from.name || node.upgrade.from.item_id)
    collectMaterials(node.upgrade.from, acc)
    for (const m of node.upgrade.materials) acc.set(m.item_id, m.name || m.item_id)
  }
}

export function ItemDetailPage() {
  const { itemId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const prices = useUserPrices()
  const settings = useUserCraftSettings()
  const { isAuthenticated } = useAuth()

  const resource = isResource(itemId)
  const city = params.get('city') || settings.defaultCity
  const quality = resource ? 1 : (Number(params.get('quality')) || DEFAULT_QUALITY)

  const { recipes, loading } = useItemRecipes([itemId])
  const recipe = recipes.get(itemId) ?? null

  const premium = settings.premium
  const focus = settings.focus
  const [strategy, setStrategy] = useState<CraftStrategy3>(settings.craftStrategy)
  const [qty, setQty] = useState(1)

  // Materials are priced at Normal quality (1) per city, mirroring the crafting math.
  const priceOf: PriceOf = useMemo(() => (id: string) => priceFrom(prices, id, city, 1), [prices, city])
  const rrOf: ReturnRateOf = useMemo(() => (id: string) => returnRateFor(id, city, focus), [city, focus])
  const itemValue = recipe?.item_value ?? null
  const stationFee = useMemo(
    () => userStationFee(itemId, city, settings.stationFees, itemValue),
    [itemId, city, settings.stationFees, itemValue],
  )

  const analysis = useMemo(
    () => (recipe ? analyzeCraft(recipe, priceOf, rrOf, stationFee) : null),
    [recipe, priceOf, rrOf, stationFee],
  )
  const cost = analysis ? strategyCost(analysis, strategy) : null

  const materials = useMemo(() => {
    const acc = new Map<string, string>()
    if (recipe) collectMaterials(recipe, acc)
    return [...acc.entries()]
  }, [recipe])

  const name = recipe?.name || itemId
  const tier = parseTier(itemId)
  const econ = itemEcon(itemId)
  const category = itemCategory(itemId)
  const sellPrice = priceFrom(prices, itemId, city, quality)
  const taxRate = salesTaxRate(premium)
  const margin = profit(sellPrice, cost, taxRate)

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-4">
      <Link to="/games/albion/item-index" className="text-xs text-[#6b7280] hover:text-[#c4af64]">← Item Index</Link>

      <div className="flex items-center gap-3">
        <ItemIcon uniqueName={itemId} size={48} quality={quality} />
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">{name}</h1>
          <p className="text-xs text-[#6b7280]">
            {tierLabel(itemId) || `T${tier}`} · {category}
            {econ ? ` · ${stationLabel(econ.station)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#6b7280] uppercase tracking-widest">City</label>
          <select className={SELECT} value={city} onChange={e => setParam('city', e.target.value)}>
            {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {!resource && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#6b7280] uppercase tracking-widest">Quality</label>
            <select className={SELECT} value={quality} onChange={e => setParam('quality', e.target.value)}>
              {QUALITIES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading && !recipe ? (
        <p className="text-sm text-[#6b7280]">Loading recipe...</p>
      ) : !recipe || (!recipe.craftable && !recipe.upgrade) ? (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 space-y-3">
          <p className="text-sm text-[#6b7280]">This item has no crafting recipe - enter its market price to track it.</p>
          <label className="flex items-center gap-2 text-sm text-[#9ca3af]">
            Your sell price
            <input
              type="number" inputMode="numeric" min={0}
              value={sellPrice ?? ''}
              onChange={e => setPrice(itemId, city, quality, Number(e.target.value) || null)}
              className={PRICE_INPUT}
            />
          </label>
        </div>
      ) : (
        <>
          {/* Cost / Margin summary from your prices */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
              <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">Craft Cost</p>
              <p className="text-lg font-semibold text-[#e2e4ed]">{fmt(cost)}</p>
              <p className="text-[10px] text-[#6b7280]">{STRATEGIES.find(s => s.value === strategy)?.label}</p>
            </div>
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
              <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">Your Sell Price</p>
              <input
                type="number" inputMode="numeric" min={0}
                value={sellPrice ?? ''}
                placeholder="-"
                onChange={e => setPrice(itemId, city, quality, Number(e.target.value) || null)}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1 text-lg font-semibold text-[#c4af64] focus:border-[#c4af64] outline-none"
              />
            </div>
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
              <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">Sales Tax</p>
              <p className="text-lg font-semibold text-[#e2e4ed]">{Math.round(taxRate * 100)}%</p>
              <p className="text-[10px] text-[#6b7280]">{premium ? 'premium' : 'no premium'}</p>
            </div>
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
              <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">Margin</p>
              <p className={`text-lg font-semibold ${margin == null ? 'text-[#6b7280]' : margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {margin == null ? '-' : `${margin >= 0 ? '+' : ''}${fmt(margin)}`}
              </p>
              <p className="text-[10px] text-[#6b7280]">revenue − tax − cost</p>
            </div>
          </div>

          {/* Strategy toggle */}
          <div className="flex items-center gap-1.5">
            {STRATEGIES.map(s => (
              <button
                key={s.value}
                onClick={() => setStrategy(s.value)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  strategy === s.value
                    ? 'bg-[#c4af64] text-[#0f1117]'
                    : 'bg-[#1a1d27] text-[#9ca3af] border border-[#2a2d3a] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <RecipeTreeCard
            recipe={recipe}
            priceOf={priceOf}
            rrOf={rrOf}
            strategy={strategy}
            qty={qty}
            onQty={setQty}
            stationFee={stationFee}
            cost={cost}
          />

          {/* Your material prices */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#9ca3af] tracking-wide uppercase">Your Material Prices</h3>
              <span className="text-xs text-[#6b7280]">{city} · {isAuthenticated ? 'saved to your account' : 'saved to this browser'}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              {materials.map(([id, matName]) => (
                <label key={id} className="flex items-center justify-between gap-3 py-1">
                  <span className="flex items-center gap-2 min-w-0">
                    <ItemIcon uniqueName={id} size={20} />
                    <span className="text-sm text-[#9ca3af] truncate">{tierLabel(id)} {matName}</span>
                  </span>
                  <input
                    type="number" inputMode="numeric" min={0}
                    value={priceFrom(prices, id, city, 1) ?? ''}
                    placeholder="-"
                    onChange={e => setPrice(id, city, 1, Number(e.target.value) || null)}
                    className={PRICE_INPUT}
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
