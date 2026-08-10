export function formatTime(s: number, decimals = 2): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${sec.toFixed(decimals)}s`
  return `${m}:${sec.toFixed(decimals).padStart(decimals + 3, '0')}`
}
