import { useState, useMemo, type ReactNode } from 'react'

type Flag = 'g' | 'i' | 'm' | 's'

export function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<Set<Flag>>(new Set(['g']))
  const [testStr, setTestStr] = useState('')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"

  function toggleFlag(f: Flag) {
    setFlags(prev => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  const { matches, error, highlighted } = useMemo(() => {
    if (!pattern || !testStr) return { matches: [], error: '', highlighted: [] as ReactNode[] }
    const flagStr = [...flags].join('')
    let safeRegex: RegExp
    try {
      safeRegex = new RegExp(pattern, flagStr)
    } catch (e) {
      return { matches: [], error: (e as Error).message, highlighted: [] as ReactNode[] }
    }

    const allMatches: { start: number; end: number; text: string }[] = []
    if (flags.has('g')) {
      let m: RegExpExecArray | null
      safeRegex.lastIndex = 0
      while ((m = safeRegex.exec(testStr)) !== null) {
        allMatches.push({ start: m.index, end: m.index + m[0].length, text: m[0] })
        if (m[0].length === 0) safeRegex.lastIndex++
      }
    } else {
      const m = safeRegex.exec(testStr)
      if (m) allMatches.push({ start: m.index, end: m.index + m[0].length, text: m[0] })
    }

    const nodes: ReactNode[] = []
    let cursor = 0
    for (const match of allMatches) {
      if (match.start > cursor) nodes.push(<span key={cursor}>{testStr.slice(cursor, match.start)}</span>)
      nodes.push(
        <mark key={match.start} className="bg-[#c4af64]/30 text-[#c4af64] rounded px-0.5">
          {match.text}
        </mark>
      )
      cursor = match.end
    }
    if (cursor < testStr.length) nodes.push(<span key={cursor}>{testStr.slice(cursor)}</span>)

    return { matches: allMatches, error: '', highlighted: nodes }
  }, [pattern, flags, testStr])

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Regex Tester</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Pattern</label>
          <div className="flex items-center gap-2">
            <span className="text-[#6b7280] font-mono">/</span>
            <input
              className={inputClass}
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="[a-z]+"
            />
            <span className="text-[#6b7280] font-mono">/</span>
          </div>
        </div>

        <div className="flex gap-3">
          {(['g', 'i', 'm', 's'] as Flag[]).map(f => (
            <label key={f} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flags.has(f)}
                onChange={() => toggleFlag(f)}
                className="accent-[#c4af64]"
              />
              <span className="text-xs font-mono text-[#6b7280]">{f}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Test String</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            value={testStr}
            onChange={e => setTestStr(e.target.value)}
            placeholder="Paste text to test against..."
          />
        </div>

        {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

        {testStr && !error && (
          <div className="pt-2 border-t border-[#2a2d3a]">
            <p className="text-xs text-[#6b7280] mb-2">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </p>
            <div className="font-mono text-sm text-[#e2e4ed] whitespace-pre-wrap break-all bg-[#0f1117] rounded p-3 border border-[#2a2d3a]">
              {highlighted.length > 0 ? highlighted : testStr}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
