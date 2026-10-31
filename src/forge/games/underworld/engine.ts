import {
  BASE_CP, CULTURE_FRAG_COST, DEFAULT_MAX, ELEMENTS, EXCLUSIVE_SPHERES, MAX_BLANKETS_PER_MONTH,
  MAX_RITUAL_SLOTS, OCC_CLASS, SPIRITUAL_RESOLVE_MAX_LEVEL, RACIAL_CP, RITUAL_BASE_COSTS, FAVOURED_SPELL_CIRCLE_COSTS, FAVOURED_RITUAL_BASE_COSTS,
  SPELL_CIRCLE_COSTS, sphereAt, sphereId, sphereIndex, sphereName, SPHERE_SURCHARGE_FRAGS, PYRAMID_ORDER, SLOTS_PER_CIRCLE, MAX_SLOTS_PER_CIRCLE,
  SURCHARGE_SPHERES, TABLE, WEAPON_GROUPS, ordinal,
  type LevelRow,
} from './rules'
import { CULTURES, FAVOURED_COSTS, RENOWNED, FRAG_RACES, OCC_ABILITIES, RACES, SKILLS, VOCATIONS, VOCATION_PREREQS } from './data'
import type { Prereq, PrereqCondition, Race, Skill, Vocation } from './types'

// Skill ids the engine special-cases.
export const SPELL_SLOT = 'spell-slot'
export const RITUAL_SLOT = 'ritual-slot'
export const ELEMENTAL_ATTUNEMENT = 'elemental-attunement'
export const PARAGON = 'paragon'
export const SPELL_VERSATILITY = 'spell-versatility'
export const TRADESMAN = 'tradesman'
export const FAVOURED = 'favoured'
export const READ_MAGIC = 'read-magic'
export const READ_MAGIC_ADVANCED = 'read-magic-advanced'
const READ_MAGIC_RITUAL = 'read-magic-ritual'
// Raw Material a trade produces; the trade's name is free text after a '|'.
export const TRADE_MATERIALS = ['Blacksmith', 'Scrollcraft', 'Alchemy', 'Trapper']
export function slotCost(b: Build, circle: number) {
  const g = favouredGroup(b)
  if (g) return FAVOURED_SPELL_CIRCLE_COSTS[String(circle)]?.[g] ?? 0
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
  // Weapon / group, element, spell circle, 'Light|3' for Paragon, or 'Blacksmith|Miner' for Tradesman.
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
  // complete: the plan is done; retired: no longer played. Both are read-only.
  status?: BuildStatus
  // The player dismissed the level 16 life buyback warning.
  ignoreLifeWarning?: boolean
  simple?: { blankets: number; purchases: Purchase[] }
  priority?: Priority
}

export type PlanMode = 'sandbox' | 'timeline' | 'priority'
export type BuildStatus = 'planning' | 'complete' | 'retired'
export const BUILD_STATUSES: BuildStatus[] = ['planning', 'complete', 'retired']

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
    mode: 'sandbox', status: 'planning', simple: { blankets: 0, purchases: [] },
    priority: { perMonth: MAX_BLANKETS_PER_MONTH, months: {}, purchases: [] },
  }
}

export type CatalogSkill = Skill & { racial?: boolean; tier?: number; category: string }

export function raceData(race: string): Race | null {
  return RACES[race] ?? FRAG_RACES[race] ?? null
}

export function vocationData(voc: string): Vocation | null {
  return VOCATIONS[voc] ?? null
}

// The Renowned Occupation picked when Favoured was bought, if any (Soul Frag p.43).
export function renownedOf(b: Build): string | null {
  const p = activePurchases(b).find(x => x.skill === FAVOURED) ?? b.purchases.find(x => x.skill === FAVOURED)
  return p?.choice && RENOWNED[p.choice] ? p.choice : null
}

// Body column and class frag skills: the Renowned Occupation's if set, else the occupation's.
export function classOf(b: Build) {
  const r = renownedOf(b)
  return (r && RENOWNED[r].bodyClass) || OCC_CLASS[b.occupation]
}

