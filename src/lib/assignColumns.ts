// Items with a `col` keep it (using only the columns they name) when there are
// enough columns. Otherwise greedy:
// each item goes to the lightest column so far, keeping reading order.
export function assignColumns<T extends { weight: number; col?: number }>(items: T[], cols: number): T[][] {
  if (items.length && items.every(i => i.col !== undefined && i.col < cols)) {
    const used = Math.max(...items.map(i => i.col!)) + 1
    return Array.from({ length: used }, (_, c) => items.filter(i => i.col === c))
  }
  const out = Array.from({ length: cols }, () => ({ weight: 0, items: [] as T[] }))
  for (const item of items) {
    const target = out.reduce((min, c) => (c.weight < min.weight ? c : min), out[0])
    target.items.push(item)
    target.weight += item.weight
  }
  return out.map(c => c.items)
}
