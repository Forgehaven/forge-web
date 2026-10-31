// Rules data lives in the JSON files beside this one; `meta` on each records
// where it came from. Edit the JSON, not this file.
import type { Ability, Culture, OutOfGameSkill, Production, Race, SkillCategory, Spell, Vocation, VocationPrereqs } from '../types'
import racesJson from './races.json'
import skillsJson from './skills.json'
import vocationsJson from './vocations.json'
import spellsJson from './spells.json'
import rulesJson from './rules.json'
import equipmentJson from './equipment.json'
import productionJson from './production.json'

export interface DataMeta {
  source: string
  rulebook: string | null
  updated: string
}

export const RULES = rulesJson
export const RACES = racesJson.races as unknown as Record<string, Race>
export const FRAG_RACES = racesJson.fragRaces as unknown as Record<string, Race>
export const CULTURES = racesJson.cultures as unknown as Record<string, Culture>
export const SKILLS = skillsJson.categories as unknown as SkillCategory[]
export const OUT_OF_GAME = skillsJson.outOfGame as { source: string; note: string; skills: OutOfGameSkill[] }
export const FAVOURED_COSTS = skillsJson.favouredCosts as Record<'Champion' | 'Demagogue', Record<string, number>>
export const OCC_ABILITIES = vocationsJson.occupationAbilities as Record<string, Ability[]>
export const VOCATIONS = vocationsJson.vocations as unknown as Record<string, Vocation>
export const FAVOURED_VOCATIONS = vocationsJson.favouredVocations as unknown as Record<string, Vocation>
export const VOCATION_PREREQS = vocationsJson.vocationPrereqs as unknown as Record<string, VocationPrereqs>
export const SPELLS = spellsJson.spells as Spell[]
export const EQUIPMENT = equipmentJson
export const PRODUCTION = productionJson.skills as Record<string, Production>

export const DATA_SOURCES: Record<string, DataMeta> = {
  rules: rulesJson.meta, races: racesJson.meta, skills: skillsJson.meta,
  vocations: vocationsJson.meta, spells: spellsJson.meta, equipment: equipmentJson.meta,
  production: productionJson.meta,
}

export { default as SOURCES } from './sources.json'
