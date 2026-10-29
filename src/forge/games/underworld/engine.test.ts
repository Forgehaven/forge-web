import { describe, expect, it } from 'vitest'
import { OCC_ORDER, PYRAMID_ORDER, RITUAL_BASE_COSTS, SPELL_CIRCLE_COSTS, SPHERES } from './rules'
import { SKILLS } from './data'
import {
  copyPicks, cpAt, emptyBuild, evaluate, insertBlanket, levelRow, nextBlanketMonth, pastBlankets, priorityView, simpleView, switchRole, unbuy,
  type Build, type Purchase,
} from './engine'

let n = 0
const buy = (skill: string, at = 0, choice?: string): Purchase => ({ id: String(n++), skill, at, choice })

function build(over: Partial<Build>): Build {
  return { ...emptyBuild('2026-01'), race: 'Human', occupation: 'Mercenary', ...over }
}

describe('cp and level', () => {
  it('follows the blanket table', () => {
    expect(cpAt(0)).toBe(150)
    expect(cpAt(1)).toBe(215)
    expect(cpAt(2)).toBe(280)
    expect(cpAt(3)).toBe(323)
    expect(levelRow(cpAt(1)).level).toBe(1)
    expect(levelRow(cpAt(2)).level).toBe(2)
  })

  it('racial bonus CP does not count toward level', () => {
    expect(cpAt(1, 50)).toBe(265)
    expect(levelRow(265, 50).level).toBe(1)
  })

  it('extrapolates past level 20', () => {
    const row = levelRow(2250)
    expect(row.level).toBe(22)
    expect(row.warrior).toBe(48)
    expect(row.scholar).toBe(3 + 21 - 7)
  })
})

describe('evaluate', () => {
  it('checks the CP budget at the step a purchase lands on', () => {
    const early = evaluate(build({ purchases: [buy('Read & Write'), buy('Read Magic'), buy('Sphere of Magic: 1st')] }))
    expect([...early.results.values()].map(r => r.error)).toEqual([null, null, expect.stringContaining('Over budget')])

    const later = evaluate(build({
      blankets: ['2026-01'],
      purchases: [buy('Read & Write'), buy('Read Magic'), buy('Sphere of Magic: 1st', 1)],
    }))
    expect([...later.results.values()].every(r => r.error === null)).toBe(true)
    expect(later.stats.cpSpent).toBe(215)
    expect(later.stats.cpRemaining).toBe(50)
  })

  it('cascades a missing prereq to its dependents', () => {
    const ev = evaluate(build({ blankets: ['2026-01'], purchases: [buy('Read Magic'), buy('Sphere of Magic: 1st', 1)] }))
    const errs = [...ev.results.values()].map(r => r.error)
    expect(errs[0]).toBe('Requires Read & Write')
    expect(errs[1]).toBe('Requires Read Magic')
  })

  it('gates occupational abilities and spell circles', () => {
    const ev = evaluate(build({ purchases: [buy('Hamstring'), buy('Spell Slot', 0, '5')] }))
    const errs = [...ev.results.values()].map(r => r.error)
    expect(errs[0]).toBe('Requires level 3')
    expect(errs[1]).toBe('Requires Sphere of Magic: 1st')
  })

  it('enforces the racial purchase cap by level', () => {
    const ev = evaluate(build({ purchases: [buy('Body Point Bonus (Human)'), buy('Body Point Bonus (Human)')] }))
    expect([...ev.results.values()].map(r => r.error)).toEqual([null, 'Maxed'])
    expect(ev.stats.body).toBe(6 + 5)
  })

  it('requires and validates weapon choices', () => {
    const ev = evaluate(build({
      purchases: [
        buy('Specialization +1: Weapon Specific'),
        buy('Specialization +1: Weapon Specific', 0, 'Club'),
      ],
    }))
    const errs = [...ev.results.values()].map(r => r.error)
    expect(errs[0]).toBe('Requires Weapon Group Proficiency: Medium or Weapon Group Proficiency: Large or Weapon Specific Proficiency: Exotic')
    expect(errs[1]).toBe(errs[0])
  })

  it('does not count Simple proficiency toward group prerequisites', () => {
    const ev = evaluate(build({ purchases: [buy('Specialization +1: Weapon Group', 0, 'Simple')] }))
    expect([...ev.results.values()][0].error).toMatch(/^Requires Weapon Group Proficiency: Medium/)
  })

  it('prices 4th+ spheres like the 3rd and chains their prerequisites', () => {
    const spheres = ['Read & Write', 'Read Magic', ...[1, 2, 3, 4].map(i => `Sphere of Magic: ${['1st', '2nd', '3rd', '4th'][i - 1]}`)]
    const ev = evaluate(build({
      occupation: 'Mage', blankets: Array.from({ length: 24 }, (_, i) => `2026-${String((i >> 1) + 1).padStart(2, '0')}`),
      purchases: spheres.map(s => buy(s, 24)), schools: ['Healing', 'Protection', 'Nature', 'Psionics'],
    }))
    const res = [...ev.results.values()]
    expect(res.map(r => r.error)).toEqual(Array(spheres.length).fill(null))
    expect(res[5].cost).toBe(SPHERES[2].costs.Mage)
    const skip = evaluate(build({ purchases: [buy('Sphere of Magic: 5th')] }))
    expect([...skip.results.values()][0].error).toBe('Requires Sphere of Magic: 4th')
  })

  it('flags more than two blankets in one month', () => {
    const ev = evaluate(build({ blankets: ['2026-01', '2026-01', '2026-01'] }))
    expect(ev.steps.map(s => s.error)).toEqual([null, expect.any(String), expect.any(String), expect.any(String)])
  })

  it('reports probe availability without recording it', () => {
    const b = build({ purchases: [buy('Read & Write')] })
    expect(evaluate(b, buy('Read Magic')).probe?.error).toBeNull()
    expect(evaluate(b, buy('Read Magic: Ritual')).probe?.error).toBe('Requires Read Magic: Advanced')
    expect(evaluate(b, buy('Specialization +1: Weapon Group')).probe?.error).toContain('Requires')
  })
})

