import { useMemo, useState } from 'react'
import { activePurchases, evaluate, simpleView, unbuy, withPurchases } from '../engine'
import { VOCATION_PREREQS } from '../data'
import { useBuildStore } from '../hooks/useBuildStore'
import { MournfallCard } from '../components/MournfallCard'
import { BuildBar } from './BuildBar'
import { IdentityPanel } from './IdentityPanel'
import { Timeline } from './Timeline'
import { SimplePlan } from './SimplePlan'
import { SkillCatalog } from './SkillCatalog'
import { MagicPanel } from './MagicPanel'
import { Spellbook } from './Spellbook'
import { Sheet } from './Sheet'
import { uid } from './util'

const TABS = ['Skills', 'Magic', 'Spellbook', 'Sheet'] as const
type Tab = typeof TABS[number]

export default function CharacterPlanner() {
  const store = useBuildStore()
  const { build, setBuild } = store
  const [tab, setTab] = useState<Tab>('Skills')
  const timeline = !!build.useTimeline
  const loose = !timeline
  const view = useMemo(() => (timeline ? build : simpleView(build)), [build, timeline])
  const [activeRaw, setActive] = useState(() => build.blankets.length)
  const active = timeline ? Math.min(activeRaw, build.blankets.length) : view.blankets.length
  const ev = useMemo(() => evaluate(view, undefined, loose), [view, loose])

  const add = (skill: string, choice?: string) =>
    setBuild(b => withPurchases(b, [...activePurchases(b), { id: uid(), skill, at: timeline ? active : 0, choice }]))
  const remove = (skill: string, choice?: string) => setBuild(b => unbuy(b, skill, choice))
  const invalid = activePurchases(build).filter(p => ev.results.get(p.id)?.error).length
  // Each entry is "A|B": any option satisfies it; the button buys the first.
  const missingPrereqs = (VOCATION_PREREQS[build.vocation]?.auto ?? [])
    .filter(need => !need.split('|').some(n => ev.final.counts.get(n)))
    .map(need => need.split('|')[0])

  return (
    <div className="grid gap-4 lg:h-full lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[24rem_minmax(0,1fr)]">
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

        <label className="flex items-center gap-2 text-sm text-[#e2e4ed] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={timeline}
            onChange={e => setBuild(b => ({ ...b, useTimeline: e.target.checked }))}
          />
          Use blanket timeline
          <span className="text-[11px] text-[#6b7280]">plan which month each skill is bought</span>
        </label>
        {timeline
          ? <Timeline build={build} ev={ev} active={active} setActive={setActive} setBuild={setBuild} />
          : <SimplePlan build={build} ev={ev} setBuild={setBuild} />}
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
          {tab === 'Skills' && <SkillCatalog build={view} ev={ev} active={active} loose={loose} onAdd={add} onRemove={remove} />}
          {tab === 'Magic' && <MagicPanel build={view} ev={ev} active={active} loose={loose} setBuild={setBuild} onAdd={add} onRemove={remove} />}
          {tab === 'Spellbook' && <Spellbook build={view} ev={ev} setBuild={setBuild} />}
          {tab === 'Sheet' && <Sheet build={view} ev={ev} />}
        </div>
      </div>
    </div>
  )
}
