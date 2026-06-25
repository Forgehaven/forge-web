import { WEAPON_SKILLS, type WeaponSkill, type WeaponType, type SCAttr } from '../data/weaponSkills'
import { JOBS, SKILL_CAP_75, type Job, type SkillRank } from '../data/jobs'
import { SC_BURST_ELEMENTS, SC_RESONANCES, type Element, type ResistanceMap } from '../data/elements'
import { getBurstSpells, type BurstSpell as Spell } from '../data/burstSpells'

export type { SCAttr }
export type { ResistanceState, ResistanceMap } from '../data/elements'

export interface SkillchainResult {
  name: string
  level: 1 | 2 | 3
  elements: Element[]
}

export interface PartyMember {
  job: Job | null
  weaponType: WeaponType | null
  name: string
}

export interface BurstInfo {
  memberIdx: number
  job: Job
  spell: Spell
}

export interface ChainStep {
  memberIdx: number
  ws: WeaponSkill
}

// boundaries[i] = SC produced when steps[i+1] fires (length = steps.length - 1).
// Last boundary is the final result.
export interface SkillchainLink {
  steps: ChainStep[]
  boundaries: SkillchainResult[]
  score: number
  // burstsByBoundary[i] = burst spells available for boundaries[i]
  burstsByBoundary: Partial<Record<Element, BurstInfo[]>>[]
}

export interface ChainGroup {
  links: SkillchainLink[]
  totalScore: number
}

// Best SC from explicit attr lists — used for both WS→WS and SC→WS
function findBestSC(openerAttrs: SCAttr[], closerAttrs: SCAttr[]): SkillchainResult | null {
  let best: SkillchainResult | null = null
  for (const o of openerAttrs) {
    const resonances = SC_RESONANCES[o] ?? []
    for (const r of resonances) {
      if (closerAttrs.includes(r.closer)) {
        if (!best || r.level > best.level) best = { name: r.result, level: r.level, elements: r.elements }
      }
    }
  }
  return best
}

export function computeSkillchain(ws1: WeaponSkill, ws2: WeaponSkill): SkillchainResult | null {
  return findBestSC(ws1.attrs, ws2.attrs)
}

// Extends a link by one more step if that step closes against the current final SC
function tryExtend(
  link: SkillchainLink,
  cand: ChainStep,
): SkillchainLink | null {
  const prev = link.boundaries[link.boundaries.length - 1]
  if (prev.level === 3) return null
  if (link.steps.some(s => s.memberIdx === cand.memberIdx)) return null
  const next = findBestSC([prev.name as SCAttr], cand.ws.attrs)
  if (!next) return null
  return {
    steps: [...link.steps, cand],
    boundaries: [...link.boundaries, next],
    score: 0,
    burstsByBoundary: [],
  }
}

function scoreLink(
  link: SkillchainLink,
  resistances: ResistanceMap,
  mageBursts: { memberIdx: number; job: Job; bursts: Partial<Record<Element, Spell>> }[],
): SkillchainLink {
  const finalResult = link.boundaries[link.boundaries.length - 1]

  const burstsByBoundary = link.boundaries.map(b => {
    const burstElements: Element[] = SC_BURST_ELEMENTS[b.name] ?? []
    const byEl: Partial<Record<Element, BurstInfo[]>> = {}
    for (const el of burstElements) {
      const infos: BurstInfo[] = []
      for (const mb of mageBursts) {
        const spell = mb.bursts[el]
        if (spell) infos.push({ memberIdx: mb.memberIdx, job: mb.job, spell })
      }
      if (infos.length > 0) byEl[el] = infos
    }
    return byEl
  })

  // Base: sum of all boundary levels (rewards longer chains and higher intermediates)
  // +1 if any burst element is weak, -1 if no weak and any resistant
  // +1 if any party member can burst off the final SC
  let score = link.boundaries.reduce((s, b) => s + (b.level as number), 0)

  const finalBurstElements: Element[] = SC_BURST_ELEMENTS[finalResult.name] ?? []
  const hasWeakBurst = finalBurstElements.some(el => (resistances[el] ?? 'neutral') === 'weak')
  const hasResistantBurst = finalBurstElements.some(el => (resistances[el] ?? 'neutral') === 'resistant')
  if (hasWeakBurst) score += 1
  else if (hasResistantBurst) score -= 1

  const finalBursts = burstsByBoundary[burstsByBoundary.length - 1]
  if (Object.keys(finalBursts).length > 0) score += 1

  return { ...link, score, burstsByBoundary }
}

