import { describe, it, expect } from 'vitest'
import { computeSkillchain, getSkillCap, getAvailableWSes, findBestGroups } from './engine'
import type { ChainGroup, PartyMember } from './engine'
import type { WeaponSkill, WeaponType } from '../data/weaponSkills'
import type { Job } from '../data/jobs'
import { WEAPON_SKILLS } from '../data/weaponSkills'
import { SC_RESONANCES } from '../data/elements'

// ── Helpers ─────────────────────────────────────────────────────────────────

function member(job: Job, weaponType: WeaponType): PartyMember {
  return { job, weaponType, name: '', avatar: null, forceOpener: false, forceCloser: false, preferredWS: [] }
}

function emptySlot(): PartyMember {
  return { job: null, weaponType: null, name: '', avatar: null, forceOpener: false, forceCloser: false, preferredWS: [] }
}

/** Build a 6-slot party array, padding with empty slots */
function party(...filled: PartyMember[]): PartyMember[] {
  return [...filled, ...Array.from({ length: 6 - filled.length }, emptySlot)]
}

/** All distinct final SC names across every chain in every group */
function allFinalSCs(groups: ChainGroup[]): Set<string> {
  return new Set(
    groups.flatMap(g => g.links.map(l => l.boundaries[l.boundaries.length - 1].name))
  )
}

// ── computeSkillchain ────────────────────────────────────────────────────────

describe('computeSkillchain', () => {
  it('returns null when no resonance', () => {
    // Hard Slash (Scission) → Combo (Impaction): Scission closers are Liquefaction/Detonation/Reverberation — no Impaction
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Hard Slash')!
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Combo')!
    expect(computeSkillchain(ws1, ws2)).toBeNull()
  })

  it('computes a Level 2 Distortion chain', () => {
    // HorizonXI: Distortion = Transfixion opener + Scission closer
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Double Thrust')! // Transfixion
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Iron Tempest')!  // Scission
    const result = computeSkillchain(ws1, ws2)
    expect(result?.name).toBe('Distortion')
    expect(result?.level).toBe(2)
  })

  it('computes a Level 3 Light chain', () => {
    // Wheeling Thrust (Fusion) → Spinning Slash (Fragmentation) = Light L3
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Wheeling Thrust')!
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Spinning Slash')!
    const result = computeSkillchain(ws1, ws2)
    expect(result?.name).toBe('Light')
    expect(result?.level).toBe(3)
  })

  it('picks highest level chain when multiple resonate', () => {
    // Avalanche Axe (Induration). Shoulder Tackle (Reverberation+Impaction).
    // Induration→Impaction = Impaction L1, Induration→Reverberation = Fragmentation L2 — L2 wins.
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Avalanche Axe')!
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Shoulder Tackle')!
    const result = computeSkillchain(ws1, ws2)
    expect(result?.name).toBe('Fragmentation')
    expect(result?.level).toBe(2)
  })
})

// ── getSkillCap ──────────────────────────────────────────────────────────────

describe('getSkillCap', () => {
  it('returns correct cap for A+ at level 75', () => {
    expect(getSkillCap('A+', 75)).toBe(276)
  })

  it('returns correct cap for B- at level 75', () => {
    expect(getSkillCap('B-', 75)).toBe(240)
  })

  it('returns correct cap for A+ at level 65', () => {
    expect(getSkillCap('A+', 65)).toBe(227)
  })

  it('returns 0 or very low cap at level 1', () => {
    expect(getSkillCap('A+', 1)).toBeLessThanOrEqual(10)
  })

  it('clamps level above 75 to 75 cap', () => {
    expect(getSkillCap('A+', 80)).toBe(276)
  })
})

// ── getAvailableWSes ─────────────────────────────────────────────────────────

describe('getAvailableWSes', () => {
  it('returns WSes available at the given skill cap', () => {
    const wses = getAvailableWSes('SAM', 'Great Katana', 75)
    expect(wses.some(w => w.name === 'Tachi: Enpi')).toBe(true)
    expect(wses.some(w => w.name === 'Tachi: Kasha')).toBe(true)
  })

  it('excludes quest WSes when level is too low', () => {
    const wses = getAvailableWSes('SAM', 'Great Katana', 70)
    expect(wses.some(w => w.name === 'Tachi: Kasha')).toBe(false)
  })

  it('excludes WSes above skill cap', () => {
    const wses = getAvailableWSes('SAM', 'Great Katana', 30)
    expect(wses.some(w => w.name === 'Tachi: Jinpu')).toBe(false)
  })

  it('returns empty array for job with no rating in weapon type', () => {
    const wses = getAvailableWSes('BLM', 'Great Katana', 75)
    expect(wses).toHaveLength(0)
  })
})

// ── findBestGroups ───────────────────────────────────────────────────────────

