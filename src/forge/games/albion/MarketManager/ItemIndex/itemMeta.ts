// Albion uniqueNames are structured (e.g. "T4_MAIN_SWORD@2"), so tier and enchant are
// derived directly from the id - no extra API fields or lookup tables needed.
export function parseTier(id: string): number {
  return Number(id.match(/^T(\d)/)?.[1] ?? 0)
}

export function parseEnchant(id: string): number {
  return Number(id.match(/@(\d)/)?.[1] ?? 0)
}