describe('nextBlanketMonth', () => {
  it('fills a month to two then rolls over', () => {
    const b = emptyBuild('2026-12')
    expect(nextBlanketMonth(b)).toBe('2026-12')
    expect(nextBlanketMonth({ ...b, blankets: ['2026-12', '2026-12'] })).toBe('2027-01')
  })
})

describe('data tables', () => {
  it('keys every per-occupation cost table by all occupations', () => {
    const tables: [string, Record<string, number>][] = [
      ['ritual', RITUAL_BASE_COSTS],
      ...SPHERES.map(s => [s.name, s.costs] as [string, Record<string, number>]),
      ...Object.entries(SPELL_CIRCLE_COSTS).map(([c, t]) => [`circle ${c}`, t] as [string, Record<string, number>]),
      ...SKILLS.flatMap(c => c.skills).filter(s => s.costs).map(s => [s.name, s.costs!] as [string, Record<string, number>]),
    ]
    for (const [name, t] of tables) expect(Object.keys(t).sort(), name).toEqual([...OCC_ORDER].sort())
  })
})

describe('blanket placement', () => {
  it('inserts out-of-order months in place and moves later purchases with their blanket', () => {
    const b = build({ blankets: ['2026-01', '2026-05'], purchases: [buy('Read & Write', 2)] })
    const { build: out, at } = insertBlanket(b, '2026-03')
    expect(out.blankets).toEqual(['2026-01', '2026-03', '2026-05'])
    expect(at).toBe(2)
    expect(out.purchases[0].at).toBe(3)
  })

  it('back-fills past blankets two per month from the start month', () => {
    const out = pastBlankets(build({ startMonth: '2025-11' }), 5)
    expect(out.blankets).toEqual(['2025-11', '2025-11', '2025-12', '2025-12', '2026-01'])
  })
})

describe('simple mode', () => {
  it('evaluates picks at the final level without budget errors', () => {
    const b = build({ simple: { blankets: 0, purchases: [buy('Read & Write'), buy('Read Magic'), buy('Shield')] } })
    const ev = evaluate(simpleView(b), undefined, true)
    expect([...ev.results.values()].every(r => r.error === null)).toBe(true)
    expect(ev.stats.cpRemaining).toBe(200 - 70 - 45 - 50 + 10 - 10)
  })

  it('unbuys the latest purchase of a skill in the active mode', () => {
    const b = build({ mode: 'timeline', purchases: [buy('Slay/Parry', 0), buy('Slay/Parry', 2), buy('Shield', 1)] })
    expect(unbuy(b, 'Slay/Parry').purchases.map(p => p.at)).toEqual([0, 1])
    const s = build({ simple: { blankets: 3, purchases: [buy('Shield')] } })
    expect(unbuy(s, 'Shield').simple?.purchases).toEqual([])
  })
})

