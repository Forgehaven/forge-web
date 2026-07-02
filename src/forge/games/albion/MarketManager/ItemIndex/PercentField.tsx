// Small labelled percent input for the return-rate / tax controls.
export function PercentField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[#6b7280] uppercase tracking-widest">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={0}
        max={100}
        step={0.5}
        onChange={e => onChange(Number(e.target.value))}
        className="w-20 bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-[5px] text-sm text-[#e2e4ed] focus:outline-none focus:border-[#c4af64]"
      />
    </label>
  )
}
