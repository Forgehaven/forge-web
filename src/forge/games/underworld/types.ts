export interface Prereq {
  // `|` separates alternatives; 'Level N' is a level gate.
  name: string
  minCount?: number
  // Needed once, not once per purchase, on prereqPerPurchase skills.
  primaryGate?: boolean
}

export type WeaponChoice = 'specific' | 'group' | 'exotic'

export interface Skill {
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

export interface VocationPrereqs {
  auto: string[]
  choice: {
    label: string
    groups: {
      label: string
      skills: string[]
      flexible?: { total: number; pool: string[] }
      spellLevel?: number | null
      buySphereTo?: number
    }[]
  }[]
}

export interface Spell {
  sphere: string
  level: number
  name: string
  incant: string
  desc: string
}
