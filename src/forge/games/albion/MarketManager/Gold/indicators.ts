export function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j]
      }
      result.push(sum / period)
    }
  }
  return result
}

export function rsi(data: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = []

  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }

  let avgG = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgL = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null)
    } else if (i === period) {
      const rs = avgL === 0 ? 100 : avgG / avgL
      result.push(100 - 100 / (1 + rs))
    } else {
      const diff = data[i] - data[i - 1]
      const g = diff > 0 ? diff : 0
      const l = diff < 0 ? -diff : 0
      avgG = (avgG * (period - 1) + g) / period
      avgL = (avgL * (period - 1) + l) / period
      const rs = avgL === 0 ? 100 : avgG / avgL
      result.push(100 - 100 / (1 + rs))
    }
  }

  return result
}
