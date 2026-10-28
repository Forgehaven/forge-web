// Greedy: each item goes to the lightest column so far, keeping reading order.
export function assignColumns<T extends { weight: number }>(items: T[], cols: number): T[][] {
  const out = Array.from({ length: cols }, () => ({ weight: 0, items: [] as T[] }))
  for (const item of items) {
    const target = out.reduce((min, c) => (c.weight < min.weight ? c : min), out[0])
    target.items.push(item)
    target.weight += item.weight
  }
  return out.map(c => c.items)
}
