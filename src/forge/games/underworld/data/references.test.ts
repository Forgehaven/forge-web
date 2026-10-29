import { describe, expect, it } from 'vitest'
import { CULTURES, FAVOURED_COSTS, FAVOURED_VOCATIONS, FRAG_RACES, OCC_ABILITIES, RACES, SKILLS, VOCATIONS, VOCATION_PREREQS } from '.'
import { SPHERES } from '../rules'
import { RITUAL_SLOT, SPELL_SLOT } from '../engine'

// Skills are referenced by id; a typo would silently never match.
describe('rules data references', () => {
  const vocations = [...Object.values(VOCATIONS), ...Object.values(FAVOURED_VOCATIONS)]
  const racial = [...Object.values(RACES), ...Object.values(FRAG_RACES), ...Object.values(CULTURES)].flatMap(r => r.purchased ?? [])
  const skills = [...SKILLS.flatMap(c => c.skills), ...racial]
  const abilities = [...Object.values(OCC_ABILITIES).flat(), ...vocations.flatMap(v => v.abilities)]
  const known = new Set([...[...skills, ...abilities, ...SPHERES].map(s => s.id), RITUAL_SLOT])

  it('gives every skill a unique id', () => {
    // A racial skill can appear on a race and its cultures; same skill, same id.
    const ids = [...SKILLS.flatMap(c => c.skills), ...abilities].map(s => s.id)
    expect(ids.every(Boolean)).toBe(true)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
    expect(ids).not.toContain(SPELL_SLOT)
    expect(ids).not.toContain(RITUAL_SLOT)
  })

  it('every reference names a real skill id', () => {
    const refs = [
      ...skills.flatMap(s => s.prereqs.flatMap(p => (p.id ? [p.id] : []))),
      ...Object.values(VOCATION_PREREQS).flatMap(p => [
        ...p.auto,
        ...p.choice.flatMap(c => c.anyOf.flat().flatMap(cond => (cond.skill ? [cond.skill] : []))),
      ]),
      ...Object.values(FAVOURED_COSTS).flatMap(t => Object.keys(t)),
    ].flatMap(r => r.split('|'))
    expect(refs.length).toBeGreaterThan(50)
    expect([...new Set(refs.filter(r => !known.has(r)))]).toEqual([])
  })
})
