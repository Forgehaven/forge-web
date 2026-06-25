import { useState, useMemo, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
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
}

export function DataTable<T>({ columns, data, rowKey, rowClass, defaultSort, defaultSortDir = 'desc', footer }: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState(defaultSort ?? '')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir)

  function toggleSort(key: string) {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sortCol && c.sortKey)
    if (!col || !col.sortKey) return data
    const copy = [...data]
    copy.sort((a, b) => {
      const va = col.sortKey!(a)
      const vb = col.sortKey!(b)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [data, columns, sortCol, sortDir])

  if (data.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2a2d3a]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1a1d27] border-b border-[#2a2d3a]">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortKey && toggleSort(col.key)}
                className={`px-3 py-2.5 text-left text-xs text-[#6b7280] uppercase tracking-widest font-semibold select-none whitespace-nowrap ${col.sortKey ? 'cursor-pointer hover:text-[#e2e4ed]' : ''} ${col.sticky ? 'sticky left-0 z-10 bg-[#1a1d27] border-r border-[#2a2d3a]' : ''} ${col.className ?? ''}`}
              >
                {col.label}
                {sortCol === col.key && col.sortKey && (
                  <span className="ml-1 text-[#c4af64]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const bg = rowClass ? rowClass(row, i) : (i % 2 === 0 ? '#0f1117' : '#111420')
            return (
              <tr key={rowKey(row)} className="border-b border-[#1e2130] last:border-0" style={{ background: bg }}>
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 whitespace-nowrap ${col.sticky ? `sticky left-0 z-10 border-r border-[#2a2d3a]` : ''} ${col.className ?? ''}`}
                    style={col.sticky ? { background: bg } : undefined}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {footer && <div className="px-3 py-2 text-xs text-[#6b7280] border-t border-[#2a2d3a]">{footer}</div>}
    </div>
  )
}
