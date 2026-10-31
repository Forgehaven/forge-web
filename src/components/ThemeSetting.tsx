import { useState } from 'react'
import { getTheme, setTheme, type Theme } from '../lib/theme'
import { SettingRow } from './SettingRow'

export function ThemeSetting() {
  const [theme, setState] = useState(getTheme)
  return (
    <SettingRow<Theme>
      title="Theme"
      hint="Saved in this browser"
      value={theme}
      options={[['dark', 'Dark'], ['light', 'Light']]}
      onChange={t => { setTheme(t); setState(t) }}
    />
  )
}
