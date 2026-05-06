import { useCopy } from '../../../hooks/useCopy'
import { useState } from 'react'

export function UuidGenerator() {
  const { copy, copied } = useCopy()
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState<string[]>([])

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-20 font-mono"

  function generate() {
    setUuids(Array.from({ length: count }, () => crypto.randomUUID()))
  }

  function copyAll() {
    copy(uuids.join('\n'))
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">UUID Generator</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Count (1–20)</label>
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
            className="px-4 py-2 rounded text-sm bg-[#c4af64] text-white hover:opacity-90 transition-opacity"
          >
            Generate
          </button>
        </div>

        {uuids.length > 0 && (
          <div className="pt-2 border-t border-[#2a2d3a]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#6b7280]">UUIDs v4</p>
              <button
                onClick={copyAll}
                className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {uuids.map((uuid, i) => (
                <p key={i} className="font-mono text-sm text-[#c4af64]">{uuid}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
