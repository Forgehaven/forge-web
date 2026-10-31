export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-forge-muted">
      <span className="text-forge-accent/50">{label}</span> {value}
    </span>
  )
}

export function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-forge-muted mb-1">
        <span>{label}</span><span>{Math.round(pct * 100)}%</span>
      </div>
      <div className="w-full h-1 bg-forge-border rounded-full overflow-hidden">
        <div className="h-full bg-forge-accent transition-all duration-150" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}