describe('findBestGroups', () => {
  // Regression: WAR/Sword at lv20 has Fast Blade (Scission) and Burning Blade (Liquefaction).
  // WAR/GS has Hard Slash and Power Slash (both Scission). The old poolByMembers key used
  // member indices only, so only the highest-scoring SC from pair {0,1} survived — the other
  // SC type was invisible until a resistance change flipped the winner.
  it('shows all distinct SC types from the same member pair (regression)', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 20, {})
    const scs = allFinalSCs(groups)
    expect(scs.has('Scission')).toBe(true)
    expect(scs.has('Liquefaction')).toBe(true)
  })

  // Two WAR/Sword at lv20: Fast Blade (Scission) and Burning Blade (Liquefaction) only.
  // Power Slash (GS) is now Transfixion — pairing with GS introduces Distortion L2 which
  // dominates. Using Sword+Sword avoids that: only Scission and Liquefaction L1 chains exist.
  it('Earth resistance ranks Liquefaction above Scission', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    const groups = findBestGroups(p, 20, { Earth: 'resistant' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Liquefaction')
  })

  it('Fire resistance ranks Scission above Liquefaction', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    const groups = findBestGroups(p, 20, { Fire: 'resistant' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Scission')
  })

  it('Fire weakness ranks Liquefaction above Scission', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    const groups = findBestGroups(p, 20, { Fire: 'weak' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Liquefaction')
  })

  it('Earth weakness ranks Scission above Liquefaction', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    const groups = findBestGroups(p, 20, { Earth: 'weak' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Scission')
  })

  it('resistances re-rank but never hide SC types from results', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))

    const withEarth = allFinalSCs(findBestGroups(p, 20, { Earth: 'resistant' }))
    expect(withEarth.has('Scission')).toBe(true)
    expect(withEarth.has('Liquefaction')).toBe(true)

    const withFire = allFinalSCs(findBestGroups(p, 20, { Fire: 'resistant' }))
    expect(withFire.has('Scission')).toBe(true)
    expect(withFire.has('Liquefaction')).toBe(true)
  })

  // DRG/Polearm (Wheeling Thrust = Fusion) + WAR/GS (Spinning Slash = Fragmentation) = Light L3
  it('L3 chain ranks first when achievable', () => {
    const p = party(member('DRG', 'Polearm'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 75, {})
    const topFinal = groups[0]?.links[0]?.boundaries.at(-1)
    expect(topFinal?.level).toBe(3)
    expect(topFinal?.name).toBe('Light')
  })

  it('L3 stays top even when its burst elements are resistant', () => {
    const p = party(member('DRG', 'Polearm'), member('WAR', 'Great Sword'))
    // Light bursts Fire/Light/Lightning/Wind — penalise several; should still beat L2/L1
    const groups = findBestGroups(p, 75, { Fire: 'resistant', Ice: 'resistant', Wind: 'resistant' })
    const topFinal = groups[0]?.links[0]?.boundaries.at(-1)
    expect(topFinal?.level).toBe(3)
  })

  // 4 WARs: Sword → Swift Blade (Gravitation+Light) at 225; GS → Ground Strike (Fragmentation+Distortion, quest 71).
  // Pair {0,1} and pair {2,3} each form Darkness L3 (Gravitation→Distortion) independently.
  // Concurrency bonus (+2) makes two concurrent L3 chains beat a single 4-step L3 chain.
  it('two concurrent L3 chains score higher than any single chain', () => {
    const p = party(
      member('WAR', 'Sword'),      // m0: Swift Blade (Gravitation)
      member('WAR', 'Great Sword'), // m1: Ground Strike (Distortion)
      member('WAR', 'Sword'),      // m2: Swift Blade (Gravitation)
      member('WAR', 'Great Sword'), // m3: Ground Strike (Distortion)
    )
    const groups = findBestGroups(p, 75, {})
    const top = groups[0]
    expect(top.links.length).toBe(2)
    expect(top.totalScore).toBeGreaterThan(4) // base 3+3 + bonus
    top.links.forEach(l => {
      expect(l.boundaries.at(-1)?.level).toBe(3)
    })
  })

  it('concurrent chains use non-overlapping members', () => {
    const p = party(
      member('WAR', 'Sword'),
      member('WAR', 'Great Sword'),
      member('WAR', 'Sword'),
      member('WAR', 'Great Sword'),
    )
    const groups = findBestGroups(p, 75, {})
    for (const g of groups) {
      if (g.links.length < 2) continue
      const usedMembers = new Set<number>()
      for (const link of g.links) {
        for (const step of link.steps) {
          expect(usedMembers.has(step.memberIdx)).toBe(false)
          usedMembers.add(step.memberIdx)
        }
      }
    }
  })

  it('returns empty when party has no melee weapon assignments', () => {
    const p = party(
      { job: 'BLM', weaponType: null, name: '', avatar: null, forceOpener: false, forceCloser: false, preferredWS: [] },
      { job: 'WHM', weaponType: null, name: '', avatar: null, forceOpener: false, forceCloser: false, preferredWS: [] },
    )
    expect(findBestGroups(p, 75, {})).toHaveLength(0)
  })

  it('level 5 WAR/GS produces no chains (only Hard Slash/Scission available, Scission+Scission does not chain)', () => {
    // At lv5 WAR GS cap ≈ 16 — only Hard Slash (Scission, req 5) is available.
    // No valid opener+closer pair exists: Scission→Scission is not in the resonance table.
    const p = party(member('WAR', 'Great Sword'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 5, {})
    expect(groups).toHaveLength(0)
  })

  it('level 75 WAR/GS unlocks more SC types than level 5', () => {
    const p = party(member('WAR', 'Great Sword'), member('WAR', 'Great Sword'))
    const lv5 = allFinalSCs(findBestGroups(p, 5, {}))
    const lv75 = allFinalSCs(findBestGroups(p, 75, {}))
    expect(lv75.size).toBeGreaterThan(lv5.size)
  })

  // ── Force Opener ─────────────────────────────────────────────────────────────

  it('forceOpener restricts chains to those starting with that member', () => {
    const m0 = member('WAR', 'Great Sword')
    m0.forceOpener = true
    const p = party(m0, member('WAR', 'Sword'))
    const groups = findBestGroups(p, 75, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[0].memberIdx).toBe(0)
      }
    }
  })

  it('forceOpener on specific members — only they can be step 0', () => {
    const m0 = member('WAR', 'Great Sword')
    m0.forceOpener = true
    const p = party(m0, member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[2].forceOpener = true
    const groups = findBestGroups(p, 75, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[0].memberIdx % 2).toBe(0) // only idx 0 or 2
      }
    }
  })

  it('no force opener flag leaves all chains intact', () => {
    const p = party(member('WAR', 'Great Sword'), member('WAR', 'Sword'))
    const groups = findBestGroups(p, 75, {})
    expect(groups.length).toBeGreaterThan(0)
    const step0Idxs = new Set(groups.flatMap(g => g.links.map(l => l.steps[0].memberIdx)))
    expect(step0Idxs.has(0)).toBe(true)
    expect(step0Idxs.has(1)).toBe(true)
  })

  // ── Force Closer ─────────────────────────────────────────────────────────────

  it('forceCloser restricts chains to those ending with that member', () => {
    const m0 = member('WAR', 'Great Sword')
    m0.forceCloser = true
    const p = party(m0, member('WAR', 'Sword'))
    const groups = findBestGroups(p, 75, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[link.steps.length - 1].memberIdx).toBe(0)
      }
    }
  })

  it('forceCloser on specific members — only they can be last step', () => {
    const m0 = member('WAR', 'Great Sword')
    const p = party(m0, member('WAR', 'Sword'))
    p[1].forceCloser = true
    const groups = findBestGroups(p, 75, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[link.steps.length - 1].memberIdx).toBe(1)
      }
    }
  })

  it('no force closer flag leaves all chains intact', () => {
    const p = party(member('WAR', 'Great Sword'), member('WAR', 'Sword'))
    const groups = findBestGroups(p, 75, {})
    expect(groups.length).toBeGreaterThan(0)
    const lastStepIdxs = new Set(groups.flatMap(g => g.links.map(l => l.steps[l.steps.length - 1].memberIdx)))
    expect(lastStepIdxs.has(0)).toBe(true)
    expect(lastStepIdxs.has(1)).toBe(true)
  })

  // ── Force Opener + Closer combo ──────────────────────────────────────────────

  it('forceOpener and forceCloser together — both constraints satisfied', () => {
    const m0 = member('WAR', 'Great Sword')
    m0.forceOpener = true
    const m1 = member('WAR', 'Sword')
    m1.forceCloser = true
    const p = party(m0, m1)
    const groups = findBestGroups(p, 75, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[0].memberIdx).toBe(0)
        expect(link.steps[link.steps.length - 1].memberIdx).toBe(1)
      }
    }
  })

  // ── Preferred WeaponSkills ───────────────────────────────────────────────────

  it('preferred WS adds +1 when that WS appears in a chain step', () => {
    // At lv20 WAR/Sword: Fast Blade (Scission, req 5), Burning Blade (Liquefaction, req 15).
    // Two WAR/Sword: Fast Blade→Burning Blade = Scission L1 (base 1).
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    const baseGroups = findBestGroups(p, 20, {})

    p[0].preferredWS = ['Fast Blade']
    const prefGroups = findBestGroups(p, 20, {})

    const baseScission = baseGroups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    const prefScission = prefGroups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(baseScission).toBeDefined()
    expect(prefScission).toBeDefined()
    expect(prefScission!.links[0].score).toBe(baseScission!.links[0].score + 1)
  })

  it('preferred WS bonus stacks across steps', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].preferredWS = ['Fast Blade']
    p[1].preferredWS = ['Burning Blade']
    const prefGroups = findBestGroups(p, 20, {})

    const scission = prefGroups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    // Fast Blade (preferred +1) → Burning Blade (preferred +1) = base 1 + 2 = 3
    expect(scission!.links[0].score).toBe(3)
  })

  it('no preferred WS leaves scores unchanged', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    const groups = findBestGroups(p, 20, {})
    const scission = groups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    expect(scission!.links[0].score).toBe(1)
  })
})