function linksOverlap(a: SkillchainLink, b: SkillchainLink): boolean {
  return a.steps.some(sa => b.steps.some(sb => sa.memberIdx === sb.memberIdx))
}

export function findBestGroups(
  party: PartyMember[],
  levelSync: number,
  resistances: ResistanceMap,
): ChainGroup[] {
  // (memberIdx, ws) pairs for non-mage members
  const candidates: ChainStep[] = []
  for (let i = 0; i < party.length; i++) {
    const m = party[i]
    if (!m.job || !m.weaponType) continue
    const jobInfo = JOBS.find(j => j.name === m.job)
    if (!jobInfo || (!jobInfo.roles.includes('melee') && !jobInfo.roles.includes('ranged'))) continue
    for (const ws of getAvailableWSes(m.job, m.weaponType, levelSync)) {
      candidates.push({ memberIdx: i, ws })
    }
  }

  const mageBursts: { memberIdx: number; job: Job; bursts: Partial<Record<Element, Spell>> }[] = []
  for (let i = 0; i < party.length; i++) {
    const m = party[i]
    if (!m.job) continue
    const bursts = getBurstSpells(m.job, levelSync)
    if (Object.keys(bursts).length === 0) continue
    mageBursts.push({ memberIdx: i, job: m.job, bursts })
  }

  // ── Build 2-step links ──────────────────────────────────────────────────────
  const links2: SkillchainLink[] = []
  const seen2 = new Set<string>()

  for (const a of candidates) {
    for (const b of candidates) {
      if (a.memberIdx === b.memberIdx) continue
      const sc = computeSkillchain(a.ws, b.ws)
      if (!sc) continue
      const key = `${a.memberIdx}:${a.ws.name}|${b.memberIdx}:${b.ws.name}`
      if (seen2.has(key)) continue
      seen2.add(key)
      links2.push({ steps: [a, b], boundaries: [sc], score: 0, burstsByBoundary: [] })
    }
  }

  // ── Build 3-step links ──────────────────────────────────────────────────────
  const links3: SkillchainLink[] = []
  const seen3 = new Set<string>()

  for (const link2 of links2) {
    for (const c of candidates) {
      const ext = tryExtend(link2, c)
      if (!ext) continue
      const key = ext.steps.map(s => `${s.memberIdx}:${s.ws.name}`).join('|')
      if (seen3.has(key)) continue
      seen3.add(key)
      links3.push(ext)
    }
  }

  // ── Build 4-step links ──────────────────────────────────────────────────────
  const links4: SkillchainLink[] = []
  const seen4 = new Set<string>()

  for (const link3 of links3) {
    for (const d of candidates) {
      const ext = tryExtend(link3, d)
      if (!ext) continue
      const key = ext.steps.map(s => `${s.memberIdx}:${s.ws.name}`).join('|')
      if (seen4.has(key)) continue
      seen4.add(key)
      links4.push(ext)
    }
  }

  // ── Score all links ─────────────────────────────────────────────────────────
  const allScored = [...links2, ...links3, ...links4]
    .map(link => scoreLink(link, resistances, mageBursts))
    .sort((a, b) => b.score - a.score)

  // Keep best chain per (member set, final SC type) so every distinct SC outcome
  // for a given pair survives — not just the single highest scorer. The old
  // members-only key caused valid alternatives to be silently dropped until a
  // resistance change flipped which one "won" the slot.
  const poolMap = new Map<string, SkillchainLink>()
  for (const link of allScored) {
    const members = link.steps.map(s => s.memberIdx).sort((a, b) => a - b).join(',')
    const sc = link.boundaries[link.boundaries.length - 1].name
    const key = `${members}:${sc}`
    if (!poolMap.has(key)) poolMap.set(key, link)
  }
  const pool = [...poolMap.values()].sort((a, b) => b.score - a.score)

  // ── Find non-overlapping groups ─────────────────────────────────────────────
  const CONCURRENCY_BONUS = 2
  const groups: ChainGroup[] = []

  for (const link of pool) {
    groups.push({ links: [link], totalScore: link.score })
  }
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (linksOverlap(pool[i], pool[j])) continue
      groups.push({ links: [pool[i], pool[j]], totalScore: pool[i].score + pool[j].score + CONCURRENCY_BONUS })
    }
  }
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (linksOverlap(pool[i], pool[j])) continue
      for (let k = j + 1; k < pool.length; k++) {
        if (linksOverlap(pool[i], pool[k])) continue
        if (linksOverlap(pool[j], pool[k])) continue
        groups.push({ links: [pool[i], pool[j], pool[k]], totalScore: pool[i].score + pool[j].score + pool[k].score + CONCURRENCY_BONUS * 2 })
      }
    }
  }

  const seenGroups = new Set<string>()
  const result: ChainGroup[] = []
  for (const g of groups.sort((a, b) => b.totalScore - a.totalScore)) {
    const key = g.links.map(l => l.steps.map(s => s.ws.name).join('→')).sort().join(',')
    if (!seenGroups.has(key)) {
      seenGroups.add(key)
      result.push(g)
    }
    if (result.length >= 15) break
  }
  return result
}

