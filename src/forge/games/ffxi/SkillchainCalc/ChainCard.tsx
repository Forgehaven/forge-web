import { Fragment } from 'react'
import { SC_COLORS, ELEMENT_COLORS } from '../data/elements'
import type { Element } from '../data/elements'
import type { SkillchainLink, BurstInfo, PartyMember } from './engine'


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
  panelWidth?: number
  isFavourite?: boolean
  onToggleFavourite?: () => void
}

export function ChainCard({ link, party, rank, compact, panelWidth, isFavourite, onToggleFavourite }: ChainCardProps) {
  const finalResult = link.boundaries[link.boundaries.length - 1]
  const color = SC_COLORS[finalResult.name] ?? '#c4af64'

  if (compact) {
    return (
      <div
        className="bg-[#1a1d27] border rounded-lg overflow-hidden flex flex-col sm:flex-row sm:items-stretch"
        style={{ borderColor: isFavourite ? '#c4af64' : `${color}30` }}
      >
        {/* Mobile: top bar */}
        <div
          className="sm:hidden relative flex items-center px-3 py-1.5 border-b border-[#2a2d3a]"
          style={{ background: `${color}0d` }}
        >
          <span className="text-[10px] font-semibold tabular-nums shrink-0" style={{ color }}>L{finalResult.level}</span>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none" style={{ color }}>
            {finalResult.name.toUpperCase()}
          </span>
        </div>
        {/* Desktop: left panel */}
        <div
          className="hidden sm:flex items-center justify-center px-2 py-2 border-r border-[#2a2d3a] shrink-0 gap-1"
          style={{ width: panelWidth ?? 112, background: `${color}0d` }}
        >
          <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>L{finalResult.level}</span>
          <span className="text-[#4b5563] text-[10px]">·</span>
          <span className="text-xs font-bold leading-tight text-center" style={{ color }}>
            {finalResult.name.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center sm:flex-row sm:items-center sm:flex-wrap px-3 py-2 min-w-0 overflow-hidden gap-0">
          {link.steps.map((step, si) => (
            <Fragment key={si}>
              {si > 0 && (
                <>
                  <span className="hidden sm:inline text-[#4b5563] text-xs mx-1">→</span>
                  <span className="sm:hidden text-[#4b5563] text-xs">↓</span>
                </>
              )}
              <span className="flex items-center gap-1 text-xs shrink-0">
                <MemberLabel party={party} idx={step.memberIdx} />
                <span className="font-medium text-[#e2e4ed]">{step.ws.name}</span>
              </span>
            </Fragment>
          ))}
        </div>
        {onToggleFavourite && (
          <button
            onClick={onToggleFavourite}
            className="text-sm leading-none cursor-pointer transition-colors shrink-0 px-2"
            style={{ color: isFavourite ? '#c4af64' : '#374151' }}
          >
            {isFavourite ? '★' : '☆'}
          </button>
        )}
      </div>
    )
  }

  const finalBurstEntries = Object.entries(
    link.burstsByBoundary[link.boundaries.length - 1] ?? {}
  ) as [Element, BurstInfo[]][]

  const leftPanelContent = (burst: boolean) => (
    <>
      {finalBurstEntries.length > 0 && burst && (
        <div className="flex flex-col gap-0.5 pt-1 mt-0.5 border-t border-[#2a2d3a] w-full items-center">
          {finalBurstEntries.flatMap(([el, infos]) => {
            const jobs = [...new Set(infos.map(i => i.job))]
            return (
              <span
                key={el}
                className="text-[10px] px-1.5 py-0.5 rounded font-medium text-center w-full"
                style={{
                  color: ELEMENT_COLORS[el],
                  background: `${ELEMENT_COLORS[el]}15`,
                  border: `1px solid ${ELEMENT_COLORS[el]}40`,
                }}
              >
                {el} <span className="opacity-60">{jobs.join('/')}</span>
              </span>
            )
          })}
        </div>
      )}
    </>
  )

  const steps = link.steps.map((step, si) => {
    const boundary = si > 0 ? link.boundaries[si - 1] : null
    const isFinalBoundary = si === link.steps.length - 1
    const bColor = boundary && !isFinalBoundary ? (SC_COLORS[boundary.name] ?? '#c4af64') : null
    const intermediateBursts = boundary && !isFinalBoundary
      ? (Object.entries(link.burstsByBoundary[si - 1] ?? {}) as [Element, BurstInfo[]][])
      : []
    const m = party[step.memberIdx]
    const wsBox = (
      <div className="flex flex-col gap-0.5">
        <div className="border border-[#2a2d3a] rounded-md px-2.5 py-2 flex flex-col items-center gap-0.5 bg-[#0f1117]">
          <span className="text-sm font-medium text-[#e2e4ed] whitespace-nowrap">
            {step.ws.name}{' '}
            <span className="text-[#6b7280] font-normal">({step.ws.skillReq})</span>
          </span>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {m?.name && <span className="text-xs text-[#c4af64]">{m.name}</span>}
            <span className="text-xs font-bold text-[#9ca3af]">{m?.job ?? `Slot ${step.memberIdx + 1}`}</span>
          </div>
        </div>
        {intermediateBursts.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {intermediateBursts.flatMap(([el, infos]) => {
              const jobs = [...new Set(infos.map(i => i.job))]
              return (
                <span key={el} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ color: ELEMENT_COLORS[el], background: `${ELEMENT_COLORS[el]}15`, border: `1px solid ${ELEMENT_COLORS[el]}40` }}>
                  {el} <span className="opacity-60">{jobs.join('/')}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>
    )
    return { si, bColor, boundary, wsBox }
  })

  return (
    <div
      className="bg-[#1a1d27] border rounded-lg overflow-hidden flex"
      style={{ borderColor: isFavourite ? '#c4af64' : `${color}40` }}
    >
      {/* Mobile left panel: narrow with rotated text */}
      <div
        className="sm:hidden flex flex-col items-center border-r border-[#2a2d3a] shrink-0 w-10 overflow-hidden"
        style={{ background: `${color}0d`, minHeight: finalResult.name.length * 8 + 48 }}
      >
        <span className="pt-2 pb-1 text-xs uppercase font-semibold shrink-0" style={{ color }}>
          L{finalResult.level}
        </span>
        <div className="flex-1 relative w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-0.5"
                 style={{ transform: 'rotate(-90deg)' }}>
              <span className="text-sm font-bold uppercase whitespace-nowrap" style={{ color }}>{finalResult.name}</span>
              <span className="text-xs text-[#6b7280] whitespace-nowrap">{finalResult.element}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop left panel: level label, then name + element on same row */}
      <div
        className="hidden sm:flex flex-col items-center justify-center px-3 py-4 border-r border-[#2a2d3a] shrink-0 gap-1"
        style={{ width: panelWidth ?? 112, background: `${color}0d` }}
      >
        <span className="text-[10px] uppercase tracking-widest" style={{ color }}>
          Level {finalResult.level}
        </span>
        <span className="text-sm font-bold leading-tight text-center" style={{ color }}>
          {finalResult.name.toUpperCase()}
        </span>
        <span className="text-[10px] text-[#6b7280] text-center leading-tight">{finalResult.element}</span>
        {leftPanelContent(true)}
      </div>

      {/* Steps */}
      <div className="flex flex-col sm:flex-row sm:items-center px-3 py-3 gap-2 sm:gap-0 sm:flex-wrap flex-1 min-w-0">
        {steps.map(({ si, bColor, boundary, wsBox }) => (
          <div key={si} className="flex flex-col sm:flex-row sm:items-center">
            {si > 0 && (
              <div className="flex flex-col items-center sm:mx-2 my-1 sm:my-0 shrink-0 gap-0.5">
                {bColor && (
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: bColor }}>
                    {boundary!.name}
                  </span>
                )}
                <span className="text-[#4b5563] text-sm leading-none">
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              </div>
            )}
            {wsBox}
          </div>
        ))}
        <span className="text-xs text-[#374151] sm:ml-auto sm:self-end sm:pl-2 self-end mt-1 sm:mt-0">#{rank}</span>
      </div>

      {onToggleFavourite && (
        <button
          onClick={onToggleFavourite}
          className="absolute top-2 right-2 text-base leading-none cursor-pointer transition-colors z-10"
          style={{ color: isFavourite ? '#c4af64' : '#374151' }}
        >
          {isFavourite ? '★' : '☆'}
        </button>
      )}
    </div>
  )
}
