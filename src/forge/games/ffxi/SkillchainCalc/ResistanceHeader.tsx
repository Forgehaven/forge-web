import { ELEMENTS, PHYSICAL_TYPES, ELEMENT_COLORS, PHYSICAL_COLORS } from '../data/elements'
import type { DamageType, Element, PhysicalType } from '../data/elements'
import type { ResistanceState, ResistanceMap } from './engine'

function damageTypeColor(type: DamageType): string {
  return ELEMENTS.includes(type as Element)
    ? ELEMENT_COLORS[type as Element]
    : PHYSICAL_COLORS[type as PhysicalType]
}

function DamageTypeBadge({ type, state, onClick }: {
  type: DamageType
  state: ResistanceState
  onClick: () => void
}) {
  const base = damageTypeColor(type)
  return (
    <button
      onClick={onClick}
      title={`${type}: ${state} — click to cycle`}
      className="text-xs px-2 py-0.5 rounded font-medium cursor-pointer select-none"
      style={{ background: `${base}18`, color: base, border: `1px solid ${base}40` }}
    >
      {type}
    </button>
  )
}

type ResistanceHeaderProps = {
  resistances: ResistanceMap
  onChange: (type: DamageType, state: ResistanceState) => void
}

export function ResistanceHeader({ resistances, onChange }: ResistanceHeaderProps) {
  const ALL_TYPES: DamageType[] = [...ELEMENTS, ...PHYSICAL_TYPES]

  function cycle(type: DamageType) {
    const cur = resistances[type] ?? 'neutral'
    const next: ResistanceState = cur === 'neutral' ? 'weak' : cur === 'weak' ? 'resistant' : 'neutral'
    onChange(type, next)
  }

  const weak      = ALL_TYPES.filter(t => (resistances[t] ?? 'neutral') === 'weak')
  const neutral   = ALL_TYPES.filter(t => (resistances[t] ?? 'neutral') === 'neutral')
  const resistant = ALL_TYPES.filter(t => (resistances[t] ?? 'neutral') === 'resistant')

  return (
    <div className="forge-card flex flex-col gap-2">
      <div className="flex gap-4 text-xs text-[#6b7280]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded bg-[#22c55e]" style={{ boxShadow: '0 0 0 1px #22c55e' }} />
          Weak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded bg-[#4b5563]" />
          Neutral
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded bg-[#ef4444]" style={{ boxShadow: '0 0 0 1px #ef4444' }} />
          Resistant
        </span>
        <span className="text-[#374151] ml-auto">click to cycle</span>
      </div>

      <div className="flex flex-col rounded overflow-hidden border border-[#2a2d3a]">
        <div className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2" style={{ background: '#15803d18' }}>
          {weak.length > 0
            ? weak.map(t => <DamageTypeBadge key={t} type={t} state="weak" onClick={() => cycle(t)} />)
            : <span className="text-xs text-[#374151] italic">No weaknesses</span>
          }
        </div>
        <div className="border-y border-[#2a2d3a] min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2">
          {neutral.map(t => <DamageTypeBadge key={t} type={t} state="neutral" onClick={() => cycle(t)} />)}
        </div>
        <div className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2" style={{ background: '#dc262618' }}>
          {resistant.length > 0
            ? resistant.map(t => <DamageTypeBadge key={t} type={t} state="resistant" onClick={() => cycle(t)} />)
            : <span className="text-xs text-[#374151] italic">No resistances</span>
          }
        </div>
      </div>
    </div>
  )
}
