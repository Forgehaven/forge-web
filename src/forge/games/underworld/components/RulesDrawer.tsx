import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PRODUCTION, SPELLS } from '../data'
import { ordinal } from '../rules'
import type { Skill, Trait } from '../types'
import { Cell, ProductionItems } from './ProductionItems'
import { Prose } from './Prose'
import { SkillDetails } from './SkillDetails'

export type RulesPage =
  | { kind: 'category'; cat: string }
  | { kind: 'skill'; id: string }
  | { kind: 'item'; skill: string; table: string; row: string }
  | { kind: 'trait'; name: string }

interface Props {
  categories: { cat: string; skills: Skill[] }[]
  // This build's price for a skill, shown on the category page.
  costOf: (id: string) => string
  stack: RulesPage[]
  // The race's (and culture's) built-in traits, listed on the Racial page.
  traits?: Trait[]
  setStack: (stack: RulesPage[] | null) => void
}

// Rules drill-down beside the skills: category, then skill, then what it makes.
// Portalled over the planner's left panes (and out of a read-only build's
// disabled fieldset); a click outside it or Esc closes it.
export function RulesDrawer({ categories, costOf, stack, setStack, traits = [] }: Props) {
  const ref = useRef<HTMLElement>(null)
  const skill = (id: string) => categories.flatMap(c => c.skills).find(s => s.id === id)
  const title = (p: RulesPage) => (p.kind === 'category' ? p.cat : p.kind === 'skill' ? skill(p.id)?.name ?? p.id : p.kind === 'trait' ? p.name : p.row)
  const push = (p: RulesPage) => setStack([...stack, p])
  const page = stack[stack.length - 1]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setStack(null) }
    // Rules links toggle the drawer themselves.
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (!ref.current?.contains(t) && !t.closest?.('[data-rules-link]')) setStack(null)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [setStack])

  return createPortal(
    <>
      <aside ref={ref} role="dialog" aria-label="Rules" className="fixed inset-0 z-50 lg:absolute lg:inset-y-0 lg:right-auto lg:w-[30rem] flex flex-col bg-forge-surface border border-forge-border rounded-lg shadow-2xl">
        <header className="flex items-start gap-2 px-4 py-3 border-b border-forge-border">
          {stack.length > 1 && (
            <button aria-label="Back" className="text-forge-muted hover:text-forge-text cursor-pointer leading-none pt-0.5" onClick={() => setStack(stack.slice(0, -1))}>‹</button>
          )}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-1.5 text-sm min-w-0">
            {stack.map((p, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-forge-faint">›</span>}
                {i < stack.length - 1
                  ? <button className="text-forge-muted hover:text-forge-accent cursor-pointer" onClick={() => setStack(stack.slice(0, i + 1))}>{title(p)}</button>
                  : <span className="font-semibold text-forge-text">{title(p)}</span>}
              </span>
            ))}
          </nav>
          <button aria-label="Close rules" className="ml-auto text-forge-muted hover:text-forge-text cursor-pointer text-lg leading-none" onClick={() => setStack(null)}>×</button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-3 text-xs text-forge-dim leading-relaxed flex flex-col gap-3">
          {page.kind === 'category' && page.cat === 'Racial' && traits.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-forge-accent">Racial traits</p>
              <ul className="flex flex-col -mt-2">
                {traits.map(t => (
                  <li key={t.name} className="border-b border-forge-border last:border-b-0">
                    <button className="w-full flex items-center gap-2 py-1.5 text-left cursor-pointer group" onClick={() => push({ kind: 'trait', name: t.name })}>
                      <span className={`text-sm group-hover:text-forge-accent ${t.kind === 'advantage' ? 'text-emerald-400' : 'text-red-400'}`}>{t.name}</span>
                      <span className="ml-auto text-[10px] text-forge-muted">{t.kind}</span>
                      <span className="text-forge-faint">›</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] uppercase tracking-widest text-forge-accent">Racial skills</p>
            </>
          )}
          {page.kind === 'trait' && <Prose text={traits.find(t => t.name === page.name)?.desc ?? ''} />}
          {page.kind === 'category' && (
            <ul className="flex flex-col">
              {(categories.find(c => c.cat === page.cat)?.skills ?? []).map(s => (
                <li key={s.id} className="border-b border-forge-border last:border-b-0">
                  <button className="w-full flex items-center gap-2 py-1.5 text-left cursor-pointer group" onClick={() => push({ kind: 'skill', id: s.id })}>
                    <span className="text-sm text-forge-text group-hover:text-forge-accent">{s.name}</span>
                    {PRODUCTION[s.id]?.tables && <span className="text-[10px] text-forge-muted">items</span>}
                    <span className="ml-auto font-mono text-forge-muted">{costOf(s.id)}</span>
                    <span className="text-forge-faint">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {page.kind === 'skill' && (() => {
            const s = skill(page.id)
            return s && (
              <>
                <p className="font-mono text-forge-muted">{costOf(s.id)} · max {s.maxPurchases}</p>
                <SkillDetails s={s} />
                <ProductionItems id={s.id} onItem={(table, row) => push({ kind: 'item', skill: s.id, table, row })} />
              </>
            )
          })()}
          {page.kind === 'item' && <ItemPage page={page} />}
        </div>
      </aside>
    </>,
    document.getElementById('uw-rules-slot') ?? document.body,
  )
}

function ItemPage({ page }: { page: Extract<RulesPage, { kind: 'item' }> }) {
  const table = PRODUCTION[page.skill]?.tables?.find(t => t.title === page.table)
  const row = table?.rows.find(r => r.name === page.row)
  if (!table || !row) return null
  const level = page.skill === 'create-scroll' ? Number(row.name.match(/\d+$/)?.[0]) : 0
  const spells = level ? SPELLS.filter(s => s.level === level) : []
  return (
    <>
      {table.columns.length > 0 && (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
          {table.columns.map((c, i) => (
            <div key={c} className="flex gap-1.5"><dt className="text-forge-muted font-sans">{c}</dt><dd className="text-forge-text"><Cell row={row} i={i} />{typeof row.cells[i] === 'number' ? ' RM' : ''}</dd></div>
          ))}
        </dl>
      )}
      {row.special?.some(Boolean) && <p className="text-[11px] text-amber-300/80">* needs components found in-game.</p>}
      {row.desc && <Prose text={row.desc} />}
      {spells.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-forge-accent mb-1">{ordinal(level)} circle scrolls</p>
          <ul className="flex flex-col gap-0.5">
            {spells.map(s => <li key={s.sphere + s.name}><span className="text-forge-text">{s.name}</span> <span className="text-forge-muted">· {s.sphere}</span></li>)}
          </ul>
        </div>
      )}
    </>
  )
}
