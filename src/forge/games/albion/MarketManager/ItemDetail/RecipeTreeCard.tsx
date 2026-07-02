import { useMemo, useState } from 'react'
import { ItemIcon } from '../../ItemIcon'
import { bestMode, shoppingList, shoppingListBase, shoppingListFullCraft, type PriceOf, type ReturnRateOf } from '../ItemIndex/craftCost'
import { tierLabel } from '../ItemIndex/itemMeta'
import type { RecipeNode } from '../ItemIndex/types'

type TreeMode = 'optimized' | 'base' | 'full'

const MODE_BADGES: Record<string, { label: string; cls: string }> = {
  buy: { label: 'buy', cls: 'text-[#6b7280] border-[#2a2d3a]' },
  craft: { label: 'craft', cls: 'text-[#60a5fa] border-[#60a5fa]/40' },
  upgrade: { label: 'upgrade', cls: 'text-[#a78bfa] border-[#a78bfa]/40' },
  transmute: { label: 'transmute', cls: 'text-[#fb923c] border-[#fb923c]/40' },
}

// Resources can't be crafted - their dump "recipe" is the transmutator (tier-up for a silver
// fee). Recognizable by the flat silver cost on the recipe.
function isTransmute(node: RecipeNode): boolean {
  return node.craftable && node.recipe.length > 0 && (node.silver ?? 0) > 0
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('en-US')
}

function nodeName(node: RecipeNode): string {
  return `${tierLabel(node.item_id)} ${node.name || node.item_id}`
}

