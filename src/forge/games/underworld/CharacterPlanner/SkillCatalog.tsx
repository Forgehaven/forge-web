import { useMemo, useState } from 'react'
import {
  catalog, choiceLabel, choiceOptions, evaluate, needsChoice, stateAt, SPELL_VERSATILITY, TRADESMAN, versatilityCost,
  type Build, type CatalogSkill, type Evaluation,
} from '../engine'
import { stepLabel } from './util'
import { ordinal } from '../rules'
import { Prose } from '../components/Prose'
import { Masonry } from '../../../../components/Masonry'

interface Props {
  build: Build
  ev: Evaluation
  active: number
  loose: boolean
  onAdd: (skill: string, choice?: string) => void
  onRemove: (skill: string) => void
}

const NO_OCCUPATION = 'Pick an occupation first'

interface Row {
  sk: CatalogSkill
  cost: number
  frag: number
  reason: string | null
  // [value, label]
  options: [string, string][] | null
  // Tradesman: trades already bought, with their levels, to level up.
  trades?: [string, number][]
}

function optionLabel(sk: CatalogSkill, o: string, build: Build) {
  if (sk.name === SPELL_VERSATILITY) return `${ordinal(+o)} Circle (${versatilityCost(build, o)} CP, ${versatilityCost(build, o)}f)`
  return o.replace('|', ', circle ')
}