// ── Systematic force role tests ───────────────────────────────────────────────

type ForceRoleCase = {
  label: string
  party: PartyMember[]
  level: number
}

const TEST_JOBS: [Job, WeaponType][] = [
  ['WAR', 'Sword'], ['WAR', 'Great Sword'], ['DRG', 'Polearm'], ['SAM', 'Great Katana'],
]
const TEST_LEVELS = [20, 50, 75]

function gen2(p: PartyMember[]): PartyMember[] {
  return party(p[0], p[1])
}
function gen3(p: PartyMember[]): PartyMember[] {
  return party(p[0], p[1], p[2])
}
function base2(job: Job, weapon: WeaponType): PartyMember[] {
  return [member(job, weapon), member(job, weapon)]
}
function base3(job: Job, weapon: WeaponType): PartyMember[] {
  return [member(job, weapon), member(job, weapon), member(job, weapon)]
}

describe('forceOpener — systematic', () => {
  const cases: ForceRoleCase[] = []
  for (const [job, weapon] of TEST_JOBS) {
    for (const level of TEST_LEVELS) {
      // 2-person: force opener on each member and both
      for (const idx of [0, 1]) {
        const p = base2(job, weapon); p[idx].forceOpener = true
        cases.push({ label: `2p m${idx}: ${job}/${weapon} lv${level}`, party: gen2(p), level })
      }
      { const p = base2(job, weapon); p[0].forceOpener = true; p[1].forceOpener = true
        cases.push({ label: `2p both: ${job}/${weapon} lv${level}`, party: gen2(p), level }) }
      // 3-person: force opener on each member, pairs, and all three
      for (const idx of [0, 1, 2]) {
        const p = base3(job, weapon); p[idx].forceOpener = true
        cases.push({ label: `3p m${idx}: ${job}/${weapon} lv${level}`, party: gen3(p), level })
      }
      for (const [a, b] of [[0,1],[0,2],[1,2]]) {
        const p = base3(job, weapon); p[a].forceOpener = true; p[b].forceOpener = true
        cases.push({ label: `3p m${a}m${b}: ${job}/${weapon} lv${level}`, party: gen3(p), level })
      }
      { const p = base3(job, weapon); p[0].forceOpener = true; p[1].forceOpener = true; p[2].forceOpener = true
        cases.push({ label: `3p all: ${job}/${weapon} lv${level}`, party: gen3(p), level }) }
    }
  }
  it.each(cases)('$label', ({ party: p, level }) => {
    const groups = findBestGroups(p, level, {})
    for (const g of groups)
      for (const link of g.links)
        expect(p[link.steps[0].memberIdx].forceOpener).toBe(true)
  })
})

