import { useTempUnit } from '../../hooks/useTempUnit'

export function Settings() {
  const [unit, setUnit] = useTempUnit()

  const active = 'px-3 py-1 text-xs bg-[#c4af64]/10 text-[#c4af64] border-r border-[#2a2d3a] last:border-r-0'
  const inactive = 'px-3 py-1 text-xs text-[#6b7280] hover:text-[#e2e4ed] hover:bg-[#2a2d3a] transition-colors border-r border-[#2a2d3a] last:border-r-0 cursor-pointer'

  return (
    <div className="divide-y divide-[#2a2d3a]">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm text-[#e2e4ed]">Temperature unit</p>
          <p className="text-xs text-[#6b7280] mt-0.5">Applies to all weather across the app</p>
        </div>
        <div className="flex rounded border border-[#2a2d3a] overflow-hidden">
          <button className={unit === 'C' ? active : inactive} onClick={() => setUnit('C')}>°C</button>
          <button className={unit === 'F' ? active : inactive} onClick={() => setUnit('F')}>°F</button>
        </div>
      </div>
    </div>
  )
}
