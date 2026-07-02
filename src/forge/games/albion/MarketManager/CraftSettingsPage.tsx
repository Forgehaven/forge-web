import { useEffect, useState } from 'react'
import { useAuth } from '../../../../auth/authContext'
import { useLayoutOverride } from '../../../../components/LayoutOverride'
import { CITIES, CITY_BONUSES, STATION_TYPES } from '../constants'
import { MarketManagerSidebar } from './MarketManagerSidebar'
import { MarketManagerBottomBar } from './MarketManagerBottomBar'
import { loadFocus, loadPremium, saveFocus, savePremium } from './premium'
import { fetchCraftSettings, putCraftSettings } from './ItemIndex/albionItemsApi'
import type { CraftSettings } from './ItemIndex/types'

function CrownIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 shrink-0"
      fill={active ? '#f5c518' : '#4a4d5a'}
      aria-hidden="true"
    >
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.5 10h-15L3 8z" />
      <rect x="5" y="19" width="14" height="1.6" rx="0.8" />
    </svg>
  )
}

// Community-shared craft economics (same pattern as the FFXI conquest map: one global blob,
// anyone with MM access can update it). Station fees are FLAT silver per craft, per station
// type per city (owners set their own fees). The premium toggle is per-user (localStorage) -
// it picks the 4%/8% sales tax Best Value applies. Return rates are fixed game constants:
// 15.2% base, 36.7% refining specialty, 24.8% crafting specialty.
export function CraftSettingsPage() {
  const { isAuthenticated } = useAuth()
  const { setSidebar, setBottomBar } = useLayoutOverride()

  const [settings, setSettings] = useState<CraftSettings | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [premium, setPremium] = useState(loadPremium)
  const [focus, setFocus] = useState(loadFocus)

  useEffect(() => {
    if (isAuthenticated) {
      setSidebar(MarketManagerSidebar)
      setBottomBar(MarketManagerBottomBar)
    } else {
      setSidebar(null)
      setBottomBar(null)
    }
    return () => { setSidebar(null); setBottomBar(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    let cancelled = false
    fetchCraftSettings().then(result => {
      if (cancelled) return
      if (result.status === 'ok') {
        setSettings(result.payload.settings)
        setUpdatedAt(result.payload.updated_at)
      } else {
        setError(result.message)
      }
    })
    return () => { cancelled = true }
  }, [])

  function togglePremium() {
    const next = !premium
    setPremium(next)
    savePremium(next)
  }

  function toggleFocus() {
    const next = !focus
    setFocus(next)
    saveFocus(next)
  }

  function setFee(city: string, station: string, value: number) {
    setSettings(prev => prev && ({
      ...prev,
      cities: {
        ...prev.cities,
        [city]: {
          ...prev.cities[city],
          station_fees: { ...prev.cities[city].station_fees, [station]: value },
        },
      },
    }))
    setSaved(false)
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    const result = await putCraftSettings(settings)
    setSaving(false)
    if (result.status === 'ok') {
      setSaved(true)
      setError(null)
    } else {
      setError(result.message)
    }
  }

  const inputClass = 'w-20 bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1 text-sm text-[#e2e4ed] focus:outline-none focus:border-[#c4af64]'

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-4 select-none">
      <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
        Albion Online <span className="text-[#c4af64]">Craft Settings</span>
      </h1>

      <div className="rounded-lg border border-[#c4af64]/40 bg-[#c4af64]/10 px-4 py-3 text-sm text-[#e2e4ed]">
        <p className="font-medium text-[#c4af64]">Station fees are global.</p>
        <p className="text-xs text-[#9ca3af] mt-1">
          The fee table below is shared with everyone in the guild - editing here updates it for
          all of us, so the numbers stay current. Only the premium toggle is yours. Best Value
          uses all of it: your premium picks the sales tax (4% vs 8%), station fees are the flat
          silver each station owner charges per craft, and return rates come from the game's
          production bonuses (return = 1 − 1/(1 + bonus)): base 18% bonus = 15.2% return,
          refining specialty +40% = 36.7% return, crafting specialty +15% = 24.8% return.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Per-user toggles - premium drives the 4%/8% sales tax, focus the return rates */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 flex items-center gap-6 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-[#e2e4ed] cursor-pointer">
          <input
            type="checkbox"
            checked={premium}
            onChange={togglePremium}
            className="w-4 h-4 cursor-pointer accent-[#c4af64]"
          />
          <CrownIcon active={premium} />
          I have premium
        </label>
        <span className="text-xs text-[#6b7280] -ml-3">
          sales tax {premium ? '4%' : '8%'}
        </span>
        <label className="flex items-center gap-2 text-sm text-[#e2e4ed] cursor-pointer">
          <input
            type="checkbox"
            checked={focus}
            onChange={toggleFocus}
            className="w-4 h-4 cursor-pointer accent-[#c4af64]"
          />
          I craft with focus
        </label>
        <span className="text-xs text-[#6b7280] -ml-3">
          {focus ? 'returns 43.5% base · 53.9% refining bonus · 47.9% crafting bonus' : 'returns 15.2% base · 36.7% refining bonus · 24.8% crafting bonus'}
        </span>
        <span className="text-xs text-[#4a4d5a] w-full sm:w-auto">saved on this device only</span>
      </div>

      {!settings ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#c4af64] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* City bonuses (static game data) */}
          <div className="rounded-lg border border-[#2a2d3a] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1d27] border-b border-[#2a2d3a] text-xs text-[#6b7280] uppercase tracking-widest">
                  <th className="text-left px-4 py-2.5">City</th>
                  <th className="text-left px-4 py-2.5">Refining bonus (+40% = 36.7% return)</th>
                  <th className="text-left px-4 py-2.5">Crafting bonus (+15% = 24.8% return)</th>
                </tr>
              </thead>
              <tbody>
                {CITIES.map(city => {
                  const bonuses = CITY_BONUSES[city.value]
                  return (
                    <tr key={city.value} className="border-b border-[#1e2130] last:border-0">
                      <td className="px-4 py-2 text-[#e2e4ed] whitespace-nowrap">{city.label}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {bonuses?.refining ? <span className="text-[#4ade80]">{bonuses.refining}</span> : <span className="text-[#4a4d5a]">-</span>}
                      </td>
                      <td className="px-4 py-2 text-[#9ca3af] text-xs">{bonuses?.crafting ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Station usage fees: flat silver per craft, per station type per city */}
          <div className="rounded-lg border border-[#2a2d3a] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1d27] border-b border-[#2a2d3a] text-xs text-[#6b7280] uppercase tracking-widest">
                  <th className="text-left px-4 py-2.5">Station fee (silver)</th>
                  {CITIES.map(city => (
                    <th key={city.value} className="text-left px-3 py-2.5 whitespace-nowrap">{city.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STATION_TYPES.map(station => (
                  <tr key={station.value} className="border-b border-[#1e2130] last:border-0">
                    <td className="px-4 py-2 text-[#e2e4ed] whitespace-nowrap">{station.label}</td>
                    {CITIES.map(city => {
                      const values = settings.cities[city.value]
                      if (!values) return <td key={city.value} />
                      return (
                        <td key={city.value} className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={50}
                            value={values.station_fees[station.value] ?? 0}
                            onChange={e => setFee(city.value, station.value, Number(e.target.value))}
                            aria-label={`${city.label} ${station.label} fee`}
                            className={inputClass}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded text-sm font-medium bg-[#c4af64] text-white hover:bg-[#d4bf74] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="text-xs text-green-400">Saved - shared with everyone.</span>}
            {updatedAt && !saved && (
              <span className="text-xs text-[#6b7280]">
                last updated {new Date(updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
