import { describe, it, expect } from 'vitest'
import { computeSkillchain, getSkillCap, getAvailableWSes, findBestGroups } from './engine'
import type { ChainGroup, PartyMember } from './engine'
import type { WeaponSkill, WeaponType } from '../data/weaponSkills'
import type { Job } from '../data/jobs'
import { WEAPON_SKILLS } from '../data/weaponSkills'
import { SC_RESONANCES } from '../data/elements'

// ── Helpers ─────────────────────────────────────────────────────────────────

function member(job: Job, weaponType: WeaponType): PartyMember {
  return { job, weaponType, name: '' }
}

function emptySlot(): PartyMember {
  return { job: null, weaponType: null, name: '' }
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

  // 4 WARs: Sword members have Swift Blade (Gravitation); GS members have Ground Strike (Distortion)
  // Pair {0,1} and pair {2,3} can each form Darkness L3 (Gravitation→Distortion) independently.
  it('two concurrent L3 chains score higher than any single chain', () => {
    const p = party(
      member('WAR', 'Sword'),      // m0: Swift Blade (Gravitation)
      member('WAR', 'Great Sword'), // m1: Freezebite (Distortion)
      member('WAR', 'Sword'),      // m2: Swift Blade (Gravitation)
      member('WAR', 'Great Sword'), // m3: Freezebite (Distortion)
    )
    const groups = findBestGroups(p, 75, {})
    const top = groups[0]
    expect(top.links.length).toBe(2)
    expect(top.totalScore).toBeGreaterThan(1000) // more than a single L3
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
      { job: 'BLM', weaponType: null, name: '' },
      { job: 'WHM', weaponType: null, name: '' },
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
