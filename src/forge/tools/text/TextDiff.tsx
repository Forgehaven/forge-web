import { useState, useMemo } from 'react'

// ── JSON diff ──────────────────────────────────────────────────────────────

type DiffEntry = { key: string; type: 'added' | 'removed' | 'changed' | 'same'; left?: unknown; right?: unknown }

function flattenObject(obj: unknown, prefix = ''): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) return { [prefix || '.']: obj }
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v, path))
    } else {
      result[path] = v
    }
  }
  return result
}

function diffJson(leftStr: string, rightStr: string) {
  let left: unknown, right: unknown
  let leftError = '', rightError = ''
  try { left = JSON.parse(leftStr) } catch (e) { leftError = (e as Error).message }
  try { right = JSON.parse(rightStr) } catch (e) { rightError = (e as Error).message }
  if (leftError || rightError) return { entries: [], leftError, rightError }

  const flatLeft = flattenObject(left)
  const flatRight = flattenObject(right)
  const allKeys = new Set([...Object.keys(flatLeft), ...Object.keys(flatRight)])
  const entries: DiffEntry[] = []
  for (const key of allKeys) {
    const inLeft = key in flatLeft, inRight = key in flatRight
    if (!inLeft) entries.push({ key, type: 'added', right: flatRight[key] })
    else if (!inRight) entries.push({ key, type: 'removed', left: flatLeft[key] })
    else if (JSON.stringify(flatLeft[key]) !== JSON.stringify(flatRight[key]))
      entries.push({ key, type: 'changed', left: flatLeft[key], right: flatRight[key] })
    else entries.push({ key, type: 'same', left: flatLeft[key], right: flatRight[key] })
  }
  return { entries, leftError: '', rightError: '' }
}

// ── Line diff (LCS) ────────────────────────────────────────────────────────

type LineDiff = { type: 'same' | 'added' | 'removed'; value: string }

function lineDiff(a: string[], b: string[]): LineDiff[] {
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1])

  const result: LineDiff[] = []
  let i = n, j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      result.unshift({ type: 'same', value: a[i-1] }); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.unshift({ type: 'added', value: b[j-1] }); j--
    } else {
      result.unshift({ type: 'removed', value: a[i-1] }); i--
    }
  }
  return result
}

// ── Component ──────────────────────────────────────────────────────────────

type Mode = 'json' | 'text'

const MODES: { value: Mode; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Plain Text' },
]

export function TextDiff() {
  const [mode, setMode] = useState<Mode>('json')
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const textareaClass = "flex-1 min-h-0 bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"

  const result = useMemo(() => {
    if (!left.trim() && !right.trim()) return null
    if (mode === 'json') return { mode: 'json' as const, ...diffJson(left, right) }
    const lines = lineDiff(left.split('\n'), right.split('\n'))
    return { mode: 'text' as const, lines }
  }, [left, right, mode])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-xl font-semibold text-[#e2e4ed]">Text Diff</h1>
        <div className="flex bg-[#1a1d27] border border-[#2a2d3a] rounded overflow-hidden">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                mode === m.value
                  ? 'bg-[#c4af64]/10 text-[#c4af64]'
                  : 'text-[#6b7280] hover:text-[#e2e4ed]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:h-[60vh] shrink-0">
        <div className="min-w-0 min-h-0 flex flex-col gap-1 h-[35vh] md:flex-1 md:h-auto">
          <label className="block text-xs text-[#6b7280] shrink-0">Left</label>
          <textarea className={textareaClass} value={left} onChange={e => setLeft(e.target.value)}
            placeholder={mode === 'json' ? '{"name": "Alice"}' : 'Line one\nLine two'} />
          {result?.mode === 'json' && result.leftError && (
            <p className="text-xs text-red-400 shrink-0">{result.leftError}</p>
          )}
        </div>
        <div className="min-w-0 min-h-0 flex flex-col gap-1 h-[35vh] md:flex-1 md:h-auto">
          <label className="block text-xs text-[#6b7280] shrink-0">Right</label>
          <textarea className={textareaClass} value={right} onChange={e => setRight(e.target.value)}
            placeholder={mode === 'json' ? '{"name": "Bob"}' : 'Line one\nLine three'} />
          {result?.mode === 'json' && result.rightError && (
            <p className="text-xs text-red-400 shrink-0">{result.rightError}</p>
          )}
        </div>
      </div>

      {result && (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 mt-4 shrink-0">
          {result.mode === 'json' && result.entries.length > 0 && (() => {
            const changed = result.entries.filter(e => e.type !== 'same')
            const colors: Record<string, string> = {
              added: 'bg-green-500/10 border-green-500/20 text-green-400',
              removed: 'bg-red-500/10 border-red-500/20 text-red-400',
              changed: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
              same: 'bg-transparent border-transparent text-[#6b7280]',
            }
            const prefix: Record<string, string> = { added: '+', removed: '-', changed: '~', same: ' ' }
            return <>
              <p className="text-xs text-[#6b7280] mb-3">{changed.length} difference{changed.length !== 1 ? 's' : ''}</p>
              <div className="flex flex-col gap-1">
                {result.entries.map(entry => (
                  <div key={entry.key} className={`font-mono text-xs px-2 py-0.5 rounded border ${colors[entry.type]}`}>
                    <span className="mr-2">{prefix[entry.type]}</span>
                    <span>{entry.key}</span>
                    {entry.type === 'changed' && (
                      <span className="ml-2">
                        <span className="line-through opacity-60">{JSON.stringify(entry.left)}</span>
                        <span className="mx-1">→</span>
                        <span>{JSON.stringify(entry.right)}</span>
                      </span>
                    )}
                    {entry.type !== 'changed' && entry.type !== 'same' && (
                      <span className="ml-2">{JSON.stringify(entry.right ?? entry.left)}</span>
                    )}
                    {entry.type === 'same' && <span className="ml-2">{JSON.stringify(entry.left)}</span>}
                  </div>
                ))}
              </div>
            </>
          })()}

          {result.mode === 'text' && (() => {
            const changed = result.lines.filter(l => l.type !== 'same').length
            return <>
              <p className="text-xs text-[#6b7280] mb-3">{changed} changed line{changed !== 1 ? 's' : ''}</p>
              <div className="flex flex-col font-mono text-xs">
                {result.lines.map((line, i) => {
                  const cls = line.type === 'added'
                    ? 'bg-green-500/10 text-green-400'
                    : line.type === 'removed'
                    ? 'bg-red-500/10 text-red-400'
                    : 'text-[#6b7280]'
                  const sym = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '
                  return (
                    <div key={i} className={`px-2 py-0.5 ${cls}`}>
                      <span className="mr-2 select-none">{sym}</span>
                      <span>{line.value || ' '}</span>
                    </div>
                  )
                })}
              </div>
            </>
          })()}
        </div>
      )}
    </div>
  )
}
