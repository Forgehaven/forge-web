import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { activePurchases, copyPicks, evaluate, FAVOURED, remapAbilities, priorityMonths, priorityView, simpleView, unbuy, vocationNeeds, withPurchases, type BuildStatus, type PlanMode } from '../engine'
import { useBuildStore } from '../hooks/useBuildStore'
import { BuildBar } from './BuildBar'
import { IdentityPanel } from './IdentityPanel'
import { Timeline } from './Timeline'
import { SimpleBlankets, SimplePlan } from './SimplePlan'
import { PriorityPlan } from './PriorityPlan'
import { SkillCatalog } from './SkillCatalog'
import { MagicPanel } from './MagicPanel'
import { Spellbook } from './Spellbook'
import { Sheet } from './Sheet'
import { uid } from './util'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { MobileSection } from '../../../../components/MobileSection'

const TABS = ['Skills', 'Magic', 'Spellbook', 'Sheet'] as const
type Tab = typeof TABS[number]

const MODES: { mode: PlanMode; label: string; hint: string }[] = [
  { mode: 'sandbox', label: 'Sandbox', hint: 'Pick freely against a blanket count.' },
  { mode: 'priority', label: 'Priority list', hint: 'Skills in buying order, each dated when you can afford it.' },
  { mode: 'timeline', label: 'Blanket timeline', hint: 'Place each skill on the blanket you buy it with.' },
]