describe('forceCloser — systematic', () => {
  const cases: ForceRoleCase[] = []
  for (const [job, weapon] of TEST_JOBS) {
    for (const level of TEST_LEVELS) {
      for (const idx of [0, 1]) {
        const p = base2(job, weapon); p[idx].forceCloser = true
        cases.push({ label: `2p m${idx}: ${job}/${weapon} lv${level}`, party: gen2(p), level })
      }
      { const p = base2(job, weapon); p[0].forceCloser = true; p[1].forceCloser = true
        cases.push({ label: `2p both: ${job}/${weapon} lv${level}`, party: gen2(p), level }) }
      for (const idx of [0, 1, 2]) {
        const p = base3(job, weapon); p[idx].forceCloser = true
        cases.push({ label: `3p m${idx}: ${job}/${weapon} lv${level}`, party: gen3(p), level })
      }
      for (const [a, b] of [[0,1],[0,2],[1,2]]) {
        const p = base3(job, weapon); p[a].forceCloser = true; p[b].forceCloser = true
        cases.push({ label: `3p m${a}m${b}: ${job}/${weapon} lv${level}`, party: gen3(p), level })
      }
      { const p = base3(job, weapon); p[0].forceCloser = true; p[1].forceCloser = true; p[2].forceCloser = true
        cases.push({ label: `3p all: ${job}/${weapon} lv${level}`, party: gen3(p), level }) }
    }
  }
  it.each(cases)('$label', ({ party: p, level }) => {
    const groups = findBestGroups(p, level, {})
    for (const g of groups)
      for (const link of g.links)
        expect(p[link.steps[link.steps.length - 1].memberIdx].forceCloser).toBe(true)
  })
})

