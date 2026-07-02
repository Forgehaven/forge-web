// Conquest tally clock - Sunday 23:59:59 JST = Sunday 14:59:59 UTC. Shared by
// TeleportCost (map reset) and QuestTracker (weekly repeatables).

export function lastConquestReset(): number {
  const now = Date.now()
  const d = new Date(now)
  const sunday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - d.getUTCDay(), 14, 59, 59))
  if (sunday.getTime() > now) sunday.setUTCDate(sunday.getUTCDate() - 7)
  return sunday.getTime()
}

export function formatNextReset(): string {
  const next = lastConquestReset() + 7 * 24 * 60 * 60 * 1000
  const ms = next - Date.now()
  if (ms <= 0) return 'imminent'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
