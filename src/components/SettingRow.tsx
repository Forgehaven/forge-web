const active = 'px-3 py-1 text-xs bg-forge-accent/10 text-forge-accent border-r border-forge-border last:border-r-0'
const inactive = 'px-3 py-1 text-xs text-forge-muted hover:text-forge-text hover:bg-forge-border transition-colors border-r border-forge-border last:border-r-0 cursor-pointer'

// A settings modal row: title, hint and a segmented choice.
export function SettingRow<T extends string>({ title, hint, value, options, onChange }: {
  title: string
  hint: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm text-forge-text">{title}</p>
        <p className="text-xs text-forge-muted mt-0.5">{hint}</p>
      </div>
      <div className="flex shrink-0 rounded border border-forge-border overflow-hidden">
        {options.map(([v, label]) => (
          <button key={v} className={value === v ? active : inactive} onClick={() => onChange(v)}>{label}</button>
        ))}
      </div>
    </div>
  )
}
