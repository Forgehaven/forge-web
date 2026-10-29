import {
  BASE_CP, CULTURE_FRAG_COST, DEFAULT_MAX, ELEMENTS, EXCLUSIVE_SPHERES, MAX_BLANKETS_PER_MONTH,
  MAX_RITUAL_SLOTS, OCC_CLASS, RACIAL_CP, RITUAL_BASE_COSTS, SLOTS_PER_CIRCLE,
  SPELL_CIRCLE_COSTS, SPHERE_NAMES, sphereAt, sphereIndex, sphereName, MAX_SLOTS_PER_CIRCLE, SPHERE_SURCHARGE_FRAGS,
  SURCHARGE_SPHERES, TABLE, WEAPON_GROUPS, ordinal,
  type LevelRow,
} from './rules'
import { CULTURES, FAVOURED_COSTS, FAVOURED_VOCATIONS, FRAG_RACES, OCC_ABILITIES, RACES, SKILLS, VOCATIONS, VOCATION_PREREQS } from './data'
import type { Race, Skill, Vocation } from './types'

export const SPELL_SLOT = 'Spell Slot'
export const RITUAL_SLOT = 'Ritual Slot'
export const ELEMENTAL_ATTUNEMENT = 'Elemental Attunement'
export const PARAGON = 'Paragon'
export const SPELL_VERSATILITY = 'Spell Versatility'
export function slotCost(b: Build, circle: number) {
  const costs = SPELL_CIRCLE_COSTS[String(circle)]
  return costs ? occCost(costs, b) : 0
}
// Spell Versatility: half the augmented slot's CP + 5, in both CP and frags (slot costs are all even).
export const versatilityCost = (b: Build, choice?: string) => slotCost(b, Number(choice)) / 2 + 5

export interface Purchase {
  id: string
  skill: string
  // 0 = character creation, n = bought after blanket n.
  at: number
  // Weapon / group, element, spell circle, or 'Light|3' for Paragon.
  choice?: string
}

export interface Build {
  v: 1
  name: string
  race: string
  culture: string
  occupation: string
  vocation: string
  schools: string[]
  attunement: string
  startMonth: string
  blankets: string[]
  purchases: Purchase[]
  // `${circle}-${slot}` or 'paragon' -> `${sphere}|${spell}`
  spells: Record<string, string>
  // sandbox (default): free picking against a blanket count, `simple` holds the picks.
  // timeline: the hand-dated `blankets` + `purchases` above.
  // priority: `priority.purchases` in buying order, each dated by priorityView.
  mode?: PlanMode
  simple?: { blankets: number; purchases: Purchase[] }
  priority?: Priority
}

export type PlanMode = 'sandbox' | 'timeline' | 'priority'

export interface Priority {
  // Blankets applied each month, unless `months` overrides that month.
  perMonth: number
  months: Record<string, number>
  purchases: Purchase[]
}

export function emptyBuild(startMonth: string): Build {
  return {
    v: 1, name: '', race: '', culture: '', occupation: '', vocation: '',
    schools: ['', '', ''], attunement: '', startMonth, blankets: [], purchases: [], spells: {},
    mode: 'sandbox', simple: { blankets: 0, purchases: [] },
    priority: { perMonth: MAX_BLANKETS_PER_MONTH, months: {}, purchases: [] },
  }
}

export type CatalogSkill = Skill & { racial?: boolean; tier?: number; category: string }

export function raceData(race: string): Race | null {
  return RACES[race] ?? FRAG_RACES[race] ?? null
}

export function vocationData(voc: string): Vocation | null {
  return VOCATIONS[voc] ?? FAVOURED_VOCATIONS[voc] ?? null
}

function favouredTable(b: Build) {
  const fv = FAVOURED_VOCATIONS[b.vocation]
  if (!fv) return null
  return FAVOURED_COSTS[fv.group ?? 'Champion']
}