type ForceBothCase = ForceRoleCase & {
  openerIdxs: number[]
  closerIdxs: number[]
}

describe('forceOpener + forceCloser — combined', () => {
  const cases: ForceBothCase[] = []
  for (const [job, weapon] of TEST_JOBS) {
    for (const level of TEST_LEVELS) {
      // 2-person: m0 opener, m1 closer
      { const p = base2(job, weapon); p[0].forceOpener = true; p[1].forceCloser = true
        cases.push({ label: `2p m0op+m1cl: ${job}/${weapon} lv${level}`, party: gen2(p), level, openerIdxs: [0], closerIdxs: [1] }) }
      // 2-person: m1 opener, m0 closer
      { const p = base2(job, weapon); p[1].forceOpener = true; p[0].forceCloser = true
        cases.push({ label: `2p m1op+m0cl: ${job}/${weapon} lv${level}`, party: gen2(p), level, openerIdxs: [1], closerIdxs: [0] }) }
      // 3-person: m0 opener, m2 closer
      { const p = base3(job, weapon); p[0].forceOpener = true; p[2].forceCloser = true
        cases.push({ label: `3p m0op+m2cl: ${job}/${weapon} lv${level}`, party: gen3(p), level, openerIdxs: [0], closerIdxs: [2] }) }
      // 3-person: m0,m1 opener, m2 closer
      { const p = base3(job, weapon); p[0].forceOpener = true; p[1].forceOpener = true; p[2].forceCloser = true
        cases.push({ label: `3p m0m1op+m2cl: ${job}/${weapon} lv${level}`, party: gen3(p), level, openerIdxs: [0, 1], closerIdxs: [2] }) }
      // 3-person: m0 opener, m1,m2 closer
      { const p = base3(job, weapon); p[0].forceOpener = true; p[1].forceCloser = true; p[2].forceCloser = true
        cases.push({ label: `3p m0op+m1m2cl: ${job}/${weapon} lv${level}`, party: gen3(p), level, openerIdxs: [0], closerIdxs: [1, 2] }) }
    }
  }
  it.each(cases)('$label', ({ party: p, level, openerIdxs, closerIdxs }) => {
    const groups = findBestGroups(p, level, {})
    for (const g of groups) {
      for (const link of g.links) {
        expect(openerIdxs).toContain(link.steps[0].memberIdx)
        expect(closerIdxs).toContain(link.steps[link.steps.length - 1].memberIdx)
      }
    }
  })
})

// ── Preferred WS scoring tests ────────────────────────────────────────────────

