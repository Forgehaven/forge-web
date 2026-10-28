import { useState } from 'react'
import { SPELLS } from '../data'
import { PARAGON, SPELL_SLOT, type Build, type Evaluation } from '../engine'
import { ordinal, sphereName } from '../rules'
import type { Spell } from '../types'
import { Prose } from '../components/Prose'

interface Props {
  build: Build
  ev: Evaluation
  setBuild: (fn: (b: Build) => Build) => void
}

const key = (s: Spell) => `${s.sphere}|${s.name}`

function SlotRow({ label, value, options, attunement, onChange }: {
  label: string
  value: string
  options: Spell[]
  attunement: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const spell = options.find(s => key(s) === value)
  const incant = spell && attunement ? spell.incant.replace(/<[Tt]ype>/g, attunement) : spell?.incant
  return (
    <li className="py-1.5 border-b border-[#2a2d3a] last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="w-16 text-[11px] text-[#6b7280]">{label}</span>
        <select className="forge-input !py-1 text-xs flex-1" value={spell ? value : ''} onChange={e => onChange(e.target.value)}>
          <option value="">Empty slot</option>
          {options.map(s => <option key={key(s)} value={key(s)}>{s.name} ({s.sphere})</option>)}
        </select>
        {spell && (
          <button className="text-xs text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer w-10" onClick={() => setOpen(o => !o)}>
            {open ? 'less' : 'more'}
          </button>
        )}
      </div>
      {spell && (
        <p className="ml-18 mt-1 text-[11px] italic text-[#c4af64]/80">"{incant}"</p>
      )}
      {spell && open && <Prose text={spell.desc} className="ml-18 mt-1 text-xs text-[#9ca3af] leading-relaxed" />}
    </li>
  )
}

export function Spellbook({ build, ev, setBuild }: Props) {
  const schools = build.schools.filter((s, i) => s && (ev.final.counts.get(sphereName(i)) ?? 0) > 0)
  const set = (k: string, v: string) => setBuild(b => {
    const spells = { ...b.spells }
    if (v) spells[k] = v
    else delete spells[k]
    return { ...b, spells }
  })
  const paragon = paragonGift(build, ev)

  if (!schools.length && !paragon) {
    return <p className="text-sm text-[#6b7280]">Buy a sphere and pick its school on the Magic tab, then add spell slots.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#6b7280]">Spheres: <span className="text-[#e2e4ed]">{schools.join(', ') || 'none'}</span></p>
      {Array.from({ length: 9 }, (_, i) => i + 1).map(circle => {
        const n = ev.final.circles[circle]
        if (!n) return null
        const options = SPELLS.filter(s => s.level === circle && schools.includes(s.sphere))
        return (
          <section key={circle} className="forge-card !p-3">
            <h3 className="text-xs font-semibold text-[#c4af64] mb-1">{ordinal(circle)} Circle <span className="text-[#6b7280] font-normal">· {n} slot{n > 1 ? 's' : ''}</span></h3>
            <ul>
              {Array.from({ length: n }, (_, s) => (
                <SlotRow
                  key={s}
                  label={`Slot ${s + 1}`}
                  value={build.spells[`${circle}-${s + 1}`] ?? ''}
                  options={options}
                  attunement={build.attunement}
                  onChange={v => set(`${circle}-${s + 1}`, v)}
                />
              ))}
            </ul>
          </section>
        )
      })}
      {paragon && (
        <section className="forge-card !p-3">
          <h3 className="text-xs font-semibold text-[#c4af64] mb-1">Paragon <span className="text-[#6b7280] font-normal">· {paragon.sphere}, {ordinal(paragon.circle)} Circle</span></h3>
          <ul>
            <SlotRow
              label="Gift"
              value={build.spells.paragon ?? ''}
              options={SPELLS.filter(s => s.sphere === paragon.sphere && s.level === paragon.circle)}
              attunement={build.attunement}
              onChange={v => set('paragon', v)}
            />
          </ul>
        </section>
      )}
      {ev.final.counts.get(SPELL_SLOT) === undefined && !paragon && (
        <p className="text-xs text-[#6b7280]">No spell slots yet.</p>
      )}
    </div>
  )
}

function paragonGift(build: Build, ev: Evaluation) {
  const p = build.purchases.find(x => x.skill === PARAGON && x.choice && !ev.results.get(x.id)?.error)
  if (!p?.choice) return null
  const [sphere, circle] = p.choice.split('|')
  return { sphere, circle: Number(circle) }
}