// 0 until an occupation is picked; costed purchases are blocked until then.
function occCost(costs: Record<string, number>, b: Build) {
  return costs[b.occupation] ?? 0
}

// ---- CP and level ----

export function cpAt(blankets: number, cpBonus = 0) {
  let total = BASE_CP
  let remaining = blankets
  let row = 0
  while (remaining > 0) {
    const cur = TABLE[row]
    const next = TABLE[row + 1]
    if (!next) {
      total += remaining * cur.cpPer
      break
    }
    const needed = Math.ceil((next.threshold - total) / cur.cpPer)
    if (remaining >= needed) {
      total += needed * cur.cpPer
      remaining -= needed
      row++
    } else {
      total += remaining * cur.cpPer
      remaining = 0
    }
  }
  return Math.round(total) + cpBonus
}

// Racial bonus CP never counts toward level.
export function levelRow(cp: number, cpBonus = 0): LevelRow {
  const adj = cp - cpBonus
  const last = TABLE[TABLE.length - 1]
  const prev = TABLE[TABLE.length - 2]
  if (adj >= last.threshold) {
    const extra = Math.floor((adj - last.threshold) / (last.threshold - prev.threshold))
    if (extra === 0) return last
    const level = last.level + extra
    return {
      level,
      threshold: last.threshold + extra * (last.threshold - prev.threshold),
      cpPer: last.cpPer,
      warrior: last.warrior + extra * (last.warrior - prev.warrior),
      rogue: last.rogue + extra * (last.rogue - prev.rogue),
      // +1 every level except multiples of 3
      scholar: 3 + (level - 1) - Math.floor(level / 3),
    }
  }
  for (let i = TABLE.length - 1; i >= 0; i--) if (adj >= TABLE[i].threshold) return TABLE[i]
  return TABLE[0]
}

// ---- Catalog ----

export function catalog(b: Build): { cat: string; skills: CatalogSkill[] }[] {
  const tag = (cat: string, skills: Skill[]) => ({ cat, skills: skills.map(s => ({ ...s, category: cat })) })
  const out: { cat: string; skills: CatalogSkill[] }[] = []

  const culture = CULTURES[b.culture]
  const race = raceData(b.race)
  const racial = (culture?.purchased ?? race?.purchased ?? []).map(s => ({
    costs: null, frag: 0, prereqPerPurchase: false, ...s, racial: true, category: 'Racial',
  }))
  out.push({ cat: 'Racial', skills: racial })

  const frag = SKILLS.find(c => c.cat === 'Frag Skills')
  if (frag) out.push(tag(frag.cat, frag.skills))

  const voc = vocationData(b.vocation)
  const abilities = voc?.abilities ?? OCC_ABILITIES[b.occupation] ?? []
  if (abilities.length) {
    out.push({
      cat: 'Occupational Abilities',
      skills: abilities.map(ab => {
        const prev = abilities.find(a => a.tier === ab.tier - 3)
        return {
          name: ab.name, costs: null, cp: ab.cp, frag: 0, maxPurchases: ab.maxPurchases ?? DEFAULT_MAX,
          bodyBonus: ab.bodyBonus ?? 0, strBonus: 0, prereqPerPurchase: false,
          prereqs: prev ? [{ name: prev.name, minCount: 1 }] : [],
          desc: ab.desc, tier: ab.tier, category: 'Occupational Abilities',
        }
      }),
    })
  }

  const cls = OCC_CLASS[b.occupation]
  for (const c of SKILLS) {
    if (['General', 'Frag Skills'].includes(c.cat) || c.cat.endsWith('Class Frag Skills')) continue
    out.push(tag(c.cat, c.skills))
    const classFrag = SKILLS.find(f => f.cat === `${c.cat} Class Frag Skills`)
    if (classFrag && cls === c.cat.toLowerCase()) out.push(tag(classFrag.cat, classFrag.skills))
  }
  return out
}

// ---- Replay ----

