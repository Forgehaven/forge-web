import { useState } from 'react'
import { getTheme, setTheme, type Theme } from '../lib/theme'

const active = 'px-3 py-1 text-xs bg-forge-accent/10 text-forge-accent border-r border-forge-border last:border-r-0'
const inactive = 'px-3 py-1 text-xs text-forge-muted hover:text-forge-text hover:bg-forge-border transition-colors border-r border-forge-border last:border-r-0 cursor-pointer'

export function ThemeSetting() {
  const [theme, setState] = useState(getTheme)
  const pick = (t: Theme) => { setTheme(t); setState(t) }
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm text-forge-text">Theme</p>
        <p className="text-xs text-forge-muted mt-0.5">Saved in this browser</p>
      </div>
      <div className="flex rounded border border-forge-border overflow-hidden">
        <button className={theme === 'dark' ? active : inactive} onClick={() => pick('dark')}>Dark</button>
        <button className={theme === 'light' ? active : inactive} onClick={() => pick('light')}>Light</button>
      </div>
    </div>
  )
}