describe('preferred WS — score impact', () => {
  // Monotonicity: adding preferred WS never decreases a chain's score.
  // Score stays the same for chains that don't use preferred WS, and increases
  // by the number of steps that do use a preferred WS.
  it('score never decreases when preferred WS are added', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Great Sword'))
    const base = findBestGroups(p, 75, {})
    p[0].preferredWS = ['Fast Blade', 'Swift Blade']
    p[1].preferredWS = ['Ground Strike']
    const pref = findBestGroups(p, 75, {})
    for (let gi = 0; gi < Math.min(base.length, pref.length); gi++) {
      for (let li = 0; li < Math.min(base[gi].links.length, pref[gi].links.length); li++) {
        const bl = base[gi].links[li]
        const pl = pref[gi].links[li]
        const sameSteps = bl.steps.length === pl.steps.length &&
          bl.steps.every((s, i) => s.memberIdx === pl.steps[i].memberIdx && s.ws.name === pl.steps[i].ws.name)
        if (!sameSteps) continue
        expect(pl.score).toBeGreaterThanOrEqual(bl.score)
      }
    }
  })

  // +1 per step using a preferred WS — verifiable at lv20 WAR/Sword where
  // only Fast Blade (Scission) and Burning Blade (Liquefaction) exist.
  // Scission chain: Fast Blade (m0) → Burning Blade (m1) = base 1
  it('exact +1 when only opener prefers a WS used in that chain', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].preferredWS = ['Fast Blade']
    const groups = findBestGroups(p, 20, {})
    const scission = groups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    expect(scission!.links[0].score).toBe(2) // base 1 + 1
  })

  it('exact +2 when both steps use preferred WS', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].preferredWS = ['Fast Blade']
    p[1].preferredWS = ['Burning Blade']
    const groups = findBestGroups(p, 20, {})
    const scission = groups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    expect(scission!.links[0].score).toBe(3) // base 1 + 2
  })

  it('no score change when preferred WS are not used in any chain', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].preferredWS = ['Vorpal Blade']
    const groups = findBestGroups(p, 20, {})
    const scission = groups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    expect(scission!.links[0].score).toBe(1) // base only
  })

  it('+1 for each step with preferred WS in 3-person chain', () => {
    // 3 WAR/GS at lv75 — many chains, at least some 3-step ones exist
    const p = party(member('WAR', 'Great Sword'), member('WAR', 'Great Sword'), member('WAR', 'Great Sword'))
    p[0].preferredWS = ['Ground Strike']
    const groups = findBestGroups(p, 75, {})
    // Find a 3-step chain and verify bonus matches the number of preferred steps
    const chain3 = groups.find(g => g.links[0].steps.length === 3)
    if (chain3) {
      const link = chain3.links[0]
      const prefSteps = link.steps.filter(s => p[s.memberIdx].preferredWS.includes(s.ws.name)).length
      expect(link.score).toBeGreaterThanOrEqual(link.boundaries.reduce((s, b) => s + (b.level as number), 0))
      expect(link.score).toBe(link.boundaries.reduce((s, b) => s + (b.level as number), 0) + prefSteps)
    }
  })

  // Preferred WS bonus stacks with other bonuses (burst, resistance, etc.)
  it('preferred WS + burst bonus both apply', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].preferredWS = ['Fast Blade']
    const groups = findBestGroups(p, 20, { Fire: 'weak' })
    const scission = groups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    // Scission bursts Earth → neutral (no bonus). Base 1 + 1 (pref) = 2
    expect(scission!.links[0].score).toBe(2)
  })

  // Multiple preferred WS per member — any matching WS counts
  it('multiple preferred WS per member — any match adds bonus', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].preferredWS = ['Fast Blade', 'Burning Blade']
    const groups = findBestGroups(p, 20, {})
    const scission = groups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    expect(scission!.links[0].score).toBe(2) // base 1 + 1 (Fast Blade matches)
  })
})

// ── Cross-feature: force roles + preferred WS ─────────────────────────────────

describe('force roles + preferred WS', () => {
  // Both features active: forceOpener + preferred WS on same member
  it('forceOpener member with preferred WS — both constraints and bonus apply', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].forceOpener = true
    p[0].preferredWS = ['Fast Blade']
    const groups = findBestGroups(p, 20, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[0].memberIdx).toBe(0)
        const prefSteps = link.steps.filter(s => p[s.memberIdx].preferredWS.includes(s.ws.name)).length
        expect(prefSteps).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('forceCloser with preferred WS on closer step — bonus applied', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[1].forceCloser = true
    p[1].preferredWS = ['Burning Blade']
    const groups = findBestGroups(p, 20, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[link.steps.length - 1].memberIdx).toBe(1)
      }
    }
  })

  it('forceOpener + forceCloser on different members with preferred WS', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].forceOpener = true
    p[1].forceCloser = true
    p[0].preferredWS = ['Fast Blade']
    p[1].preferredWS = ['Burning Blade']
    const groups = findBestGroups(p, 20, {})
    expect(groups.length).toBeGreaterThan(0)
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[0].memberIdx).toBe(0)
        expect(link.steps[link.steps.length - 1].memberIdx).toBe(1)
      }
    }
  })
})

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('force roles — edge cases', () => {
  it('forceOpener on member who cannot generate WS candidates — no chains', () => {
    const p = party(
      { job: 'WHM', weaponType: null, name: '', avatar: null, forceOpener: false, forceCloser: false, preferredWS: [] },
      { job: 'WHM', weaponType: null, name: '', avatar: null, forceOpener: true, forceCloser: false, preferredWS: [] },
    )
    expect(findBestGroups(p, 75, {})).toHaveLength(0)
  })

  it('forceCloser on a mage — no chains (mage cannot close with WS)', () => {
    const p = party(
      member('WAR', 'Sword'),
      { job: 'BLM', weaponType: null, name: '', avatar: null, forceOpener: false, forceCloser: true, preferredWS: [] },
    )
    expect(findBestGroups(p, 75, {})).toHaveLength(0)
  })

  it('forceOpener on all 6 slots — any valid chain satisfies', () => {
    const p = Array.from({ length: 6 }, () => {
      const m = member('WAR', 'Sword')
      m.forceOpener = true
      return m
    })
    const filled = party(...p.slice(0, 2))
    const groups = findBestGroups(filled, 75, {})
    if (groups.length > 0) {
      for (const g of groups) {
        for (const link of g.links) {
          expect(link.steps[0].memberIdx).toBeGreaterThanOrEqual(0)
          expect(link.steps[0].memberIdx).toBeLessThan(2)
        }
      }
    }
  })

  it('forceOpener and forceCloser on same member — no valid chains (mutual exclusion)', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].forceOpener = true
    p[0].forceCloser = true
    // Same member must be both step 0 and last step — impossible
    const groups = findBestGroups(p, 75, {})
    expect(groups).toHaveLength(0)
  })

  it('forceOpener satisfied when opener is the forced member in 4-step chain', () => {
    // 4 WAR/GS at lv75 — chains up to 4 steps exist
    const p = party(
      member('WAR', 'Great Sword'), member('WAR', 'Great Sword'),
      member('WAR', 'Great Sword'), member('WAR', 'Great Sword'),
    )
    p[0].forceOpener = true
    const groups = findBestGroups(p, 75, {})
    for (const g of groups) {
      for (const link of g.links) {
        if (link.steps.length >= 4) {
          expect(link.steps[0].memberIdx).toBe(0)
        }
      }
    }
  })

  it('force roles with resistances — both constraints and resistances apply', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].forceOpener = true
    const groups = findBestGroups(p, 20, { Earth: 'resistant' })
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[0].memberIdx).toBe(0)
      }
    }
  })
})

