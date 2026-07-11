import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCraftSettings, patchCraftSettings, setStationFee, stationFeeValue,
  replaceCraftSettings,
} from './craftSettings'

beforeEach(() => {
  localStorage.clear()
  replaceCraftSettings({}) // reset module cache to defaults
})

describe('craftSettings store', () => {
  it('defaults to premium on, focus off, Bridgewatch', () => {
    const s = getCraftSettings()
    expect(s.premium).toBe(true)
    expect(s.focus).toBe(false)
    expect(s.defaultCity).toBe('Bridgewatch')
  })

  it('patches fields', () => {
    patchCraftSettings({ premium: false, focus: true, defaultCity: 'Lymhurst' })
    const s = getCraftSettings()
    expect(s.premium).toBe(false)
    expect(s.focus).toBe(true)
    expect(s.defaultCity).toBe('Lymhurst')
  })

  it('sets and clears a station fee', () => {
    setStationFee('Thetford', 'forge', 500)
    expect(stationFeeValue(getCraftSettings(), 'Thetford', 'forge')).toBe(500)
    setStationFee('Thetford', 'forge', 0)
    expect(stationFeeValue(getCraftSettings(), 'Thetford', 'forge')).toBe(0)
  })

  it('merges a server blob over defaults', () => {
    replaceCraftSettings({ premium: false, stationFees: { Lymhurst: { forge: 100 } } })
    const s = getCraftSettings()
    expect(s.premium).toBe(false)
    expect(s.defaultCity).toBe('Bridgewatch') // default preserved
    expect(stationFeeValue(s, 'Lymhurst', 'forge')).toBe(100)
  })
})
