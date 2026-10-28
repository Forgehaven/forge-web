import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { assignColumns } from '../lib/assignColumns'

export interface MasonryItem {
  key: string
  // Estimated height (e.g. row count). Columns are assigned from these, not
  // from live heights, so expanding a card never moves cards between columns.
  weight: number
  node: ReactNode
}

// Column count follows the container width (one column per `minWidth` px).
export function Masonry({ items, minWidth, gap = 12 }: { items: MasonryItem[]; minWidth: number; gap?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      setCols(Math.max(1, Math.floor((entry.contentRect.width + gap) / (minWidth + gap))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [minWidth, gap])

  const columns = useMemo(() => assignColumns(items, cols), [items, cols])

  return (
    <div ref={ref} className="flex items-start" style={{ gap }}>
      {columns.map((col, i) => (
        <div key={i} className="flex-1 min-w-0 flex flex-col" style={{ gap }}>
          {col.map(it => <Fragment key={it.key}>{it.node}</Fragment>)}
        </div>
      ))}
    </div>
  )
}
