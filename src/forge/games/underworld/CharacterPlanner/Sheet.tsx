import { catalog, raceData, type Build, type Evaluation } from '../engine'
import { monthLabel } from './util'

// Read-only character sheet of everything valid in the plan.
export function Sheet({ build, ev }: { build: Build; ev: Evaluation }) {
  const catOf = new Map<string, string>()
  for (const c of catalog(build)) for (const s of c.skills) catOf.set(s.name, c.cat)

  const groups = new Map<string, Map<string, number>>()
  for (const p of build.purchases) {
    const r = ev.results.get(p.id)
    if (!r || r.error) continue
    const cat = catOf.get(p.skill) ?? 'Magic'
    const g = groups.get(cat) ?? new Map<string, number>()
    g.set(r.label, (g.get(r.label) ?? 0) + 1)
    groups.set(cat, g)
  }
  const traits = raceData(build.race)?.auto ?? []
  const spells = Object.entries(build.spells).sort()
  const last = ev.steps[ev.steps.length - 1]

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="forge-card !p-4">
        <h3 className="text-base font-semibold text-[#e2e4ed]">{build.name || 'Unnamed character'}</h3>
        <p className="text-xs text-[#9ca3af] mt-1">
          {[build.race, build.culture, build.occupation, build.vocation].filter(Boolean).join(' · ') || 'No choices yet'}
        </p>
        <p className="text-xs text-[#6b7280] mt-1">
          Level {ev.stats.level} after {build.blankets.length} blanket{build.blankets.length === 1 ? '' : 's'} ({monthLabel(last.month)}) ·
          {' '}{ev.stats.cpSpent}/{ev.stats.cpTotal} CP · Body {ev.stats.body ?? '-'} · Strength {ev.stats.strength} · {ev.stats.frags} frags
        </p>
      </div>

      {traits.length > 0 && (
        <section>
          <h4 className="forge-label uppercase tracking-widest">Racial traits</h4>
          <p className="text-xs text-[#9ca3af]">{traits.map(t => t.name).join(', ')}, Weapon Group Proficiency: Simple</p>
        </section>
      )}

      {[...groups].map(([cat, skills]) => (
        <section key={cat}>
          <h4 className="forge-label uppercase tracking-widest">{cat}</h4>
          <ul className="grid sm:grid-cols-2 gap-x-6">
            {[...skills].map(([label, n]) => (
              <li key={label} className="flex justify-between text-xs text-[#c4c7d0] border-b border-[#2a2d3a] py-1">
                <span>{label}</span>{n > 1 && <span className="font-mono text-[#c4af64]">×{n}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {spells.length > 0 && (
        <section>
          <h4 className="forge-label uppercase tracking-widest">Spells</h4>
          <ul className="grid sm:grid-cols-2 gap-x-6">
            {spells.map(([slot, v]) => (
              <li key={slot} className="text-xs text-[#c4c7d0] border-b border-[#2a2d3a] py-1">
                <span className="text-[#6b7280] font-mono mr-2">{slot === 'paragon' ? 'P' : slot.split('-')[0]}</span>{v.split('|')[1]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
