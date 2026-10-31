import { useState } from 'react'
import { PRODUCTION } from '../data'
import type { ProductionRow } from '../types'
import { Prose } from './Prose'

export function Cell({ row, i }: { row: ProductionRow; i: number }) {
  const v = row.cells[i]
  if (v === null || v === undefined) return <span className="text-forge-faint">–</span>
  return <>{v}{row.special?.[i] && <span className="text-amber-300" title="Needs components found in-game">*</span>}</>
}

// What a production skill can make, with RM costs. With `onItem` a row opens
// its own page; without it a row with a description expands in place.
export function ProductionItems({ id, onItem }: { id: string; onItem?: (table: string, row: string) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const p = PRODUCTION[id]
  if (!p) return null
  return (
    <div className="flex flex-col gap-3">
      {p.note && <p className="text-forge-muted italic">{p.note}</p>}
      {p.intro && <Prose text={p.intro} />}
      {p.tables?.map(t => (
        <div key={t.title}>
          <p className="text-[10px] uppercase tracking-widest text-forge-accent mb-1">{t.title}</p>
          <table className="w-full text-xs">
            {t.columns.length > 0 && (
              <thead>
                <tr className="text-forge-muted text-left">
                  <th className="font-normal py-0.5">Item</th>
                  {t.columns.map(c => <th key={c} className="font-normal text-right pl-2">{c}</th>)}
                </tr>
              </thead>
            )}
            <tbody>
              {t.rows.map(r => {
                const key = `${t.title}|${r.name}`
                return [
                  <tr key={key} className="border-t border-forge-border">
                    <td className="py-1">
                      {r.desc
                        ? <button className="text-left text-forge-text hover:text-forge-accent cursor-pointer" onClick={() => (onItem ? onItem(t.title, r.name) : setOpen(o => (o === key ? null : key)))}>{r.name}</button>
                        : <span className="text-forge-text">{r.name}</span>}
                    </td>
                    {t.columns.map((c, i) => <td key={c} className="text-right pl-2 font-mono"><Cell row={r} i={i} /></td>)}
                  </tr>,
                  !onItem && open === key && (
                    <tr key={`${key}-desc`}><td colSpan={t.columns.length + 1} className="pb-2"><Prose text={r.desc!} /></td></tr>
                  ),
                ]
              })}
            </tbody>
          </table>
        </div>
      ))}
      {p.sections?.map(s => (
        <div key={s.title}>
          <p className="font-medium text-forge-text">{s.title}</p>
          <Prose text={s.text} />
        </div>
      ))}
      <p className="text-[10px] text-forge-muted">{p.ref}</p>
    </div>
  )
}
