import { useState, useEffect } from 'react'

export type TempUnit = 'C' | 'F'

const KEY = 'forgetools_temp_unit'
const EVENT = 'forgetools_tempunit_change'

export function formatTemp(celsius: number, unit: TempUnit): string {
  if (unit === 'F') return `${Math.round(celsius * 9 / 5 + 32)}°F`
  return `${Math.round(celsius)}°C`
}

export function formatWind(kmh: number, dir: string, unit: TempUnit): string {
  if (unit === 'F') return `${Math.round(kmh * 0.621371)} mph ${dir}`
  return `${Math.round(kmh)} km/h ${dir}`
}

export function formatPressure(hpa: number, unit: TempUnit): string {
  if (unit === 'F') return `${(hpa * 0.02953).toFixed(2)} inHg`
  return `${Math.round(hpa)} hPa`
}

export function formatPrecip(mm: number, unit: TempUnit): string {
  if (unit === 'F') return `${(mm * 0.0393701).toFixed(2)} in/h`
  return `${mm} mm/h`
}

export function formatDist(km: number, unit: TempUnit): string {
  if (unit === 'F') {
    const mi = km * 0.621371
    return mi < 1 ? '< 1 mi' : `${Math.round(mi).toLocaleString()} mi`
  }
  return km < 1 ? '< 1 km' : `${Math.round(km).toLocaleString()} km`
}

export function useTempUnit(): [TempUnit, (u: TempUnit) => void] {
  const [unit, setUnitState] = useState<TempUnit>(
    () => (localStorage.getItem(KEY) as TempUnit) ?? 'C'
  )

  useEffect(() => {
    function sync() {
      setUnitState((localStorage.getItem(KEY) as TempUnit) ?? 'C')
    }
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  function setUnit(u: TempUnit) {
    localStorage.setItem(KEY, u)
    window.dispatchEvent(new Event(EVENT))
    setUnitState(u)
  }

  return [unit, setUnit]
}
