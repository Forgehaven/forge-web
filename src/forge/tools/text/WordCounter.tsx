import { useMemo } from 'react'
import { useState } from 'react'

function analyze(text: string) {
  if (!text.trim()) return null
  const words = text.trim().split(/\s+/).filter(Boolean)
  const sentences = (text.match(/[.!?]+/g) ?? []).length
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length || 1
  const uniqueWords = new Set(text.toLowerCase().match(/\b[a-z']+\b/g) ?? []).size
  const readingMins = words.length / 200
  const readingSecs = Math.round(readingMins * 60)

  return {
    chars: text.length,
    charsNoSpaces: text.replace(/\s/g, '').length,
    words: words.length,
    uniqueWords,
    sentences,
    paragraphs,
    readingSecs,
  }
}

function readingTimeLabel(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function WordCounter() {
  const [text, setText] = useState('')
  const stats = useMemo(() => analyze(text), [text])

  const statItems = stats
    ? [
        { label: 'Words',              value: stats.words.toLocaleString() },
        { label: 'Unique words',       value: stats.uniqueWords.toLocaleString() },
        { label: 'Characters',         value: stats.chars.toLocaleString() },
        { label: 'Chars (no spaces)',  value: stats.charsNoSpaces.toLocaleString() },
        { label: 'Sentences',          value: stats.sentences.toLocaleString() },
        { label: 'Paragraphs',         value: stats.paragraphs.toLocaleString() },
        { label: 'Reading time',       value: readingTimeLabel(stats.readingSecs) },
      ]
    : []

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Word Counter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Text</label>
          <textarea
            autoFocus
            className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full resize-none"
            rows={10}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type your text here…"
          />
        </div>

        {!text.trim() && (
          <p className="text-xs text-[#6b7280]">Start typing or paste text to see statistics.</p>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#2a2d3a]">
            {statItems.map(item => (
              <div key={item.label} className="bg-[#0f1117] border border-[#2a2d3a] rounded p-3">
                <p className="text-xs text-[#6b7280] mb-1">{item.label}</p>
                <p className="font-mono text-lg text-[#c4af64]">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