export interface ReplayState {
  counts: Map<string, number>
  weapons: string[]
  exotics: string[]
  attunements: string[]
  circles: number[]
  versatile: number[]
  rituals: number
  racial: number
  spent: number
  frags: number
}

export interface PurchaseResult {
  label: string
  cost: number
  frag: number
  error: string | null
}

export interface Step {
  at: number
  month: string
  cp: number
  row: LevelRow
  // Cumulative CP spent through this step.
  spent: number
  error: string | null
}

function newState(): ReplayState {
  return {
    counts: new Map(), weapons: [...WEAPON_GROUPS.Simple], exotics: [], attunements: [],
    circles: Array(10).fill(0), versatile: Array(10).fill(0), rituals: 0, racial: 0, spent: 0, frags: 0,
  }
}

const count = (st: ReplayState, name: string) => st.counts.get(name) ?? 0

export function weaponGroups(st: ReplayState) {
  return ['Simple', ...['Medium', 'Large'].filter(g => count(st, `Weapon Group Proficiency: ${g}`) > 0)]
}

// Legal answers for a choice skill given what is owned so far.
export function choiceOptions(sk: Skill, st: ReplayState): string[] {
  if (sk.name === ELEMENTAL_ATTUNEMENT) return ELEMENTS.filter(e => !st.attunements.includes(e))
  if (sk.name === SPELL_SLOT) return ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  if (sk.name === SPELL_VERSATILITY) return ['1', '2', '3', '4', '5', '6', '7', '8', '9'].filter(c => st.circles[+c] > st.versatile[+c])
  if (sk._paragon) {
    const circles = [1, 2, 3, 4, 5, 6, 7].filter(c => st.circles[c] > 0)
    return ['Light', 'Dark'].flatMap(sp => circles.map(c => `${sp}|${c}`))
  }
  if (sk._weaponChoice === 'exotic') return WEAPON_GROUPS.Exotic.filter(w => !st.exotics.includes(w))
  if (sk._weaponChoice === 'group') return weaponGroups(st)
  if (sk._weaponChoice === 'specific') {
    const summoned = sk.name === 'Specialization +1: Weapon Specific'
    return st.weapons.filter(w => w !== 'Summoned Weapon' || summoned)
  }
  return []
}

export function needsChoice(sk: Skill) {
  return !!sk._weaponChoice || !!sk._paragon || sk.name === ELEMENTAL_ATTUNEMENT || sk.name === SPELL_SLOT || sk.name === SPELL_VERSATILITY
}

export function choiceLabel(skillName: string, choice?: string) {
  if (!choice) return skillName
  if (skillName === SPELL_SLOT) return `Spell Slot: ${ordinal(Number(choice))} Circle`
  if (skillName === SPELL_VERSATILITY) return `Spell Versatility: ${ordinal(Number(choice))} Circle`
  if (skillName === PARAGON) {
    const [sp, c] = choice.split('|')
    return `Paragon (${sp}, ${ordinal(Number(c))} Circle)`
  }
  return `${skillName}: ${choice}`
}

function lookup(b: Build) {
  const map = new Map<string, CatalogSkill>()
  for (const c of catalog(b)) for (const s of c.skills) if (!map.has(s.name)) map.set(s.name, s)
  return map
}

function skillCost(sk: CatalogSkill, b: Build, choice?: string): number {
  if (sk.racial) return RACIAL_CP
  if (sk._paragon) return Number(choice?.split('|')[1] ?? 0) + 10
  if (sk.name === SPELL_VERSATILITY) return versatilityCost(b, choice)
  const fav = favouredTable(b)
  if (sk.costs && fav && fav[sk.name] !== undefined) return fav[sk.name]
  if (sk.costs) return occCost(sk.costs, b)
  return sk.cp ?? 0
}

