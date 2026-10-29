// Imperial Army I.D. tag stock, modelled on LandSandBoat
// scripts/globals/assault/npc_handler.lua: the stock starts full and one tag
// regenerates per period, counted from the first draw out of a full stock.
export const ASSAULT_TAG_MS = 86_400_000

export interface TagState {
  stock: number
  nextAt: number | null
  fullAt: number | null
}

export function assaultTags(draws: number[], max: number, nowMs: number, period = ASSAULT_TAG_MS): TagState {
  let stock = max
  let timer: number | null = null
  const refill = (at: number) => {
    if (timer === null) return
    const n = Math.floor((at - timer) / period)
    if (n <= 0) return
    const apply = Math.min(n, max - stock)
    stock += apply
    timer = stock >= max ? null : timer + apply * period
  }
  for (const t of [...draws].sort((a, b) => a - b)) {
    if (t > nowMs) break
    refill(t)
    if (stock <= 0) continue
    stock -= 1
    if (timer === null) timer = t
  }
  refill(nowMs)
  return {
    stock,
    nextAt: timer === null ? null : timer + period,
    fullAt: timer === null ? null : timer + (max - stock) * period,
  }
}
