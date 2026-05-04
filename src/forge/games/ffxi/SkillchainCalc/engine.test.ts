import { describe, it, expect } from 'vitest'
import { computeSkillchain, getSkillCap, getAvailableWSes, findBestGroups } from './engine'
import type { ChainGroup, PartyMember } from './engine'
import type { WeaponType } from './data/weaponSkills'
import type { Job } from './data/jobs'
import { WEAPON_SKILLS } from './data/weaponSkills'

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
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Slice')!
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Shadow of Death')!
    expect(computeSkillchain(ws1, ws2)).toBeNull()
  })

  it('computes a Level 2 Distortion chain', () => {
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Tachi: Gekko')!
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Tachi: Yukikaze')!
    const result = computeSkillchain(ws1, ws2)
    expect(result?.name).toBe('Distortion')
    expect(result?.level).toBe(2)
  })

  it('computes a Level 3 Light chain', () => {
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Tachi: Kasha')!
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Tachi: Jinpu')!
    const result = computeSkillchain(ws1, ws2)
    expect(result?.name).toBe('Light')
    expect(result?.level).toBe(3)
  })

  it('picks highest level chain when multiple resonate', () => {
    const ws1 = WEAPON_SKILLS.find(w => w.name === 'Tachi: Gekko')!
    const ws2 = WEAPON_SKILLS.find(w => w.name === 'Tachi: Yukikaze')!
    const result = computeSkillchain(ws1, ws2)
    expect(result?.level).toBeGreaterThanOrEqual(2)
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

  it('Earth resistance ranks Liquefaction above Scission', () => {
    // Scission bursts Earth — if Earth is resistant, Scission score drops
    const p = party(member('WAR', 'Sword'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 20, { Earth: 'resistant' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Liquefaction')
  })

  it('Fire resistance ranks Scission above Liquefaction', () => {
    // Liquefaction bursts Fire — if Fire is resistant, Liquefaction score drops
    const p = party(member('WAR', 'Sword'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 20, { Fire: 'resistant' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Scission')
  })

  it('Fire weakness ranks Liquefaction above Scission', () => {
    // Liquefaction bursts Fire — if Fire is weak, Liquefaction score rises.
    // Bug: Math.round(base * 0.05) with base=5 rounds to 0, killing the bonus.
    // Fix: Math.max(1, ...) ensures a non-zero delta even for L1 chains.
    const p = party(member('WAR', 'Sword'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 20, { Fire: 'weak' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Liquefaction')
  })

  it('Earth weakness ranks Scission above Liquefaction', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 20, { Earth: 'weak' })
    const topSC = groups[0]?.links[0]?.boundaries.at(-1)?.name
    expect(topSC).toBe('Scission')
  })

  it('resistances re-rank but never hide SC types from results', () => {
    const p = party(member('WAR', 'Sword'), member('WAR', 'Great Sword'))

    const withEarth = allFinalSCs(findBestGroups(p, 20, { Earth: 'resistant' }))
    expect(withEarth.has('Scission')).toBe(true)
    expect(withEarth.has('Liquefaction')).toBe(true)

    const withFire = allFinalSCs(findBestGroups(p, 20, { Fire: 'resistant' }))
    expect(withFire.has('Scission')).toBe(true)
    expect(withFire.has('Liquefaction')).toBe(true)
  })

  // 2 SAMs at lv75: Tachi:Jinpu (Fragmentation) + Tachi:Kasha (Fusion) = Light L3
  it('L3 chain ranks first when achievable', () => {
    const p = party(member('SAM', 'Great Katana'), member('SAM', 'Great Katana'))
    const groups = findBestGroups(p, 75, {})
    const topFinal = groups[0]?.links[0]?.boundaries.at(-1)
    expect(topFinal?.level).toBe(3)
    expect(topFinal?.name).toBe('Light')
  })

  it('L3 stays top even when its burst elements are resistant', () => {
    const p = party(member('SAM', 'Great Katana'), member('SAM', 'Great Katana'))
    // Light bursts all elements — penalise several; it should still beat L2/L1
    const groups = findBestGroups(p, 75, { Fire: 'resistant', Ice: 'resistant', Wind: 'resistant' })
    const topFinal = groups[0]?.links[0]?.boundaries.at(-1)
    expect(topFinal?.level).toBe(3)
  })

  // 4 WARs: Sword members have Swift Blade (Gravitation); GS members have Freezebite (Distortion)
  // Pair {0,1} and pair {2,3} can each form Darkness L3 independently.
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

  it('level 5 WAR/GS produces only Scission (single WS available)', () => {
    // At lv5 WAR GS cap ≈ 16 — only Hard Slash (Scission, req 5) is available
    const p = party(member('WAR', 'Great Sword'), member('WAR', 'Great Sword'))
    const groups = findBestGroups(p, 5, {})
    const scs = allFinalSCs(groups)
    expect(scs.has('Scission')).toBe(true)
    expect(scs.size).toBe(1)
  })

  it('level 75 WAR/GS unlocks more SC types than level 5', () => {
    const p = party(member('WAR', 'Great Sword'), member('WAR', 'Great Sword'))
    const lv5 = allFinalSCs(findBestGroups(p, 5, {}))
    const lv75 = allFinalSCs(findBestGroups(p, 75, {}))
    expect(lv75.size).toBeGreaterThan(lv5.size)
  })
})