function TreeRow({
  node,
  units,
  mode,
  priceOf,
  rrOf,
  depth,
  isRoot,
}: {
  node: RecipeNode
  units: number
  mode: TreeMode
  priceOf: PriceOf
  rrOf: ReturnRateOf
  depth: number
  isRoot?: boolean
}) {
  const acquire = isRoot ? null : bestMode(node, priceOf, rrOf)
  const craftable = node.craftable && node.recipe.length > 0
  const transmute = isTransmute(node)
  // Optimized: only expand nodes the optimizer would actually craft/transmute/upgrade.
  // Base: never expand below the root - every direct material is a market buy.
  // Full: expand every REFINABLE node to raw - transmutes stay buy-leaves (the full tree is
  // the refining chain, not the transmutator).
  const expand = isRoot || (craftable && mode !== 'base' && (
    mode === 'full' ? !transmute : acquire?.mode === 'craft'
  ))
  const viaUpgrade = !isRoot && mode === 'optimized' && acquire?.mode === 'upgrade' && node.upgrade
  const badge = isRoot
    ? MODE_BADGES[transmute ? 'transmute' : 'craft']
    : MODE_BADGES[viaUpgrade ? 'upgrade' : expand ? (transmute ? 'transmute' : 'craft') : 'buy']
  const price = priceOf(node.item_id)
  const crafts = units / (node.amount ?? 1)

  return (
    <div className={depth > 0 ? 'ml-5 border-l border-[#2a2d3a] pl-3' : ''}>
      <div className="flex items-center gap-2 py-1">
        <ItemIcon uniqueName={node.item_id} size={22} />
        <span className="text-[#e2e4ed] text-xs font-medium whitespace-nowrap">
          {Math.ceil(units).toLocaleString('en-US')}×
        </span>
        <span className="text-[#9ca3af] text-xs truncate">{nodeName(node)}</span>
        <span className={`text-[9px] uppercase tracking-wider border rounded px-1 py-px shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
        {!expand && !viaUpgrade && price != null && (
          <span className="text-[10px] font-mono text-[#6b7280] ml-auto shrink-0">
            {fmt(price)} ea · {fmt(price * Math.ceil(units))}
          </span>
        )}
        {node.amount && node.amount > 1 && expand && (
          <span className="text-[10px] text-[#6b7280] ml-auto shrink-0">crafts {node.amount}/batch</span>
        )}
      </div>
      {viaUpgrade && node.upgrade && (
        <>
          <TreeRow
            node={node.upgrade.from}
            units={units}
            mode={mode}
            priceOf={priceOf}
            rrOf={rrOf}
            depth={depth + 1}
          />
          {node.upgrade.materials.map(mat => (
            <div key={mat.item_id} className="ml-5 border-l border-[#2a2d3a] pl-3">
              <div className="flex items-center gap-2 py-1">
                <ItemIcon uniqueName={mat.item_id} size={22} />
                <span className="text-[#e2e4ed] text-xs font-medium whitespace-nowrap">
                  {Math.ceil(mat.count * units).toLocaleString('en-US')}×
                </span>
                <span className="text-[#9ca3af] text-xs truncate">
                  {tierLabel(mat.item_id)} {mat.name || mat.item_id}
                </span>
                <span className={`text-[9px] uppercase tracking-wider border rounded px-1 py-px shrink-0 ${MODE_BADGES.buy.cls}`}>
                  buy
                </span>
              </div>
            </div>
          ))}
        </>
      )}
      {expand && node.recipe.map(child => (
        <TreeRow
          key={child.item_id}
          node={child}
          units={(child.count ?? 1) * (1 - rrOf(node.item_id)) * crafts}
          mode={mode}
          priceOf={priceOf}
          rrOf={rrOf}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

// Flowchart of everything needed to make `qty` of the item, with the aggregated buy list
// beside it (the same material shows up in several branches - the list sums them). "Full
// tree" refines every craftable material from raw; "Optimized" only expands nodes where
// crafting (or transmuting) beats buying, so buy-leaves collapse with their market subtotal.
export function RecipeTreeCard({
  recipe,
  priceOf,
  rrOf,
}: {
  recipe: RecipeNode
  priceOf: PriceOf
  rrOf: ReturnRateOf
}) {
  const [mode, setMode] = useState<TreeMode>('optimized')
  const [qty, setQty] = useState(1)

  const aggregate = useMemo(() => {
    if (mode === 'base') return shoppingListBase(recipe, priceOf, rrOf)
    if (mode === 'full') return shoppingListFullCraft(recipe, priceOf, rrOf)
    return shoppingList(recipe, priceOf, rrOf)
  }, [mode, recipe, priceOf, rrOf])

  const lines = useMemo(() => aggregate.lines.map(line => {
    const count = Math.ceil(line.count * qty)
    return {
      ...line,
      total: count,
      subtotal: line.unitCost == null ? null : count * line.unitCost,
    }
  }), [aggregate, qty])
  const silver = Math.round(aggregate.silver * qty)
  const grandTotal = lines.every(l => l.subtotal != null)
    ? lines.reduce((sum, l) => sum + (l.subtotal ?? 0), 0) + silver
    : null

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-medium text-[#9ca3af] tracking-wide uppercase">Crafting Tree</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {([['optimized', 'Optimized'], ['base', 'Base mats'], ['full', 'Full tree']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  mode === value
                    ? 'bg-[#c4af64] text-white'
                    : 'bg-[#0f1117] text-[#9ca3af] border border-[#2a2d3a] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#6b7280]">
            Qty
            <input
              type="number"
              min={1}
              value={qty}
              onChange={e => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              aria-label="Crafting tree quantity"
              className="w-16 bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1 text-sm text-[#e2e4ed] focus:outline-none focus:border-[#c4af64]"
            />
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-4">
        <div>
          <TreeRow node={recipe} units={qty} mode={mode} priceOf={priceOf} rrOf={rrOf} depth={0} isRoot />
        </div>
        {/* Aggregated buys across every branch of the tree */}
        <div className="lg:border-l lg:border-[#2a2d3a] lg:pl-4 space-y-1 text-xs self-start">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider pb-1">Shopping list</p>
          {lines.map(line => (
            <div key={line.id} className="flex justify-between gap-3">
              <span className="text-[#9ca3af] truncate">
                {line.total.toLocaleString('en-US')}× {tierLabel(line.id)} {line.name}
              </span>
              <span className="font-mono text-[#e2e4ed] shrink-0">{fmt(line.subtotal)}</span>
            </div>
          ))}
          {silver > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-[#9ca3af]">crafting fees</span>
              <span className="font-mono text-[#e2e4ed]">{fmt(silver)}</span>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-[#2a2d3a] pt-1.5 font-semibold">
            <span className="text-[#c4af64]">Total for {qty}</span>
            <span className="font-mono text-[#c4af64]">{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[#6b7280] pt-1">
        counts include bonus-aware resource return rates (Craft Settings), rounded up
      </p>
    </div>
  )
}
