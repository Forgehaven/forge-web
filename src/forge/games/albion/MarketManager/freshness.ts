const HOUR = 3_600_000
const DAY = 86_400_000

// Shared 4-tier staleness ladder for market data ages.
export function freshnessClass(ageMs: number): string {
  return ageMs < HOUR ? 'text-[#4ade80]'
    : ageMs < DAY ? 'text-[#e2e4ed]'
    : ageMs < 3 * DAY ? 'text-[#facc15]'
    : 'text-[#f87171]'
}

export const SCAN_TIME_FMT: Intl.DateTimeFormatOptions = {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
}