// Display names by id.
const NAMES = new Map<string, string>([
  [SPELL_SLOT, 'Spell Slot'], [RITUAL_SLOT, 'Ritual Slot'],
  ...[
    ...SKILLS.flatMap(c => c.skills),
    ...Object.values({ ...RACES, ...FRAG_RACES }).flatMap(r => r.purchased),
    ...Object.values(CULTURES).flatMap(c => c.purchased ?? []),
    ...Object.values(OCC_ABILITIES).flat(),
    ...[...Object.values(VOCATIONS), ...Object.values(RENOWNED)].flatMap(v => v.abilities),
  ].map(s => [s.id, s.name] as const),
])

export function skillName(id: string) {
  const sphere = sphereIndex(id)
  return sphere >= 0 ? sphereName(sphere) : NAMES.get(id) ?? id
}

export const prereqLabel = (p: Prereq) =>
  `${(p.minCount ?? 1) > 1 ? `${p.minCount}x ` : ''}${p.level ? `Level ${p.level}` : (p.id ?? '').split('|').map(skillName).join(' or ')}`

// Saves made before skills had ids stored names.
const LEGACY = new Map([...NAMES].map(([id, name]) => [name, id]))
export function legacyId(skill: string) {
  const m = /^Sphere of Magic: (\d+)/.exec(skill)
  return m ? sphereId(Number(m[1]) - 1) : LEGACY.get(skill) ?? skill
}

// A vocation's abilities replace the class's; a Renowned Occupation's replace the occupation's.
const abilitiesOf = (b: Build) =>
  vocationData(b.vocation)?.abilities ?? RENOWNED[renownedOf(b) ?? '']?.abilities ?? OCC_ABILITIES[b.occupation] ?? []

// Changing occupation or vocation swaps each owned ability for the new set's
// ability of the same tier (3/6/9/12), in every plan mode.
export function switchRole(b: Build, patch: Partial<Pick<Build, 'occupation' | 'vocation'>>): Build {
  return remapAbilities(b, { ...b, ...patch })
}

// Buying or dropping Favoured changes the ability set the same way.
export function remapAbilities(b: Build, next: Build): Build {
  const to = new Map(abilitiesOf(next).map(a => [a.tier, a.id]))
  const rename = new Map(abilitiesOf(b).flatMap(a => (to.has(a.tier) ? [[a.id, to.get(a.tier)!] as const] : [])))
  const fix = (ps: Purchase[]) => ps.map(p => (rename.has(p.skill) ? { ...p, skill: rename.get(p.skill)! } : p))
  return {
    ...next,
    purchases: fix(next.purchases),
    simple: next.simple && { ...next.simple, purchases: fix(next.simple.purchases) },
    priority: next.priority && { ...next.priority, purchases: fix(next.priority.purchases) },
  }
}

// 'Champion' or 'Demagogue' once the character is a Renowned Occupation.
function favouredGroup(b: Build) {
  const r = renownedOf(b)
  return r ? RENOWNED[r].group : null
}

