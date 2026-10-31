import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../../../../config/storageKeys'

// How repeatable skills are bought in the planner: a count box or +/- buttons.
export type SkillInput = 'number' | 'buttons'

const EVENT = 'forgegames_uw_skillinput_change'
const read = (): SkillInput => (localStorage.getItem(STORAGE_KEYS.uwSkillInput) === 'buttons' ? 'buttons' : 'number')

export function useSkillInput(): [SkillInput, (v: SkillInput) => void] {
  const [value, setValue] = useState(read)
  useEffect(() => {
    const sync = () => setValue(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const set = (v: SkillInput) => {
    localStorage.setItem(STORAGE_KEYS.uwSkillInput, v)
    window.dispatchEvent(new Event(EVENT))
  }
  return [value, set]
}
