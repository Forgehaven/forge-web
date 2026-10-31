import { SettingRow } from '../../components/SettingRow'
import { ThemeSetting } from '../../components/ThemeSetting'
import { useSkillInput, type SkillInput } from './underworld/hooks/useSkillInput'

export function GamesSettings() {
  const [skillInput, setSkillInput] = useSkillInput()
  return (
    <div className="divide-y divide-forge-border">
      <ThemeSetting />
      <SettingRow<SkillInput>
        title="UW LARP skill purchases"
        hint="How the Character Planner buys repeatable skills"
        value={skillInput}
        options={[['number', 'Number'], ['buttons', '+ / −']]}
        onChange={setSkillInput}
      />
    </div>
  )
}
