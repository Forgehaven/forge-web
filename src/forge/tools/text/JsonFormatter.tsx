import { useCopy } from '../../../hooks/useCopy'
import { useState, useMemo } from 'react'

type Mode = 'pretty' | 'minify'

export function JsonFormatter() {
  const { copy, copied } = useCopy()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('pretty')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"

  const { output, error } = useMemo<{ output: string; error: string }>(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const parsed = JSON.parse(input)
      return {
        output: mode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed),
        error: '',
      }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, mode])

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">JSON Formatter</h1>

      <div className="flex gap-2 mb-6">
        {(['pretty', 'minify'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
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
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">JSON Input</label>
          <textarea
            className={inputClass}
            rows={8}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='{"key": "value"}'
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        )}

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
            <pre className="font-mono text-sm text-[#c4af64] whitespace-pre-wrap break-all">{output}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