function favouredTable(b: Build) {
  const g = favouredGroup(b)
  return g ? FAVOURED_COSTS[g] : null
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
  // A culture replaces the race's purchasable ability but keeps its Body/Strength bonuses (Core p.29).
  const own = race?.purchased ?? []
  const racial = (culture ? [...(culture.purchased ?? []), ...own.filter(s => s.bodyBonus || s.strBonus)] : own).map(s => ({
    costs: null, frag: 0, prereqPerPurchase: false, ...s, racial: true, category: 'Racial',
  }))
  out.push({ cat: 'Racial', skills: racial })

  const frag = SKILLS.find(c => c.cat === 'Soul Frag Skills')
  if (frag) out.push(tag(frag.cat, frag.skills))

  const abilities = abilitiesOf(b)
  if (abilities.length) {
    out.push({
      cat: 'Occupational Abilities',
      skills: abilities.map(ab => {
        const prev = abilities.find(a => a.tier === ab.tier - 3)
        return {
          id: ab.id, name: ab.name, costs: null, cp: ab.cp, frag: 0, maxPurchases: ab.maxPurchases ?? DEFAULT_MAX,
          bodyBonus: ab.bodyBonus ?? 0, strBonus: 0, prereqPerPurchase: false,
          prereqs: prev ? [{ id: prev.id, minCount: 1 }] : [],
          desc: ab.desc, tier: ab.tier, category: 'Occupational Abilities',
        }
      }),
    })
  }

  const cls = classOf(b)
  for (const c of SKILLS) {
    if (['General', 'Soul Frag Skills'].includes(c.cat) || c.cat.endsWith('Class Frag Skills')) continue
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
  return ['Simple', ...['Medium', 'Large'].filter(g => count(st, `weapon-group-proficiency-${g.toLowerCase()}`) > 0)]
}

// Legal answers for a choice skill given what is owned so far.
export function choiceOptions(sk: Skill, st: ReplayState): string[] {
  if (sk.id === ELEMENTAL_ATTUNEMENT) return ELEMENTS.filter(e => !st.attunements.includes(e))
  if (sk.id === TRADESMAN) return TRADE_MATERIALS
  if (sk.id === FAVOURED) return Object.keys(RENOWNED)
  if (sk.id === SPELL_SLOT) return ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  if (sk.id === SPELL_VERSATILITY) return ['1', '2', '3', '4', '5', '6', '7', '8', '9'].filter(c => st.circles[+c] > st.versatile[+c])
  if (sk._paragon) {
    const circles = [1, 2, 3, 4, 5, 6, 7].filter(c => st.circles[c] > 0)
    return ['Light', 'Dark'].flatMap(sp => circles.map(c => `${sp}|${c}`))
  }
  if (sk._weaponChoice === 'exotic') return WEAPON_GROUPS.Exotic.filter(w => !st.exotics.includes(w))
  if (sk._weaponChoice === 'group') return weaponGroups(st)
  if (sk._weaponChoice === 'specific') {
    const summoned = sk.id === 'specialization-1-weapon-specific'
    return st.weapons.filter(w => w !== 'Summoned Weapon' || summoned)
  }
  return []
}

export function needsChoice(sk: Skill) {
  return !!sk._weaponChoice || !!sk._paragon || sk.id === ELEMENTAL_ATTUNEMENT || sk.id === SPELL_SLOT || sk.id === SPELL_VERSATILITY || sk.id === TRADESMAN || sk.id === FAVOURED
}

export function choiceLabel(skill: string, choice?: string) {
  const name = skillName(skill)
  if (!choice) return name
  if (skill === SPELL_SLOT) return `Spell Slot: ${ordinal(Number(choice))} Circle`
  if (skill === SPELL_VERSATILITY) return `Spell Versatility: ${ordinal(Number(choice))} Circle`
  if (skill === TRADESMAN) {
    const [material, name] = choice.split('|')
    return `Tradesman: ${name || 'Unnamed'} (${material})`
  }
  if (skill === PARAGON) {
    const [sp, c] = choice.split('|')
    return `Paragon (${sp}, ${ordinal(Number(c))} Circle)`
  }
  return `${name}: ${choice}`
}

function lookup(b: Build) {
  const map = new Map<string, CatalogSkill>()
  for (const c of catalog(b)) for (const s of c.skills) if (!map.has(s.id)) map.set(s.id, s)
  return map
}

function skillCost(sk: CatalogSkill, b: Build, choice?: string): number {
  if (sk.racial) return RACIAL_CP
  if (sk._paragon) return slotCost(b, Number(choice?.split('|')[1])) + 10
  if (sk.id === SPELL_VERSATILITY) return versatilityCost(b, choice)
  const fav = favouredTable(b)
  if (sk.costs && fav && fav[sk.id] !== undefined) return fav[sk.id]
  if (sk.costs) return occCost(sk.costs, b)
  return sk.cp ?? 0
}

function prereqError(sk: CatalogSkill, st: ReplayState, level: number): string | null {
  const have = count(st, sk.id)
  for (const pre of sk.prereqs) {
    if (pre.level) {
      if (level < pre.level) return `Requires level ${pre.level}`
      continue
    }
    const options = (pre.id ?? '').split('|')
    const need = pre.minCount ?? 1
    // Each further purchase needs one more (Core p.68: "an additional purchase of the weapon specialisation").
    const required = !pre.primaryGate && sk.prereqPerPurchase ? need + have : need
    const got = options.reduce((sum, o) => sum + count(st, o), 0)
    if (got < required) return `Requires ${required > 1 ? `${required}x ` : ''}${options.map(skillName).join(' or ')}`
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
  const fav = RENOWNED[renownedOf(b) ?? '']

  const sphereIdx = sphereIndex(p.skill)
  if (sphereIdx >= 0) {
    const sphere = sphereAt(sphereIdx)
    const cost = fav ? sphere.favouredCosts[fav.group] : occCost(sphere.costs, b)
    const school = b.schools[sphereIdx]
    const frag = SURCHARGE_SPHERES.includes(school) ? SPHERE_SURCHARGE_FRAGS : 0
    if (!b.occupation) return [cost, frag, 'Pick an occupation first']
    if (count(st, p.skill) > 0) return [cost, frag, 'Already owned']
    const pre = sphereIdx === 0 ? READ_MAGIC : sphereId(sphereIdx - 1)
    if (count(st, pre) === 0) return [cost, frag, `Requires ${skillName(pre)}`]
    return [cost, frag, null]
  }

  if (p.skill === SPELL_SLOT) {
    const circle = Number(p.choice)
    const cost = slotCost(b, circle)
    if (!b.occupation) return [cost, 0, 'Pick an occupation first']
    if (!(circle >= 1 && circle <= 9)) return [cost, 0, 'Pick a circle']
    if (count(st, sphereId(0)) === 0) return [cost, 0, `Requires ${sphereName(0)}`]
    if (circle >= 5 && count(st, READ_MAGIC_ADVANCED) === 0) return [cost, 0, 'Requires Read Magic: Advanced']
    const pyramid = pyramidError(st.circles, circle)
    if (pyramid) return [cost, 0, pyramid]
    return [cost, 0, null]
  }

  if (p.skill === RITUAL_SLOT) {
    const g = favouredGroup(b)
    const cost = (g ? FAVOURED_RITUAL_BASE_COSTS[g] : occCost(RITUAL_BASE_COSTS, b)) * (st.rituals + 1)
    if (!b.occupation) return [cost, 0, 'Pick an occupation first']
    if (count(st, READ_MAGIC_RITUAL) === 0) return [cost, 0, 'Requires Read Magic: Ritual']
    if (st.circles[9] < 1) return [cost, 0, 'Requires a 9th Circle slot']
    if (st.rituals >= MAX_RITUAL_SLOTS) return [cost, 0, 'Maxed']
    return [cost, 0, null]
  }

  const sk = ctx.skills.get(p.skill)
  if (!sk) return [0, 0, 'Not available to this character']
  const have = count(st, sk.id)
  const cost = sk.cpFirstOnly && have > 0 ? 0 : skillCost(sk, b, p.choice)
  const frag = sk.id === SPELL_VERSATILITY ? versatilityCost(b, p.choice) : sk.frag
  const err = (e: string): [number, number, string] => [cost, frag, e]

  if (sk.costs && !b.occupation) return err('Pick an occupation first')
  if (sk.id === ELEMENTAL_ATTUNEMENT) {
    const elemental = b.schools.some((s, i) => s === 'Elemental' && count(st, sphereId(i)) > 0)
    if (!elemental) return err('Requires the Elemental sphere')
    if (!b.attunement) return err('Pick a primary attunement')
  }
  if (sk._paragon) {
    if (fav) return err('Not available to Renowned Occupations')
    if (!st.circles.some(n => n > 0)) return err('Requires a spell slot')
  }
  if (have >= (sk.maxPurchases || DEFAULT_MAX)) return err('Maxed')
  if (sk.racial && st.racial >= Math.ceil(level / 2)) return err(`Racial cap at level ${level} (${Math.ceil(level / 2)})`)
  if (sk.tier && level < sk.tier) return err(`Requires level ${sk.tier}`)
  const pre = prereqError(sk, st, level)
  if (pre) return err(pre)
  if (needsChoice(sk)) {
    if (p.choice === undefined) return [cost, frag, strictChoice ? 'Make a choice' : null]
    const pick = sk.id === TRADESMAN ? p.choice.split('|')[0] : p.choice
    if (!choiceOptions(sk, st).includes(pick)) return err(`${pick} not available`)
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
  if (p.skill === 'weapon-group-proficiency-medium') st.weapons.push(...WEAPON_GROUPS.Medium)
  if (p.skill === 'weapon-group-proficiency-large') st.weapons.push(...WEAPON_GROUPS.Large)
  if (p.skill === 'weapon-specific-proficiency-exotic' && p.choice) {
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

// The first 45 slots follow Chart 8-1 order (Core p.106). Once every circle has 5,
// any circle may widen to 10 as long as it never has more slots than the circle
// below it. circles[c] = slots at circle c.
export const SLOT_ORDER = [...PYRAMID_ORDER, ...PYRAMID_ORDER]
const CIRCLES = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const slotTotal = (circles: number[]) => circles.reduce((a, n) => a + n, 0)
const pyramidFull = (circles: number[]) => CIRCLES.every(c => circles[c] >= SLOTS_PER_CIRCLE)

export function pyramidError(circles: number[], circle: number): string | null {
  if (!pyramidFull(circles)) {
    const next = PYRAMID_ORDER[slotTotal(circles)]
    return circle === next ? null : `Next slot must be ${ordinal(next)} Circle`
  }
  if (circles[circle] >= MAX_SLOTS_PER_CIRCLE) return `${MAX_SLOTS_PER_CIRCLE} slots is the most per circle`
  if (circle > 1 && circles[circle] >= circles[circle - 1]) return `Needs another ${ordinal(circle - 1)} Circle slot first`
  return null
}

// Whether removing one slot at this circle leaves a legal book.
export function canRemoveSlot(circles: number[], circle: number) {
  if (!pyramidFull(circles)) return PYRAMID_ORDER[slotTotal(circles) - 1] === circle
  if (circles[circle] > SLOTS_PER_CIRCLE) return circle === 9 || circles[circle] > circles[circle + 1]
  return circle === 9 && slotTotal(circles) === PYRAMID_ORDER.length
}

// Suggested next slot: the first one the two-tower order still lacks, else any legal one.
export function nextSlotCircle(circles: number[]) {
  const have = [...circles]
  return SLOT_ORDER.find(c => have[c]-- <= 0 && !pyramidError(circles, c)) ?? CIRCLES.find(c => !pyramidError(circles, c))
}
// Suggested slot to remove: the highest circle that can go.
export const lastSlotCircle = (circles: number[]) => [...CIRCLES].reverse().find(c => canRemoveSlot(circles, c))

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
  skillWarnings: string[]
  renowned: string | null
  // Level 16 ends Spiritual Resolve; null when not reached or dismissed.
  lifeWarning: string | null
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
  // Elemental Attunement buys additional elements, never the primary (Core p.61).
  if (b.attunement) st.attunements.push(b.attunement)
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
  const bs = count(st, 'blacksmith')
  strength += bs >= 10 ? 2 : bs >= 6 ? 1 : 0
  const cls = classOf(b)

  const voc = vocationData(b.vocation)
  const frags = st.frags + (race?.fragCost ?? 0) + (b.culture ? CULTURE_FRAG_COST : 0) + (voc?.fragCost ?? 0)

  return {
    steps, results, final: st, probe: probeResult, renowned: renownedOf(b),
    ...(({ character, skills }) => ({ warnings: character, skillWarnings: skills }))(buildWarnings(b, st)),
    lifeWarning: b.ignoreLifeWarning ? null : lifeWarning(steps, bonus),
    stats: {
      level, cpTotal: last.cp, cpSpent: st.spent, cpRemaining: last.cp - st.spent, frags,
      body: cls ? last.row[cls] + body : null, strength,
    },
  }
}

function condMet(b: Build, st: ReplayState, c: PrereqCondition) {
  return (!c.skill || c.skill.split('|').reduce((n, s) => n + count(st, s), 0) >= (c.count ?? 1)) &&
    (!c.circle || (st.circles[c.circle] > 0 && (!c.sphere || b.schools.some((s, i) => s === c.sphere && count(st, sphereId(i)) > 0))))
}

// Skills that would help meet an unmet vocation prerequisite, for highlighting.
export function vocationNeeds(b: Build, st: ReplayState): Set<string> {
  const p = VOCATION_PREREQS[b.vocation]
  const out = new Set<string>()
  for (const need of p?.auto ?? []) {
    const options = need.split('|')
    if (!options.some(o => count(st, o) > 0)) options.forEach(o => out.add(o))
  }
  for (const c of p?.choice ?? []) {
    if (c.anyOf.some(alt => alt.every(cond => condMet(b, st, cond)))) continue
    for (const cond of c.anyOf.flat()) cond.skill?.split('|').forEach(s => out.add(s))
  }
  return out
}

// Most blankets a character can apply and stay at or under `level`.
export function lastBlanketAtLevel(level: number, cpBonus = 0) {
  let n = 0
  while (levelRow(cpAt(n + 1, cpBonus), cpBonus).level <= level) n++
  return n
}

function lifeWarning(steps: Step[], cpBonus: number): string | null {
  if (!steps.some(s => s.row.level > SPIRITUAL_RESOLVE_MAX_LEVEL)) return null
  const safe = lastBlanketAtLevel(SPIRITUAL_RESOLVE_MAX_LEVEL, cpBonus)
  return `Blanket ${safe + 1} reaches level ${SPIRITUAL_RESOLVE_MAX_LEVEL + 1}: lives can no longer be bought back with frags (Spiritual Resolve). Stop at ${safe} blankets to keep that option.`
}

// Character warnings (race, culture, vocation fit) and skill warnings (what the plan lacks).
function buildWarnings(b: Build, st: ReplayState): { character: string[]; skills: string[] } {
  const w: string[] = []
  const sk: string[] = []
  const culture = CULTURES[b.culture]
  if (culture && !culture.races.includes(b.race)) w.push(`${b.culture} is not open to ${b.race || 'this race'}`)
  const voc = VOCATIONS[b.vocation]
  if (voc?.occupations?.length && !voc.occupations.includes(b.occupation)) {
    w.push(`${b.vocation} is limited to ${voc.occupations.join(', ')}`)
  }
  const prereqs = VOCATION_PREREQS[b.vocation]
  for (const need of prereqs?.auto ?? []) {
    const options = need.split('|')
    if (!options.some(o => count(st, o) > 0)) sk.push(`${b.vocation} expects ${options.map(skillName).join(' or ')}`)
  }
  for (const c of prereqs?.choice ?? []) {
    if (!c.anyOf.some(alt => alt.every(cond => condMet(b, st, cond)))) sk.push(`${b.vocation} expects ${c.label}`)
  }
  b.schools.forEach((school, i) => {
    if (!school || count(st, sphereId(i)) === 0) return
    const allowed = EXCLUSIVE_SPHERES[school]
    if (allowed && !allowed.includes(renownedOf(b) ?? '')) sk.push(`${school} sphere is limited to ${allowed.join(', ')}`)
  })
  const dupes = b.schools.filter((s, i) => s && b.schools.indexOf(s) !== i)
  if (dupes.length) sk.push(`Duplicate sphere school: ${dupes.join(', ')}`)
  return { character: w, skills: sk }
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
  if (!last) return b
  const next = withPurchases(b, list.filter(p => p !== last))
  return skill === FAVOURED ? remapAbilities(b, next) : next
}
