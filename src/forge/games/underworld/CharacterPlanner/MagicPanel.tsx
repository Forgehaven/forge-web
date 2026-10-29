import { useState } from 'react'
import { evaluate, READ_MAGIC, READ_MAGIC_ADVANCED, RITUAL_SLOT, SPELL_SLOT, skillName, type Build, type Evaluation } from '../engine'
import {
  ELEMENTS, EXCLUSIVE_SPHERES, MAX_RITUAL_SLOTS, SCHOOLS_OF_MAGIC, SLOTS_PER_CIRCLE,
  SURCHARGE_SPHERES, ordinal, PYRAMID_ORDER, sphereId, sphereName,
} from '../rules'
import { stepLabel } from './util'

interface Props {
  build: Build
  ev: Evaluation
  active: number
  setBuild: (fn: (b: Build) => Build) => void
  loose: boolean
  onAdd: (skill: string, choice?: string) => void
  onRemove: (skill: string, choice?: string) => void
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="w-7 h-7 rounded border border-[#2a2d3a] text-[#9ca3af] hover:text-red-300 hover:border-red-400/40 cursor-pointer"
    >−</button>
  )
}

function AddButton({ label, probe, onClick }: {
  label: string
  probe: Evaluation['probe']
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      title={probe?.error ?? `${probe?.cost} CP`}
      disabled={!!probe?.error}
      onClick={onClick}
      className="w-7 h-7 rounded border border-[#2a2d3a] text-[#c4af64] hover:bg-[#c4af64]/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
    >+</button>
  )
}