function SkillRow({ row, owned, hasOccupation, onAdd, onRemove }: {
  row: Row
  owned: number
  hasOccupation: boolean
  onAdd: (choice?: string) => void
  onRemove: () => void
}) {
  const { sk, cost, frag, options } = row
  const [open, setOpen] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [trade, setTrade] = useState('')
  const maxed = owned > 0 && owned >= sk.maxPurchases
  const reason = row.reason === NO_OCCUPATION || maxed ? null : row.reason
  const blocked = !!row.reason || (options !== null && options.length === 0)
  const prereqs = sk.prereqs.map(p => `${(p.minCount ?? 1) > 1 ? `${p.minCount}x ` : ''}${p.name.split('|').join(' or ')}`)
  const showCost = hasOccupation || !sk.costs

  return (
    <li className={`border-b border-[#2a2d3a] last:border-b-0 ${owned ? 'border-l-2 border-l-[#c4af64]/60 -ml-3 pl-2.5' : ''}`}>
      <div className="flex items-center gap-2 py-1 group">
        <button
          className="flex-1 min-w-0 text-left cursor-pointer"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          <span className={`text-sm ${blocked && !maxed ? 'text-[#6b7280]' : 'text-[#e2e4ed] group-hover:text-white'}`}>
            {sk.name}
          </span>
          {sk.tier && <span className="ml-1.5 text-[10px] text-[#6b7280]">L{sk.tier}</span>}
          {owned > 0 && (
            <span className="ml-1.5 text-[10px] font-mono text-[#c4af64]">
              {maxed ? '✓' : ''}{sk.maxPurchases > 1 ? ` ${owned}/${sk.maxPurchases}` : maxed ? ' owned' : ''}
            </span>
          )}
          {reason && <span className="block text-[11px] text-amber-200/45 truncate" title={reason}>{reason}</span>}
        </button>
        <span className="text-xs font-mono text-[#9ca3af] whitespace-nowrap text-right">
          {sk.costNote ?? (showCost ? `${cost} CP` : '–')}
          {frag && !sk.costNote ? <span className="text-violet-300/80"> · {frag}f</span> : null}
        </span>
        {owned > 0 && (
          <button
            aria-label={`Remove one ${sk.name}`}
            title="Remove the latest purchase"
            className="w-6 h-6 shrink-0 rounded text-sm leading-none border border-[#2a2d3a] text-[#9ca3af] hover:text-red-300 hover:border-red-400/40 cursor-pointer"
            onClick={onRemove}
          >−</button>
        )}
        <button
          aria-label={`Add ${sk.name}`}
          className="w-6 h-6 shrink-0 rounded text-sm leading-none border border-[#c4af64]/40 text-[#c4af64] hover:bg-[#c4af64]/15 disabled:border-[#2a2d3a] disabled:text-[#3a3d4a] disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
          disabled={blocked}
          onClick={() => (options !== null ? setChoosing(c => !c) : onAdd())}
        >+</button>
      </div>

      {choosing && options !== null && !blocked && (
        <div className="flex items-center gap-2 pb-2">
          {sk.name === TRADESMAN && (
            <input
              autoFocus
              aria-label="Trade name"
              className="forge-input !py-1 !px-1.5 text-xs flex-1 min-w-0"
              placeholder="New trade, e.g. Miner"
              maxLength={40}
              value={trade}
              onChange={e => setTrade(e.target.value)}
            />
          )}
          <select
            autoFocus={sk.name !== TRADESMAN}
            aria-label={`${sk.name} choice`}
            className="forge-input !py-1 !px-1.5 text-xs flex-1"
            defaultValue=""
            onChange={e => {
              if (!e.target.value) return
              const v = e.target.value
              // A bare material starts a new trade under the typed name.
              onAdd(sk.name === TRADESMAN && !v.includes('|') ? `${v}|${trade.replace(/\|/g, '').trim()}` : v)
              setChoosing(false)
              setTrade('')
            }}
          >
            <option value="" disabled>Choose {sk._weaponChoice === 'group' ? 'a weapon group' : sk._weaponChoice ? 'a weapon' : sk._paragon ? 'sphere and circle' : sk.name === SPELL_VERSATILITY ? 'a slot' : sk.name === TRADESMAN ? (row.trades?.length ? 'a trade' : 'its material') : 'an element'}…</option>
            {row.trades?.length ? (
              <>
                <optgroup label="Level up">
                  {row.trades.map(([v, n]) => <option key={v} value={v}>{choiceLabel(TRADESMAN, v).replace('Tradesman: ', '')} to level {n + 1}</option>)}
                </optgroup>
                <optgroup label="New trade">
                  {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </optgroup>
              </>
            ) : options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <button className="text-xs text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer" onClick={() => setChoosing(false)}>Cancel</button>
        </div>
      )}

      {open && (
        <div className="pb-3 text-xs text-[#9ca3af] leading-relaxed">
          <Prose text={sk.desc} />
          <p className="mt-1 text-[#6b7280]">
            Max {sk.maxPurchases}{prereqs.length ? ` · Requires ${prereqs.join('; ')}` : ''}
            {sk.prereqPerPurchase ? ' (per purchase)' : ''}
          </p>
        </div>
      )}
    </li>
  )
}

export function SkillCatalog({ build, ev, active, loose, onAdd, onRemove }: Props) {
  const [query, setQuery] = useState('')
  const [hideBlocked, setHideBlocked] = useState(false)
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  const rows = useMemo(() => {
    const st = stateAt(build, active, loose)
    const trades = new Map<string, number>()
    for (const p of build.purchases) if (p.skill === TRADESMAN && p.choice) trades.set(p.choice, (trades.get(p.choice) ?? 0) + 1)
    return catalog(build).map(c => ({
      cat: c.cat,
      skills: c.skills.map((sk): Row => {
        const probe = evaluate(build, { id: 'probe', skill: sk.name, at: active }, loose).probe
        return {
          sk,
          cost: probe?.cost ?? 0,
          frag: probe?.frag ?? 0,
          reason: probe?.error ?? null,
          options: needsChoice(sk) ? choiceOptions(sk, st).map(o => [o, optionLabel(sk, o, build)]) : null,
          trades: sk.name === TRADESMAN ? [...trades] : undefined,
        }
      }),
    }))
  }, [build, active, loose])

  const q = query.trim().toLowerCase()
  const owned = (name: string) => ev.final.counts.get(name) ?? 0
  const hasOccupation = !!build.occupation

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="forge-input flex-1 min-w-48"
          placeholder="Search skills…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-1.5 text-xs text-[#9ca3af] cursor-pointer">
          <input type="checkbox" checked={hideBlocked} onChange={e => setHideBlocked(e.target.checked)} />
          Only buyable
        </label>
        {!loose && <span className="text-xs text-[#6b7280]">Buying at <span className="text-[#c4af64]">{stepLabel(active)}</span></span>}
      </div>

      {!hasOccupation && (
        <p className="rounded-md border border-[#c4af64]/30 bg-[#c4af64]/5 px-3 py-2 text-xs text-[#c4af64]">
          Pick an occupation on the left: most skill costs depend on it.
        </p>
      )}

      <Masonry minWidth={352} items={rows.flatMap(({ cat, skills }) => {
          const shown = skills.filter(r =>
            (!q || r.sk.name.toLowerCase().includes(q)) && (!hideBlocked || !r.reason))
          if (!shown.length) return []
          const isClosed = closed[cat] && !q
          const ownedHere = skills.filter(r => owned(r.sk.name) > 0).length
          const buyable = skills.filter(r => !r.reason).length
          // Weight ignores collapse so folding a category never reshuffles columns.
          return [{ key: cat, weight: shown.length + 2, node: (
            <section className="forge-card !p-0 overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#e2e4ed] bg-[#2a2d3a]/30 hover:bg-[#2a2d3a]/60 cursor-pointer"
                aria-expanded={!isClosed}
                onClick={() => setClosed(c => ({ ...c, [cat]: !c[cat] }))}
              >
                <span className={`text-[10px] text-[#6b7280] transition-transform ${isClosed ? '' : 'rotate-90'}`}>▸</span>
                {cat}
                <span className="ml-auto text-[10px] font-normal text-[#6b7280]">
                  {ownedHere > 0 && <span className="text-[#c4af64]">{ownedHere} owned · </span>}
                  {buyable} buyable
                </span>
              </button>
              {!isClosed && (
                <ul className="px-3">
                  {shown.map(r => (
                    <SkillRow
                      key={r.sk.name}
                      row={r}
                      owned={owned(r.sk.name)}
                      hasOccupation={hasOccupation}
                      onAdd={choice => onAdd(r.sk.name, choice)}
                      onRemove={() => onRemove(r.sk.name)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ) }]
        })} />
    </div>
  )
}
