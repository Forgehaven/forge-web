export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-[#6b7280]">
      <span className="text-[#c4af64]/50">{label}</span> {value}
    </span>
  )
}

export function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#6b7280] mb-1">
        <span>{label}</span><span>{Math.round(pct * 100)}%</span>
      </div>
      <div className="w-full h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
        <div className="h-full bg-[#c4af64] transition-all duration-150" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}
