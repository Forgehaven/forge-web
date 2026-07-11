import type { CraftFilterState } from './craftRows'

const SELECT = 'bg-[#1a1d27] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-[#e2e4ed] focus:border-[#c4af64] outline-none cursor-pointer'
const LABEL = 'text-xs text-[#6b7280] uppercase tracking-widest'

const TIERS = [1, 2, 3, 4, 5, 6, 7, 8]
const ENCHANTS = [0, 1, 2, 3, 4]
const CRAFTABLE: { value: CraftFilterState['craftable']; label: string }[] = [
  { value: 'any', label: 'All' },
  { value: 'yes', label: 'Craftable' },
  { value: 'no', label: 'Not craftable' },
]

export interface CraftFiltersProps {
  filters: CraftFilterState
  onChange: (patch: Partial<CraftFilterState>) => void
  categories: string[]
  stations: string[]
  hideFavToggle?: boolean
}

export function CraftFilters({ filters, onChange, categories, stations, hideFavToggle }: CraftFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label className={LABEL}>Tier</label>
        <select className={SELECT} value={filters.tier} onChange={e => onChange({ tier: e.target.value })}>
          <option value="">All</option>
          {TIERS.map(t => <option key={t} value={t}>T{t}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className={LABEL}>Enchant</label>
        <select className={SELECT} value={filters.enchant} onChange={e => onChange({ enchant: e.target.value })}>
          <option value="">All</option>
          {ENCHANTS.map(n => <option key={n} value={n}>{n === 0 ? 'Base' : `.${n}`}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className={LABEL}>Category</label>
        <select className={SELECT} value={filters.category} onChange={e => onChange({ category: e.target.value })}>
          <option value="">All</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className={LABEL}>Station</label>
        <select className={SELECT} value={filters.station} onChange={e => onChange({ station: e.target.value })}>
          <option value="">All</option>
          {stations.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className={LABEL}>Craftable</label>
        <select
          className={SELECT}
          value={filters.craftable}
          onChange={e => onChange({ craftable: e.target.value as CraftFilterState['craftable'] })}
        >
          {CRAFTABLE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {!hideFavToggle && (
        <label className="flex items-center gap-1.5 text-sm text-[#9ca3af] pb-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.favOnly}
            onChange={e => onChange({ favOnly: e.target.checked })}
          />
          Favourites only
        </label>
      )}
    </>
  )
}
