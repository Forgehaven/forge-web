// Month + year dropdowns for a 'YYYY-MM' value. Native <input type="month"> is
// a bare text box in Firefox, so this is used everywhere instead.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FIRST_YEAR = 2000

export function MonthSelect({ value, onChange, label, compact = false }: {
  value: string
  onChange: (month: string) => void
  label: string
  compact?: boolean
}) {
  const [y, m] = value.split('-').map(Number)
  const lastYear = Math.max(new Date().getFullYear() + 15, y)
  const years = Array.from({ length: lastYear - FIRST_YEAR + 1 }, (_, i) => lastYear - i)
  const cls = compact
    ? 'bg-[#0f1117] text-xs text-[#c4c7d0] border border-[#2a2d3a] rounded px-1 py-0.5 focus:outline-none focus:border-[#c4af64] cursor-pointer'
    : 'forge-input !w-auto !py-1.5 cursor-pointer'
  const set = (year: number, month: number) => onChange(`${year}-${String(month).padStart(2, '0')}`)

  return (
    <span className="inline-flex gap-1" onClick={e => e.stopPropagation()}>
      <select aria-label={`${label} month`} className={cls} value={m} onChange={e => set(y, Number(e.target.value))}>
        {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select aria-label={`${label} year`} className={cls} value={y} onChange={e => set(Number(e.target.value), m)}>
        {years.map(year => <option key={year} value={year}>{year}</option>)}
      </select>
    </span>
  )
}
