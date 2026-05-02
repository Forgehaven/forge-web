import { useCopy } from '../../hooks/useCopy'
import { useState } from 'react'

const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ')

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

function sentence(wordCount: number): string {
  const words = Array.from({ length: wordCount }, randomWord)
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  return words.join(' ') + '.'
}

function generate(type: 'words' | 'sentences' | 'paragraphs', count: number): string {
  if (type === 'words') {
    const words = Array.from({ length: count }, randomWord)
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
    return words.join(' ') + '.'
  }
  if (type === 'sentences') {
    return Array.from({ length: count }, () => sentence(Math.floor(Math.random() * 10) + 5)).join(' ')
  }
  return Array.from({ length: count }, () => {
    const sentCount = Math.floor(Math.random() * 4) + 3
    return Array.from({ length: sentCount }, () => sentence(Math.floor(Math.random() * 10) + 5)).join(' ')
  }).join('\n\n')
}

type GenType = 'words' | 'sentences' | 'paragraphs'

export function LoremIpsum() {
  const { copy, copied } = useCopy()
  const [type, setType] = useState<GenType>('paragraphs')
  const [count, setCount] = useState(2)
  const [output, setOutput] = useState('')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] font-mono w-24"

  function handleGenerate() {
    setOutput(generate(type, Math.max(1, count)))
  }

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Lorem Ipsum Generator</h1>

      <div className="flex gap-2 mb-6">
        {(['words', 'sentences', 'paragraphs'] as GenType[]).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded text-sm transition-colors capitalize ${
              type === t
                ? 'bg-[#c4af64] text-white'
                : 'bg-[#1a1d27] text-[#9ca3af] hover:text-[#e2e4ed] border border-[#2a2d3a]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Count</label>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            />
          </div>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 rounded text-sm bg-[#c4af64] text-white hover:opacity-90 transition-opacity"
          >
            Generate
          </button>
        </div>

        {output && (
          <div className="pt-2 border-t border-[#2a2d3a]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#6b7280]">Output</p>
              <button
                onClick={() => copy(output)}
                className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-[#e2e4ed] whitespace-pre-wrap leading-relaxed">{output}</p>
          </div>
        )}
      </div>
    </div>
  )
}
