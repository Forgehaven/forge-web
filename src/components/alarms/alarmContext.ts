import { createContext, useContext } from 'react'
import type { ChimeLevel } from '../../lib/chime'

export type AlarmTarget = { key: string; inMs: number }
export type TargetSource = (nowMs: number) => AlarmTarget[]

export interface AlarmsCtx {
  armed: Map<string, number>
  toggleAlert: (key: string, e: React.MouseEvent) => void
  disarmAlert: (key: string) => void
  chimeLevel: ChimeLevel
  setChime: (l: ChimeLevel) => void
  repeatMode: boolean
  toggleRepeat: () => void
  volume: number
  setVolume: (v: number) => void
}

export const AlarmsContext = createContext<AlarmsCtx | null>(null)

// Scoped view of the alarm engine for one source: names are auto-prefixed
// with the source id so sources can never collide.
export function useAlarmSource(sourceId: string) {
  const ctx = useContext(AlarmsContext)
  if (!ctx) throw new Error('useAlarmSource requires an AlarmProvider ancestor')
  const k = (name: string) => `${sourceId}:${name}`
  return {
    has: (name: string) => ctx.armed.has(k(name)),
    toggle: (name: string, e: React.MouseEvent) => ctx.toggleAlert(k(name), e),
    disarm: (name: string) => ctx.disarmAlert(k(name)),
    chimeLevel: ctx.chimeLevel,
    setChime: ctx.setChime,
    repeatMode: ctx.repeatMode,
    toggleRepeat: ctx.toggleRepeat,
    volume: ctx.volume,
    setVolume: ctx.setVolume,
  }
}
