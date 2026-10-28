export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return month
  return new Date(Date.UTC(y, m - 1)).toLocaleString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function stepLabel(at: number) {
  return at === 0 ? 'Creation' : `Blanket ${at}`
}
