import { SC_COLORS, ELEMENT_COLORS } from '../data/elements'
import type { Element } from '../data/elements'
import type { SkillchainLink, BurstInfo, PartyMember } from './engine'

function scLabelSizes(level: 1 | 2 | 3, isFinal: boolean) {
  if (isFinal) return level === 1 ? { label: 'text-[10px]', name: 'text-sm' } : { label: 'text-xs', name: 'text-base' }
  return level === 1 ? { label: 'text-[9px]', name: 'text-xs' } : { label: 'text-[10px]', name: 'text-sm' }
}

function MemberLabel({ party, idx }: { party: PartyMember[]; idx: number }) {
  const m = party[idx]
  if (!m || (!m.name && !m.job)) {
    return <span className="text-xs text-[#6b7280]">Slot {idx + 1}</span>
  }
  return (
    <>
      {m.name && <span className="text-xs text-[#c4af64]">{m.name}</span>}
      {m.job && <span className="text-xs text-[#6b7280]">{m.job}</span>}
    </>
  )
}

type ChainCardProps = {
  link: SkillchainLink
  party: PartyMember[]
  rank: number
  compact?: boolean
  isFavourite?: boolean
  onToggleFavourite?: () => void
}

export function ChainCard({ link, party, rank, compact, isFavourite, onToggleFavourite }: ChainCardProps) {
  const finalResult = link.boundaries[link.boundaries.length - 1]
  const color = SC_COLORS[finalResult.name] ?? '#c4af64'

  if (compact) {
    return (
      <div
        className="forge-card flex items-center justify-between gap-3 py-2"
        style={{ borderColor: isFavourite ? '#c4af64' : `${color}30` }}
      >
        <div className="flex items-center gap-1 text-xs min-w-0 flex-1 overflow-hidden flex-wrap">
          {link.steps.map((step, si) => (
            <span key={si} className="flex items-center gap-1 shrink-0">
              {si > 0 && <span className="text-[#4b5563]">→</span>}
              <MemberLabel party={party} idx={step.memberIdx} />
              <span className="font-medium text-[#e2e4ed]">{step.ws.name}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold tracking-wide" style={{ color }}>
              {finalResult.name.toUpperCase()}
            </span>
            <span className="text-xs text-[#4b5563]">L{finalResult.level}</span>
          </div>
          {onToggleFavourite && (
            <button
              onClick={onToggleFavourite}
              className="text-sm leading-none cursor-pointer transition-colors"
              style={{ color: isFavourite ? '#c4af64' : '#374151' }}
            >
              {isFavourite ? '★' : '☆'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative bg-[#1a1d27] border border-[#2a2d3a] rounded-lg overflow-hidden flex flex-col"
      style={{ borderColor: isFavourite ? '#c4af64' : `${color}40` }}
    >
      {onToggleFavourite && (
        <button
          onClick={onToggleFavourite}
          className="absolute top-2 right-2 text-base leading-none cursor-pointer transition-colors z-10"
          style={{ color: isFavourite ? '#c4af64' : '#374151' }}
        >
          {isFavourite ? '★' : '☆'}
        </button>
      )}
      <div className="flex items-center px-3 py-3 flex-wrap gap-y-2">
        {link.steps.map((step, si) => {
          const boundary = si > 0 ? link.boundaries[si - 1] : null
          const isFinal = si === link.steps.length - 1
          const bColor = boundary ? (SC_COLORS[boundary.name] ?? '#c4af64') : null
          const bursts = boundary ? link.burstsByBoundary[si - 1] : null
          const burstEntries = bursts
            ? (Object.entries(bursts) as [Element, BurstInfo[]][])
            : []
          const m = party[step.memberIdx]

          return (
            <div key={si} className="flex items-center">
              {si > 0 && (
                <span className="text-[#4b5563] text-sm mx-2 shrink-0">→</span>
              )}
              <div className="flex flex-col gap-1 min-w-0">
                {boundary && bColor && (() => {
                  const sz = scLabelSizes(boundary.level, isFinal)
                  return (
                    <div className="flex flex-col gap-0">
                      <span className={`${sz.label} uppercase tracking-widest`} style={{ color: bColor }}>
                        Level {boundary.level}
                      </span>
                      <span className={`${sz.name} font-bold leading-tight`} style={{ color: bColor }}>
                        {boundary.name.toUpperCase()}
                      </span>
                      <span className={`${sz.label} text-[#6b7280]`}>{boundary.element}</span>
                    </div>
                  )
                })()}

                <div className="border border-[#2a2d3a] rounded-md px-2.5 py-2 flex flex-col gap-0.5 bg-[#0f1117]">
                  <span className="text-sm font-medium text-[#e2e4ed] whitespace-nowrap">
                    {step.ws.name} <span className="text-[#6b7280] font-normal">({step.ws.skillReq})</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m?.name && (
                      <span className="text-xs text-[#c4af64]">{m.name}</span>
                    )}
                    <span className="text-xs font-bold text-[#9ca3af]">
                      {m?.job ?? `Slot ${step.memberIdx + 1}`}
                    </span>
                  </div>
                </div>

                {burstEntries.length > 0 && (
                  <div className="flex flex-col gap-0.5 pt-1 border-t border-[#2a2d3a]">
                    {burstEntries.flatMap(([el, infos]) => {
                      const bySpell = new Map<string, { job: string; minLevel: number }[]>()
                      for (const info of infos) {
                        const list = bySpell.get(info.spell.name) ?? []
                        list.push({ job: info.job, minLevel: info.spell.minLevel })
                        bySpell.set(info.spell.name, list)
                      }
                      return [...bySpell.entries()].map(([spellName, jobInfos]) => (
                        <span
                          key={`${el}-${spellName}`}
                          className="text-xs px-1.5 py-0.5 rounded font-medium self-start"
                          style={{
                            color: ELEMENT_COLORS[el],
                            background: `${ELEMENT_COLORS[el]}15`,
                            border: `1px solid ${ELEMENT_COLORS[el]}40`,
                          }}
                        >
                          {spellName} <span className="opacity-50">{jobInfos.map(j => `${j.job}(${j.minLevel})`).join('/')}</span>
                        </span>
                      ))
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-3 py-1.5 border-t border-[#2a2d3a]">
        <span className="text-xs text-[#374151]">#{rank}</span>
      </div>
    </div>
  )
}