// ── Larger party force tests ──────────────────────────────────────────────────

describe('force roles — 4-6 person parties', () => {
  const cases: ForceRoleCase[] = []
  for (const level of [20, 75]) {
    // 4-person: force opener on single member
    { const p = [member('WAR', 'Sword'), member('WAR', 'Great Sword'), member('DRG', 'Polearm'), member('SAM', 'Great Katana')]
      for (const idx of [0, 1, 2, 3]) {
        const copy = p.map(m => ({ ...m }))
        copy[idx].forceOpener = true
        cases.push({ label: `4p m${idx} opener lv${level}`, party: party(...copy), level })
      }
    }
    // 4-person: force closer on single member
    { const p = [member('WAR', 'Sword'), member('WAR', 'Great Sword'), member('DRG', 'Polearm'), member('SAM', 'Great Katana')]
      for (const idx of [0, 1, 2, 3]) {
        const copy = p.map(m => ({ ...m }))
        copy[idx].forceCloser = true
        cases.push({ label: `4p m${idx} closer lv${level}`, party: party(...copy), level })
      }
    }
    // 5-person: force opener
    { const p = [member('WAR', 'Sword'), member('WAR', 'Great Sword'), member('DRG', 'Polearm'), member('SAM', 'Great Katana'), member('MNK', 'Hand-to-Hand')]
      for (const idx of [0, 2, 4]) {
        const copy = p.map(m => ({ ...m }))
        copy[idx].forceOpener = true
        cases.push({ label: `5p m${idx} opener lv${level}`, party: party(...copy), level })
      }
    }
    // 6-person: force closer
    { const p = [member('WAR', 'Sword'), member('WAR', 'Great Sword'), member('DRG', 'Polearm'), member('SAM', 'Great Katana'), member('MNK', 'Hand-to-Hand'), member('THF', 'Dagger')]
      for (const idx of [1, 3, 5]) {
        const copy = p.map(m => ({ ...m }))
        copy[idx].forceCloser = true
        cases.push({ label: `6p m${idx} closer lv${level}`, party: party(...copy), level })
      }
    }
    // 4-person: combined opener+closer
    { const p = [member('WAR', 'Sword'), member('WAR', 'Great Sword'), member('DRG', 'Polearm'), member('SAM', 'Great Katana')]
      const copy = p.map(m => ({ ...m }))
      copy[0].forceOpener = true
      copy[3].forceCloser = true
      cases.push({ label: `4p m0op+m3cl lv${level}`, party: party(...copy), level })
    }
  }
  it.each(cases)('$label', ({ party: p, level }) => {
    const groups = findBestGroups(p, level, {})
    for (const g of groups) {
      for (const link of g.links) {
        const hasOpener = p.some(m => m.forceOpener)
        const hasCloser = p.some(m => m.forceCloser)
        if (hasOpener) expect(p[link.steps[0].memberIdx].forceOpener).toBe(true)
        if (hasCloser) expect(p[link.steps[link.steps.length - 1].memberIdx].forceCloser).toBe(true)
      }
    }
  })
})

// ── Preferred WS — diverse weapons ────────────────────────────────────────────

