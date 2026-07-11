import { CITIES, CITY_BONUSES, STATION_TYPES } from '../shared/constants'
import { RETURN_RATES } from '../shared/crafting/craftEconomics'
import { useAuth } from '../../../../auth/authContext'
import {
  useUserCraftSettings, patchCraftSettings, setStationFee, stationFeeValue,
  type MatSource, type CraftStrategy,
} from '../shared/settings/craftSettings'

function CrownIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill={active ? '#f5c518' : '#4a4d5a'} aria-hidden="true">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.5 10h-15L3 8z" />
      <rect x="5" y="19" width="14" height="1.6" rx="0.8" />
    </svg>
  )
}

function ToggleGroup({ value, options, onChange, label }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-[#6b7280] uppercase tracking-widest">{label}</span>
      <div className="flex gap-1">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              value === o.value
                ? 'bg-[#c4af64] text-[#0f1117]'
                : 'bg-[#1a1d27] text-[#9ca3af] border border-[#2a2d3a] hover:text-[#e2e4ed]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const MAT_SOURCES = [
  { value: 'sell', label: 'Instant buy' },
  { value: 'buy', label: 'Buy orders' },
]
const STRATEGIES = [
  { value: 'optimized', label: 'Optimized' },
  { value: 'base', label: 'Base mats' },
]

const FEE_INPUT = 'w-20 bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1 text-sm text-[#e2e4ed] focus:outline-none focus:border-[#c4af64]'

// Per-user craft settings. Everything here is the individual user's own (unlike the Market
// Manager, where station fees were a shared guild blob). Saved to localStorage, and to the
// account when logged in (settings/sync.ts). No Save button - edits sync automatically.
export function CraftSettingsPanel() {
  const { isAuthenticated } = useAuth()
  const s = useUserCraftSettings()

  return (
    <div className="px-5 py-4 space-y-4">
      <p className="text-xs text-[#6b7280]">
        Your own settings - {isAuthenticated
          ? 'saved to your account and synced across devices.'
          : 'saved to this browser. Log in to sync across devices.'}
      </p>

      <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-[#e2e4ed] cursor-pointer">
          <input
            type="checkbox"
            checked={s.premium}
            onChange={() => patchCraftSettings({ premium: !s.premium })}
            className="w-4 h-4 cursor-pointer accent-[#c4af64]"
          />
          <CrownIcon active={s.premium} />
          I have premium
          <span className="text-xs text-[#6b7280]">(sales tax {s.premium ? '4%' : '8%'})</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-[#e2e4ed] cursor-pointer">
          <input
            type="checkbox"
            checked={s.focus}
            onChange={() => patchCraftSettings({ focus: !s.focus })}
            className="w-4 h-4 cursor-pointer accent-[#c4af64]"
          />
          I craft with focus
        </label>

        <label className="flex items-center gap-2 text-sm text-[#e2e4ed]">
          Default town
          <select
            value={s.defaultCity}
            onChange={e => patchCraftSettings({ defaultCity: e.target.value })}
            className="bg-[#1a1d27] border border-[#2a2d3a] rounded px-2 py-1.5 text-xs text-[#e2e4ed] focus:outline-none focus:border-[#c4af64] cursor-pointer"
          >
            {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>

        <ToggleGroup
          label="Mats"
          value={s.matSource}
          options={MAT_SOURCES}
          onChange={v => patchCraftSettings({ matSource: v as MatSource })}
        />
        <ToggleGroup
          label="Craft"
          value={s.craftStrategy}
          options={STRATEGIES}
          onChange={v => patchCraftSettings({ craftStrategy: v as CraftStrategy })}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-medium text-[#9ca3af] uppercase tracking-widest">Station Fees</h3>
          <span className="text-xs text-[#6b7280]">silver / 100 nutrition</span>
        </div>
        <div className="rounded-lg border border-[#2a2d3a] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1a1d27] border-b border-[#2a2d3a] text-xs text-[#6b7280] uppercase tracking-widest">
                <th className="text-left px-3 py-2.5 font-semibold">Station</th>
                {CITIES.map(c => <th key={c.value} className="text-left px-3 py-2.5 font-semibold whitespace-nowrap">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {STATION_TYPES.map(station => (
                <tr key={station.value} className="border-b border-[#1e2130] last:border-0">
                  <td className="px-3 py-2 text-[#e2e4ed] whitespace-nowrap">{station.label}</td>
                  {CITIES.map(city => (
                    <td key={city.value} className="px-3 py-2">
                      <input
                        type="number" min={0} step={50} inputMode="numeric"
                        value={stationFeeValue(s, city.value, station.value) || ''}
                        placeholder="0"
                        onChange={e => setStationFee(city.value, station.value, Number(e.target.value))}
                        onFocus={e => e.target.select()}
                        aria-label={`${city.label} ${station.label} fee`}
                        className={FEE_INPUT}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#6b7280] mt-2">
          Enter the fee exactly as it reads on the station sign. A craft consumes Item Value × 0.1125
          nutrition, so the actual fee scales with the item; T1/T2 crafts are exempt.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[#9ca3af] uppercase tracking-widest mb-2">City Production Bonuses</h3>
        <div className="rounded-lg border border-[#2a2d3a] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1a1d27] border-b border-[#2a2d3a] text-xs text-[#6b7280] uppercase tracking-widest">
                <th className="px-3 py-2.5 text-left font-semibold">City</th>
                <th className="px-3 py-2.5 text-left font-semibold">Refining specialty ({RETURN_RATES.refining}% return)</th>
                <th className="px-3 py-2.5 text-left font-semibold">Crafting specialty ({RETURN_RATES.crafting}% return)</th>
              </tr>
            </thead>
            <tbody>
              {CITIES.map(city => {
                const b = CITY_BONUSES[city.value]
                return (
                  <tr key={city.value} className="border-b border-[#1e2130] last:border-0">
                    <td className="px-3 py-2 text-[#e2e4ed]">{city.label}</td>
                    <td className="px-3 py-2 text-[#4ade80]">{b?.refining ?? '-'}</td>
                    <td className="px-3 py-2 text-[#9ca3af]">{b?.crafting ?? '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#6b7280] mt-2">
          Refining specialty gives the highest return in its city; the base return rate applies elsewhere.
          Focus adds a large bonus on top. Return rates: 15.2% base / 36.7% refining / 24.8% crafting
          (43.5 / 53.9 / 47.9 with focus).
        </p>
      </div>
    </div>
  )
}
