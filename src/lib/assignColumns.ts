// Placement keyed by column count: { [cols]: [column, row] }.
export type Place = Record<number, [number, number]>

// Items use the placement for the widest layout that fits (only the columns it
// names, ordered by row). Without one, greedy in array order:
// each item goes to the lightest column so far, keeping reading order.
export function assignColumns<T extends { weight: number; place?: Place }>(items: T[], cols: number): T[][] {
  const key = Math.max(...Object.keys(items[0]?.place ?? {}).map(Number).filter(k => k <= cols))
  if (items.length && items.every(i => i.place?.[key])) {
    const used = Math.max(...items.map(i => i.place![key][0])) + 1
    return Array.from({ length: used }, (_, c) =>
      items.filter(i => i.place![key][0] === c).sort((x, y) => x.place![key][1] - y.place![key][1]))
  }
  const out = Array.from({ length: cols }, () => ({ weight: 0, items: [] as T[] }))
  for (const item of items) {
    const target = out.reduce((min, c) => (c.weight < min.weight ? c : min), out[0])
    target.items.push(item)
    target.weight += item.weight
  }
  return out.map(c => c.items)
}
