import { freshnessClass, SCAN_TIME_FMT } from './freshness'

// Per-row scan-age dot: ADP records age independently per (item, city, quality) -
// one fresh row says nothing about its neighbours. Gray = never scanned in game.
export function ScanDot({ dataAt, fetchedAt }: {
  dataAt: Date | null
  fetchedAt: Date | null
}) {
  if (!dataAt || !fetchedAt) {
    return (
      <span
        className="text-[#4a4d5a] select-none"
        title="Never scanned in game - no player has opened this market with the data client"
      >
        ●
      </span>
    )
  }
  const age = Math.max(0, fetchedAt.getTime() - dataAt.getTime())
  return (
    <span
      className={`${freshnessClass(age)} select-none`}
      title={`Scanned in game ${dataAt.toLocaleString('en-US', SCAN_TIME_FMT)}`}
    >
      ●
    </span>
  )
}

// Age of the underlying MARKET data (ADP's last observation), not of our fetch - the
// poller refetches every 120s but a dead market can sit unobserved for days. Age is
// measured against fetchedAt instead of the wall clock (no Date.now in render), which is
// at most one poll interval stale.
export function DataFreshness({ dataAt, fetchedAt }: {
  dataAt: Date | null
  fetchedAt: Date | null
}) {
  if (!dataAt || !fetchedAt) return null
  const age = Math.max(0, fetchedAt.getTime() - dataAt.getTime())
  return (
    <span
      className={freshnessClass(age)}
      title="Newest in-game scan in this batch - individual rows can be much older (see their dots)"
    >
      · data from {dataAt.toLocaleString('en-US', SCAN_TIME_FMT)}
    </span>
  )
}
