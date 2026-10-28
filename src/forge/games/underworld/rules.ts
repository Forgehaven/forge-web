import { RULES } from './data'

export const RACIAL_CP = 50
export const DEFAULT_MAX = 10
export const BASE_CP = 150
export const MAX_BLANKETS_PER_MONTH = 2
export const CULTURE_FRAG_COST = 100
export const SPHERE_SURCHARGE_FRAGS = 100
export const SLOTS_PER_CIRCLE = 5
// Once every circle has 5, circles can widen to 10 (Core p.106).
export const MAX_SLOTS_PER_CIRCLE = 10
// The only legal purchase order for the first 45 slots (Core p.106, Chart 8-1).
export const PYRAMID_ORDER = [
  1, 1, 2, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 4, 5, 2, 3, 4, 5, 6, 3, 4, 5, 6, 7, 4, 5, 6, 7, 8,
  5, 6, 7, 8, 9, 6, 7, 8, 9, 7, 8, 9, 8, 9, 9,
]
export const MAX_RITUAL_SLOTS = 10

export type BodyClass = 'warrior' | 'rogue' | 'scholar'

export interface LevelRow {
  level: number
  threshold: number
  cpPer: number
  warrior: number
  rogue: number
  scholar: number
}

export const TABLE: LevelRow[] = RULES.levelTable
export const OCC_CLASS = Object.fromEntries(
  Object.entries(RULES.occupations).map(([occ, o]) => [occ, o.class as BodyClass]),
)
export const OCC_ORDER = Object.keys(OCC_CLASS)
export const SCHOOLS_OF_MAGIC: string[] = RULES.schools
// Only these Favoured Vocations may pick the sphere.
export const EXCLUSIVE_SPHERES: Record<string, string[]> = RULES.exclusiveSpheres
// +SPHERE_SURCHARGE_FRAGS per purchased sphere of these schools.
export const SURCHARGE_SPHERES: string[] = RULES.surchargeSpheres
export const SPHERES: { name: string; costs: Record<string, number>; favouredCosts: Record<string, number> }[] = RULES.spheres
export const SPHERE_NAMES = SPHERES.map(s => s.name)
// 4th+ spheres cost the same as the 3rd (Soul Frag 2.10 Chart 4-3: "3rd or Higher").
export const sphereAt = (i: number) => SPHERES[Math.min(i, SPHERES.length - 1)]
export const sphereName = (i: number) => `Sphere of Magic: ${ordinal(i + 1)}`
export function sphereIndex(name: string) {
  const m = /^Sphere of Magic: (\d+)(st|nd|rd|th)$/.exec(name)
  return m ? Number(m[1]) - 1 : -1
}
// Keyed by circle, then occupation.
export const SPELL_CIRCLE_COSTS: Record<string, Record<string, number>> = RULES.spellCircleCosts
// Ritual slot N costs base * N.
export const RITUAL_BASE_COSTS: Record<string, number> = RULES.ritualBaseCosts
export const WEAPON_GROUPS: Record<string, string[]> = RULES.weaponGroups

export const ELEMENTS = ['Fire', 'Stone', 'Lightning', 'Ice']

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
