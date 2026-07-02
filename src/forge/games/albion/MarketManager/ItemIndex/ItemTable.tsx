import type { ReactNode } from 'react'
import { DataTable, type Column } from '../../../../../components/DataTable'
import type { ItemRow } from './types'

// Thin wrapper over DataTable shared by Item Index + Favourites. DataTable renders null on
// empty data, so the empty state lives here.
export function ItemTable({
  rows,
  columns,
  empty,
  footer,
}: {
  rows: ItemRow[]
  columns: Column<ItemRow>[]
  empty: string
  footer?: ReactNode
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#6b7280] text-center py-10 select-none">{empty}</p>
  }
  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={r => r.id}
      defaultSort="name"
      defaultSortDir="asc"
      footer={footer}
    />
  )
}
