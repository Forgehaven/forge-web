import { useState, useEffect } from 'react'
import { DataTable, type Column } from '../../../../components/DataTable'
import { API_URLS } from '../../../../config/apiUrls'
const DAY_MS = 86_400_000
const MONTH_MS = 30 * DAY_MS
const FORTY8_H_MS = 2 * DAY_MS

interface LifetimeStats {
  Total: number
  Royal: number
  Outlands: number
  Avalon: number
  Hellgate: number
  CorruptedDungeon: number
  Mists: number
}

interface GatheringStats {
  Fiber: LifetimeStats; Hide: LifetimeStats; Ore: LifetimeStats; Rock: LifetimeStats; Wood: LifetimeStats; All: LifetimeStats
}

interface MemberData {
  Name: string; Id: string; GuildName: string; GuildId: string
  AllianceName: string | null; AllianceId: string; AllianceTag: string
  KillFame: number; DeathFame: number; FameRatio: number
  LifetimeStatistics: {
    PvE: LifetimeStats; Gathering: GatheringStats; Crafting: LifetimeStats
    CrystalLeague: number; FishingFame: number; FarmingFame: number; Timestamp: string | null
  }
}

function fmt(n: number): string { return n.toLocaleString('en-US') }

function tsCell(ts: string | null) {
  if (!ts) return <span className="text-red-400">Never</span>
  const age = Date.now() - new Date(ts).getTime()
  const color = age > MONTH_MS ? 'text-red-400' : age < FORTY8_H_MS ? 'text-green-400' : 'text-[#9ca3af]'
  const d = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return <span className={color}>{d}</span>
}

export function GuildRoster() {
  const [members, setMembers] = useState<MemberData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchMembers() {
      try {
        const res = await fetch(`${API_URLS.forgeAPI}/game/albion/guild-data`, { credentials: 'include' })
        if (cancelled) return
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const json = await res.json()
        if (!cancelled && json.status === 'ok') setMembers(json.payload as MemberData[])
        else if (!cancelled) setError(json.message || 'Failed to load')
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMembers()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#c4af64] border-t-transparent rounded-full animate-spin" /></div>
  if (error) return <p className="text-sm text-red-400 text-center py-8">Failed to load guild data: {error}</p>
  if (members.length === 0) return <p className="text-sm text-[#6b7280] text-center py-8">No guild members found.</p>

  const columns: Column<MemberData>[] = [
    { key: 'Name', label: 'Name', sortKey: m => m.Name.toLowerCase(), render: m => <span className="text-[#e2e4ed] font-medium">{m.Name}</span> },
    { key: 'LastLogin', label: 'Last Login', sortKey: m => m.LifetimeStatistics.Timestamp ? new Date(m.LifetimeStatistics.Timestamp).getTime() : 0, render: m => tsCell(m.LifetimeStatistics.Timestamp) },
    { key: 'PvE', label: 'PvE Fame', sortKey: m => m.LifetimeStatistics.PvE.Total, render: m => <>{fmt(m.LifetimeStatistics.PvE.Total)}</> },
    { key: 'Kill', label: 'Kill Fame', sortKey: m => m.KillFame, render: m => <>{fmt(m.KillFame)}</> },
    { key: 'Death', label: 'Death Fame', sortKey: m => m.DeathFame, render: m => <>{fmt(m.DeathFame)}</> },
    { key: 'KD', label: 'K/D', sortKey: m => m.FameRatio, render: m => <>{(m.FameRatio * 100).toFixed(1)}%</> },
    { key: 'Gathering', label: 'Gathering', sortKey: m => m.LifetimeStatistics.Gathering.All.Total, render: m => <>{fmt(m.LifetimeStatistics.Gathering.All.Total)}</> },
    { key: 'Crafting', label: 'Crafting', sortKey: m => m.LifetimeStatistics.Crafting.Total, render: m => <>{fmt(m.LifetimeStatistics.Crafting.Total)}</> },
    { key: 'Fishing', label: 'Fishing', sortKey: m => m.LifetimeStatistics.FishingFame, render: m => <>{fmt(m.LifetimeStatistics.FishingFame)}</> },
    { key: 'Farming', label: 'Farming', sortKey: m => m.LifetimeStatistics.FarmingFame, render: m => <>{fmt(m.LifetimeStatistics.FarmingFame)}</> },
    { key: 'Alliance', label: 'Alliance', sortKey: m => (m.AllianceName || '').toLowerCase(), render: m => <>{m.AllianceName || ''}</> },
  ]

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={members}
        rowKey={m => m.Id}
        defaultSort="PvE"
        defaultSortDir="desc"
        footer={`${members.length} members`}
      />
    </div>
  )
}
