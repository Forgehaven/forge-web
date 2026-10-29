import { useState } from 'react'
import { insertBlanket, nextBlanketMonth, pastBlankets, sortedPurchases, type Build, type Evaluation } from '../engine'
import { MAX_BLANKETS_PER_MONTH } from '../rules'
import { monthLabel, stepLabel } from './util'
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

function TodayLine() {
  return (
    <div className="flex items-center gap-2 py-2 pl-[3.25rem] text-[10px] uppercase tracking-widest text-sky-300">
      <span className="h-px flex-1 bg-sky-300/40" /> Today <span className="h-px flex-1 bg-sky-300/40" />
    </div>
  )
}

const thisMonth = () => new Date().toISOString().slice(0, 7)
const monthsBetween = (a: string, b: string) => {
  const [ay, am] = a.split('-').map(Number)
  const [by, bm] = b.split('-').map(Number)
  return (by - ay) * 12 + bm - am
}
const span = (months: number) => {
  const y = Math.floor(months / 12), m = months % 12
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo`].filter(Boolean).join(' ') || 'under a month'
}

function Chip({ id, ev, onRemove }: { id: string; ev: Evaluation; onRemove: () => void }) {
  const r = ev.results.get(id)
  if (!r) return null
  return (
    <li
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', id)}
      title={r.error ?? `${r.cost} CP${r.frag ? `, ${r.frag} frags` : ''}`}
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-grab ${
        r.error ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-[#2a2d3a] text-[#c4c7d0]'
      }`}
    >
      {r.label}
      <span className="text-[#6b7280] font-mono">{r.cost}</span>
      <button aria-label={`Remove ${r.label}`} className="text-[#6b7280] hover:text-red-400 cursor-pointer" onClick={e => { e.stopPropagation(); onRemove() }}>×</button>
    </li>
  )
}

