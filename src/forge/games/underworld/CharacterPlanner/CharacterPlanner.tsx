import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { activePurchases, copyPicks, evaluate, priorityMonths, priorityView, simpleView, unbuy, withPurchases, type PlanMode } from '../engine'
import { VOCATION_PREREQS } from '../data'
import { useBuildStore } from '../hooks/useBuildStore'
import { MournfallCard } from '../components/MournfallCard'
import { BuildBar } from './BuildBar'
import { IdentityPanel } from './IdentityPanel'
import { Timeline } from './Timeline'
import { SimplePlan } from './SimplePlan'
import { PriorityPlan } from './PriorityPlan'
import { SkillCatalog } from './SkillCatalog'
import { MagicPanel } from './MagicPanel'
import { Spellbook } from './Spellbook'
import { Sheet } from './Sheet'
import { uid } from './util'
import { ConfirmButton } from '../../../../components/ConfirmButton'

const TABS = ['Skills', 'Magic', 'Spellbook', 'Sheet'] as const
type Tab = typeof TABS[number]

const MODES: { mode: PlanMode; label: string; hint: string }[] = [
  { mode: 'sandbox', label: 'Sandbox', hint: 'Pick freely against a blanket count.' },
  { mode: 'priority', label: 'Priority list', hint: 'Skills in buying order, each dated when you can afford it.' },
  { mode: 'timeline', label: 'Blanket timeline', hint: 'Place each skill on the blanket you buy it with.' },
]

