import { describe, expect, it } from 'vitest'
import { sanitize } from './useBuildStore'
import { evaluate, simpleView } from '../engine'

describe('sanitize', () => {
  it('turns a malformed blob into a build the engine can evaluate', () => {
    const bad = { v: 1, name: 5, schools: 'Elemental', blankets: [1, '2026-02', 'x'], purchases: [{ id: 'a' }, null, { id: 'b', skill: 'Shield', at: 0 }], spells: [], simple: { blankets: -3, purchases: 'nope' } }
    const b = sanitize(bad)
    expect(b).toMatchObject({ name: '', schools: ['', '', ''], blankets: ['2026-02'], purchases: [{ id: 'b', skill: 'Shield', at: 0 }], spells: {}, simple: { blankets: 0, purchases: [] } })
    expect(() => evaluate(simpleView(b), undefined, true)).not.toThrow()
    expect(sanitize(null).v).toBe(1)
  })
})
