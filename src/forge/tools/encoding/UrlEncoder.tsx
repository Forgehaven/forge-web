import { useCopy } from '../../../hooks/useCopy'
import { useState, useMemo } from 'react'

type Mode = 'encode' | 'decode'
type EncType = 'encodeURIComponent' | 'encodeURI'

export function UrlEncoder() {
  const { copy, copied } = useCopy()
  const [mode, setMode] = useState<Mode>('encode')
  const [encType, setEncType] = useState<EncType>('encodeURIComponent')
  const [input, setInput] = useState('')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"

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
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">URL Encoder / Decoder</h1>

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
        <div className="flex gap-3">
          {(['encodeURIComponent', 'encodeURI'] as EncType[]).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="encType"
                checked={encType === t}
                onChange={() => setEncType(t)}
                className="accent-[#c4af64]"
              />
              <span className="text-xs text-[#6b7280] font-mono">{t}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Input</label>
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
          <div className="pt-2 border-t border-[#2a2d3a]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6b7280]">Output</p>
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