function prereqError(sk: CatalogSkill, st: ReplayState, level: number): string | null {
  const have = count(st, sk.name)
  for (const pre of sk.prereqs) {
    if (pre.name.startsWith('Level ')) {
      const req = parseInt(pre.name.slice(6))
      if (level < req) return `Requires level ${req}`
      continue
    }
    const options = pre.name.split('|').map(o => o.trim())
    const need = pre.minCount ?? 1
    const required = !pre.primaryGate && sk.prereqPerPurchase ? need * (have + 1) : need
    const got = options.reduce((sum, o) => sum + count(st, o), 0)
    if (got < required) return `Requires ${required > 1 ? `${required}x ` : ''}${options.join(' or ')}`
  }
  return null
}

interface Ctx {
  b: Build
  skills: Map<string, CatalogSkill>
  level: number
}

// Returns [cost, frag, error]. `strictChoice` false lets a catalog probe skip
// the not-yet-made choice.
function check(p: Purchase, st: ReplayState, ctx: Ctx, strictChoice: boolean): [number, number, string | null] {
  const { b, level } = ctx
  const fav = FAVOURED_VOCATIONS[b.vocation]

  const sphereIdx = sphereIndex(p.skill)
  if (sphereIdx >= 0) {
    const sphere = sphereAt(sphereIdx)
    const cost = fav ? sphere.favouredCosts[fav.group ?? 'Champion'] : occCost(sphere.costs, b)
    const school = b.schools[sphereIdx]
    const frag = SURCHARGE_SPHERES.includes(school) ? SPHERE_SURCHARGE_FRAGS : 0
    if (!b.occupation) return [cost, frag, 'Pick an occupation first']
    if (count(st, p.skill) > 0) return [cost, frag, 'Already owned']
    const pre = sphereIdx === 0 ? 'Read Magic' : sphereName(sphereIdx - 1)
    if (count(st, pre) === 0) return [cost, frag, `Requires ${pre}`]
    return [cost, frag, null]
  }

  if (p.skill === SPELL_SLOT) {
    const circle = Number(p.choice)
    const cost = slotCost(b, circle)
    if (!b.occupation) return [cost, 0, 'Pick an occupation first']
    if (!(circle >= 1 && circle <= 9)) return [cost, 0, 'Pick a circle']
    if (count(st, SPHERE_NAMES[0]) === 0) return [cost, 0, `Requires ${SPHERE_NAMES[0]}`]
    if (circle >= 5 && count(st, 'Read Magic: Advanced') === 0) return [cost, 0, 'Requires Read Magic: Advanced']
    const pyramid = pyramidError(st.circles, circle)
    if (pyramid) return [cost, 0, pyramid]
    return [cost, 0, null]
  }

  if (p.skill === RITUAL_SLOT) {
    const cost = occCost(RITUAL_BASE_COSTS, b) * (st.rituals + 1)
    if (!b.occupation) return [cost, 0, 'Pick an occupation first']
    if (count(st, 'Read Magic: Ritual') === 0) return [cost, 0, 'Requires Read Magic: Ritual']
    if (st.circles[9] < 1) return [cost, 0, 'Requires a 9th Circle slot']
    if (st.rituals >= MAX_RITUAL_SLOTS) return [cost, 0, 'Maxed']
    return [cost, 0, null]
  }

  const sk = ctx.skills.get(p.skill)
  if (!sk) return [0, 0, 'Not available to this character']
  const cost = skillCost(sk, b, p.choice)
  const frag = sk.name === SPELL_VERSATILITY ? versatilityCost(b, p.choice) : sk.frag
  const err = (e: string): [number, number, string] => [cost, frag, e]
  const have = count(st, sk.name)

  if (sk.costs && !b.occupation) return err('Pick an occupation first')
  if (sk.name === ELEMENTAL_ATTUNEMENT) {
    const elemental = b.schools.some((s, i) => s === 'Elemental' && count(st, sphereName(i)) > 0)
    if (!elemental) return err('Requires the Elemental sphere')
    if (!b.attunement) return err('Pick a primary attunement')
  }
  if (sk._paragon) {
    if (fav) return err('Not available to Favoured Vocations')
    if (!st.circles.some(n => n > 0)) return err('Requires a spell slot')
  }
  if (have >= (sk.maxPurchases || DEFAULT_MAX)) return err('Maxed')
  if (sk.racial && st.racial >= Math.ceil(level / 2)) return err(`Racial cap at level ${level} (${Math.ceil(level / 2)})`)
  if (sk.tier && level < sk.tier) return err(`Requires level ${sk.tier}`)
  const pre = prereqError(sk, st, level)
  if (pre) return err(pre)
  if (needsChoice(sk)) {
    if (p.choice === undefined) return [cost, frag, strictChoice ? 'Make a choice' : null]
    if (!choiceOptions(sk, st).includes(p.choice)) return err(`${p.choice} not available`)
  }
  return [cost, frag, null]
}

