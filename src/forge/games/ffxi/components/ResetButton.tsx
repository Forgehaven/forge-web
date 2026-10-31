// Two-step reset link (click -> inline Yes/No). Generic over the reset-target
// union so each tool keeps its own target names.
export function ResetButton<T extends string>({
  label, target, confirm, onRequest, onConfirm, onCancel,
}: {
  label: string
  target: T
  confirm: T | null
  onRequest: (t: T) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  if (confirm === target) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <button onClick={onConfirm} className="text-red-400 hover:text-red-300 cursor-pointer transition-colors">Yes</button>
        <button onClick={onCancel} className="text-forge-muted hover:text-forge-text cursor-pointer transition-colors">No</button>
      </span>
    )
  }
  return (
    <button
      onClick={() => onRequest(target)}
      className="text-xs text-forge-edge hover:text-forge-muted transition-colors cursor-pointer"
    >
      {label}
    </button>
  )
}
