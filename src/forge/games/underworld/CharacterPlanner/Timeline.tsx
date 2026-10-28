import { useState } from 'react'
import { insertBlanket, nextBlanketMonth, pastBlankets, sortedPurchases, type Build, type Evaluation } from '../engine'
import { MAX_BLANKETS_PER_MONTH } from '../rules'
import { stepLabel } from './util'
import { MonthSelect } from '../components/MonthSelect'

interface Props {
  build: Build
  ev: Evaluation
  active: number
  setActive: (at: number) => void
  setBuild: (fn: (b: Build) => Build) => void
}

// Removing blanket k folds its purchases into the step before it.
function removeBlanket(b: Build, k: number): Build {
  return {
    ...b,
    blankets: b.blankets.filter((_, i) => i !== k - 1),
    purchases: b.purchases.map(p => (p.at >= k ? { ...p, at: p.at - 1 } : p)),
  }
}

export function Timeline({ build, ev, active, setActive, setBuild }: Props) {
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [addMonth, setAddMonth] = useState('')
  const [past, setPast] = useState('')
  const byStep = new Map<number, string[]>()
  for (const p of sortedPurchases(build)) byStep.set(p.at, [...(byStep.get(p.at) ?? []), p.id])

  const move = (id: string, at: number) =>
    setBuild(b => ({ ...b, purchases: b.purchases.map(p => (p.id === id ? { ...p, at } : p)) }))
  const drop = (id: string) => setBuild(b => ({ ...b, purchases: b.purchases.filter(p => p.id !== id) }))
  const setMonth = (k: number, month: string) =>
    setBuild(b => ({ ...b, blankets: b.blankets.map((m, i) => (i === k - 1 ? month : m)) }))
  const month = addMonth || nextBlanketMonth(build)
  const addBlanket = () => {
    const { build: out, at } = insertBlanket(build, month)
    setBuild(() => out)
    setActive(at)
    setAddMonth('')
  }
  const addPast = () => {
    const n = Number(past)
    if (!(n > 0)) return
    setBuild(b => pastBlankets(b, Math.min(n, 200)))
    setPast('')
  }

  return (
    <section className="forge-card !p-4 flex flex-col gap-3 self-start">
      <h2 className="text-sm font-semibold text-[#e2e4ed]">Timeline</h2>
      <p className="text-[11px] text-[#6b7280] leading-snug">
        Set the month the character was created, then add blankets in the months you apply them
        (max {MAX_BLANKETS_PER_MONTH} a month). Click a step to buy skills there; drag skills between steps.
      </p>

      <ol className="flex flex-col gap-2">
        {ev.steps.map((step, i) => {
          const prev = ev.steps[i - 1]
          const levelUp = prev && step.row.level > prev.row.level
          const isActive = step.at === active
          const pct = Math.min(1, step.spent / step.cp)
          const over = step.spent > step.cp
          return (
            <li
              key={step.at}
              onClick={() => setActive(step.at)}
              onDragOver={e => { e.preventDefault(); setDragOver(step.at) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(null)
                const id = e.dataTransfer.getData('text/plain')
                if (id) move(id, step.at)
              }}
              className={`relative rounded-md border p-3 cursor-pointer transition-colors ${
                isActive ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'
              } ${dragOver === step.at ? 'ring-1 ring-[#c4af64]' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isActive ? 'text-[#c4af64]' : 'text-[#e2e4ed]'}`}>{stepLabel(step.at)}</span>
                <MonthSelect
                  compact
                  label={step.at === 0 ? 'Character created' : `Blanket ${step.at}`}
                  value={step.month}
                  onChange={m => (step.at === 0 ? setBuild(b => ({ ...b, startMonth: m })) : setMonth(step.at, m))}
                />
                <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${levelUp ? 'bg-emerald-500/15 text-emerald-300' : 'text-[#6b7280]'}`}>
                  L{step.row.level}{levelUp ? ' ▲' : ''}
                </span>
                {step.at > 0 && (
                  <button
                    aria-label={`Remove blanket ${step.at}`}
                    className="text-[#4b5563] hover:text-red-400 cursor-pointer leading-none"
                    onClick={e => {
                      e.stopPropagation()
                      setBuild(b => removeBlanket(b, step.at))
                      if (active >= step.at) setActive(Math.max(0, active - 1))
                    }}
                  >×</button>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
                  <div className={`h-full ${over ? 'bg-red-400' : 'bg-[#c4af64]'}`} style={{ width: `${pct * 100}%` }} />
                </div>
                <span className={`text-[10px] font-mono ${over ? 'text-red-400' : 'text-[#6b7280]'}`}>{step.spent}/{step.cp} CP</span>
              </div>
              {step.error && <p className="text-[11px] text-red-400 mt-1">{step.error}</p>}

              {(byStep.get(step.at) ?? []).length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {(byStep.get(step.at) ?? []).map(id => {
                    const r = ev.results.get(id)
                    if (!r) return null
                    return (
                      <li
                        key={id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('text/plain', id)}
                        title={r.error ?? `${r.cost} CP${r.frag ? `, ${r.frag} frags` : ''}`}
                        className={`group flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] cursor-grab ${
                          r.error ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-[#2a2d3a] text-[#c4c7d0]'
                        }`}
                      >
                        {r.label}
                        <span className="text-[#6b7280] font-mono">{r.cost}</span>
                        <button
                          aria-label={`Remove ${r.label}`}
                          className="text-[#6b7280] hover:text-red-400 cursor-pointer"
                          onClick={e => { e.stopPropagation(); drop(id) }}
                        >×</button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-col gap-2 border-t border-[#2a2d3a] pt-3">
        <span className="forge-label !mb-0">Next blanket</span>
        <div className="flex items-center gap-2">
          <MonthSelect label="Next blanket" value={month} onChange={setAddMonth} />
          <button className="forge-btn-accent !py-1.5 ml-auto" onClick={addBlanket}>+ Add blanket</button>
        </div>
        <p className="text-[11px] text-[#6b7280] leading-snug">Change any blanket's month on its card.</p>
      </div>

      <details className="group text-xs">
        <summary className="cursor-pointer list-none text-[#6b7280] hover:text-[#9ca3af] select-none">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> Building on an existing character?
        </summary>
        <div className="mt-2 flex flex-col gap-2 rounded-md border border-[#2a2d3a] p-3 text-[#9ca3af] leading-snug">
          <p>
            Set <span className="text-[#e2e4ed]">Creation</span> to the month you made the character, then enter how
            many blankets you've applied so far. They're added from that month, {MAX_BLANKETS_PER_MONTH} a month;
            adjust any month afterwards.
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              Blankets applied
              <input
                type="number"
                inputMode="numeric"
                min={1}
                className="forge-input !w-20 !py-1"
                value={past}
                onChange={e => setPast(e.target.value)}
              />
            </label>
            <button className="text-[#c4af64] hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed ml-auto" onClick={addPast} disabled={!(Number(past) > 0)}>
              Add history
            </button>
          </div>
        </div>
      </details>
    </section>
  )
}
