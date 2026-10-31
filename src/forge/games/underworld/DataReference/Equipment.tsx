import { EQUIPMENT } from '../data'
import { Masonry } from '../../../../components/Masonry'
import { Prose } from '../components/Prose'
import armourLocations from '../images/armour-locations.webp'

const GROUPS = ['Simple', 'Medium', 'Large', 'Exotic']

function Ref({ text }: { text: string }) {
  return <span className="text-[10px] text-forge-muted font-normal normal-case tracking-normal">{text}</span>
}

function Card({ title, refText, children }: { title: string; refText: string; children: React.ReactNode }) {
  return (
    <section className="forge-card !p-4 flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-forge-text flex items-baseline justify-between gap-3">{title}<Ref text={refText} /></h2>
      <div className="text-xs text-forge-dim leading-relaxed">{children}</div>
    </section>
  )
}

// Weapon and Armour Guide 1.4: colours, weapon chart, armour grades and the location chart.
export function Equipment() {
  const { colours, weapons, sections, grades, locations } = EQUIPMENT

  return (
    <div className="flex flex-col gap-4">
      <Card title="Weapon chart" refText={weapons.ref}>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-forge-muted">
                <th className="font-normal px-1 py-1">Weapon</th>
                <th className="font-normal px-1">Damage</th>
                <th className="font-normal px-1">Length in (cm)</th>
                <th className="font-normal px-1">Core</th>
                <th className="font-normal px-1">Striking surface</th>
              </tr>
            </thead>
            {GROUPS.map(g => {
              const list = weapons.rows.filter(w => w.group === g)
              if (!list.length) return null
              return (
                <tbody key={g}>
                  <tr><td colSpan={5} className="px-1 pt-3 pb-1 text-[10px] uppercase tracking-widest text-forge-accent">{g} weapons</td></tr>
                  {list.map(w => (
                    <tr key={w.name} className="border-t border-forge-border align-top">
                      <td className="px-1 py-1.5 text-forge-text">{w.name}</td>
                      <td className="px-1 py-1.5 font-mono text-forge-accent whitespace-nowrap">{w.damage}</td>
                      <td className="px-1 py-1.5 font-mono whitespace-nowrap">{w.lengthIn} <span className="text-forge-muted">({w.lengthCm})</span></td>
                      <td className="px-1 py-1.5 whitespace-nowrap">{w.core}</td>
                      <td className="px-1 py-1.5">{w.striking}</td>
                    </tr>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>
        <ul className="mt-2 text-[11px] text-forge-muted flex flex-col gap-0.5">
          {weapons.notes.map(n => <li key={n}>{n}</li>)}
        </ul>
      </Card>

      <Card title="Armour locations" refText={locations.ref}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,26rem)_1fr] items-start">
          <img
            src={armourLocations}
            alt="Armour coverage locations 1 to 28, front and back. Shoulders, arms, hands and calves are shaded blue."
            className="w-full rounded bg-white p-2"
            loading="lazy"
          />
          <div>
            <p className="mb-2">{locations.note}</p>
            <ol className="grid grid-cols-[auto_auto] w-fit gap-x-10 gap-y-0.5">
              {locations.list.map(l => (
                <li key={l.n} className="flex gap-2">
                  <span className="font-mono text-forge-muted w-5 text-right">{l.n}</span>
                  <span className={'blue' in l && l.blue ? 'text-sky-300' : 'text-forge-soft'}>{l.name}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Card>

      <Masonry minWidth={420} gap={16} items={[
        { key: 'colours', weight: JSON.stringify(colours).length, node: (
          <Card title="Boffer colours" refText={colours.ref}>
            <p className="mb-2">{colours.intro}</p>
            <ul className="flex flex-col gap-1.5">
              {colours.list.map(c => (
                <li key={c.colour} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm border border-forge-line shrink-0" style={{ background: c.swatch }} />
                  <span className="text-forge-text">{c.colour}</span>
                  <span className="ml-auto text-right">{c.meaning}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) },
        { key: 'grades', weight: JSON.stringify(grades).length, node: (
          <Card title="Armour grades" refText={grades.ref}>
            <ul className="flex flex-col gap-3">
              {grades.rows.map(g => (
                <li key={g.grade}>
                  <p className="flex items-baseline gap-2">
                    <span className="font-semibold text-forge-text">Grade {g.grade}</span>
                    <span className="font-mono text-forge-accent">{g.points} AP/location</span>
                  </p>
                  <p className="text-forge-soft">{g.materials}</p>
                  <Prose text={g.text} className="mt-1" />
                </li>
              ))}
            </ul>
          </Card>
        ) },
        ...sections.map(s => ({
          key: s.title, weight: s.text.length,
          node: <Card title={s.title} refText={s.ref}><Prose text={s.text} /></Card>,
        })),
      ]} />
    </div>
  )
}
