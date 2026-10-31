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
    <div className="rounded-lg border border-forge-border bg-forge-surface p-4 flex flex-col gap-3">
      {description && <p className="text-xs text-forge-muted">{description}</p>}
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setError(false) }}
        placeholder="Paste export code here…"
        rows={3}
        className="w-full px-3 py-2 text-xs font-mono rounded border bg-forge-bg text-forge-dim border-forge-border focus:outline-none focus:border-[#4a5070] resize-none"
      />
      {error && <p className="text-xs text-red-400">Invalid code - could not import.</p>}
      <div className="flex gap-2">
        <button
          onClick={handleLoad}
          disabled={!text.trim()}
          className="text-xs px-3 py-1 rounded border border-forge-accent/40 text-forge-accent hover:bg-forge-accent/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Load
        </button>
        <button
          onClick={onClose}
          className="text-xs px-3 py-1 rounded border border-forge-border text-forge-muted hover:text-forge-text cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
