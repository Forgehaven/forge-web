import { useState, useEffect, useMemo } from 'react'
import { useIPInfo } from '../../../hooks/useIPInfo'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'

const hourOptions24: SelectOption[] = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0'),
}))

const hourOptions12: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

const minuteOptions: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i * 5).padStart(2, '0'),
  label: String(i * 5).padStart(2, '0'),
}))

const periodOptions: SelectOption[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

const discordFormats: { code: string; label: string }[] = [
  { code: 't', label: 'Short Time' },
  { code: 'T', label: 'Long Time' },
  { code: 'd', label: 'Short Date' },
  { code: 'D', label: 'Long Date' },
  { code: 'f', label: 'Short Date/Time' },
  { code: 'F', label: 'Long Date/Time' },
  { code: 'R', label: 'Relative' },
]

const dateStyleMap: Record<string, Intl.DateTimeFormatOptions> = {
  t: { hour: 'numeric', minute: '2-digit' },
  T: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
  d: { month: '2-digit', day: '2-digit', year: 'numeric' },
  D: { month: 'long', day: 'numeric', year: 'numeric' },
  f: { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
  F: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
}

function formatDiscordPreview(ts: number, code: string, tz: string): string {
  const d = new Date(ts * 1000)
  if (code === 'R') {
    const diff = Math.round((ts * 1000 - Date.now()) / 1000)
    const abs = Math.abs(diff)
    const past = diff < 0
    if (abs < 60) return past ? `${abs} seconds ago` : `in ${abs} seconds`
    if (abs < 3600) return past ? `${Math.floor(abs / 60)} minutes ago` : `in ${Math.floor(abs / 60)} minutes`
    if (abs < 86400) return past ? `${Math.floor(abs / 3600)} hours ago` : `in ${Math.floor(abs / 3600)} hours`
    return past ? `${Math.floor(abs / 86400)} days ago` : `in ${Math.floor(abs / 86400)} days`
  }
  return d.toLocaleString('en-US', { ...dateStyleMap[code], timeZone: tz })
}

export function DiscordTimestamp() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const [tsInput, setTsInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [timeHour, setTimeHour] = useState('00')
  const [timeMinute, setTimeMinute] = useState('00')
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM')
  const [is24hr, setIs24hr] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const { data: ipInfo } = useIPInfo()

  const timezone = ipInfo?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])


  const tsResult = useMemo(() => {
    const n = Number(tsInput)
    if (!tsInput || isNaN(n)) return null
    const d = new Date(n * 1000)
    return isNaN(d.getTime()) ? null : d
  }, [tsInput])

  function toggleMode() {
    const h = parseInt(timeHour)
    if (is24hr) {
      // 24h → 12h
      if (h === 0)       { setTimeHour('12'); setTimePeriod('AM') }
      else if (h < 12)   { setTimeHour(String(h)); setTimePeriod('AM') }
      else if (h === 12) { setTimeHour('12'); setTimePeriod('PM') }
      else               { setTimeHour(String(h - 12)); setTimePeriod('PM') }
    } else {
      // 12h → 24h
      if (timePeriod === 'AM') setTimeHour(h === 12 ? '00' : String(h).padStart(2, '0'))
      else                     setTimeHour(h === 12 ? '12' : String(h + 12).padStart(2, '0'))
    }
    setIs24hr(v => !v)
  }

  const hour24 = is24hr
    ? timeHour
    : (() => {
        const h = parseInt(timeHour)
        if (timePeriod === 'AM') return h === 12 ? '00' : String(h).padStart(2, '0')
        return h === 12 ? '12' : String(h + 12).padStart(2, '0')
      })()

  const dateResult = useMemo(() => {
    if (!dateInput) return null
    const d = new Date(`${dateInput}T${hour24}:${timeMinute}`)
    return isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000)
  }, [dateInput, hour24, timeMinute])

  const discordTs = tsResult ? Math.floor(tsResult.getTime() / 1000) : (dateResult ?? now)

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // clipboard permission denied
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Discord Timestamp Converter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div className="pb-2 border-b border-[#2a2d3a]">
          <p className="text-xs text-[#6b7280] mb-1">Current Unix Timestamp</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-2xl text-[#c4af64]">{now}</p>
            <button onClick={() => copy(String(now), 'now')} className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors">
              {copied === 'now' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-[#6b7280] mt-1">
            {new Date(now * 1000).toLocaleString('en-US', { timeZone: timezone })}
            {' · '}{timezone}
          </p>
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Unix Timestamp → Human Date</label>
          <input className="forge-input-mono" type="number" inputMode="numeric" value={tsInput} onChange={e => setTsInput(e.target.value)} placeholder="e.g. 1700000000" />
          {tsResult && (
            <div className="mt-2 flex items-center justify-between">
              <p className="font-mono text-sm text-[#c4af64]">
                {tsResult.toLocaleString('en-US', { timeZone: timezone })}
              </p>
              <button onClick={() => copy(tsResult.toISOString(), 'ts')} className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors ml-2 shrink-0">
                {copied === 'ts' ? 'Copied!' : 'Copy ISO'}
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Human Date → Unix Timestamp</label>
          <div className="flex gap-2 flex-wrap">
            <input className="forge-input-mono flex-1 min-w-0" type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} />
            <div className="flex items-center gap-1 shrink-0">
              <Select
                options={is24hr ? hourOptions24 : hourOptions12}
                value={(is24hr ? hourOptions24 : hourOptions12).find(o => o.value === timeHour) ?? null}
                onChange={opt => opt && setTimeHour(opt.value)}
                className="w-16"
              />
              <span className="text-[#6b7280] text-sm">:</span>
              <Select
                options={minuteOptions}
                value={minuteOptions.find(o => o.value === timeMinute) ?? null}
                onChange={opt => opt && setTimeMinute(opt.value)}
                className="w-16"
              />
              {!is24hr && (
                <Select
                  options={periodOptions}
                  value={periodOptions.find(o => o.value === timePeriod) ?? null}
                  onChange={opt => opt && setTimePeriod(opt.value as 'AM' | 'PM')}
                  className="w-16"
                />
              )}
              <button
                onClick={toggleMode}
                className="px-2 py-1.5 text-xs rounded border border-[#2a2d3a] text-[#6b7280] hover:text-[#e2e4ed] hover:border-[#3a3d4a] transition-colors cursor-pointer whitespace-nowrap"
              >
                {is24hr ? '24h' : '12h'}
              </button>
            </div>
          </div>
          {dateResult !== null && (
            <div className="mt-2 flex items-center justify-between">
              <p className="font-mono text-sm text-[#c4af64]">{dateResult}</p>
              <button onClick={() => copy(String(dateResult), 'date')} className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors ml-2 shrink-0">
                {copied === 'date' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </div>

      {discordTs !== null && (
        <div className="mt-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-[#5865f2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            <p className="text-sm font-medium text-[#e2e4ed]">Discord Timestamps</p>
            <span className="text-xs text-[#6b7280]">· renders in viewer's local time</span>
          </div>

          <div className="flex flex-col">
            {discordFormats.map(({ code, label }) => {
              const markdown = `<t:${discordTs}:${code}>`
              const preview = formatDiscordPreview(discordTs, code, timezone)
              return (
                <div key={code} className="flex items-center gap-3 py-2 border-b border-[#2a2d3a] last:border-0">
                  <span className="font-mono text-xs text-[#6b7280] w-4 shrink-0">{code}</span>
                  <span className="text-xs text-[#6b7280] w-28 shrink-0">{label}</span>
                  <span className="font-mono text-xs text-[#c4af64] flex-1">{markdown}</span>
                  <span className="text-xs text-[#9ca3af] w-48 shrink-0 hidden sm:block truncate">{preview}</span>
                  <button
                    onClick={() => copy(markdown, `discord-${code}`)}
                    className="text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors shrink-0"
                  >
                    {copied === `discord-${code}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
