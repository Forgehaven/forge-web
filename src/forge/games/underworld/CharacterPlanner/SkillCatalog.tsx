import { useMemo, useState } from 'react'
import {
  catalog, choiceLabel, choiceOptions, evaluate, needsChoice, prereqLabel, slotCost, stateAt, vocationNeeds, SPELL_VERSATILITY, TRADESMAN, versatilityCost,
  type Build, type CatalogSkill, type Evaluation,
} from '../engine'
import { stepLabel } from './util'
import { ordinal } from '../rules'
import { Prose } from '../components/Prose'
import { Masonry, type MasonryItem } from '../../../../components/Masonry'
import { toggleProps } from '../../../../lib/toggleProps'
import type { Place } from '../../../../lib/assignColumns'
import { useSkillInput } from '../hooks/useSkillInput'

interface Props {
  build: Build
  ev: Evaluation
  active: number
  loose: boolean
  onAdd: (skill: string, choice?: string) => void
  onRemove: (skill: string) => void
  query: string
  hideBlocked: boolean
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
  if (sk.id === SPELL_VERSATILITY) return `${ordinal(+o)} Circle (${versatilityCost(build, o)} CP, ${versatilityCost(build, o)}f)`
  if (sk._paragon) {
    const [sp, c] = o.split('|')
    return `${sp}, ${ordinal(+c)} Circle (${slotCost(build, +c) + 10} CP)`
  }
  return o.replace('|', ', circle ')
}

// Card placement per column count: 3 wide on desktop, 2 wide on tablets. One
// column reads the 2-wide columns top to bottom.
const LAYOUTS: Record<number, string[][]> = {
  2: [['Racial', 'Production', 'Soul Frag Skills', 'Occupational Abilities', 'Class Frag Skills'], ['Warrior', 'Scholar', 'Rogue']],
  3: [['Racial', 'Production', 'Warrior'], ['Soul Frag Skills', 'Scholar'], ['Occupational Abilities', 'Class Frag Skills', 'Rogue']],
}
// Class Frag Skills is whichever class applies.
const group = (cat: string) => (cat.endsWith('Class Frag Skills') ? 'Class Frag Skills' : cat)
function place(cat: string): Place {
  return Object.fromEntries(Object.entries(LAYOUTS).map(([n, cols]) => {
    const c = cols.findIndex(col => col.includes(group(cat)))
    return [n, [c, cols[c].indexOf(group(cat))]]
  }))
}
const stackIndex = (cat: string) => LAYOUTS[2].flat().indexOf(group(cat))

// Short forms for long names, used when the row is too narrow for the full one.
const SHORT: [RegExp, string][] = [[/^Specialization/, 'Spec'], [/^Weapon Group Proficiency/, 'Weap Grp Prof'], [/^Weapon Specific Proficiency/, 'Weap Spec Prof'], [/Subsequent$/, 'Subseq']]
const shortName = (name: string) => SHORT.reduce((n, [re, to]) => n.replace(re, to), name)

// Count picker for repeatable skills; higher counts are off while the next one can't be bought.
function CountInput({ name, owned, max, canAdd, onAdd, onRemove }: {
  name: string
  owned: number
  max: number
  canAdd: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <select
      aria-label={`${name} count`}
      className="forge-input !w-9 !px-1 !py-0.5 appearance-none text-center text-xs font-mono cursor-pointer"
      value={owned}
      onChange={e => {
        const n = Number(e.target.value)
        for (let i = owned; i < n; i++) onAdd()
        for (let i = n; i < owned; i++) onRemove()
      }}
    >
      {Array.from({ length: max + 1 }, (_, n) => <option key={n} value={n} disabled={n > owned && !canAdd}>{n}</option>)}
    </select>
  )
}

