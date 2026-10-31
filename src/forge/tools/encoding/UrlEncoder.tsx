import { useCopy } from '../../../hooks/useCopy'
import { useState, useMemo } from 'react'

type Mode = 'encode' | 'decode'
type EncType = 'encodeURIComponent' | 'encodeURI'

export function UrlEncoder() {
  const { copy, copied } = useCopy()
  const [mode, setMode] = useState<Mode>('encode')
  const [encType, setEncType] = useState<EncType>('encodeURIComponent')
  const [input, setInput] = useState('')

  const inputClass = "bg-forge-bg border border-forge-border text-forge-text rounded px-3 py-2 text-sm focus:outline-none focus:border-forge-accent w-full font-mono resize-none"

  const { output, error } = useMemo<{ output: string; error: string }>(() => {
    if (!input) return { output: '', error: '' }
    try {
      if (mode === 'encode') {
        const out = encType === 'encodeURIComponent' ? encodeURIComponent(input) : encodeURI(input)
        return { output: out, error: '' }
      } else {
        const out = encType === 'encodeURIComponent' ? decodeURIComponent(input) : decodeURI(input)
        return { output: out, error: '' }
      }
    } catch {
      return { output: '', error: 'Invalid input for decoding' }
    }
  }, [input, mode, encType])

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-forge-text mb-6">URL Encoder / Decoder</h1>

      <div className="flex gap-2 mb-6">
        {(['encode', 'decode'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setInput('') }}
            className={`px-3 py-1.5 rounded text-sm transition-colors capitalize ${
              mode === m
                ? 'bg-forge-accent text-white'
                : 'bg-forge-surface text-forge-dim hover:text-forge-text border border-forge-border'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="bg-forge-surface border border-forge-border rounded-lg p-6 flex flex-col gap-4">
        <div className="flex gap-3">
          {(['encodeURIComponent', 'encodeURI'] as EncType[]).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="encType"
                checked={encType === t}
                onChange={() => setEncType(t)}
                className="accent-forge-accent"
              />
              <span className="text-xs text-forge-muted font-mono">{t}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs text-forge-muted mb-1">Input</label>
          <textarea
            className={inputClass}
            rows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'https://example.com/path?q=hello world' : 'https%3A%2F%2Fexample.com'}
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {output && (
          <div className="pt-2 border-t border-forge-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-forge-muted">Output</p>
              <button
                onClick={() => copy(output)}
                className="text-xs text-forge-accent hover:text-forge-text transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-sm text-forge-accent break-all">{output}</p>
          </div>
        )}
      </div>
    </div>
  )
}