// ── Skill cap calculation ─────────────────────────────────────────────────────

const GROUP_BREAKPOINTS: Record<'AB' | 'B' | 'C' | 'D' | 'E' | 'F', number[]> = {
  AB: [6,  33, 63,  93, 123, 153, 203],
  B:  [5,  31, 60,  89, 118, 147, 196],
  C:  [5,  30, 58,  86, 114, 142, 190],
  D:  [4,  28, 55,  82, 109, 136, 183],
  E:  [4,  26, 51,  76, 101, 126, 171],
  F:  [4,  24, 47,  70,  93, 116, 159],
}
const BREAKPOINT_LEVELS = [1, 10, 20, 30, 40, 50, 60]

const CAPS_61_75: Record<SkillRank, number[]> = {
  'A+': [207,212,217,222,227,232,236,241,246,251,256,261,266,271,276],
  'A-': [207,211,215,219,223,227,231,235,239,244,249,254,259,264,269],
  'B+': [199,203,207,210,214,218,221,225,229,233,237,241,246,251,256],
  'B':  [199,202,205,208,212,215,218,221,225,228,232,236,240,245,250],
  'B-': [198,201,204,206,209,212,214,217,220,223,226,229,232,236,240],
  'C+': [192,195,197,200,202,205,207,210,212,215,218,221,224,227,230],
  'C':  [192,194,196,199,201,203,205,208,210,212,214,217,219,222,225],
  'C-': [192,194,196,198,200,202,204,206,208,210,212,214,216,218,220],
  'D':  [184,186,188,190,192,194,195,197,199,201,203,205,207,208,210],
  'E':  [172,174,176,178,180,182,184,186,188,190,192,194,196,198,200],
  'F':  [161,163,165,167,169,171,173,175,177,179,181,183,185,187,189],
}

export function getSkillCap(rank: SkillRank, level: number): number {
  const clamped = Math.max(1, Math.min(75, level))
  if (clamped >= 61) return CAPS_61_75[rank][clamped - 61]

  const group: keyof typeof GROUP_BREAKPOINTS =
    rank === 'A+' || rank === 'A-' ? 'AB'
    : rank === 'B+' || rank === 'B' || rank === 'B-' ? 'B'
    : rank === 'C+' || rank === 'C' || rank === 'C-' ? 'C'
    : rank === 'D' ? 'D'
    : rank === 'E' ? 'E'
    : 'F'

  const caps = GROUP_BREAKPOINTS[group]
  for (let i = 0; i < BREAKPOINT_LEVELS.length - 1; i++) {
    const l1 = BREAKPOINT_LEVELS[i], l2 = BREAKPOINT_LEVELS[i + 1]
    if (clamped >= l1 && clamped <= l2) {
      const t = (clamped - l1) / (l2 - l1)
      return Math.floor(caps[i] + t * (caps[i + 1] - caps[i]))
    }
  }
  return caps[caps.length - 1]
}

export function getAvailableWSes(job: Job, weaponType: WeaponType, levelSync: number): WeaponSkill[] {
  const jobInfo = JOBS.find(j => j.name === job)
  if (!jobInfo) return []
  const rank = jobInfo.weapons[weaponType]
  if (!rank) return []
  const cap = getSkillCap(rank, levelSync)
  return WEAPON_SKILLS.filter(ws =>
    ws.weapon === weaponType &&
    ws.skillReq <= cap &&
    (!ws.questLevel || levelSync >= ws.questLevel)
  )
}

export { SKILL_CAP_75 }