export default function CharacterPlanner() {
  const store = useBuildStore()
  const { build } = store
  const status = build.status ?? 'planning'
  // Complete and retired builds are read-only until set back to planning.
  const locked = status !== 'planning'
  const setBuild: typeof store.setBuild = locked ? () => {} : store.setBuild
  const setStatus = (next: BuildStatus) => store.setBuild(b => ({ ...b, status: next }))
  const [tab, setTab] = useState<Tab>('Skills')
  const [query, setQuery] = useState('')
  const [hideBlocked, setHideBlocked] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.uwOnlyBuyable) === '1' } catch { return false }
  })
  const toggleBlocked = (on: boolean) => {
    setHideBlocked(on)
    try { localStorage.setItem(STORAGE_KEYS.uwOnlyBuyable, on ? '1' : '0') } catch { /* private mode */ }
  }
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
  // Timeline and priority list get their own pane beside the catalog.
  const pane = mode !== 'sandbox'
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
    setBuild(b => {
      const next = withPurchases(b, [...activePurchases(b), { id: uid(), skill, at: timeline ? active : 0, choice }])
      // Becoming Renowned swaps the occupational abilities for the new class's.
      return skill === FAVOURED ? remapAbilities(b, next) : next
    })
  const remove = (skill: string, choice?: string) => setBuild(b => unbuy(b, skill, choice))
  const invalid = activePurchases(build).filter(p => ev.results.get(p.id)?.error).length
  const needsHighlighted = vocationNeeds(view, ev.final).size > 0
  const alerts = ev.warnings.length + (ev.lifeWarning ? 1 : 0)
  const skillAlerts = ev.skillWarnings.length + (invalid > 0 ? 1 : 0) + (needsHighlighted ? 1 : 0)

  return (
    <div className={`relative grid gap-3 pb-6 lg:pb-0 lg:h-full lg:grid-rows-[minmax(0,1fr)] ${pane ? 'lg:grid-cols-[22rem_24rem_minmax(0,1fr)]' : 'lg:grid-cols-[22rem_minmax(0,1fr)]'}`}>
      {/* The rules drawer portals here so it covers the left panes, not the skills. */}
      <div id="uw-rules-slot" className="contents" />
      <aside className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-gutter:stable]">
        <header>
          <h1 className="text-xl font-semibold text-forge-text flex flex-wrap items-center gap-x-2">
            UW Character Planner
            <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-300">Unofficial</span>
          </h1>
          <p className="text-xs text-forge-dim mt-1 leading-snug">
            A tool for planning builds. Nothing here changes your actual character for UW LARP. The rulebooks win on any conflict.
          </p>
          {!store.isAuthenticated && (
            <p className="text-xs text-forge-accent mt-1 leading-snug">
              Not logged in, so plans are only kept in this browser.
              Log in (bottom of the sidebar) to keep them in your Forgehaven account and open them anywhere.
            </p>
          )}
        </header>

        <BuildBar store={store} />
        {locked && (
          <div className="rounded-md border border-sky-400/30 bg-sky-400/5 px-4 py-2 text-xs text-sky-200 flex flex-wrap items-center gap-x-3 gap-y-1">
            {status === 'complete' ? 'Plan complete' : 'Retired'}: read-only.
            <button className="underline cursor-pointer" onClick={() => setStatus('planning')}>Back to planning</button>
          </div>
        )}
        <MobileSection
          title="Character"
          summary={<>{build.name || 'Unnamed'} · Level {ev.stats.level}{alerts > 0 && <span className="text-amber-300"> · {alerts} warning{alerts > 1 ? 's' : ''}</span>}</>}
        >
        <IdentityPanel build={build} ev={ev} setBuild={setBuild} locked={locked} blankets={mode === 'sandbox' ? <SimpleBlankets build={build} ev={ev} setBuild={setBuild} /> : undefined} />

        <fieldset disabled={locked} className="contents">
        {alerts > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-200 flex flex-col gap-1">
            {ev.warnings.map(w => <p key={w}>{w}</p>)}
            {ev.lifeWarning && (
              <p>
                {ev.lifeWarning}{' '}
                <ConfirmButton
                  label="Ignore"
                  confirmPrompt="Hide this for this character?"
                  className="underline cursor-pointer"
                  onConfirm={() => setBuild(b => ({ ...b, ignoreLifeWarning: true }))}
                />
              </p>
            )}
          </div>
        )}
        {build.ignoreLifeWarning && (
          <button className="self-start text-[11px] text-forge-muted hover:text-forge-text underline cursor-pointer" onClick={() => setBuild(b => ({ ...b, ignoreLifeWarning: false }))}>
            Show ignored warnings
          </button>
        )}
        </fieldset>
        </MobileSection>

        <MobileSection title="Plan" summary={<>{MODES.find(m => m.mode === mode)?.label}{skillAlerts > 0 && <span className="text-amber-300"> · {skillAlerts} warning{skillAlerts > 1 ? 's' : ''}</span>}</>}>
        <fieldset disabled={locked} className="contents">

        <div className="flex flex-col gap-1">
          <div className="flex rounded-md border border-forge-border overflow-hidden" role="radiogroup" aria-label="Planning mode">
            {MODES.map(m => (
              <button
                key={m.mode}
                role="radio"
                aria-checked={mode === m.mode}
                className={`flex-1 py-1.5 text-xs cursor-pointer ${mode === m.mode ? 'bg-forge-accent/15 text-forge-accent' : 'text-forge-dim hover:text-forge-text'}`}
                onClick={() => setBuild(b => ({ ...b, mode: m.mode }))}
              >{m.label}</button>
            ))}
          </div>
          <p className="text-[11px] text-forge-dim text-center">{MODES.find(m => m.mode === mode)?.hint}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-forge-muted">
            {sources.length > 0 && <>
              Copy picks from
              {sources.map(m => (activePurchases(build).length ? (
                <ConfirmButton
                  key={m.mode}
                  label={m.label}
                  confirmPrompt={`Replace these picks with ${m.label}?`}
                  className="text-forge-accent hover:underline cursor-pointer"
                  onConfirm={() => setBuild(b => copyPicks(b, m.mode))}
                />
              ) : (
                <button key={m.mode} className="text-forge-accent hover:underline cursor-pointer" onClick={() => setBuild(b => copyPicks(b, m.mode))}>{m.label}</button>
              )))}
            </>}
            {activePurchases(build).length > 0 && (
              <span className="ml-auto">
                <ConfirmButton label="Clear skills" confirmPrompt="Remove this mode's picks?" onConfirm={() => setBuild(b => withPurchases(b, []))} />
              </span>
            )}
          </div>
        </div>
        {skillAlerts > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-200 flex flex-col gap-1">
            {ev.skillWarnings.map(w => <p key={w}>{w}</p>)}
            {invalid > 0 && (
              <p>
                {invalid} purchase{invalid > 1 ? 's are' : ' is'} invalid{timeline ? ' (red on the timeline)' : ''}.{' '}
                <button
                  className="underline cursor-pointer"
                  onClick={() => setBuild(b => withPurchases(b, activePurchases(b).filter(p => !ev.results.get(p.id)?.error)))}
                >Remove them</button>
              </p>
            )}
            {needsHighlighted && <p>Skills that help qualify for {build.vocation} are highlighted in the Skills tab.</p>}
          </div>
        )}
        {mode === 'sandbox' && <SimplePlan build={build} ev={ev} setBuild={setBuild} />}
        </fieldset>
        </MobileSection>
      </aside>

      {pane && (
        <div className="flex flex-col gap-4 lg:block lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <MobileSection title={timeline ? 'Timeline' : 'Priority list'} summary={`${build.blankets.length} blanket${build.blankets.length === 1 ? '' : 's'}`}>
            <fieldset disabled={locked} className="contents">
              {timeline
                ? <Timeline build={build} ev={ev} active={active} setActive={setActive} setBuild={setBuild} />
                : <PriorityPlan view={view} build={build} ev={ev} setBuild={setBuild} />}
            </fieldset>
          </MobileSection>
        </div>
      )}

      <div className="flex flex-col gap-2 min-w-0 lg:min-h-0">
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex gap-2" role="tablist">
            {TABS.map(t => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'forge-btn-active' : 'forge-btn'} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </nav>
          {tab === 'Skills' && (
            <>
              <input className="forge-input !py-1.5 flex-1 min-w-40" placeholder="Search skills…" value={query} onChange={e => setQuery(e.target.value)} />
              <label className="flex items-center gap-1.5 text-xs text-forge-dim cursor-pointer">
                <input type="checkbox" checked={hideBlocked} onChange={e => toggleBlocked(e.target.checked)} />
                Only buyable
              </label>
            </>
          )}
        </div>
        <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <fieldset disabled={locked} className="contents">
            {tab === 'Skills' && <SkillCatalog build={pick} ev={ev} active={active} loose={loose} onAdd={add} onRemove={remove} query={query} hideBlocked={hideBlocked} />}
            {tab === 'Magic' && <MagicPanel build={pick} ev={ev} active={active} loose={loose} setBuild={setBuild} onAdd={add} onRemove={remove} />}
            {tab === 'Spellbook' && <Spellbook build={view} ev={ev} setBuild={setBuild} />}
          </fieldset>
          {tab === 'Sheet' && <Sheet build={view} ev={ev} />}
        </div>
      </div>
      {/* Phones get the guild card after the catalog. */}
    </div>
  )
}
