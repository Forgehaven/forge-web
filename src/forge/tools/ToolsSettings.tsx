import { useTempUnit } from '../../hooks/useTempUnit'
import { ThemeSetting } from '../../components/ThemeSetting'

export function ToolsSettings() {
  const [unit, setUnit] = useTempUnit()

  const active = 'px-3 py-1 text-xs bg-forge-accent/10 text-forge-accent border-r border-forge-border last:border-r-0'
  const inactive = 'px-3 py-1 text-xs text-forge-muted hover:text-forge-text hover:bg-forge-border transition-colors border-r border-forge-border last:border-r-0 cursor-pointer'

  return (
    <div className="divide-y divide-forge-border">
      <ThemeSetting />
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm text-forge-text">Temperature unit</p>
          <p className="text-xs text-forge-muted mt-0.5">Applies to all weather across the app</p>
        </div>
        <div className="flex rounded border border-forge-border overflow-hidden">
          <button className={unit === 'C' ? active : inactive} onClick={() => setUnit('C')}>°C</button>
          <button className={unit === 'F' ? active : inactive} onClick={() => setUnit('F')}>°F</button>
        </div>
      </div>
    </div>
  )
}
