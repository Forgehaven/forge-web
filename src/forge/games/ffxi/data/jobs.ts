// Job weapon proficiency ratings sourced from horizonffxi.wiki
// Skill cap formula: see engine.ts getSkillCap()
import type { WeaponType } from './weaponSkills'

export type Job =
  | 'WAR' | 'MNK' | 'WHM' | 'BLM' | 'RDM' | 'THF'
  | 'PLD' | 'DRK' | 'BST' | 'BRD' | 'RNG' | 'SAM'
  | 'NIN' | 'DRG' | 'SMN'

// 11 distinct ranks - no plain "A" or plain "B" exist in the FFXI rank system
export type SkillRank = 'A+' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'E' | 'F'

// Level 75 skill caps per rank
export const SKILL_CAP_75: Record<SkillRank, number> = {
  'A+': 276, 'A-': 269, 'B+': 256, 'B': 250, 'B-': 240,
  'C+': 230, 'C':  225, 'C-': 220, 'D': 210, 'E':  200, 'F': 189,
}

export type JobRole = 'melee' | 'mage' | 'ranged'

export interface JobInfo {
  name: Job
  fullName: string
  roles: JobRole[]
  weapons: Partial<Record<WeaponType, SkillRank>>
}

export const JOBS: JobInfo[] = [
  {
    name: 'WAR', fullName: 'Warrior', roles: ['melee'],
    weapons: {
      'Hand-to-Hand': 'D', 'Dagger': 'B-', 'Sword': 'B', 'Great Sword': 'B+',
      'Axe': 'A-', 'Great Axe': 'A+', 'Scythe': 'B+', 'Polearm': 'B',
      'Club': 'B-', 'Staff': 'B',
    },
  },
  {
    name: 'MNK', fullName: 'Monk', roles: ['melee'],
    weapons: { 'Hand-to-Hand': 'A+', 'Club': 'C+', 'Staff': 'B' },
  },
  {
    name: 'WHM', fullName: 'White Mage', roles: ['mage'],
    weapons: { 'Club': 'B+', 'Staff': 'C+' },
  },
  {
    name: 'BLM', fullName: 'Black Mage', roles: ['mage'],
    weapons: { 'Staff': 'B-' },
  },
  {
    name: 'RDM', fullName: 'Red Mage', roles: ['melee', 'mage'],
    weapons: { 'Sword': 'B', 'Dagger': 'B', 'Club': 'D' },
  },
  {
    name: 'THF', fullName: 'Thief', roles: ['melee'],
    weapons: {
      'Hand-to-Hand': 'E', 'Dagger': 'A-', 'Sword': 'D', 'Club': 'D',
      'Archery': 'C+', 'Marksmanship': 'C-',
    },
  },
  {
    name: 'PLD', fullName: 'Paladin', roles: ['melee'],
    weapons: {
      'Dagger': 'C-', 'Sword': 'A+', 'Great Sword': 'B',
      'Polearm': 'E', 'Club': 'A-', 'Staff': 'A-',
    },
  },
  {
    name: 'DRK', fullName: 'Dark Knight', roles: ['melee'],
    weapons: {
      'Dagger': 'C', 'Sword': 'B-', 'Great Sword': 'A-',
      'Axe': 'B-', 'Great Axe': 'B-', 'Scythe': 'A+', 'Club': 'C-',
    },
  },
  {
    name: 'BST', fullName: 'Beastmaster', roles: ['melee'],
    weapons: { 'Dagger': 'C+', 'Sword': 'E', 'Axe': 'A-', 'Scythe': 'B-', 'Club': 'D' },
  },
  {
    name: 'BRD', fullName: 'Bard', roles: ['melee'],
    weapons: { 'Dagger': 'B-', 'Sword': 'C-', 'Club': 'D', 'Staff': 'C+' },
  },
  {
    name: 'RNG', fullName: 'Ranger', roles: ['melee', 'ranged'],
    weapons: {
      'Dagger': 'B-', 'Sword': 'D', 'Axe': 'B-', 'Club': 'E',
      'Archery': 'A-', 'Marksmanship': 'A-',
    },
  },
  {
    name: 'SAM', fullName: 'Samurai', roles: ['melee'],
    weapons: {
      'Dagger': 'E', 'Sword': 'C+', 'Polearm': 'B-',
      'Great Katana': 'A+', 'Club': 'E', 'Archery': 'C+',
    },
  },
  {
    name: 'NIN', fullName: 'Ninja', roles: ['melee'],
    weapons: {
      'Hand-to-Hand': 'E', 'Dagger': 'C+', 'Sword': 'C',
      'Katana': 'A-', 'Great Katana': 'C-', 'Club': 'E',
      'Archery': 'E', 'Marksmanship': 'C',
    },
  },
  {
    name: 'DRG', fullName: 'Dragoon', roles: ['melee'],
    weapons: {
      'Dagger': 'E', 'Sword': 'C-', 'Polearm': 'A+', 'Club': 'E', 'Staff': 'B-',
    },
  },
  {
    name: 'SMN', fullName: 'Summoner', roles: ['mage'],
    weapons: { 'Dagger': 'E', 'Club': 'C+', 'Staff': 'B' },
  },
]