export function MagicPanel({ build, ev, active, loose, setBuild, onAdd, onRemove }: Props) {
  const [fillTo, setFillTo] = useState('')
  const probe = (skill: string, choice?: string) => evaluate(build, { id: 'probe', skill, at: active, choice }, loose).probe
  const owned = (id: string) => ev.final.counts.get(id) ?? 0
  const setSchool = (i: number, school: string) =>
    setBuild(b => ({ ...b, schools: b.schools.map((s, j) => (j === i ? school : s)) }))
  const removeSphere = () => setBuild(b => ({ ...b, schools: b.schools.slice(0, -1) }))
  const hasElemental = build.schools.includes('Elemental')

  // Skills a pyramid through `target` needs that the plan doesn't own yet.
  const missingPrereqs = (target: number) =>
    ['read-write', READ_MAGIC, sphereId(0), ...(target >= 5 ? [READ_MAGIC_ADVANCED] : [])]
      .filter(id => owned(id) === 0)
  const missingSlots = (target: number) => {
    const stop = PYRAMID_ORDER.indexOf(target)
    const have = [...ev.final.circles]
    return PYRAMID_ORDER.slice(0, stop + 1).filter(circle => {
      if (have[circle] > 0) { have[circle]--; return false }
      return true
    })
  }
  const target = Number(fillTo)
  const fillPrereqs = target ? missingPrereqs(target) : []
  const fillSlots = target ? missingSlots(target) : []

  const fillPyramid = () => {
    fillPrereqs.forEach(id => onAdd(id))
    fillSlots.forEach(circle => onAdd(SPELL_SLOT, String(circle)))
    setFillTo('')
  }

  return (
    <div className="flex flex-col gap-4">
      {!loose && <p className="text-xs text-[#6b7280]">Purchases land on <span className="text-[#c4af64]">{stepLabel(active)}</span>.</p>}

      <div className="grid lg:grid-cols-[16rem_minmax(0,1fr)] gap-4 items-start">
        <div className="flex flex-col gap-2">
          {build.schools.map((_, i) => {
            const id = sphereId(i)
            const name = sphereName(i)
            const has = owned(id) > 0
            const p = probe(id)
            const used = build.schools.filter((s, j) => s && j !== i)
            return (
              <div key={id} className={`forge-card !p-3 flex flex-col gap-2 ${has ? 'border-[#c4af64]/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#e2e4ed]">Sphere {i + 1}</span>
                  {has
                    ? <span className="flex items-center gap-2"><span className="text-[10px] text-emerald-300">owned</span><RemoveButton label={`Remove ${name}`} onClick={() => onRemove(id)} /></span>
                    : <AddButton label={`Buy ${name}`} probe={p} onClick={() => onAdd(id)} />}
                </div>
                {!has && <span className="text-[11px] text-[#6b7280]">{p?.error ?? `${p?.cost} CP`}</span>}
                <select className="forge-input !py-1 text-xs" value={build.schools[i]} onChange={e => setSchool(i, e.target.value)}>
                  <option value="">School…</option>
                  {SCHOOLS_OF_MAGIC.map(s => {
                    const locked = EXCLUSIVE_SPHERES[s] && !EXCLUSIVE_SPHERES[s].includes(build.vocation)
                    return <option key={s} value={s} disabled={used.includes(s) || !!locked}>{s}{locked ? ' (Favoured only)' : ''}</option>
                  })}
                </select>
                {SURCHARGE_SPHERES.includes(build.schools[i]) && <span className="text-[11px] text-violet-300">+100 frags</span>}
                {i >= 3 && i === build.schools.length - 1 && !has && (
                  <button className="self-start text-[11px] text-[#6b7280] hover:text-red-400 cursor-pointer" onClick={removeSphere}>Remove sphere</button>
                )}
              </div>
            )
          })}
          {build.schools.length < SCHOOLS_OF_MAGIC.length && (
            <button
              className="rounded-md border border-dashed border-[#2a2d3a] py-2 text-xs text-[#6b7280] hover:text-[#c4af64] hover:border-[#c4af64]/40 cursor-pointer"
              onClick={() => setBuild(b => ({ ...b, schools: [...b.schools, ''] }))}
            >+ Add another sphere</button>
          )}

          {hasElemental && (
            <label className="flex flex-wrap items-center gap-2 text-xs text-[#9ca3af]">
              Primary attunement
              <select className="forge-input !w-auto !py-1 text-xs" value={build.attunement} onChange={e => setBuild(b => ({ ...b, attunement: e.target.value }))}>
                <option value="">Choose…</option>
                {ELEMENTS.map(el => <option key={el} value={el}>{el}</option>)}
              </select>
              <span className="text-[#6b7280]">Extra elements: buy Elemental Attunement in Skills.</span>
            </label>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map(circle => {
              const n = ev.final.circles[circle]
              const p = probe(SPELL_SLOT, String(circle))
              return (
                <div key={circle} className="rounded-md border border-[#2a2d3a] p-2 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-[#e2e4ed]">{ordinal(circle)}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.max(SLOTS_PER_CIRCLE, n) }, (_, k) => (
                      <span key={k} className={`w-2 h-2 rounded-full ${k < n ? 'bg-[#c4af64]' : 'bg-[#2a2d3a]'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-[#6b7280]">{p?.cost} CP</span>
                  <div className="flex gap-1">
                    {n > 0 && <RemoveButton label={`Remove ${ordinal(circle)} circle slot`} onClick={() => onRemove(SPELL_SLOT, String(circle))} />}
                    <AddButton label={`Add ${ordinal(circle)} circle slot`} probe={p} onClick={() => onAdd(SPELL_SLOT, String(circle))} />
                  </div>
                </div>
              )
            })}
            <div className="rounded-md border border-[#2a2d3a] p-2 flex flex-col items-center gap-1.5">
              <span className="text-xs text-[#e2e4ed]">Ritual</span>
              <span className="text-[10px] font-mono text-[#9ca3af]">{ev.final.rituals}/{MAX_RITUAL_SLOTS}</span>
              <span className="text-[10px] font-mono text-[#6b7280]">{probe(RITUAL_SLOT)?.cost} CP</span>
              <div className="flex gap-1">
                {ev.final.rituals > 0 && <RemoveButton label="Remove ritual slot" onClick={() => onRemove(RITUAL_SLOT)} />}
                <AddButton label="Add ritual slot" probe={probe(RITUAL_SLOT)} onClick={() => onAdd(RITUAL_SLOT)} />
              </div>
            </div>
          </div>

          <details className="forge-card !p-4 group">
            <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-semibold text-[#e2e4ed]">
              Fill the spell pyramid
              <span className="ml-auto text-xs text-[#6b7280] group-open:rotate-90 transition-transform">▸</span>
            </summary>
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#9ca3af]">
                Through the first
                <select aria-label="Fill through circle" className="forge-input !w-auto" value={fillTo} onChange={e => setFillTo(e.target.value)}>
                  <option value="">circle…</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(c => <option key={c} value={c}>{ordinal(c)} circle</option>)}
                </select>
                <button
                  className="forge-btn-accent"
                  disabled={!target || (!fillPrereqs.length && !fillSlots.length)}
                  onClick={fillPyramid}
                >Add to plan</button>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                {!target
                  ? `Buys every slot a legal pyramid needs up to that circle${loose ? '' : ` at ${stepLabel(active)}`}, plus Read & Write, Read Magic, Sphere 1 and (5th+) Read Magic: Advanced if missing.`
                  : !fillPrereqs.length && !fillSlots.length
                    ? 'Already there.'
                    : <>Adds {[
                        ...fillPrereqs.map(skillName),
                        ...(fillSlots.length ? [`${fillSlots.length} spell slot${fillSlots.length > 1 ? 's' : ''}`] : []),
                      ].join(', ')}{loose ? '' : ` at ${stepLabel(active)}`}.</>}
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