export default function CharacterPlanner() {
  const store = useBuildStore()
  const { build, setBuild } = store
  const [tab, setTab] = useState<Tab>('Skills')
  // Ctrl+Z undoes planner edits; text fields keep their own undo.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const el = e.target as HTMLElement
    if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== 'z') return
    if (el.closest('input, textarea, select, [contenteditable]')) return
    e.preventDefault()
    store.undo()
  })
  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const mode = build.mode ?? 'sandbox'
  const timeline = mode === 'timeline'
  const view = useMemo(() => (mode === 'timeline' ? build : mode === 'priority' ? priorityView(build) : simpleView(build)), [build, mode])
  const [activeRaw, setActive] = useState(() => build.blankets.length)
  const ev = useMemo(() => evaluate(view, undefined, mode === 'sandbox'), [view, mode])
  // Priority picks are dated later, so the catalog checks them against the whole horizon.
  const pick = useMemo(() => (mode === 'priority' ? { ...view, blankets: priorityMonths(build) } : view), [view, mode, build])
  const loose = !timeline
  // Other modes with picks to copy over.
  const sources = MODES.filter(m => m.mode !== mode && activePurchases({ ...build, mode: m.mode }).length > 0)
  const active = timeline ? Math.min(activeRaw, build.blankets.length) : pick.blankets.length

  const add = (skill: string, choice?: string) =>
    setBuild(b => withPurchases(b, [...activePurchases(b), { id: uid(), skill, at: timeline ? active : 0, choice }]))
  const remove = (skill: string, choice?: string) => setBuild(b => unbuy(b, skill, choice))
  const invalid = activePurchases(build).filter(p => ev.results.get(p.id)?.error).length
  // Each entry is "A|B": any option satisfies it; the button buys the first.
  const missingPrereqs = (VOCATION_PREREQS[build.vocation]?.auto ?? [])
    .filter(need => !need.split('|').some(n => ev.final.counts.get(n)))
    .map(need => need.split('|')[0])

  return (
    <div className={`grid gap-4 lg:h-full lg:grid-rows-[minmax(0,1fr)] ${timeline ? 'lg:grid-cols-[22rem_minmax(0,1fr)_24rem]' : 'lg:grid-cols-[24rem_minmax(0,1fr)]'}`}>
      <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
        <header>
          <h1 className="text-xl font-semibold text-[#e2e4ed]">Character Planner</h1>
          {!store.isAuthenticated && (
            <p className="text-xs text-[#c4af64] mt-1 leading-snug">
              You're not logged in, so this character is only saved in this browser.
              Log in (bottom of the sidebar) to save builds to your account and open them anywhere.
            </p>
          )}
          <p className="text-[11px] text-[#6b7280] mt-1">Unofficial. The rulebook wins on any conflict.</p>
        </header>

        <BuildBar store={store} />
        <IdentityPanel build={build} ev={ev} setBuild={setBuild} />

        {(ev.warnings.length > 0 || invalid > 0) && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-200 flex flex-col gap-1">
            {ev.warnings.map(w => <p key={w}>{w}</p>)}
            {invalid > 0 && (
              <p>
                {invalid} purchase{invalid > 1 ? 's are' : ' is'} invalid{timeline ? ' (red on the timeline)' : ''}.{' '}
                <button
                  className="underline cursor-pointer"
                  onClick={() => setBuild(b => withPurchases(b, activePurchases(b).filter(p => !ev.results.get(p.id)?.error)))}
                >Remove them</button>
              </p>
            )}
            {missingPrereqs.length > 0 && (
              <p>
                <button className="underline cursor-pointer" onClick={() => missingPrereqs.forEach(n => add(n))}>
                  Add {build.vocation} prerequisites
                </button>{' '}at the selected step.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex rounded-md border border-[#2a2d3a] overflow-hidden" role="radiogroup" aria-label="Planning mode">
            {MODES.map(m => (
              <button
                key={m.mode}
                role="radio"
                aria-checked={mode === m.mode}
                className={`flex-1 py-1.5 text-xs cursor-pointer ${mode === m.mode ? 'bg-[#c4af64]/15 text-[#c4af64]' : 'text-[#9ca3af] hover:text-[#e2e4ed]'}`}
                onClick={() => setBuild(b => ({ ...b, mode: m.mode }))}
              >{m.label}</button>
            ))}
          </div>
          <p className="text-[11px] text-[#9ca3af] text-center">{MODES.find(m => m.mode === mode)?.hint}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6b7280]">
            {sources.length > 0 && <>
              Copy picks from
              {sources.map(m => (activePurchases(build).length ? (
                <ConfirmButton
                  key={m.mode}
                  label={m.label}
                  confirmPrompt={`Replace these picks with ${m.label}?`}
                  className="text-[#c4af64] hover:underline cursor-pointer"
                  onConfirm={() => setBuild(b => copyPicks(b, m.mode))}
                />
              ) : (
                <button key={m.mode} className="text-[#c4af64] hover:underline cursor-pointer" onClick={() => setBuild(b => copyPicks(b, m.mode))}>{m.label}</button>
              )))}
            </>}
            {activePurchases(build).length > 0 && (
              <span className="ml-auto">
                <ConfirmButton label="Clear skills" confirmPrompt="Remove this mode's picks?" onConfirm={() => setBuild(b => withPurchases(b, []))} />
              </span>
            )}
          </div>
        </div>
        {mode === 'priority' && <PriorityPlan view={view} build={build} ev={ev} setBuild={setBuild} />}
        {mode === 'sandbox' && <SimplePlan build={build} ev={ev} setBuild={setBuild} />}
        <MournfallCard compact />
      </aside>

      <div className="flex flex-col gap-3 min-w-0 lg:min-h-0">
        <nav className="flex gap-2" role="tablist">
          {TABS.map(t => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'forge-btn-active' : 'forge-btn'} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
        <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {tab === 'Skills' && <SkillCatalog build={pick} ev={ev} active={active} loose={loose} onAdd={add} onRemove={remove} />}
          {tab === 'Magic' && <MagicPanel build={pick} ev={ev} active={active} loose={loose} setBuild={setBuild} onAdd={add} onRemove={remove} />}
          {tab === 'Spellbook' && <Spellbook build={view} ev={ev} setBuild={setBuild} />}
          {tab === 'Sheet' && <Sheet build={view} ev={ev} />}
        </div>
      </div>
      {timeline && (
        <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <Timeline build={build} ev={ev} active={active} setActive={setActive} setBuild={setBuild} />
        </div>
      )}
    </div>
  )
}
