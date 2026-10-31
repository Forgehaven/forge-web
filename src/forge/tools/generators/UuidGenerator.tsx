import { useCopy } from '../../../hooks/useCopy'
import { useState } from 'react'

export function UuidGenerator() {
  const { copy, copied } = useCopy()
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState<string[]>([])

  const inputClass = "bg-forge-bg border border-forge-border text-forge-text rounded px-3 py-2 text-sm focus:outline-none focus:border-forge-accent w-20 font-mono"

  function generate() {
    setUuids(Array.from({ length: count }, () => crypto.randomUUID()))
  }

  function copyAll() {
    copy(uuids.join('\n'))
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-forge-text mb-6">UUID Generator</h1>

      <div className="bg-forge-surface border border-forge-border rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-forge-muted mb-1">Count (1–20)</label>
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={count}
              onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
            />
          </div>
          <button
            onClick={generate}
            className="px-4 py-2 rounded text-sm bg-forge-accent text-white hover:opacity-90 transition-opacity"
          >
            Generate
          </button>
        </div>

        {uuids.length > 0 && (
          <div className="pt-2 border-t border-forge-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-forge-muted">UUIDs v4</p>
              <button
                onClick={copyAll}
                className="text-xs text-forge-accent hover:text-forge-text transition-colors"
              >
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {uuids.map((uuid, i) => (
                <p key={i} className="font-mono text-sm text-forge-accent">{uuid}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
