// Silver amounts: rounded, thousands-separated, '-' for no value.
// Byte-identical copy in runningdawn.github.io .../MarketManager/marketFormat.ts - keep in lockstep.
export function fmt(n: number | null | undefined): string {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('en-US')
}