describe('priority mode', () => {
  it('dates each pick at the first blanket that affords it, in order', () => {
    const magic = ['Read & Write', 'Read Magic', 'Sphere of Magic: 1st', 'Read Magic: Advanced'].map(s => buy(s))
    const slots = PYRAMID_ORDER.slice(0, 15).map(c => buy('Spell Slot', 0, String(c)))
    const picks = [...magic, ...slots]
    const b = build({ occupation: 'Mage', mode: 'priority', priority: { perMonth: 2, months: { '2026-02': 0 }, purchases: picks } })
    const view = priorityView(b)
    const ats = view.purchases.map(p => p.at)
    expect(ats[0]).toBe(0)
    expect(ats.at(-1)).toBeGreaterThan(0)
    expect(ats).toEqual([...ats].sort((x, y) => x - y))
    expect(view.blankets).not.toContain('2026-02')
    expect([...evaluate(view).results.values()].every(r => r.error === null)).toBe(true)

    const k = ats.findIndex(a => a > 0)
    const earlier = { ...view, blankets: view.blankets.slice(0, ats[k] - 1), purchases: view.purchases.slice(0, k) }
    expect(evaluate(earlier, { ...picks[k], at: ats[k] - 1 }).probe?.error).toMatch(/^Over budget/)
  })

  it('copies picks between modes', () => {
    const picks = ['Read & Write', 'Read Magic', 'Sphere of Magic: 1st', 'Sphere of Magic: 2nd'].map(s => buy(s))
    const prio = build({ occupation: 'Mage', mode: 'priority', priority: { perMonth: 2, months: {}, purchases: picks } })

    const timeline = copyPicks({ ...prio, mode: 'timeline' }, 'priority')
    expect(timeline.purchases).toEqual(priorityView(prio).purchases)
    expect(timeline.blankets).toEqual(priorityView(prio).blankets)

    const sandbox = copyPicks({ ...timeline, mode: 'sandbox' }, 'timeline')
    expect(sandbox.simple).toEqual({ blankets: timeline.blankets.length, purchases: picks.map(p => ({ ...p, at: 0 })) })

    const back = copyPicks({ ...sandbox, mode: 'timeline' }, 'sandbox')
    expect(back.blankets).toHaveLength(timeline.blankets.length)
    expect([...evaluate(back).results.values()].every(r => r.error === null)).toBe(true)
  })

  it('does not wait on errors more blankets cannot fix', () => {
    const view = priorityView(build({ mode: 'priority', priority: { perMonth: 2, months: {}, purchases: [buy('Read Magic')] } }))
    expect(view.blankets).toEqual([])
    expect([...evaluate(view).results.values()][0].error).toContain('Requires')
  })
})

describe('spell pyramid (Core p.105-106)', () => {
  const magic = () => [buy('Read & Write'), buy('Read Magic'), buy('Sphere of Magic: 1st'), buy('Read Magic: Advanced')]
  const slots = (...circles: number[]) => circles.map(c => buy('Spell Slot', 0, String(c)))
  const errors = (purchases: Purchase[]) =>
    [...evaluate(build({ occupation: 'Mage', purchases }), undefined, true).results.values()].slice(4).map(r => r.error)

  it('accepts the full 45-slot book order', () => {
    expect(errors([...magic(), ...slots(...PYRAMID_ORDER)]).every(e => e === null)).toBe(true)
  })

  it('needs two slots below to open a circle and forces the next buy upward', () => {
    // Reordered into book order within the step, so order of entry does not matter.
    expect(errors([...magic(), ...slots(2, 1, 1)])).toEqual([null, null, null])
    expect(errors([...magic(), ...slots(1, 2)])).toEqual([null, 'Needs 2 1st Circle slots'])
    expect(errors([...magic(), ...slots(1, 1, 1)])).toEqual([null, null, 'Next slot must be 2nd Circle'])
  })

  it('widens to 10 only after the pyramid is full, never past the circle below', () => {
    expect(errors([...magic(), ...slots(...PYRAMID_ORDER, 1, 2)]).slice(-2)).toEqual([null, null])
    expect(errors([...magic(), ...slots(...PYRAMID_ORDER, 2)]).slice(-1)).toEqual(['Needs another 1st Circle slot first'])
    expect(errors([...magic(), ...slots(1, 1, 2, 1, 2, 1, 1)]).slice(-1)).toEqual(['Next slot must be 3rd Circle'])
  })
})

