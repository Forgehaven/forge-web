import { prereqLabel } from '../engine'
import { OCC_ORDER } from '../rules'
import type { Skill } from '../types'
import { Prose } from './Prose'

// A skill's rules text, prerequisites and per-occupation costs.
export function SkillDetails({ s }: { s: Skill }) {
  return (
    <>
      <Prose text={s.desc} />
      {s.prereqs.length > 0 && (
        <p><span className="text-forge-accent">Requires:</span> {s.prereqs.map(prereqLabel).join('; ')}{s.prereqPerPurchase ? ' (per purchase)' : ''}</p>
      )}
      {s.costs && (
        <dl className="grid grid-cols-3 gap-x-4 gap-y-0.5 font-mono text-[11px]">
          {OCC_ORDER.map(o => (
            <div key={o} className="flex justify-between gap-2">
              <dt className="text-forge-muted font-sans">{o}</dt>
              <dd className="text-forge-text">{s.costs![o]}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )
}
