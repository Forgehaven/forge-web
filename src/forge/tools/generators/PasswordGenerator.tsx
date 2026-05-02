import { useCopy } from '../../../hooks/useCopy'
import { useState, useCallback } from 'react'

const SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

export function PasswordGenerator() {
  const { copy, copied } = useCopy()
  const [length, setLength] = useState(16)
  const [opts, setOpts] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: false })
  const [password, setPassword] = useState('')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"

  const generate = useCallback(() => {
    const charset = Object.entries(opts)
      .filter(([, enabled]) => enabled)
      .map(([key]) => SETS[key as keyof typeof SETS])
      .join('')
    if (!charset) return
    const arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    setPassword(Array.from(arr, v => charset[v % charset.length]).join(''))
  }, [length, opts])

  function toggle(key: keyof typeof opts) {
    setOpts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Password Generator</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#6b7280]">Length</label>
            <span className="text-xs font-mono text-[#c4af64]">{length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={128}
            value={length}
            onChange={e => setLength(Number(e.target.value))}
            className="w-full accent-[#c4af64]"
          />
          <div className="flex justify-between text-xs text-[#6b7280] mt-0.5">
            <span>8</span><span>128</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(opts) as (keyof typeof opts)[]).map(key => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={opts[key]}
                onChange={() => toggle(key)}
                className="accent-[#c4af64]"
              />
              <span className="text-xs text-[#6b7280] capitalize">{key}</span>
            </label>
          ))}
        </div>

        <button
          onClick={generate}
          className="px-4 py-2 rounded text-sm bg-[#c4af64] text-white hover:opacity-90 transition-opacity"
        >
          Generate
        </button>

        {password && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6b7280]">Generated Password</p>
              <button
                onClick={() => copy(password)}
                className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <input
              readOnly
              className={inputClass}
              value={password}
            />
          </div>
        )}
      </div>
    </div>
  )
}
