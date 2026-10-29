// Skills are referenced by `id`; `name` is display only.
export interface Prereq {
  // Skill ids, `|` separating alternatives. Absent on a level gate.
  id?: string
  level?: number
  minCount?: number
  // Needed once, not once per purchase, on prereqPerPurchase skills.
  primaryGate?: boolean
}

export type WeaponChoice = 'specific' | 'group' | 'exotic'

export interface Skill {
  id: string
  name: string
  // CP per occupation; null means the flat `cp`.
  costs: Record<string, number> | null
  cp?: number
  // Shown instead of a number when the cost depends on what it is bought for.
  costNote?: string
  frag: number
  maxPurchases: number
  bodyBonus: number
  strBonus: number
  occupational?: boolean
  prereqPerPurchase: boolean
  _weaponChoice?: WeaponChoice | null
  prereqs: Prereq[]
  desc: string
  raceReq?: string
  _fragOnly?: boolean
  _paragon?: boolean
  // Only the first purchase costs CP; later ones cost frags only.
  cpFirstOnly?: boolean
}

// A frag purchase applied to the player (Soul Frag "Out of Game Skills"); not bought with CP.
export interface OutOfGameSkill {
  id: string
  name: string
  // null when the cost varies; see costNote.
  frag: number | null
  costNote?: string
  desc: string
}

export interface SkillCategory {
  cat: string
  skills: Skill[]
}

export interface Trait {
  name: string
  kind: 'advantage' | 'disadvantage'
  desc: string
  bodyBonus?: number
  strBonus?: number
}

export type RacialSkill = Omit<Skill, 'costs' | 'frag' | 'prereqPerPurchase'> & Partial<Pick<Skill, 'costs' | 'frag' | 'prereqPerPurchase'>>

export interface Race {
  tier?: string
  cpBonus: number
  fragCost: number
  lore: string
  auto: Trait[]
  purchased: RacialSkill[]
  bodyBonusPerLevel?: number
  strBonusPerFiveLevels?: number
}

export interface Culture {
  races: string[]
  lore: string
  indoctrination: string
  racialCharacteristicAddition: string
  purchased: RacialSkill[]
}

export interface Ability {
  id: string
  name: string
  cp: number
  tier: number
  desc: string
  bodyBonus?: number
  maxPurchases?: number
}

export interface Vocation {
  fragCost: number
  cpCost?: number
  group?: 'Champion' | 'Demagogue'
  exclusiveSphere?: string
  occupations?: string[]
  prereqs: string
  lore: string
  abilities: Ability[]
}

// One condition: `count` purchases across the skills in "A|B", or a spell
// slot of `circle` (with a sphere of that school owned).
export interface PrereqCondition {
  // Skill ids.
  skill?: string
  count?: number
  circle?: number
  sphere?: string
}

export interface VocationPrereqs {
  // Each entry is required; "A|B" means either.
  auto: string[]
  // Each needs at least one alternative with all its conditions met.
  choice: { label: string; anyOf: PrereqCondition[][] }[]
}

export interface Spell {
  sphere: string
  level: number
  name: string
  incant: string
  desc: string
}
