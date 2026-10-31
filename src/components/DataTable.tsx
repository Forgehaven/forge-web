import { useState, useMemo, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  title?: string // native tooltip on the header cell
  render: (row: T, i: number) => ReactNode
  sortKey?: (row: T) => number | string
  className?: string
  sticky?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  rowClass?: (row: T, i: number) => string
  defaultSort?: string
  defaultSortDir?: 'asc' | 'desc'
  footer?: ReactNode
  // Rows matching this stay pinned above the rest through any column sort.
  pinned?: (row: T) => boolean
  // Scroll inside the table instead of the page: caps at the parent's height
  // (parent needs a bounded height, e.g. flex-1 min-h-0) and sticks the header.
  fill?: boolean
}

export function DataTable<T>({ columns, data, rowKey, rowClass, defaultSort, defaultSortDir = 'desc', footer, pinned, fill }: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState(defaultSort ?? '')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir)

  function toggleSort(key: string) {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sortCol && c.sortKey)
    let rows = data
    if (col?.sortKey) {
      rows = [...data].sort((a, b) => {
        const va = col.sortKey!(a)
        const vb = col.sortKey!(b)
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    if (pinned) rows = [...rows.filter(pinned), ...rows.filter(r => !pinned(r))]
    return rows
  }, [data, columns, sortCol, sortDir, pinned])

  if (data.length === 0) return null

  return (
    <div className={`${fill ? 'max-h-full overflow-auto' : 'overflow-x-auto'} rounded-lg border border-forge-border`}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-forge-surface border-b border-forge-border">
            {columns.map(col => (
              <th
                key={col.key}
                title={col.title}
                onClick={() => col.sortKey && toggleSort(col.key)}
                className={`px-3 py-2.5 text-left text-xs text-forge-muted uppercase tracking-widest font-semibold select-none whitespace-nowrap ${col.sortKey ? 'cursor-pointer hover:text-forge-text' : ''} ${fill ? 'sticky top-0 z-20 bg-forge-surface shadow-[inset_0_-1px_0_#2a2d3a]' : ''} ${col.sticky ? `sticky left-0 bg-forge-surface border-r border-forge-border ${fill ? 'z-30' : 'z-10'}` : ''} ${col.className ?? ''}`}
              >
                {col.label}
                {sortCol === col.key && col.sortKey && (
                  <span className="ml-1 text-forge-accent">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const bg = rowClass ? rowClass(row, i) : (i % 2 === 0 ? '#0f1117' : '#111420')
            return (
              <tr key={rowKey(row)} className="border-b border-forge-raise last:border-0" style={{ background: bg }}>
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 whitespace-nowrap ${col.sticky ? `sticky left-0 z-10 border-r border-forge-border` : ''} ${col.className ?? ''}`}
                    style={col.sticky ? { background: bg } : undefined}
                  >
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {footer && <div className="px-3 py-2 text-xs text-forge-muted border-t border-forge-border">{footer}</div>}
    </div>
  )
}