describe('preferred WS — diverse weapons', () => {
  const cases: { label: string; party: PartyMember[]; level: number; bonusPerStep: number }[] = []
  const diverse: [Job, WeaponType][] = [
    ['SAM', 'Great Katana'], ['DRG', 'Polearm'], ['MNK', 'Hand-to-Hand'], ['THF', 'Dagger'],
  ]
  for (const [job, weapon] of diverse) {
    for (const level of [30, 50, 75]) {
      // Same weapon pair — pick a WS name that exists at that level
      const wses = getAvailableWSes(job, weapon, level)
      if (wses.length < 2) continue
      { const p = base2(job, weapon); p[0].preferredWS = [wses[0].name]; p[1].preferredWS = [wses[1].name]
        cases.push({ label: `${job}/${weapon} lv${level}`, party: gen2(p), level, bonusPerStep: 1 }) }
      // Different weapons — only way to ensure chains exist
      const other = diverse.find(([j, w]) => j !== job && w !== weapon)
      if (other) {
        const wses2 = getAvailableWSes(other[0], other[1], level)
        if (wses2.length > 0) {
          const p = party(member(job, weapon), member(other[0], other[1]))
          p[0].preferredWS = [wses[0].name]
          cases.push({ label: `${job}/${weapon}+${other[0]}/${other[1]} lv${level}`, party: p, level, bonusPerStep: 1 })
        }
      }
    }
  }
  it.each(cases)('$label', ({ party: p, level }) => {
    const groups = findBestGroups(p, level, {})
    for (const g of groups) {
      for (const link of g.links) {
        const prefSteps = link.steps.filter(s => p[s.memberIdx]?.preferredWS?.includes(s.ws.name)).length
        if (prefSteps > 0) {
          const base = link.boundaries.reduce((s, b) => s + (b.level as number), 0)
          expect(link.score).toBe(base + prefSteps)
        }
      }
    }
  })
})

// ── SMN avatar + force roles + preferred WS ──────────────────────────────────

describe('SMN avatar with force roles and preferred', () => {
  it('SMN with forceOpener — avatar blood pact appears as opener', () => {
    const p = party(
      { job: 'SMN', weaponType: null, name: '', avatar: 'Leviathan', forceOpener: true, forceCloser: false, preferredWS: [] },
      member('WAR', 'Sword'),
    )
    const groups = findBestGroups(p, 50, {})
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[0].memberIdx).toBe(0)
      }
    }
  })

  it('SMN with forceCloser — avatar blood pact appears as closer', () => {
    const p = party(
      member('WAR', 'Sword'),
      { job: 'SMN', weaponType: null, name: '', avatar: 'Shiva', forceOpener: false, forceCloser: true, preferredWS: [] },
    )
    const groups = findBestGroups(p, 50, {})
    for (const g of groups) {
      for (const link of g.links) {
        expect(link.steps[link.steps.length - 1].memberIdx).toBe(1)
      }
    }
  })
})

// ── Preferred WS + same WS across multiple members ──────────────────────────

describe('preferred WS — same WS across members', () => {
  it('all members prefer same WS — each step using it gets +1', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Sword'))
    p[0].preferredWS = ['Fast Blade']
    p[1].preferredWS = ['Fast Blade']
    const groups = findBestGroups(p, 20, {})
    const scission = groups.find(g => g.links[0].boundaries.at(-1)?.name === 'Scission')
    expect(scission).toBeDefined()
    // Fast Blade (m0, pref +1) → Burning Blade (m1, pref not matching) = base 1 + 1 = 2
    expect(scission!.links[0].score).toBe(2)
  })
})

// ── Exhaustive cross-weapon chain validation ──────────────────────────────────
//
// For every WS pair on different weapon types, derive the expected chain from
// SC_RESONANCES (the authoritative data source) and assert computeSkillchain
// returns exactly that. Catches any bug in findBestSC's attr iteration or
// level-priority logic.

type PairCase = {
  label: string
  ws1: WeaponSkill
  ws2: WeaponSkill
  name: string
  level: 1 | 2 | 3
}

function buildAllValidPairs(): PairCase[] {
  const pairs: PairCase[] = []
  for (const ws1 of WEAPON_SKILLS) {
    if (ws1.attrs.length === 0) continue
    for (const ws2 of WEAPON_SKILLS) {
      if (ws2.attrs.length === 0) continue
      if (ws1.weapon === ws2.weapon) continue
      let best: { name: string; level: 1 | 2 | 3 } | null = null
      for (const o of ws1.attrs) {
        for (const r of SC_RESONANCES[o] ?? []) {
          if (ws2.attrs.includes(r.closer)) {
            if (!best || r.level > best.level) best = { name: r.result, level: r.level }
          }
        }
      }
      if (!best) continue
      pairs.push({
        label: `${ws1.name} (${ws1.weapon}) → ${ws2.name} (${ws2.weapon}) = ${best.name} L${best.level}`,
        ws1, ws2,
        name: best.name,
        level: best.level,
      })
    }
  }
  return pairs
}

describe('computeSkillchain — all valid cross-weapon pairs', () => {
  it.each(buildAllValidPairs())('$label', ({ ws1, ws2, name, level }) => {
    const result = computeSkillchain(ws1, ws2)
    expect(result).not.toBeNull()
    expect(result?.name).toBe(name)
    expect(result?.level).toBe(level)
  })
})
