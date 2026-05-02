export interface GeoResult {
  id: number
  name: string
  country_code: string
  country: string
  admin1?: string
  timezone: string
  latitude: number
  longitude: number
}

export function flag(cc: string): string {
  return [...cc.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  let Δλ = (lon2 - lon1) * Math.PI / 180
  if (Math.abs(Δλ) > Math.PI) Δλ = Δλ > 0 ? Δλ - 2 * Math.PI : Δλ + 2 * Math.PI
  const Δψ = Math.log(Math.tan(φ2 / 2 + Math.PI / 4) / Math.tan(φ1 / 2 + Math.PI / 4))
  return (Math.atan2(Δλ, Δψ) * 180 / Math.PI + 360) % 360
}

export function formatDist(km: number): string {
  if (km < 1) return '< 1 km'
  return `${Math.round(km).toLocaleString()} km`
}
