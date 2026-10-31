import { useState } from 'react'
import { activePurchases, withPurchases, type Build, type Evaluation } from '../engine'
import { toggleProps } from '../../../../lib/toggleProps'

interface Props {
  build: Build
  ev: Evaluation
  setBuild: (fn: (b: Build) => Build) => void
}

// Free-pick mode: a blanket count sets the CP pool; overspending is allowed and
// shows as negative CP left.
export function SimpleBlankets({ build, ev, setBuild }: Props) {
  const n = build.simple?.blankets ?? 0
  const setN = (v: number) => setBuild(b => ({
    ...b, simple: { purchases: b.simple?.purchases ?? [], blankets: Math.max(0, Math.min(500, v)) },
  }))
  const { cpTotal, cpSpent, cpRemaining, level } = ev.stats
  const over = cpRemaining < 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-forge-text">Blankets</span>
        <div className="flex items-center ml-auto">
          <button aria-label="One fewer blanket" className="w-7 h-7 rounded-l border border-forge-border text-forge-dim hover:text-forge-text cursor-pointer" onClick={() => setN(n - 1)}>−</button>
          <input
            aria-label="Blankets"
            type="text"
            inputMode="numeric"
            className="w-14 h-7 bg-forge-bg border-y border-forge-border text-center text-sm text-forge-text focus:outline-none"
            value={n}
            onChange={e => setN(Number(e.target.value.replace(/\D/g, '')) || 0)}
          />
          <button aria-label="One more blanket" className="w-7 h-7 rounded-r border border-forge-border text-forge-dim hover:text-forge-text cursor-pointer" onClick={() => setN(n + 1)}>+</button>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-forge-dim">Level {level}</span>
          <span className={`font-mono ${over ? 'text-red-400' : 'text-forge-dim'}`}>
            {cpSpent}/{cpTotal} CP{over ? ` (${cpRemaining})` : ''}
          </span>
        </div>
        <div className="h-1 bg-forge-border rounded-full overflow-hidden">
          <div className={`h-full ${over ? 'bg-red-400' : 'bg-forge-accent'}`} style={{ width: `${Math.min(1, cpSpent / cpTotal) * 100}%` }} />
        </div>
        {over && <p className="text-[11px] text-red-400 mt-1">{-cpRemaining} CP over. Add blankets or drop a skill.</p>}
      </div>
    </div>
  )
}

// The sandbox picks, collapsed to a count until opened.
export function SimplePlan({ build, ev, setBuild }: Props) {
  const [open, setOpen] = useState(false)
  const picks = activePurchases(build)

  return (
    <section className="forge-card !p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm cursor-pointer" {...toggleProps(open, () => setOpen(o => !o))}>
        <span className={`text-xs text-forge-muted transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
        <span className="font-semibold text-forge-text">Skills/Magic List</span>
        <span className="ml-auto text-xs text-forge-muted">{picks.length} pick{picks.length === 1 ? '' : 's'}</span>
      </div>
      {open && (picks.length > 0 ? (
        <ul className="flex flex-wrap gap-1">
          {picks.map(p => {
            const r = ev.results.get(p.id)
            if (!r) return null
            return (
              <li
                key={p.id}
                title={r.error ?? `${r.cost} CP${r.frag ? `, ${r.frag} frags` : ''}`}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${
                  r.error ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-forge-border text-forge-soft'
                }`}
              >
                {r.label}
                <span className="text-forge-muted font-mono">{r.cost}</span>
                <button
                  aria-label={`Remove ${r.label}`}
                  className="text-forge-muted hover:text-red-400 cursor-pointer"
                  onClick={() => setBuild(b => withPurchases(b, activePurchases(b).filter(x => x.id !== p.id)))}
                >×</button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[11px] text-forge-muted">Pick skills on the right.</p>
      ))}
    </section>
  )
}
