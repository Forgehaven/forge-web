import { useCopy } from '../../../hooks/useCopy'
import { useState, useMemo } from 'react'

type Mode = 'encode' | 'decode'

export function Base64() {
  const { copy, copied } = useCopy()
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [urlSafe, setUrlSafe] = useState(false)

  const inputClass = "bg-forge-bg border border-forge-border text-forge-text rounded px-3 py-2 text-sm focus:outline-none focus:border-forge-accent w-full font-mono resize-none"

  function toUrlSafe(s: string) {
    return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  function fromUrlSafe(s: string) {
    return s.replace(/-/g, '+').replace(/_/g, '/').padEnd(s.length + (4 - s.length % 4) % 4, '=')
  }

  const [output, computeError] = useMemo<[string, string]>(() => {
    if (!input) return ['', '']
    if (mode === 'encode') {
      try {
        const bytes = new TextEncoder().encode(input)
        const binary = Array.from(bytes, b => String.fromCharCode(b)).join('')
        const encoded = btoa(binary)
        return [urlSafe ? toUrlSafe(encoded) : encoded, '']
      } catch {
        return ['', 'Encoding failed']
      }
    } else {
      try {
        const normalized = urlSafe ? fromUrlSafe(input) : input
        const binary = atob(normalized)
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
        return [new TextDecoder().decode(bytes), '']
      } catch {
        return ['', 'Invalid Base64 input']
      }
    }
  }, [input, mode, urlSafe])

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-forge-text mb-6">Base64 Encoder / Decoder</h1>

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
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={e => setUrlSafe(e.target.checked)}
            className="accent-forge-accent"
          />
          <span className="text-xs text-forge-muted">URL-safe variant</span>
        </label>

        <div>
          <label className="block text-xs text-forge-muted mb-1">
            {mode === 'encode' ? 'Plain text' : 'Base64 input'}
          </label>
          <textarea
            className={inputClass}
            rows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
          />
        </div>

        {computeError && <p className="text-xs text-red-400">{computeError}</p>}

        {output && (
          <div className="pt-2 border-t border-forge-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-forge-muted">
                {mode === 'encode' ? 'Encoded' : 'Decoded'}
              </p>
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
