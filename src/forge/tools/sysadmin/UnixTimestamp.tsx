import { useState } from 'react'

function Row({ label, value, id, copiedKey, onCopy }: {
  label: string; value: string; id: string
  copiedKey: string | null; onCopy: (id: string, value: string) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#2a2d3a] last:border-0">
      <span className="text-xs text-[#6b7280] shrink-0 pt-0.5 w-28">{label}</span>
      <span className="text-sm font-mono text-[#e2e4ed] flex-1 break-all">{value}</span>
      <button onClick={() => onCopy(id, value)} className="text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors shrink-0 cursor-pointer">
        {copiedKey === id ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function relativeTime(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000
  const abs = Math.abs(diff)
  const future = diff < 0
  const sfx = future ? 'from now' : 'ago'
  if (abs < 60) return `${Math.round(abs)}s ${sfx}`
  if (abs < 3600) return `${Math.round(abs / 60)}m ${sfx}`
  if (abs < 86400) return `${Math.round(abs / 3600)}h ${sfx}`
  if (abs < 86400 * 30) return `${Math.round(abs / 86400)}d ${sfx}`
  if (abs < 86400 * 365) return `${Math.round(abs / 86400 / 30)} months ${sfx}`
  return `${Math.round(abs / 86400 / 365)} years ${sfx}`
}

function weekNumber(d: Date): number {
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
}

export function UnixTimestamp() {
  const [tsInput, setTsInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  function copy(key: string, val: string) {
    navigator.clipboard.writeText(val)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  // Timestamp → Date
  const rawTs = tsInput.trim() ? parseInt(tsInput.trim()) : null
  const isMs = rawTs !== null && rawTs > 1e12
  const tsMs = rawTs !== null ? (isMs ? rawTs : rawTs * 1000) : null
  const dateFromTs = tsMs !== null && !isNaN(tsMs) ? new Date(tsMs) : null

  // Date → Timestamp
  const dateFromInput = dateInput ? new Date(dateInput) : null
  const validDate = dateFromInput && !isNaN(dateFromInput.getTime())

  const btnClass = "px-3 py-1.5 text-xs rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"

  const rp = { copiedKey, onCopy: copy }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Unix Timestamp</h1>

      <div className="flex flex-col gap-5">

        {/* Timestamp → Date */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-[#e2e4ed]">Timestamp → Date</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={tsInput}
              onChange={e => setTsInput(e.target.value)}
              placeholder="e.g. 1700000000"
              className="forge-input-mono"
            />
            <button onClick={() => setTsInput(String(Math.floor(Date.now() / 1000)))} className={btnClass}>
              Now
            </button>
          </div>
          {tsInput && !dateFromTs && <p className="text-xs text-red-400">Invalid timestamp</p>}
          {dateFromTs && (
            <div className="bg-[#0f1117] rounded-lg px-4 pt-2 pb-1">
              <Row {...rp} id="utc"      label="UTC"       value={dateFromTs.toUTCString()} />
              <Row {...rp} id="local"    label="Local"     value={dateFromTs.toLocaleString()} />
              <Row {...rp} id="iso"      label="ISO 8601"  value={dateFromTs.toISOString()} />
              <Row {...rp} id="relative" label="Relative"  value={relativeTime(dateFromTs)} />
              <Row {...rp} id="weekday"  label="Day"       value={dateFromTs.toLocaleDateString(undefined, { weekday: 'long' })} />
              <Row {...rp} id="week"     label="Week"      value={`Week ${weekNumber(dateFromTs)} of ${dateFromTs.getFullYear()}`} />
              {isMs && <p className="text-xs text-[#6b7280] pt-2 pb-1">Detected milliseconds - showing as seconds below</p>}
              <Row {...rp} id="secs"  label="Seconds"    value={String(Math.floor((tsMs ?? 0) / 1000))} />
              <Row {...rp} id="ms"    label="Milliseconds" value={String(tsMs)} />
            </div>
          )}
        </div>

        {/* Date → Timestamp */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-[#e2e4ed]">Date → Timestamp</h2>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={dateInput}
              onChange={e => setDateInput(e.target.value)}
              className="forge-input-mono"
            />
            <button
              onClick={() => setDateInput(new Date().toISOString().slice(0, 16))}
              className={btnClass}
            >
              Now
            </button>
          </div>
          {validDate && (
            <div className="bg-[#0f1117] rounded-lg px-4 pt-2 pb-1">
              <Row {...rp} id="ts-s"  label="Seconds"      value={String(Math.floor(dateFromInput!.getTime() / 1000))} />
              <Row {...rp} id="ts-ms" label="Milliseconds" value={String(dateFromInput!.getTime())} />
              <Row {...rp} id="ts-utc" label="UTC"         value={dateFromInput!.toUTCString()} />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
