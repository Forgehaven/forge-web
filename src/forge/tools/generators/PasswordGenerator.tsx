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
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-forge-text mb-6">Password Generator</h1>

      <div className="bg-forge-surface border border-forge-border rounded-lg p-6 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-forge-muted">Length</label>
            <span className="text-xs font-mono text-forge-accent">{length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={128}
            value={length}
            onChange={e => setLength(Number(e.target.value))}
            className="w-full accent-forge-accent"
          />
          <div className="flex justify-between text-xs text-forge-muted mt-0.5">
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
                className="accent-forge-accent"
              />
              <span className="text-xs text-forge-muted capitalize">{key}</span>
            </label>
          ))}
        </div>

        <button
          onClick={generate}
          className="px-4 py-2 rounded text-sm bg-forge-accent text-white hover:opacity-90 transition-opacity"
        >
          Generate
        </button>

        {password && (
          <div className="bg-forge-surface border border-forge-border rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-forge-muted">Generated Password</p>
              <button
                onClick={() => copy(password)}
                className="text-xs text-forge-accent hover:text-forge-text transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <input
              readOnly
              className="forge-input-mono"
              value={password}
            />
          </div>
        )}
      </div>
    </div>
  )
}
