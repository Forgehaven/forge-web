import { useCopy } from '../../../hooks/useCopy'
import { useState, useMemo } from 'react'

type Mode = 'encode' | 'decode'

export function Base64() {
  const { copy, copied } = useCopy()
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [urlSafe, setUrlSafe] = useState(false)

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"

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
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Base64 Encoder / Decoder</h1>

      <div className="flex gap-2 mb-6">
        {(['encode', 'decode'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setInput('') }}
            className={`px-3 py-1.5 rounded text-sm transition-colors capitalize ${
              mode === m
                ? 'bg-[#c4af64] text-white'
                : 'bg-[#1a1d27] text-[#9ca3af] hover:text-[#e2e4ed] border border-[#2a2d3a]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={e => setUrlSafe(e.target.checked)}
            className="accent-[#c4af64]"
          />
          <span className="text-xs text-[#6b7280]">URL-safe variant</span>
        </label>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">
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
          <div className="pt-2 border-t border-[#2a2d3a]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6b7280]">
                {mode === 'encode' ? 'Encoded' : 'Decoded'}
              </p>
              <button
                onClick={() => copy(output)}
                className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-sm text-[#c4af64] break-all">{output}</p>
          </div>
        )}
      </div>
    </div>
  )
}
