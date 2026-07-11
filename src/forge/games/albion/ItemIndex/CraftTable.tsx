import { Link } from 'react-router-dom'
import { DataTable, type Column } from '../../../../components/DataTable'
import { ItemIcon } from '../shared/ItemIcon'
import { tierLabel } from '../shared/crafting/itemMeta'
import type { CraftRow } from './craftRows'

// Compact "2× T4 Cloth, 8× T4 Leather" material line from a craftable item's direct recipe.
function bomText(row: CraftRow): string {
  if (!row.recipe || !row.craftable || row.recipe.recipe.length === 0) return ''
  return row.recipe.recipe
    .map(c => `${c.count ?? 1}× ${`${tierLabel(c.item_id)} ${c.name || c.item_id}`.trim()}`)
    .join(', ')
}

export interface CraftTableProps {
  rows: CraftRow[]
  isFavourite: (id: string) => boolean
  onToggleFav: (row: CraftRow) => void
  footer?: React.ReactNode
}

export function CraftTable({ rows, isFavourite, onToggleFav, footer }: CraftTableProps) {
  const columns: Column<CraftRow>[] = [
    {
      key: 'fav',
      label: '',
      className: 'w-8 text-center',
      render: row => (
        <button
          onClick={() => onToggleFav(row)}
          title={isFavourite(row.id) ? 'Remove favourite' : 'Add favourite'}
          className={`text-base leading-none cursor-pointer transition-colors ${
            isFavourite(row.id) ? 'text-[#c4af64]' : 'text-[#3a3d4a] hover:text-[#9ca3af]'
          }`}
        >
          {isFavourite(row.id) ? '★' : '☆'}
        </button>
      ),
    },
    {
      key: 'name',
      label: 'Item',
      sortKey: r => r.name.toLowerCase(),
      render: row => (
        <Link to={`/games/albion/item/${encodeURIComponent(row.id)}`} className="flex items-center gap-2 group">
          <ItemIcon uniqueName={row.id} size={24} />
          <span className="text-[#e2e4ed] group-hover:text-[#c4af64] transition-colors">{row.name}</span>
        </Link>
      ),
    },
    {
      key: 'tier',
      label: 'Tier',
      sortKey: r => r.tier * 10 + r.enchant,
      render: row => <span className="text-[#9ca3af]">{tierLabel(row.id) || '-'}</span>,
    },
    {
      key: 'station',
      label: 'Station',
      sortKey: r => r.stationName,
      render: row => <span className="text-[#9ca3af]">{row.stationName || '-'}</span>,
    },
    {
      key: 'bom',
      label: 'Materials',
      render: row => {
        const t = bomText(row)
        return t
          ? <span className="inline-block max-w-[340px] truncate align-middle text-xs text-[#9ca3af]" title={t}>{t}</span>
          : <span className="text-[#6b7280]">-</span>
      },
    },
    {
      key: 'category',
      label: 'Category',
      sortKey: r => r.category,
      render: row => <span className="text-[#9ca3af]">{row.category}</span>,
    },
    {
      key: 'cost',
      label: 'Your Cost',
      title: 'Enter your prices on the item page (coming soon)',
      render: () => <span className="text-[#6b7280]">-</span>,
    },
    {
      key: 'margin',
      label: 'Margin',
      title: 'Computed from your prices (coming soon)',
      render: () => <span className="text-[#6b7280]">-</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={r => r.id}
      defaultSort="name"
      defaultSortDir="asc"
      footer={footer}
      fill
    />
  )
}