// The character's history and plan as a vertical timeline.
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

  const now = thisMonth()
  const lastStep = ev.steps[ev.steps.length - 1]
  const final = lastStep.row.level
  // Newest first. The "Today" line sits above the latest step not after this month.
  const todayAt = ev.steps.findLast(s => s.month <= now)?.at

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold text-[#e2e4ed]">Timeline</h2>
        <p className="text-xs text-[#9ca3af]">
          Created {monthLabel(build.startMonth)} · {build.blankets.length} blanket{build.blankets.length === 1 ? '' : 's'} over{' '}
          {span(Math.max(0, monthsBetween(build.startMonth, lastStep.month)))} · reaches Level {final}
        </p>
      </header>

      <details className="group text-xs">
        <summary className="cursor-pointer list-none text-[#6b7280] hover:text-[#9ca3af] select-none">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> Building on an existing character?
        </summary>
        <div className="mt-2 flex flex-col gap-2 rounded-md border border-[#2a2d3a] p-3 text-[#9ca3af] leading-snug max-w-md">
          <p>
            Set <span className="text-[#e2e4ed]">Creation</span> to the month you made the character, then enter how
            many blankets you've applied so far. They're added from that month, {MAX_BLANKETS_PER_MONTH} a month;
            adjust any month afterwards.
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              Blankets applied
              <input type="number" inputMode="numeric" min={1} className="forge-input !w-20 !py-1" value={past} onChange={e => setPast(e.target.value)} />
            </label>
            <button className="text-[#c4af64] hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed ml-auto" onClick={addPast} disabled={!(Number(past) > 0)}>
              Add history
            </button>
          </div>
        </div>
      </details>

      <ol className="relative">
        <li className="grid grid-cols-[2rem_1.25rem_minmax(0,1fr)] gap-x-2">
          <span />
          <span className="relative flex justify-center">
            <span className="absolute top-4 bottom-0 w-px border-l border-dashed border-[#3a3d4a]" />
            <span className="relative mt-3.5 w-2.5 h-2.5 rounded-full border border-dashed border-[#c4af64]" />
          </span>
          <div className="my-1 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-[#2a2d3a] px-3 py-2">
            <span className="text-sm text-[#9ca3af]">Next blanket</span>
            <MonthSelect compact label="Next blanket" value={month} onChange={setAddMonth} />
            <button className="forge-btn-accent !py-1 ml-auto" onClick={addBlanket}>+ Add blanket</button>
          </div>
        </li>

        {ev.steps.map((step, i) => [step, i] as const).reverse().map(([step, i]) => {
          const prev = ev.steps[i - 1]
          const later = ev.steps[i + 1]
          const levelUp = !prev || step.row.level > prev.row.level
          const year = step.month.slice(0, 4)
          const newYear = !later || later.month.slice(0, 4) !== year
          const planned = step.month > now
          const isActive = step.at === active
          const over = step.spent > step.cp
          const ids = byStep.get(step.at) ?? []
          return (
            <li key={step.at} className="contents">
              {step.at === todayAt && <TodayLine />}
              {newYear && (
                <div className="pl-1 pt-2 pb-1 text-sm font-semibold text-[#c4af64]">{year}</div>
              )}
              <div className="grid grid-cols-[2rem_1.25rem_minmax(0,1fr)] gap-x-2">
                <span className="text-xs text-[#6b7280] text-right pt-3">{later?.month === step.month ? '' : monthLabel(step.month).split(' ')[0]}</span>
                <span className="relative flex justify-center">
                  <span className={`absolute inset-y-0 w-px ${planned ? 'border-l border-dashed border-[#3a3d4a]' : 'bg-[#3a3d4a]'} ${i === 0 ? 'h-4' : ''}`} />
                  <span className={`relative rounded-full ${
                    levelUp ? 'mt-3 w-3.5 h-3.5 bg-emerald-400 ring-4 ring-emerald-400/15' : `mt-3.5 w-2.5 h-2.5 ${isActive ? 'bg-[#c4af64]' : 'bg-[#4b5563]'}`
                  }`} />
                </span>
                <div
                  onClick={() => setActive(step.at)}
                  onDragOver={e => { e.preventDefault(); setDragOver(step.at) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOver(null)
                    const id = e.dataTransfer.getData('text/plain')
                    if (id) move(id, step.at)
                  }}
                  className={`my-1 rounded-md border px-3 py-2 cursor-pointer transition-colors ${planned ? 'border-dashed' : ''} ${
                    isActive ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'
                  } ${dragOver === step.at ? 'ring-1 ring-[#c4af64]' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isActive ? 'text-[#c4af64]' : 'text-[#e2e4ed]'}`}>{stepLabel(step.at)}</span>
                    <MonthSelect
                      compact
                      label={step.at === 0 ? 'Character created' : `Blanket ${step.at}`}
                      value={step.month}
                      onChange={m => (step.at === 0 ? setBuild(b => ({ ...b, startMonth: m })) : setMonth(step.at, m))}
                    />
                    {step.at > 0 && (
                      <button
                        aria-label={`Remove blanket ${step.at}`}
                        className="ml-auto text-[#4b5563] hover:text-red-400 cursor-pointer leading-none"
                        onClick={e => {
                          e.stopPropagation()
                          setBuild(b => removeBlanket(b, step.at))
                          if (active >= step.at) setActive(Math.max(0, active - 1))
                        }}
                      >×</button>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {levelUp && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        {step.at === 0 ? `Level ${step.row.level}` : `Reached Level ${step.row.level}`}
                      </span>
                    )}
                    <span className={`ml-auto text-xs font-mono ${over ? 'text-red-400' : 'text-[#6b7280]'}`}>{step.spent}/{step.cp} CP</span>
                  </div>
                  {step.error && <p className="text-xs text-red-400 mt-1">{step.error}</p>}
                  {ids.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {ids.map(id => <Chip key={id} id={id} ev={ev} onRemove={() => drop(id)} />)}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          )
        })}
        {todayAt === undefined && <li><TodayLine /></li>}
      </ol>
      <p className="text-[11px] text-[#6b7280]">
        Max {MAX_BLANKETS_PER_MONTH} blankets a month. Click a step to buy skills there; drag skills between steps.
      </p>
    </section>
  )
}
