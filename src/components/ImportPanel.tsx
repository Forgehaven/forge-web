import { useState } from 'react'

type Props = {
  description?: string
  onImport: (code: string) => boolean
  onClose: () => void
}

export function ImportPanel({ description, onImport, onClose }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState(false)

  function handleLoad() {
    if (onImport(text.trim())) {
      onClose()
    } else {
      setError(true)
    }
  }

  return (
    <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-4 flex flex-col gap-3">
      {description && <p className="text-xs text-[#6b7280]">{description}</p>}
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setError(false) }}
        placeholder="Paste export code here…"
        rows={3}
        className="w-full px-3 py-2 text-xs font-mono rounded border bg-[#0f1117] text-[#9ca3af] border-[#2a2d3a] focus:outline-none focus:border-[#4a5070] resize-none"
      />
      {error && <p className="text-xs text-red-400">Invalid code - could not import.</p>}
      <div className="flex gap-2">
        <button
          onClick={handleLoad}
          disabled={!text.trim()}
          className="text-xs px-3 py-1 rounded border border-[#c4af64]/40 text-[#c4af64] hover:bg-[#c4af64]/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Load
        </button>
        <button
          onClick={onClose}
          className="text-xs px-3 py-1 rounded border border-[#2a2d3a] text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
