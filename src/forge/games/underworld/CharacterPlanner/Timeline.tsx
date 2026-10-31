import { useState } from 'react'
import { insertBlanket, nextBlanketMonth, pastBlankets, sortedPurchases, type Build, type Evaluation } from '../engine'
import { MAX_BLANKETS_PER_MONTH } from '../rules'
import { monthLabel, stepLabel } from './util'
import { MonthSelect } from '../components/MonthSelect'
import { ConfirmButton } from '../../../../components/ConfirmButton'

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
        r.error ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-forge-border text-forge-soft'
      }`}
    >
      {r.label}
      <span className="text-forge-muted font-mono">{r.cost}</span>
      <button aria-label={`Remove ${r.label}`} className="text-forge-muted hover:text-red-400 cursor-pointer" onClick={e => { e.stopPropagation(); onRemove() }}>×</button>
    </li>
  )
}

// The character's history and plan as a vertical timeline.
export function Timeline({ build, ev, active, setActive, setBuild }: Props) {
  const [dragOver, setDragOver] = useState<number | null>(null)
  // Skill lists start collapsed except on the active step; a click overrides either way.
  const [shown, setShown] = useState<Record<number, boolean>>({})
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
  // CP bar: spent through today, spent on planned blankets, and left over.
  const total = lastStep.cp
  const used = todayAt === undefined ? 0 : ev.steps[todayAt].spent
  const planned = lastStep.spent - used
  const free = total - lastStep.spent
  const pct = (n: number) => (total > 0 ? Math.max(0, Math.min(100, (n / total) * 100)) : 0)

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold text-forge-text">Timeline</h2>
        <p className="text-xs text-forge-dim">
          Created {monthLabel(build.startMonth)} · {build.blankets.length} blanket{build.blankets.length === 1 ? '' : 's'} over{' '}
          {span(Math.max(0, monthsBetween(build.startMonth, lastStep.month)))} · reaches Level {final}
        </p>
      </header>

      <div className="flex flex-col gap-1" title="CP spent up to today, CP spent on planned blankets, and CP not yet spent">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-forge-border">
          <div className="bg-forge-accent" style={{ width: `${pct(used)}%` }} />
          <div className="bg-sky-400/70" style={{ width: `${pct(planned)}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs font-mono text-forge-soft">
          <span><span className="text-forge-accent">■</span> {used} used</span>
          <span><span className="text-sky-400/70">■</span> {planned} planned</span>
          <span className={free < 0 ? 'text-red-400' : ''}><span className="text-forge-line">■</span> {free} unspent</span>
          <span className="ml-auto text-forge-dim">{total} CP</span>
        </div>
      </div>

      <details className="group text-xs">
        <summary className="cursor-pointer list-none text-forge-muted hover:text-forge-dim select-none">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> Building on an existing character?
        </summary>
        <div className="mt-2 flex flex-col gap-2 rounded-md border border-forge-border p-3 text-forge-dim leading-snug max-w-md">
          <p>
            Set <span className="text-forge-text">Creation</span> to the month you made the character, then enter how
            many blankets you've applied so far. They're added from that month, {MAX_BLANKETS_PER_MONTH} a month;
            adjust any month afterwards.
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              Blankets applied
              <input type="number" inputMode="numeric" min={1} className="forge-input !w-20 !py-1" value={past} onChange={e => setPast(e.target.value)} />
            </label>
            <button className="text-forge-accent hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed ml-auto" onClick={addPast} disabled={!(Number(past) > 0)}>
              Add history
            </button>
          </div>
        </div>
      </details>

      <ol className="relative">
        <li className="grid grid-cols-[2rem_1.25rem_minmax(0,1fr)] gap-x-2">
          <span />
          <span className="relative flex justify-center">
            <span className="absolute top-4 bottom-0 w-px border-l border-dashed border-forge-line" />
            <span className="relative mt-3.5 w-2.5 h-2.5 rounded-full border border-dashed border-forge-accent" />
          </span>
          <div className="my-1 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-forge-border px-3 py-2">
            <span className="text-sm text-forge-dim">Next blanket</span>
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
          const open = shown[step.at] ?? isActive
          return (
            <li key={step.at} className="contents">
              {step.at === todayAt && <TodayLine />}
              {newYear && (
                <div className="pl-1 pt-2 pb-1 text-sm font-semibold text-forge-accent">{year}</div>
              )}
              <div className="grid grid-cols-[2rem_1.25rem_minmax(0,1fr)] gap-x-2">
                <span className="text-xs text-forge-muted text-right pt-3">{later?.month === step.month ? '' : monthLabel(step.month).split(' ')[0]}</span>
                <span className="relative flex justify-center">
                  <span className={`absolute inset-y-0 w-px ${planned ? 'border-l border-dashed border-forge-line' : 'bg-forge-line'} ${i === 0 ? 'h-4' : ''}`} />
                  <span className={`relative rounded-full ${
                    levelUp ? 'mt-3 w-3.5 h-3.5 bg-emerald-400 ring-4 ring-emerald-400/15' : `mt-3.5 w-2.5 h-2.5 ${isActive ? 'bg-forge-accent' : 'bg-forge-faint'}`
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
                    isActive ? 'border-forge-accent bg-forge-accent/5' : 'border-forge-border hover:border-forge-line'
                  } ${dragOver === step.at ? 'ring-1 ring-forge-accent' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isActive ? 'text-forge-accent' : 'text-forge-text'}`}>{stepLabel(step.at)}</span>
                    <MonthSelect
                      compact
                      label={step.at === 0 ? 'Character created' : `Blanket ${step.at}`}
                      value={step.month}
                      onChange={m => (step.at === 0 ? setBuild(b => ({ ...b, startMonth: m })) : setMonth(step.at, m))}
                    />
                    {step.at > 0 && (
                      <span className="ml-auto" onClick={e => e.stopPropagation()}>
                        <ConfirmButton
                          label="×"
                          ariaLabel={`Remove blanket ${step.at}`}
                          confirmPrompt="Remove?"
                          className="text-forge-faint hover:text-red-400 cursor-pointer leading-none"
                          onConfirm={() => {
                            setBuild(b => removeBlanket(b, step.at))
                            if (active >= step.at) setActive(Math.max(0, active - 1))
                          }}
                        />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {levelUp && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        {step.at === 0 ? `Level ${step.row.level}` : `Reached Level ${step.row.level}`}
                      </span>
                    )}
                    <span className={`ml-auto text-sm font-mono ${over ? 'text-red-400' : 'text-forge-soft'}`}>{step.spent}/{step.cp} CP</span>
                  </div>
                  {step.error && <p className="text-xs text-red-400 mt-1">{step.error}</p>}
                  {ids.length > 0 && (
                    <button
                      aria-expanded={open}
                      className="mt-1 flex items-center gap-1 text-xs text-forge-muted hover:text-forge-text cursor-pointer"
                      onClick={e => { e.stopPropagation(); setShown(s => ({ ...s, [step.at]: !open })) }}
                    >
                      <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
                      {ids.length} skill{ids.length > 1 ? 's' : ''}
                    </button>
                  )}
                  {open && ids.length > 0 && (
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
      <p className="text-[11px] text-forge-muted">
        Max {MAX_BLANKETS_PER_MONTH} blankets a month. Click a step to buy skills there; drag skills between steps.
      </p>
    </section>
  )
}
