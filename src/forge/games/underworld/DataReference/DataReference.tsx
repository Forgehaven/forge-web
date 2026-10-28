import { Children, isValidElement, useState } from 'react'
import { Masonry } from '../../../../components/Masonry'
import {
  CULTURES, DATA_SOURCES, EQUIPMENT, FAVOURED_VOCATIONS, FRAG_RACES, OCC_ABILITIES, RACES, SKILLS, SOURCES, SPELLS, VOCATIONS,
} from '../data'
import { OCC_CLASS, OCC_ORDER, TABLE, ordinal } from '../rules'
import type { Race, Skill, Vocation } from '../types'
import { MournfallCard } from '../components/MournfallCard'
import { Prose } from '../components/Prose'
import { Equipment } from './Equipment'

const TABS = ['All', 'Races', 'Cultures', 'Occupations', 'Vocations', 'Skills', 'Spells', 'Armour & Weapons', 'Levels', 'Sources'] as const
type Tab = typeof TABS[number]

const SPHERES = [...new Set(SPELLS.map(s => s.sphere))]
const CIRCLES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const has = (q: string, ...text: (string | undefined)[]) => !q || text.some(t => t?.toLowerCase().includes(q))

function Entry({ title, tags, children }: { title: string; tags?: string[]; children: React.ReactNode }) {
  return (
    <details className="forge-card !p-0 group">
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer list-none">
        <span className="text-sm text-[#e2e4ed] group-hover:text-white">{title}</span>
        {tags?.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2d3a] text-[#9ca3af] whitespace-nowrap">{t}</span>)}
        <span className="ml-auto text-xs text-[#6b7280] group-open:rotate-90 transition-transform">▸</span>
      </summary>
      <div className="px-3 pb-3 text-xs text-[#9ca3af] leading-relaxed flex flex-col gap-2 border-t border-[#2a2d3a] pt-2">{children}</div>
    </details>
  )
}

// Two independent columns: opening a card only pushes cards below it.
function Grid({ children }: { children: React.ReactNode }) {
  const items = Children.toArray(children).map((node, i) => ({ key: String(isValidElement(node) ? node.key : i), weight: 1, node }))
  return <Masonry minWidth={420} gap={8} items={items} />
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="forge-label uppercase tracking-widest mt-3 mb-1">{children}</h2>
}

function Filter({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select aria-label={label} className="forge-input !w-auto" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">All {label.toLowerCase()}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Sub({ name, meta, text }: { name: string; meta?: string; text: string }) {
  return (
    <div>
      <p><span className="text-[#c4af64]">{name}</span>{meta && <span className="text-[#6b7280]"> · {meta}</span>}</p>
      <Prose text={text} />
    </div>
  )
}

function RaceEntry({ name, race }: { name: string; race: Race }) {
  const tags = [race.tier ? `${race.tier} · ${race.fragCost} frags` : 'Common']
  if (race.cpBonus) tags.push(`+${race.cpBonus} CP`)
  return (
    <Entry title={name} tags={tags}>
      <Prose text={race.lore} />
      {race.auto.map(t => (
        <div key={t.name}>
          <p className={t.kind === 'advantage' ? 'text-emerald-400' : 'text-red-400'}>{t.name}</p>
          <Prose text={t.desc} />
        </div>
      ))}
      {race.purchased.map(s => <Sub key={s.name} name={s.name} meta={`racial skill, 50 CP, max ${s.maxPurchases}`} text={s.desc} />)}
    </Entry>
  )
}

function VocationEntry({ name, voc }: { name: string; voc: Vocation }) {
  const tags = [`${voc.fragCost} frags`]
  if (voc.group) tags.push(`Favoured ${voc.group}`, `${voc.cpCost} CP`)
  return (
    <Entry title={name} tags={tags}>
      <Prose text={voc.lore} />
      <p><span className="text-[#c4af64]">Prerequisites:</span> {voc.prereqs}</p>
      {voc.abilities.map(a => <Sub key={a.name} name={a.name} meta={`level ${a.tier}, ${a.cp} CP`} text={a.desc} />)}
    </Entry>
  )
}

function SkillEntry({ s }: { s: Skill }) {
  const tags = [s.costs ? 'cost by occupation' : `${s.cp} CP`, ...(s.frag ? [`${s.frag} frags`] : []), `max ${s.maxPurchases}`]
  return (
    <Entry title={s.name} tags={tags}>
      <Prose text={s.desc} />
      {s.prereqs.length > 0 && (
        <p><span className="text-[#c4af64]">Requires:</span> {s.prereqs.map(p => p.name.split('|').join(' or ')).join('; ')}</p>
      )}
      {s.costs && (
        <dl className="grid grid-cols-3 gap-x-4 gap-y-0.5 font-mono text-[11px]">
          {OCC_ORDER.map(o => (
            <div key={o} className="flex justify-between gap-2">
              <dt className="text-[#6b7280] font-sans">{o}</dt>
              <dd className="text-[#e2e4ed]">{s.costs![o]}</dd>
            </div>
          ))}
        </dl>
      )}
    </Entry>
  )
}

interface Filters { q: string; sphere: string; circle: string; category: string }

const SEARCHABLE = ['Races', 'Cultures', 'Occupations', 'Vocations', 'Skills', 'Spells', 'Armour & Weapons'] as const
type Searchable = typeof SEARCHABLE[number]
const isSearchable = (t: Tab): t is Searchable => (SEARCHABLE as readonly string[]).includes(t)

const raceList = (all: Record<string, Race>, q: string) => Object.entries(all).filter(([n, r]) => has(q, n, r.lore))
const vocList = (all: Record<string, Vocation>, q: string) => Object.entries(all).filter(([n, v]) => has(q, n, v.lore))

// A tab's filtered content, or null when nothing matches.
function section(tab: Searchable, { q, sphere, circle, category }: Filters): React.ReactNode {
  switch (tab) {
    case 'Races': {
      const common = raceList(RACES, q)
      const frag = raceList(FRAG_RACES, q)
      if (!common.length && !frag.length) return null
      return (
        <>
          {common.length > 0 && <><Heading>Common races</Heading><Grid>{common.map(([n, r]) => <RaceEntry key={n} name={n} race={r} />)}</Grid></>}
          {frag.length > 0 && <><Heading>Frag races</Heading><Grid>{frag.map(([n, r]) => <RaceEntry key={n} name={n} race={r} />)}</Grid></>}
        </>
      )
    }
    case 'Cultures': {
      const list = Object.entries(CULTURES).filter(([n, c]) => has(q, n, c.lore, c.races.join(' ')))
      if (!list.length) return null
      return (
        <Grid>
          {list.map(([n, c]) => (
            <Entry key={n} title={n} tags={[...c.races, '100 frags']}>
              <Prose text={c.lore} />
              <p><span className="text-[#c4af64]">Look:</span> {c.racialCharacteristicAddition}</p>
              <Sub name="Indoctrination" text={c.indoctrination} />
              {c.purchased.map(s => <Sub key={s.name} name={s.name} meta="replaces the racial skill" text={s.desc} />)}
            </Entry>
          ))}
        </Grid>
      )
    }
    case 'Occupations': {
      const list = OCC_ORDER.filter(o => has(q, o, ...(OCC_ABILITIES[o] ?? []).map(a => a.name)))
      if (!list.length) return null
      return (
        <Grid>
          {list.map(o => (
            <Entry key={o} title={o} tags={[OCC_CLASS[o]]}>
              {(OCC_ABILITIES[o] ?? []).map(a => <Sub key={a.name} name={a.name} meta={`level ${a.tier}, ${a.cp} CP`} text={a.desc} />)}
            </Entry>
          ))}
        </Grid>
      )
    }
    case 'Vocations': {
      const plain = vocList(VOCATIONS, q)
      const fav = vocList(FAVOURED_VOCATIONS, q)
      if (!plain.length && !fav.length) return null
      return (
        <>
          {plain.length > 0 && <><Heading>Vocations</Heading><Grid>{plain.map(([n, v]) => <VocationEntry key={n} name={n} voc={v} />)}</Grid></>}
          {fav.length > 0 && <><Heading>Favoured vocations</Heading><Grid>{fav.map(([n, v]) => <VocationEntry key={n} name={n} voc={v} />)}</Grid></>}
        </>
      )
    }
    case 'Skills': {
      const cats = SKILLS
        .filter(c => !category || c.cat === category)
        .map(c => ({ cat: c.cat, skills: c.skills.filter(s => has(q, s.name, s.desc)) }))
        .filter(c => c.skills.length)
      if (!cats.length) return null
      return cats.map(c => (
        <section key={c.cat}>
          <Heading>{c.cat}</Heading>
          <Grid>{c.skills.map(s => <SkillEntry key={s.name} s={s} />)}</Grid>
        </section>
      ))
    }
    case 'Spells': {
      const spheres = SPHERES.filter(s => !sphere || s === sphere).map(sp => ({
        sp,
        spells: SPELLS
          .filter(s => s.sphere === sp && (!circle || s.level === Number(circle)) && has(q, s.name, s.desc))
          .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
      })).filter(s => s.spells.length)
      if (!spheres.length) return null
      return spheres.map(({ sp, spells }) => (
        <section key={sp}>
          <Heading>{sp}</Heading>
          <Grid>
            {spells.map(s => (
              <Entry key={s.name + s.level} title={s.name} tags={[`${ordinal(s.level)} circle`]}>
                <p className="italic text-[#c4af64]/80">"{s.incant}"</p>
                <Prose text={s.desc} />
              </Entry>
            ))}
          </Grid>
        </section>
      ))
    }
    case 'Armour & Weapons': {
      if (!q) return <Equipment />
      const weapons = EQUIPMENT.weapons.rows.filter(w => has(q, w.name, w.group))
      const grades = EQUIPMENT.grades.rows.filter(g => has(q, `grade ${g.grade}`, g.materials, g.text))
      const rules = EQUIPMENT.sections.filter(s => has(q, s.title, s.text))
      if (!weapons.length && !grades.length && !rules.length) return null
      return (
        <Grid>
          {weapons.map(w => (
            <Entry key={w.name} title={w.name} tags={[`${w.group} weapon`, `${w.damage} damage`]}>
              <p><span className="text-[#c4af64]">Length:</span> {w.lengthIn} in ({w.lengthCm} cm)</p>
              <p><span className="text-[#c4af64]">Core:</span> {w.core}</p>
              <p><span className="text-[#c4af64]">Striking surface:</span> {w.striking}</p>
            </Entry>
          ))}
          {grades.map(g => (
            <Entry key={g.grade} title={`Armour grade ${g.grade}`} tags={[`${g.points} AP/location`]}>
              <p className="text-[#c4c7d0]">{g.materials}</p>
              <Prose text={g.text} />
            </Entry>
          ))}
          {rules.map(s => <Entry key={s.title} title={s.title} tags={[s.ref]}><Prose text={s.text} /></Entry>)}
        </Grid>
      )
    }
  }
}

export default function DataReference() {
  const [tab, setTab] = useState<Tab>('All')
  const [query, setQuery] = useState('')
  const [sphere, setSphere] = useState('')
  const [circle, setCircle] = useState('')
  const [category, setCategory] = useState('')
  const q = query.trim().toLowerCase()
  const nothing = <p className="text-xs text-[#6b7280]">Nothing matches "{query.trim()}".</p>
  const hits = tab === 'All' && q
    ? SEARCHABLE.map(t => [t, section(t, { q, sphere: '', circle: '', category: '' })] as const).filter(([, node]) => node)
    : []

  return (
    <div className="flex flex-col gap-4 max-w-6xl">
      <header>
        <h1 className="text-xl font-semibold text-[#e2e4ed]">Data Reference</h1>
        <p className="text-xs text-[#6b7280]">
          Races, skills, vocations and spells used by the Character Planner. Unofficial: the{' '}
          <a href={SOURCES.index} target="_blank" rel="noopener noreferrer" className="text-[#c4af64] hover:underline">official rulebooks</a> win on any conflict.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t} className={tab === t ? 'forge-btn-active' : 'forge-btn'} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {!['Levels', 'Sources', 'Armour & Weapons'].includes(tab) && (
        <div className="flex flex-wrap gap-2">
          <input className="forge-input !w-72" placeholder={tab === 'All' ? 'Search everything…' : `Search ${tab.toLowerCase()}…`} value={query} onChange={e => setQuery(e.target.value)} />
          {tab === 'Spells' && (
            <>
              <Filter label="Spheres" value={sphere} onChange={setSphere} options={SPHERES.map(s => ({ value: s, label: s }))} />
              <Filter label="Circles" value={circle} onChange={setCircle} options={CIRCLES.map(c => ({ value: String(c), label: `${ordinal(c)} circle` }))} />
            </>
          )}
          {tab === 'Skills' && (
            <Filter label="Categories" value={category} onChange={setCategory} options={SKILLS.map(c => ({ value: c.cat, label: c.cat }))} />
          )}
        </div>
      )}

      <div className="flex flex-col">
        {tab === 'All' && !q && (
          <p className="text-xs text-[#6b7280]">Search races, cultures, occupations, vocations, skills, spells, weapons and armour.</p>
        )}
        {tab === 'All' && q && !hits.length && nothing}
        {hits.map(([t, node]) => (
          <section key={t} className="mb-4">
            <h2 className="text-sm font-semibold text-[#c4af64] border-b border-[#2a2d3a] pb-1 mt-2">{t}</h2>
            {node}
          </section>
        ))}

        {isSearchable(tab) && (section(tab, { q: tab === 'Armour & Weapons' ? '' : q, sphere, circle, category }) ?? nothing)}

        {tab === 'Levels' && (
          <div className="forge-card !p-4 overflow-x-auto max-w-2xl">
            <table className="text-xs font-mono w-full">
              <thead>
                <tr className="text-[#6b7280] text-left">
                  <th className="pr-4 font-normal">Level</th><th className="pr-4 font-normal">CP</th><th className="pr-4 font-normal">CP/blanket</th>
                  <th className="pr-4 font-normal">Warrior body</th><th className="pr-4 font-normal">Rogue body</th><th className="font-normal">Scholar body</th>
                </tr>
              </thead>
              <tbody className="text-[#e2e4ed]">
                {TABLE.map(r => (
                  <tr key={r.level} className="border-t border-[#2a2d3a]">
                    <td className="pr-4 py-1">{r.level}</td><td className="pr-4">{r.threshold}</td><td className="pr-4">{r.cpPer}</td>
                    <td className="pr-4">{r.warrior}</td><td className="pr-4">{r.rogue}</td><td>{r.scholar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-[#6b7280] mt-2">Past 20: 100 CP per level at 10 CP a blanket.</p>
          </div>
        )}

        {tab === 'Sources' && (
          <div className="flex flex-col gap-4 max-w-3xl">
            <div className="forge-card !p-4 overflow-x-auto">
              <h2 className="text-sm text-[#e2e4ed] mb-1">Official rulebooks</h2>
              <p className="text-xs text-[#6b7280] mb-3">
                From <a href={SOURCES.index} target="_blank" rel="noopener noreferrer" className="text-[#c4af64] hover:underline">underworldlarp.com/rulebooks</a>, last checked {SOURCES.checked}.
              </p>
              <table className="text-xs w-full">
                <tbody>
                  {SOURCES.rulebooks.map(r => (
                    <tr key={r.id} className="border-t border-[#2a2d3a]">
                      <td className="py-1.5 pr-4"><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[#c4af64] hover:underline">{r.title}</a></td>
                      <td className="pr-4 font-mono text-[#e2e4ed]">v{r.version}</td>
                      <td className="pr-4 text-[#6b7280]">updated {r.lastModified}</td>
                      <td className={r.parsed ? 'text-emerald-400' : 'text-[#6b7280]'}>{r.parsed ? 'verified' : 'not yet verified'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="forge-card !p-4">
              <h2 className="text-sm text-[#e2e4ed] mb-2">Verification</h2>
              <ul className="text-xs text-[#9ca3af] flex flex-col gap-1">
                {Object.entries(DATA_SOURCES).map(([k, m]) => (
                  <li key={k} className="flex justify-between gap-4">
                    <span className="capitalize text-[#e2e4ed]">{k}</span>
                    <span>{m.rulebook ? `checked against ${m.rulebook}` : 'not yet checked against the rulebooks'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-sm"><MournfallCard /></div>
    </div>
  )
}
