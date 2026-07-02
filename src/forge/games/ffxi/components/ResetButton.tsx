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
        <button onClick={onCancel} className="text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer transition-colors">No</button>
      </span>
    )
  }
  return (
    <button
      onClick={() => onRequest(target)}
      className="text-xs text-[#374151] hover:text-[#6b7280] transition-colors cursor-pointer"
    >
      {label}
    </button>
  )
}
