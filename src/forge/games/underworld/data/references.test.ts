import { describe, expect, it } from 'vitest'
import { FAVOURED_VOCATIONS, FRAG_RACES, OCC_ABILITIES, RACES, SKILLS, VOCATIONS, VOCATION_PREREQS } from '.'
import { SPHERE_NAMES } from '../rules'
import { RITUAL_SLOT } from '../engine'

// Skills are referenced by name, so a typo would silently never match.
describe('rules data references', () => {
  const races = [...Object.values(RACES), ...Object.values(FRAG_RACES)]
  const vocations = [...Object.values(VOCATIONS), ...Object.values(FAVOURED_VOCATIONS)]
  const skills = [
    ...SKILLS.flatMap(c => c.skills),
    ...races.flatMap(r => r.purchased),
    ...Object.values(OCC_ABILITIES).flat(),
    ...vocations.flatMap(v => v.abilities),
  ]
  // Spheres and the ritual slot are built by the engine, not listed as skills.
  const known = new Set([...skills.map(s => s.name), ...SPHERE_NAMES, RITUAL_SLOT])

  it('every prerequisite names a real skill', () => {
    const refs = [
      ...skills.flatMap(s => ('prereqs' in s && Array.isArray(s.prereqs) ? (s.prereqs as { name: string }[]) : []).map(p => p.name)),
      ...Object.values(VOCATION_PREREQS).flatMap(p => [
        ...p.auto,
        ...p.choice.flatMap(c => c.anyOf.flat().flatMap(cond => (cond.skill ? [cond.skill] : []))),
      ]),
    ].flatMap(r => r.split('|'))
    expect(refs.length).toBeGreaterThan(50)
    expect([...new Set(refs.filter(r => !known.has(r)))]).toEqual([])
  })
})