function SkillRow({ row, owned, needFor, hasOccupation, numeric, onAdd, onRemove }: {
  row: Row
  owned: number
  numeric: boolean
  // Vocation this skill would help qualify for.
  needFor?: string
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
  const prereqs = sk.prereqs.map(prereqLabel)
  const showCost = hasOccupation || !sk.costs
  const short = shortName(sk.name)

  return (
    <li className={`border-b border-forge-border last:border-b-0 ${owned ? 'border-l-2 border-l-forge-accent/60 -ml-3 pl-2.5' : needFor ? 'border-l-2 border-l-amber-400/70 bg-amber-400/5 -ml-3 pl-2.5' : ''}`}>
      <div className="flex items-center gap-2 py-1 group">
        <div className="@container flex-1 min-w-0 flex items-center text-left cursor-pointer" title={sk.name} {...toggleProps(open, () => setOpen(o => !o))}>
          <span className={`truncate text-sm ${blocked && !maxed ? 'text-forge-muted' : 'text-forge-text group-hover:text-forge-bright'}`}>
            {short === sk.name ? sk.name : <><span className="hidden @[17rem]:inline">{sk.name}</span><span className="@[17rem]:hidden">{short}</span></>}
          </span>
          {needFor && <span className="ml-1.5 shrink-0 text-[10px] text-amber-300 whitespace-nowrap">needed for {needFor}</span>}
          {sk.tier && <span className="ml-1.5 shrink-0 text-[10px] text-forge-muted">L{sk.tier}</span>}
          {owned > 0 && (
            <span className="ml-1.5 shrink-0 whitespace-nowrap text-[10px] font-mono text-forge-accent">
              {maxed ? '✓' : ''}{sk.maxPurchases > 1 ? ` ${owned}/${sk.maxPurchases}` : maxed ? ' owned' : ''}
            </span>
          )}
          {reason && (
            <svg viewBox="0 0 16 16" className="ml-1.5 shrink-0 w-3 h-3 text-amber-300/60" fill="none" stroke="currentColor" strokeWidth="1.5" role="img" aria-label={reason}>
              <title>{reason}</title>
              <rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
          )}
        </div>
        <span className="text-xs font-mono text-forge-dim whitespace-nowrap text-right">
          {sk.costNote ?? (showCost ? `${cost} CP` : '–')}
          {frag ? <span className="text-violet-300/80"> · {frag}f</span> : null}
        </span>
        <div className="w-[3.25rem] shrink-0 flex justify-end gap-1">
        {numeric && options === null ? (
          <CountInput name={sk.name} owned={owned} max={sk.maxPurchases} canAdd={!blocked} onAdd={() => onAdd()} onRemove={onRemove} />
        ) : <>
        {owned > 0 && (
          <button
            aria-label={`Remove one ${sk.name}`}
            title="Remove the latest purchase"
            className="w-6 h-6 shrink-0 rounded text-sm leading-none border border-forge-border text-forge-dim hover:text-red-300 hover:border-red-400/40 cursor-pointer"
            onClick={onRemove}
          >−</button>
        )}
        <button
          aria-label={`Add ${sk.name}`}
          className="w-6 h-6 shrink-0 rounded text-sm leading-none border border-forge-accent/40 text-forge-accent hover:bg-forge-accent/15 disabled:border-forge-border disabled:text-forge-line disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
          disabled={blocked}
          onClick={() => (options !== null ? setChoosing(c => !c) : onAdd())}
        >+</button>
        </>}
        </div>
      </div>

      {choosing && options !== null && !blocked && (
        <div className="flex items-center gap-2 pb-2">
          {sk.id === TRADESMAN && (
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
            autoFocus={sk.id !== TRADESMAN}
            aria-label={`${sk.name} choice`}
            className="forge-input !py-1 !px-1.5 text-xs flex-1"
            defaultValue=""
            onChange={e => {
              if (!e.target.value) return
              const v = e.target.value
              // A bare material starts a new trade under the typed name.
              onAdd(sk.id === TRADESMAN && !v.includes('|') ? `${v}|${trade.replace(/\|/g, '').trim()}` : v)
              setChoosing(false)
              setTrade('')
            }}
          >
            <option value="" disabled>Choose {sk._weaponChoice === 'group' ? 'a weapon group' : sk._weaponChoice ? 'a weapon' : sk._paragon ? 'a sphere and circle' : sk.id === SPELL_VERSATILITY ? 'a slot' : sk.id === TRADESMAN ? (row.trades?.length ? 'a trade' : 'its material') : 'an element'}…</option>
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
          <button className="text-xs text-forge-muted hover:text-forge-text cursor-pointer" onClick={() => setChoosing(false)}>Cancel</button>
        </div>
      )}

      {open && (
        <div className="pb-3 text-xs text-forge-dim leading-relaxed">
          {reason && <p className="mb-1 text-amber-300/80">{reason}</p>}
          <Prose text={sk.desc} />
          <p className="mt-1 text-forge-muted">
            Max {sk.maxPurchases}{prereqs.length ? ` · Requires ${prereqs.join('; ')}` : ''}
            {sk.prereqPerPurchase ? ' (per purchase)' : ''}
          </p>
        </div>
      )}
    </li>
  )
}

export function SkillCatalog({ build, ev, active, loose, onAdd, onRemove, query, hideBlocked }: Props) {

  const rows = useMemo(() => {
    const st = stateAt(build, active, loose)
    const trades = new Map<string, number>()
    for (const p of build.purchases) if (p.skill === TRADESMAN && p.choice) trades.set(p.choice, (trades.get(p.choice) ?? 0) + 1)
    return catalog(build).map(c => ({
      cat: c.cat,
      skills: c.skills.map((sk): Row => {
        const probe = evaluate(build, { id: 'probe', skill: sk.id, at: active }, loose).probe
        return {
          sk,
          cost: probe?.cost ?? 0,
          frag: probe?.frag ?? 0,
          reason: probe?.error ?? null,
          options: needsChoice(sk) ? choiceOptions(sk, st).map(o => [o, optionLabel(sk, o, build)]) : null,
          trades: sk.id === TRADESMAN ? [...trades] : undefined,
        }
      }),
    }))
  }, [build, active, loose])

  const q = query.trim().toLowerCase()
  const owned = (name: string) => ev.final.counts.get(name) ?? 0
  const needs = useMemo(() => vocationNeeds(build, ev.final), [build, ev.final])
  const hasOccupation = !!build.occupation
  const [skillInput] = useSkillInput()

  return (
    <div className="flex flex-col gap-2">
      {!loose && <span className="text-xs text-forge-muted">Buying at <span className="text-forge-accent">{stepLabel(active)}</span></span>}

      {!hasOccupation && (
        <p className="rounded-md border border-forge-accent/30 bg-forge-accent/5 px-3 py-2 text-xs text-forge-accent">
          Pick an occupation on the left: most skill costs depend on it.
        </p>
      )}

      <Masonry minWidth={300} items={[...rows].sort((a, b) => stackIndex(a.cat) - stackIndex(b.cat)).flatMap(({ cat, skills }): MasonryItem[] => {
          const shown = skills.filter(r =>
            (!q || r.sk.name.toLowerCase().includes(q)) && (!hideBlocked || !r.reason))
          // Columns come from full category sizes, so filtering or buying never moves
          // a card; a category with nothing to show hides in its slot.
          if (!shown.length) return [{ key: cat, place: place(cat), weight: skills.length + 2, node: null }]
          const ownedHere = skills.filter(r => owned(r.sk.id) > 0).length
          const buyable = skills.filter(r => !r.reason).length
          return [{ key: cat, place: place(cat), weight: skills.length + 2, node: (
            <section>
              <h3 className="flex items-baseline gap-2 border-b border-forge-accent/30 pb-0.5 text-[11px] font-semibold uppercase tracking-widest text-forge-accent">
                {cat}
                <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-forge-muted">
                  {ownedHere > 0 && <span className="text-forge-accent">{ownedHere} owned · </span>}
                  {buyable} buyable
                </span>
              </h3>
              <ul className="pl-3">
                  {shown.map(r => (
                    <SkillRow
                      key={r.sk.id}
                      row={r}
                      owned={owned(r.sk.id)}
                      needFor={needs.has(r.sk.id) ? build.vocation : undefined}
                      hasOccupation={hasOccupation}
                      numeric={skillInput === 'number'}
                      onAdd={choice => onAdd(r.sk.id, choice)}
                      onRemove={() => onRemove(r.sk.id)}
                    />
                  ))}
              </ul>
            </section>
          ) }]
        })} />
    </div>
  )
}