describe('spell slot ordering across steps', () => {
  it('keeps a legal order when circle-1 slots were bought at an earlier step', () => {
    const b = build({
      occupation: 'Mage', mode: 'timeline', blankets: ['2026-01', '2026-01', '2026-02'],
      purchases: [
        buy('Read & Write'), buy('Read Magic'), buy('Sphere of Magic: 1st'),
        buy('Spell Slot', 2, '1'), buy('Spell Slot', 2, '1'),
        buy('Spell Slot', 3, '2'), buy('Spell Slot', 3, '1'),
      ],
    })
    const ev = evaluate(b, undefined, true)
    expect([...ev.results.values()].every(r => r.error === null)).toBe(true)
  })

  it('ties Spell Versatility to an owned slot and prices it by circle', () => {
    const magic = [buy('Read & Write'), buy('Read Magic'), buy('Sphere of Magic: 1st')]
    const slots = [1, 1, 2, 1, 2, 3].map(c => buy('Spell Slot', 0, String(c)))
    const vers = ['3', '3', '1'].map(c => buy('Spell Versatility', 0, c))
    const ev = evaluate(build({ occupation: 'Mage', purchases: [...magic, ...slots, ...vers] }), undefined, true)
    const [three, again, one] = vers.map(p => ev.results.get(p.id)!)
    expect([three.cost, three.frag, three.error]).toEqual([SPELL_CIRCLE_COSTS['3'].Mage / 2 + 5, SPELL_CIRCLE_COSTS['3'].Mage / 2 + 5, null])
    expect(again.error).toBe('3 not available')
    expect([one.cost, one.frag, one.error]).toEqual([SPELL_CIRCLE_COSTS['1'].Mage / 2 + 5, SPELL_CIRCLE_COSTS['1'].Mage / 2 + 5, null])
  })

  it('checks vocation prerequisites, including either/or ones', () => {
    // Weapon-choice skills get the Medium group; Tradesman a Miner trade.
    const pick = (sk: string) => buy(sk, 0, /Weapon Group$|Master$/.test(sk) ? 'Medium' : sk === 'Tradesman' ? 'Blacksmith|Miner' : undefined)
    const warn = (vocation: string, skills: string[], occupation = 'Mercenary') =>
      evaluate(build({ occupation, vocation, purchases: skills.map(pick) }), undefined, true).warnings.filter(w => w.startsWith(vocation))
    const parry = ['Weapon Group Proficiency: Medium', 'Specialization +1: Weapon Group', 'Slay/Parry: Master']
    expect(warn('Stalwart', ['Heavy Armour', 'Shield'])).toContain('Stalwart expects Slay/Parry or Slay/Parry: Master')
    expect(warn('Stalwart', ['Heavy Armour', 'Shield', ...parry])).toEqual([])
    expect(warn('Swashbuckler', ['Ambidexterity'])).toEqual(['Swashbuckler expects a Slay (Specific or Master) or a Dodge'])
    expect(warn('Swashbuckler', ['Ambidexterity', ...parry])).toEqual([])
    const trade = Array(5).fill('Tradesman')
    expect(warn('Artisan', trade)).toHaveLength(1)
    expect(warn('Artisan', [...trade, 'Blacksmith', 'Blacksmith', 'Blacksmith', 'Alchemy', 'Alchemy'])).toEqual([])
  })

  it('swaps owned occupational abilities by tier when the role changes', () => {
    const b = build({ occupation: 'Mage', purchases: [buy('Identify Magic Item'), buy('Shield')], simple: { blankets: 0, purchases: [buy('Mana Harvest')] } })
    const merc = switchRole(b, { occupation: 'Mercenary' })
    expect(merc.purchases.map(p => p.skill)).toEqual(['Hamstring', 'Shield'])
    expect(merc.simple!.purchases.map(p => p.skill)).toEqual(['Head-Butt'])
    expect(switchRole(merc, { occupation: 'Mage' }).purchases[0].skill).toBe('Identify Magic Item')
  })

  it('names a Tradesman trade and checks its material', () => {
    const trades = [buy('Tradesman', 0, 'Blacksmith|Miner'), buy('Tradesman', 0, 'Gold|Miner')]
    const ev = evaluate(build({ occupation: 'Mage', purchases: trades }), undefined, true)
    const [ok, bad] = trades.map(p => ev.results.get(p.id)!)
    expect([ok.label, ok.error]).toEqual(['Tradesman: Miner (Blacksmith)', null])
    expect(bad.error).toBe('Gold not available')
  })

  it('orders slots past the full pyramid by the circle below', () => {
    const magic = [buy('Read & Write'), buy('Read Magic'), buy('Sphere of Magic: 1st'), buy('Read Magic: Advanced')]
    const slots = [...PYRAMID_ORDER, 2, 1].map(c => buy('Spell Slot', 0, String(c)))
    const ev = evaluate(build({ occupation: 'Mage', purchases: [...magic, ...slots] }), undefined, true)
    expect([...ev.results.values()].every(r => r.error === null)).toBe(true)
  })
})