function apply(p: Purchase, st: ReplayState, ctx: Ctx, cost: number, frag: number) {
  st.counts.set(p.skill, count(st, p.skill) + 1)
  st.spent += cost
  st.frags += frag
  if (p.skill === SPELL_SLOT) st.circles[Number(p.choice)]++
  if (p.skill === RITUAL_SLOT) st.rituals++
  if (p.skill === SPELL_VERSATILITY) st.versatile[Number(p.choice)]++
  if (p.skill === ELEMENTAL_ATTUNEMENT && p.choice) st.attunements.push(p.choice)
  if (ctx.skills.get(p.skill)?.racial) st.racial++
  if (p.skill === 'Weapon Group Proficiency: Medium') st.weapons.push(...WEAPON_GROUPS.Medium)
  if (p.skill === 'Weapon Group Proficiency: Large') st.weapons.push(...WEAPON_GROUPS.Large)
  if (p.skill === 'Weapon Specific Proficiency: Exotic' && p.choice) {
    st.exotics.push(p.choice)
    st.weapons.push(p.choice)
  }
}

export function monthCounts(b: Build) {
  const m = new Map<string, number>()
  for (const month of b.blankets) m.set(month, (m.get(month) ?? 0) + 1)
  return m
}

export function addMonths(month: string, n: number) {
  const [y, m] = month.split('-').map(Number)
  const t = y * 12 + (m - 1) + n
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

export function nextBlanketMonth(b: Build) {
  const last = b.blankets[b.blankets.length - 1] ?? b.startMonth
  if ((monthCounts(b).get(last) ?? 0) < MAX_BLANKETS_PER_MONTH) return last
  return addMonths(last, 1)
}

// Inserts a blanket in month order; purchases on later blankets move with them.
export function insertBlanket(b: Build, month: string): { build: Build; at: number } {
  const k = b.blankets.filter(m => m <= month).length
  const blankets = [...b.blankets]
  blankets.splice(k, 0, month)
  const purchases = b.purchases.map(p => (p.at > k ? { ...p, at: p.at + 1 } : p))
  return { build: { ...b, blankets, purchases }, at: k + 1 }
}

// Back-fills `count` blankets from the start month at the monthly max, for
// characters that already have history.
export function pastBlankets(b: Build, count: number): Build {
  let out = b
  let month = b.startMonth
  for (let i = 0; i < count; i++) {
    while ((monthCounts(out).get(month) ?? 0) >= MAX_BLANKETS_PER_MONTH) month = addMonths(month, 1)
    out = insertBlanket(out, month).build
  }
  return out
}

// Timeline order. Within a step, spell slots are re-sequenced so each next
// slot is one the pyramid rules (Core p.106) allow given every slot before it,
// so the order they were clicked in does not matter.
export function sortedPurchases(b: Build) {
  const ordered = b.purchases.map((p, i) => [p, i] as const)
    .sort((x, y) => x[0].at - y[0].at || x[1] - y[1])
    .map(([p]) => p)
  const circles = Array(10).fill(0)
  const out: Purchase[] = []
  for (let i = 0; i < ordered.length;) {
    const at = ordered[i].at
    let end = i
    while (end < ordered.length && ordered[end].at === at) end++
    const step = ordered.slice(i, end)
    const slots = step.filter(p => p.skill === SPELL_SLOT)
    const rest = [...slots]
    const sequenced: Purchase[] = []
    while (rest.length) {
      const legal = rest.findIndex(p => !pyramidError(circles, Number(p.choice)))
      const [next] = rest.splice(legal < 0 ? 0 : legal, 1)
      const c = Number(next.choice)
      if (c >= 1 && c <= 9) circles[c]++
      sequenced.push(next)
    }
    // Slots keep their positions in the step but take the sequenced order.
    let s = 0
    for (const p of step) out.push(p.skill === SPELL_SLOT ? sequenced[s++] : p)
    i = end
  }
  return out
}

// Core p.105-106. circles[c] = slots owned at circle c (1-9).
export function pyramidError(circles: number[], circle: number): string | null {
  const full = [1, 2, 3, 4, 5, 6, 7, 8, 9].every(c => circles[c] >= SLOTS_PER_CIRCLE)
  if (full) {
    if (circles[circle] >= MAX_SLOTS_PER_CIRCLE) return `${ordinal(circle)} Circle is at the maximum of ${MAX_SLOTS_PER_CIRCLE}`
    if (circle > 1 && circles[circle] + 1 > circles[circle - 1]) return `Needs another ${ordinal(circle - 1)} Circle slot first`
    return null
  }
  if (circles[circle] >= SLOTS_PER_CIRCLE) return `${ordinal(circle)} Circle is full until the whole pyramid is 5 wide`
  if (circle > 1) {
    const need = Math.min(circles[circle] + 2, SLOTS_PER_CIRCLE)
    if (circles[circle - 1] < need) return `Needs ${need} ${ordinal(circle - 1)} Circle slots`
  }
  // Two more slots in a circle than the one above forces the next buy upward.
  for (let c = 1; c < 9; c++) {
    if (circles[c] >= circles[c + 1] + 2 && circles[c + 1] < SLOTS_PER_CIRCLE) {
      return c + 1 === circle ? null : `Next slot must be ${ordinal(c + 1)} Circle`
    }
  }
  return null
}

export interface Evaluation {
  steps: Step[]
  results: Map<string, PurchaseResult>
  final: ReplayState
  stats: {
    level: number
    cpTotal: number
    cpSpent: number
    cpRemaining: number
    frags: number
    body: number | null
    strength: number
  }
  warnings: string[]
  probe: { cost: number; frag: number; error: string | null } | null
}

// Replays the build in timeline order. Invalid purchases are flagged and
// skipped, so anything that depended on them is flagged too.
// `loose` (simple mode): no month rules and no budget errors; overspend just
// shows as negative CP left.
export function evaluate(b: Build, probe?: Purchase, loose = false): Evaluation {
  const race = raceData(b.race)
  const bonus = race?.cpBonus ?? 0
  const skills = lookup(b)
  const counts = monthCounts(b)

  const steps: Step[] = [0, ...b.blankets.map((_, i) => i + 1)].map(at => {
    const cp = cpAt(at, bonus)
    const month = at === 0 ? b.startMonth : b.blankets[at - 1]
    let error: string | null = null
    if (loose) error = null
    else if (at > 0 && month < b.startMonth) error = 'Before start month'
    else if (at > 1 && month < b.blankets[at - 2]) error = 'Earlier than the previous blanket'
    else if (at > 0 && (counts.get(month) ?? 0) > MAX_BLANKETS_PER_MONTH) error = `More than ${MAX_BLANKETS_PER_MONTH} blankets in this month`
    return { at, month, cp, row: levelRow(cp, bonus), spent: 0, error }
  })

  const st = newState()
  const fv = FAVOURED_VOCATIONS[b.vocation]
  if (fv?.cpCost) st.spent += fv.cpCost

  const results = new Map<string, PurchaseResult>()
  let probeResult: Evaluation['probe'] = null
  const order = sortedPurchases(b)
  if (probe) {
    const pos = order.findIndex(p => p.at > probe.at)
    order.splice(pos < 0 ? order.length : pos, 0, probe)
  }

  let stepIdx = 0
  for (const p of order) {
    const at = Math.min(p.at, steps.length - 1)
    while (stepIdx < at) steps[stepIdx++].spent = st.spent
    const step = steps[at]
    const ctx = { b, skills, level: step.row.level }
    const isProbe = p === probe
    const [cost, frag, checked] = check(p, st, ctx, !isProbe)
    let error = checked
    if (p.at > steps.length - 1) error = 'Blanket was removed'
    if (!loose && !error && st.spent + cost > step.cp) error = `Over budget: ${st.spent + cost - step.cp} CP short at ${at === 0 ? 'creation' : `blanket ${at}`}`
    if (isProbe) {
      probeResult = { cost, frag, error }
      continue
    }
    results.set(p.id, { label: choiceLabel(p.skill, p.choice), cost, frag, error })
    if (!error) apply(p, st, ctx, cost, frag)
  }
  while (stepIdx < steps.length) steps[stepIdx++].spent = st.spent

  const last = steps[steps.length - 1]
  const level = last.row.level
  let body = 0
  let strength = 0
  for (const [name, n] of st.counts) {
    const sk = skills.get(name)
    body += (sk?.bodyBonus ?? 0) * n
    strength += (sk?.strBonus ?? 0) * n
  }
  for (const t of race?.auto ?? []) {
    body += t.bodyBonus ?? 0
    strength += t.strBonus ?? 0
  }
  body += (race?.bodyBonusPerLevel ?? 0) * level
  strength += (race?.strBonusPerFiveLevels ?? 0) * Math.ceil(level / 5)
  const bs = count(st, 'Blacksmith')
  strength += bs >= 10 ? 2 : bs >= 6 ? 1 : 0
  const cls = OCC_CLASS[b.occupation]

  const voc = vocationData(b.vocation)
  const frags = st.frags + (race?.fragCost ?? 0) + (b.culture ? CULTURE_FRAG_COST : 0) + (voc?.fragCost ?? 0)

  return {
    steps, results, final: st, probe: probeResult,
    warnings: buildWarnings(b, st),
    stats: {
      level, cpTotal: last.cp, cpSpent: st.spent, cpRemaining: last.cp - st.spent, frags,
      body: cls ? last.row[cls] + body : null, strength,
    },
  }
}

function buildWarnings(b: Build, st: ReplayState): string[] {
  const w: string[] = []
  const culture = CULTURES[b.culture]
  if (culture && !culture.races.includes(b.race)) w.push(`${b.culture} is not open to ${b.race || 'this race'}`)
  const voc = VOCATIONS[b.vocation]
  if (voc?.occupations?.length && !voc.occupations.includes(b.occupation)) {
    w.push(`${b.vocation} is limited to ${voc.occupations.join(', ')}`)
  }
  for (const need of VOCATION_PREREQS[b.vocation]?.auto ?? []) {
    const options = need.split('|')
    if (!options.some(o => count(st, o) > 0)) w.push(`${b.vocation} expects ${options.join(' or ')}`)
  }
  b.schools.forEach((school, i) => {
    if (!school || count(st, sphereName(i)) === 0) return
    const allowed = EXCLUSIVE_SPHERES[school]
    if (allowed && !allowed.includes(b.vocation)) w.push(`${school} sphere is limited to ${allowed.join(', ')}`)
  })
  const dupes = b.schools.filter((s, i) => s && b.schools.indexOf(s) !== i)
  if (dupes.length) w.push(`Duplicate sphere school: ${dupes.join(', ')}`)
  return w
}

// State after every valid purchase up to and including step `at`.
export function stateAt(b: Build, at: number, loose = false) {
  return evaluate({ ...b, purchases: b.purchases.filter(p => p.at <= at) }, undefined, loose).final
}

// Simple mode as an engine build: N blankets, every pick made after the last.
export function simpleView(b: Build): Build {
  const n = b.simple?.blankets ?? 0
  return {
    ...b,
    blankets: Array(n).fill(b.startMonth),
    purchases: (b.simple?.purchases ?? []).map(p => ({ ...p, at: n })),
  }
}

// The purchase list the planner is editing in the current mode.
export function activePurchases(b: Build) {
  if (b.mode === 'timeline') return b.purchases
  if (b.mode === 'priority') return b.priority?.purchases ?? []
  return b.simple?.purchases ?? []
}

export function withPurchases(b: Build, purchases: Purchase[]): Build {
  if (b.mode === 'timeline') return { ...b, purchases }
  if (b.mode === 'priority') return { ...b, priority: { ...priorityOf(b), purchases } }
  return { ...b, simple: { blankets: b.simple?.blankets ?? 0, purchases } }
}

const priorityOf = (b: Build): Priority => b.priority ?? { perMonth: MAX_BLANKETS_PER_MONTH, months: {}, purchases: [] }

// How far the scheduler looks ahead (20 years at the monthly max).
export const PRIORITY_HORIZON = 480

// Blanket months from the start month, `perMonth` each unless overridden.
export function priorityMonths(b: Build, count = PRIORITY_HORIZON) {
  const p = priorityOf(b)
  const out: string[] = []
  let month = b.startMonth
  for (let i = 0; i < PRIORITY_HORIZON && out.length < count; i++, month = addMonths(month, 1)) {
    const n = Math.min(p.months[month] ?? p.perMonth, MAX_BLANKETS_PER_MONTH)
    for (let k = 0; k < n && out.length < count; k++) out.push(month)
  }
  return out
}

// Errors that more blankets can fix.
const WAITABLE = /^(Over budget|Requires level|Racial cap)/

// Priority mode as an engine build: each pick, in order, lands on the first
// blanket (no earlier than the pick before it) where it is legal and affordable.
// Picks that waiting cannot fix stay on the previous pick's blanket and show their error.
export function priorityView(b: Build): Build {
  const months = priorityMonths(b)
  const purchases: Purchase[] = []
  let at = 0
  for (const item of priorityOf(b).purchases) {
    for (let t = at; t <= months.length; t++) {
      const error = evaluate({ ...b, blankets: months.slice(0, t), purchases }, { ...item, at: t }).probe?.error
      if (!error) { at = t; break }
      if (!WAITABLE.test(error)) break
    }
    purchases.push({ ...item, at })
  }
  return { ...b, blankets: months.slice(0, at), purchases }
}

// Replaces the current mode's picks with another mode's, keeping their order
// and, where the target has dates, their blankets.
export function copyPicks(b: Build, from: PlanMode): Build {
  const src = from === 'timeline' ? b : from === 'priority' ? priorityView(b) : simpleView(b)
  const list = sortedPurchases(src)
  const undated = list.map(p => ({ ...p, at: 0 }))
  const to = b.mode ?? 'sandbox'
  if (to === 'sandbox') return { ...b, simple: { blankets: src.blankets.length, purchases: undated } }
  if (to === 'priority') return { ...b, priority: { ...priorityOf(b), purchases: undated } }
  if (from === 'priority') return { ...b, blankets: src.blankets, purchases: list }
  // Sandbox has a count, not dates: back-fill that many blankets and buy everything after the last.
  const dated = pastBlankets({ ...b, blankets: [], purchases: [] }, src.blankets.length)
  return { ...dated, purchases: list.map(p => ({ ...p, at: dated.blankets.length })) }
}

// Removes the latest purchase of a skill (matching `choice` when given).
export function unbuy(b: Build, skill: string, choice?: string): Build {
  const list = activePurchases(b)
  const ordered = sortedPurchases({ ...b, purchases: list })
  const last = [...ordered].reverse().find(p => p.skill === skill && (choice === undefined || p.choice === choice))
  return last ? withPurchases(b, list.filter(p => p !== last)) : b
}
