// Job weapon proficiency ratings sourced from horizonffxi.wiki
// Skill cap formula: see engine.ts getSkillCap()
import type { WeaponType } from './weaponSkills'

export type Job =
  | 'WAR' | 'MNK' | 'WHM' | 'BLM' | 'RDM' | 'THF'
  | 'PLD' | 'DRK' | 'BST' | 'BRD' | 'RNG' | 'SAM'
  | 'NIN' | 'DRG' | 'SMN'

// 11 distinct ranks — no plain "A" or plain "B" exist in the FFXI rank system
export type SkillRank = 'A+' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'E' | 'F'

// Level 75 skill caps per rank
export const SKILL_CAP_75: Record<SkillRank, number> = {
  'A+': 276, 'A-': 269, 'B+': 256, 'B': 250, 'B-': 240,
  'C+': 230, 'C':  225, 'C-': 220, 'D': 210, 'E':  200, 'F': 189,
}

export interface JobInfo {
  name: Job
  fullName: string
  isMage: boolean      // WHM, BLM, RDM, SMN — no WS panel in party card
  isRanged: boolean    // RNG — ranged WSes shown first
  weapons: Partial<Record<WeaponType, SkillRank>>
}

export const JOBS: JobInfo[] = [
  {
    name: 'WAR', fullName: 'Warrior', isMage: false, isRanged: false,
    weapons: {
      'Hand-to-Hand': 'D', 'Dagger': 'B-', 'Sword': 'B', 'Great Sword': 'B+',
      'Axe': 'A-', 'Great Axe': 'A+', 'Scythe': 'B+', 'Polearm': 'B-',
      'Club': 'B-', 'Staff': 'B',
    },
  },
  {
    name: 'MNK', fullName: 'Monk', isMage: false, isRanged: false,
    weapons: { 'Hand-to-Hand': 'A+', 'Club': 'C+', 'Staff': 'B' },
  },
  {
    name: 'WHM', fullName: 'White Mage', isMage: true, isRanged: false,
    weapons: { 'Club': 'B+', 'Staff': 'C+' },
  },
  {
    name: 'BLM', fullName: 'Black Mage', isMage: true, isRanged: false,
    weapons: { 'Staff': 'B-' },
  },
  {
    name: 'RDM', fullName: 'Red Mage', isMage: true, isRanged: false,
    weapons: { 'Sword': 'B', 'Dagger': 'B', 'Club': 'D' },
  },
  {
    name: 'THF', fullName: 'Thief', isMage: false, isRanged: false,
    weapons: {
      'Hand-to-Hand': 'E', 'Dagger': 'A-', 'Sword': 'D', 'Club': 'E',
    },
  },
  {
    name: 'PLD', fullName: 'Paladin', isMage: false, isRanged: false,
    weapons: {
      'Dagger': 'C-', 'Sword': 'A+', 'Great Sword': 'B',
      'Polearm': 'E', 'Club': 'A-', 'Staff': 'A-',
    },
  },
  {
    name: 'DRK', fullName: 'Dark Knight', isMage: false, isRanged: false,
    weapons: {
      'Dagger': 'C', 'Sword': 'B-', 'Great Sword': 'A-',
      'Axe': 'B-', 'Great Axe': 'B-', 'Scythe': 'A+', 'Club': 'C-',
    },
  },
  {
    name: 'BST', fullName: 'Beastmaster', isMage: false, isRanged: false,
    weapons: { 'Dagger': 'C+', 'Sword': 'E', 'Axe': 'A-', 'Scythe': 'B-', 'Club': 'D' },
  },
  {
    name: 'BRD', fullName: 'Bard', isMage: false, isRanged: false,
    weapons: { 'Dagger': 'B-', 'Sword': 'C-', 'Club': 'D', 'Staff': 'C+' },
  },
  {
    name: 'RNG', fullName: 'Ranger', isMage: false, isRanged: true,
    weapons: {
      'Dagger': 'B-', 'Sword': 'D', 'Axe': 'B-', 'Club': 'E',
      'Archery': 'A-', 'Marksmanship': 'A-',
    },
  },
  {
    name: 'SAM', fullName: 'Samurai', isMage: false, isRanged: false,
    weapons: {
      'Dagger': 'E', 'Sword': 'C+', 'Polearm': 'B-',
      'Great Katana': 'A+', 'Club': 'E',
    },
  },
  {
    name: 'NIN', fullName: 'Ninja', isMage: false, isRanged: false,
    weapons: {
      'Hand-to-Hand': 'E', 'Dagger': 'C+', 'Sword': 'C',
      'Katana': 'A-', 'Great Katana': 'C-', 'Club': 'E',
    },
  },
  {
    name: 'DRG', fullName: 'Dragoon', isMage: false, isRanged: false,
    weapons: {
      'Dagger': 'E', 'Sword': 'C-', 'Polearm': 'A+', 'Club': 'E', 'Staff': 'B-',
    },
  },
  {
    name: 'SMN', fullName: 'Summoner', isMage: true, isRanged: false,
    weapons: { 'Dagger': 'E', 'Club': 'C+', 'Staff': 'B' },
  },
]
