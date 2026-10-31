import { useState } from 'react'

type Props = {
  label: string
  onConfirm: () => void
  confirmPrompt?: string
  confirmLabel?: string
  cancelLabel?: string
  className?: string
  ariaLabel?: string
}

export function ConfirmButton({
  label, onConfirm,
  confirmPrompt = 'Sure?',
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  className, ariaLabel,
}: Props) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 text-xs shrink-0">
        <span className="text-forge-muted">{confirmPrompt}</span>
        <button
          onClick={() => { onConfirm(); setConfirming(false) }}
          className="text-red-400 hover:text-red-300 cursor-pointer transition-colors"
        >{confirmLabel}</button>
        <button
          onClick={() => setConfirming(false)}
          className="text-forge-faint hover:text-forge-text cursor-pointer transition-colors"
        >{cancelLabel}</button>
      </span>
    )
  }

  return (
    <button
      aria-label={ariaLabel}
      onClick={() => setConfirming(true)}
      className={className ?? 'text-xs text-forge-faint hover:text-forge-dim transition-colors cursor-pointer'}
    >
      {label}
    </button>
  )
}
