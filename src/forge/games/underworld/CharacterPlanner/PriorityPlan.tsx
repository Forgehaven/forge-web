import { useState } from 'react'
import { activePurchases, withPurchases, type Build, type Evaluation, type Priority } from '../engine'
import { MAX_BLANKETS_PER_MONTH } from '../rules'
import { MonthSelect } from '../components/MonthSelect'
import { monthLabel } from './util'

interface Props {
  // Scheduled build (priorityView); `build` is the stored one.
  view: Build
  build: Build
  ev: Evaluation
  setBuild: (fn: (b: Build) => Build) => void
}

const COUNTS = Array.from({ length: MAX_BLANKETS_PER_MONTH + 1 }, (_, i) => i)

// Priority mode: skills in buying order; each is dated at the first blanket that
// can afford it.
export function PriorityPlan({ view, build, ev, setBuild }: Props) {
  const p = build.priority ?? { perMonth: MAX_BLANKETS_PER_MONTH, months: {}, purchases: [] }
  const [month, setMonth] = useState(build.startMonth)
  const setPriority = (fn: (p: Priority) => Priority) => setBuild(b => ({ ...b, priority: fn(b.priority ?? p) }))
  const picks = activePurchases(build)
  const at = new Map(view.purchases.map(x => [x.id, x.at]))
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null)
  const move = (from: number, to: number) => setBuild(b => {
    const list = [...activePurchases(b)]
    if (from === to || to < 0 || to >= list.length) return b
    list.splice(to, 0, ...list.splice(from, 1))
    return withPurchases(b, list)
  })
  const overrides = Object.entries(p.months).sort(([a], [b]) => a.localeCompare(b))

  return (
    <section className="forge-card !p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-forge-text">Blankets a month</span>
        <select
          aria-label="Blankets a month"
          className="forge-input !w-auto !py-1 ml-auto cursor-pointer"
          value={p.perMonth}
          onChange={e => setPriority(x => ({ ...x, perMonth: Number(e.target.value) }))}
        >
          {COUNTS.slice(1).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-forge-dim hover:text-forge-text">
          Months with fewer blankets{overrides.length ? ` (${overrides.length})` : ''}
        </summary>
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <MonthSelect compact label="Exception" value={month} onChange={setMonth} />
            {COUNTS.slice(0, -1).map(n => (
              <button
                key={n}
                className="forge-btn !py-0.5 !px-2 text-xs cursor-pointer"
                onClick={() => setPriority(x => ({ ...x, months: { ...x.months, [month]: n } }))}
              >{n}</button>
            ))}
          </div>
          {overrides.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {overrides.map(([m, n]) => (
                <li key={m} className="flex items-center gap-1 rounded bg-forge-border px-1.5 py-0.5 text-[11px] text-forge-soft">
                  {monthLabel(m)}: {n}
                  <button
                    aria-label={`Clear ${monthLabel(m)}`}
                    className="text-forge-muted hover:text-red-400 cursor-pointer"
                    onClick={() => setPriority(x => ({ ...x, months: Object.fromEntries(Object.entries(x.months).filter(([k]) => k !== m)) }))}
                  >×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {picks.length > 0 ? (
        <ol className="flex flex-col">
          {picks.map((x, i) => {
            const r = ev.results.get(x.id)
            if (!r) return null
            const step = ev.steps[at.get(x.id) ?? 0]
            const prev = i > 0 ? ev.steps[at.get(picks[i - 1].id) ?? 0] : null
            return (
              <li
                key={x.id}
                draggable
                onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDrag({ from: i, over: i }) }}
                onDragOver={e => { e.preventDefault(); if (drag && drag.over !== i) setDrag({ ...drag, over: i }) }}
                onDrop={e => { e.preventDefault(); if (drag) move(drag.from, i) }}
                onDragEnd={() => setDrag(null)}
                className={`cursor-grab active:cursor-grabbing ${drag?.over === i && drag.from !== i ? (drag.from < i ? 'border-b' : 'border-t') + ' border-forge-accent' : ''} ${drag?.from === i ? 'opacity-40' : ''}`}
              >
                {step !== prev && (
                  <div className={`flex justify-between text-[11px] text-forge-accent mb-0.5 ${i ? 'mt-2' : ''}`}>
                    <span>{step.at === 0 ? 'Creation' : monthLabel(step.month)}</span>
                    <span className="text-forge-muted">Level {step.row.level} · {step.cp - step.spent} CP left</span>
                  </div>
                )}
                <div
                  title={r.error ?? `${r.cost} CP${r.frag ? `, ${r.frag} frags` : ''}`}
                  className={`group flex items-center gap-1.5 text-xs py-0.5 ${r.error ? 'text-red-300' : 'text-forge-soft'}`}
                >
                  <span className="flex-1 min-w-0 truncate">{r.label}</span>
                  {r.error && <span className="text-[10px] text-red-400/80 truncate max-w-[45%]">{r.error}</span>}
                  <span className="text-forge-muted font-mono">{r.cost}</span>
                  <span className="flex opacity-40 group-hover:opacity-100 focus-within:opacity-100">
                    <button aria-label={`Move ${r.label} up`} className="w-5 text-forge-dim hover:text-forge-text cursor-pointer disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)}>↑</button>
                    <button aria-label={`Move ${r.label} down`} className="w-5 text-forge-dim hover:text-forge-text cursor-pointer disabled:opacity-30" disabled={i === picks.length - 1} onClick={() => move(i, i + 1)}>↓</button>
                    <button
                      aria-label={`Remove ${r.label}`}
                      className="w-5 text-forge-muted hover:text-red-400 cursor-pointer"
                      onClick={() => setBuild(b => withPurchases(b, activePurchases(b).filter(y => y.id !== x.id)))}
                    >×</button>
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-[11px] text-forge-muted">Pick skills on the right in the order you want them; drag to reorder. Each one is dated at the first blanket that can afford it.</p>
      )}
    </section>
  )
}
