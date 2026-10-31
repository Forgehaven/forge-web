import { useState, type ReactNode } from 'react'
import { toggleProps } from '../../../../lib/toggleProps'
import { SPELLS } from '../data'
import { PARAGON, SPELL_SLOT, type Build, type Evaluation } from '../engine'
import { ordinal, sphereId } from '../rules'
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
    <li className="py-1.5 border-b border-forge-border last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="w-16 text-[11px] text-forge-muted">{label}</span>
        <select className="forge-input !py-1 text-xs flex-1" value={spell ? value : ''} onChange={e => onChange(e.target.value)}>
          <option value="">Empty slot</option>
          {options.map(s => <option key={key(s)} value={key(s)}>{s.name} ({s.sphere})</option>)}
        </select>
        {spell && (
          <button className="text-xs text-forge-muted hover:text-forge-text cursor-pointer w-10" onClick={() => setOpen(o => !o)}>
            {open ? 'less' : 'more'}
          </button>
        )}
      </div>
      {spell && (
        <p className="ml-18 mt-1 text-[11px] italic text-forge-accent/80">"{incant}"</p>
      )}
      {spell && open && <Prose text={spell.desc} className="ml-18 mt-1 text-xs text-forge-dim leading-relaxed" />}
    </li>
  )
}

// A circle's card; the header collapses it.
function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="forge-card !p-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-forge-accent cursor-pointer" {...toggleProps(open, () => setOpen(o => !o))}>
        <span className={`text-[10px] text-forge-muted transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
        {title} <span className="text-forge-muted font-normal">· {sub}</span>
      </h3>
      {open && <div className="mt-1">{children}</div>}
    </section>
  )
}

export function Spellbook({ build, ev, setBuild }: Props) {
  const schools = build.schools.filter((s, i) => s && (ev.final.counts.get(sphereId(i)) ?? 0) > 0)
  const set = (k: string, v: string) => setBuild(b => {
    const spells = { ...b.spells }
    if (v) spells[k] = v
    else delete spells[k]
    return { ...b, spells }
  })
  const paragon = paragonGift(build, ev)

  if (!schools.length && !paragon) {
    return <p className="text-sm text-forge-muted">Buy a sphere and pick its school on the Magic tab, then add spell slots.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-forge-muted">Spheres: <span className="text-forge-text">{schools.join(', ') || 'none'}</span></p>
      {Array.from({ length: 9 }, (_, i) => i + 1).map(circle => {
        const n = ev.final.circles[circle]
        if (!n) return null
        const options = SPELLS.filter(s => s.level === circle && schools.includes(s.sphere))
        return (
          <Section key={circle} title={`${ordinal(circle)} Circle`} sub={`${n} slot${n > 1 ? 's' : ''}`}>
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
          </Section>
        )
      })}
      {paragon && (
        <Section title="Paragon" sub={`${paragon.sphere}, ${ordinal(paragon.circle)} Circle`}>
          <ul>
            <SlotRow
              label="Gift"
              value={build.spells.paragon ?? ''}
              options={SPELLS.filter(s => s.sphere === paragon.sphere && s.level === paragon.circle)}
              attunement={build.attunement}
              onChange={v => set('paragon', v)}
            />
          </ul>
        </Section>
      )}
      {ev.final.counts.get(SPELL_SLOT) === undefined && !paragon && (
        <p className="text-xs text-forge-muted">No spell slots yet.</p>
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
