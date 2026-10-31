import { describe, expect, it } from 'vitest'
import { sanitize } from './useBuildStore'
import { evaluate, simpleView } from '../engine'

describe('sanitize', () => {
  // 'Shield' also shows a pre-id save's skill name mapping to its id.
  it('turns a malformed blob into a build the engine can evaluate', () => {
    const bad = { v: 1, name: 5, schools: 'Elemental', blankets: [1, '2026-02', 'x'], purchases: [{ id: 'a' }, null, { id: 'b', skill: 'Shield', at: 0 }], spells: [], simple: { blankets: -3, purchases: 'nope' } }
    const b = sanitize(bad)
    expect(b).toMatchObject({ name: '', schools: ['', '', ''], blankets: ['2026-02'], purchases: [{ id: 'b', skill: 'shield', at: 0 }], spells: {}, simple: { blankets: 0, purchases: [] } })
    expect(() => evaluate(simpleView(b), undefined, true)).not.toThrow()
    expect(sanitize(null).v).toBe(1)
  })

  it('keeps plan mode and priority settings, migrating useTimeline', () => {
    const b = sanitize({ mode: 'priority', priority: { perMonth: 1, months: { '2026-03': 0, x: 1, '2026-04': 9 }, purchases: [{ id: 'a', skill: 'Shield', at: 0 }] } })
    expect(b).toMatchObject({ mode: 'priority', priority: { perMonth: 1, months: { '2026-03': 0 }, purchases: [{ id: 'a' }] } })
    expect(sanitize({ useTimeline: true }).mode).toBe('timeline')
  })

  it('turns an old Favoured vocation into a Favoured purchase', () => {
    const b = sanitize({ occupation: 'Mage', vocation: 'Paladin', simple: { blankets: 2, purchases: [{ id: 'a', skill: 'shield', at: 0 }] } })
    expect(b.vocation).toBe('')
    expect(b.simple!.purchases.map(p => [p.skill, p.choice])).toEqual([['favoured', 'Paladin'], ['shield', undefined]])
    expect(evaluate(simpleView(b), undefined, true).renowned).toBe('Paladin')
  })
})
