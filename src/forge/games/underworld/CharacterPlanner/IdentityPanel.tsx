import { CULTURES, FAVOURED_VOCATIONS, FRAG_RACES, RACES, VOCATIONS } from '../data'
import { OCC_CLASS, OCC_ORDER } from '../rules'
import { BUILD_STATUSES, raceData, switchRole, vocationData, type Build, type BuildStatus, type Evaluation } from '../engine'
import { Collapsible } from '../../../../components/Collapsible'
import { Prose } from '../components/Prose'

interface Props {
  build: Build
  ev: Evaluation
  setBuild: (fn: (b: Build) => Build) => void
  locked: boolean
  setStatus: (status: BuildStatus) => void
  // Sandbox blanket count and CP bar, shown under occupation and vocation.
  blankets?: React.ReactNode
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="min-w-0">
      <span className="forge-label">{label}</span>
      {children}
    </label>
  )
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg font-mono ${warn ? 'text-red-400' : 'text-forge-accent'}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-forge-muted">{label}</span>
    </div>
  )
}

const fragTiers = ['Uncommon', 'Rare', 'Obscure']

export function IdentityPanel({ build, ev, setBuild, locked, setStatus, blankets }: Props) {
  const set = (patch: Partial<Build>) => setBuild(b => ({ ...b, ...patch }))
  const race = raceData(build.race)
  const culture = CULTURES[build.culture]
  const voc = vocationData(build.vocation)
  const cultures = Object.entries(CULTURES).filter(([, c]) => c.races.includes(build.race))
  const { stats } = ev

  return (
    <div className="forge-card !p-3 flex flex-col gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
        <label className="min-w-0">
          <span className="forge-label">Character name</span>
          <input
            className="forge-input !py-1.5"
            value={build.name}
            placeholder="Unnamed character"
            maxLength={80}
            disabled={locked}
            onChange={e => set({ name: e.target.value })}
          />
        </label>
        <Field label="Status">
          <select className="forge-input !py-1.5" value={build.status ?? 'planning'} onChange={e => setStatus(e.target.value as BuildStatus)}>
            {BUILD_STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </Field>
      </div>
      <fieldset disabled={locked} className="grid grid-cols-2 gap-x-3 gap-y-2 min-w-0">
        <Field label="Race">
          <select className="forge-input !py-1.5" value={build.race} onChange={e => set({ race: e.target.value, culture: '' })}>
            <option value="">Choose…</option>
            <optgroup label="Common races">
              {Object.keys(RACES).map(r => <option key={r} value={r}>{r}</option>)}
            </optgroup>
            {fragTiers.map(tier => (
              <optgroup key={tier} label={`${tier} (frag) races`}>
                {Object.entries(FRAG_RACES).filter(([, r]) => r.tier === tier).map(([name, r]) => (
                  <option key={name} value={name}>{name} ({r.fragCost} frags)</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Culture">
          <select className="forge-input !py-1.5" value={build.culture} disabled={!cultures.length} onChange={e => set({ culture: e.target.value })}>
            <option value="">{cultures.length ? 'None' : 'None available'}</option>
            {cultures.map(([name]) => <option key={name} value={name}>{name} (100 frags)</option>)}
          </select>
        </Field>
        <Field label="Occupation">
          <select className="forge-input !py-1.5" value={build.occupation} onChange={e => { const occupation = e.target.value; setBuild(b => switchRole(b, { occupation })) }}>
            <option value="">Choose…</option>
            {(['warrior', 'rogue', 'scholar'] as const).map(cls => (
              <optgroup key={cls} label={cls[0].toUpperCase() + cls.slice(1)}>
                {OCC_ORDER.filter(o => OCC_CLASS[o] === cls).map(o => <option key={o} value={o}>{o}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Vocation">
          <select className="forge-input !py-1.5" value={build.vocation} onChange={e => { const vocation = e.target.value; setBuild(b => switchRole(b, { vocation })) }}>
            <option value="">None</option>
            <optgroup label="Vocations (150 frags)">
              {Object.keys(VOCATIONS).map(v => <option key={v} value={v}>{v}</option>)}
            </optgroup>
            {(['Champion', 'Demagogue'] as const).map(g => (
              <optgroup key={g} label={`Favoured ${g} (250 frags + 50 CP)`}>
                {Object.entries(FAVOURED_VOCATIONS).filter(([, v]) => v.group === g).map(([name]) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      </fieldset>

      {blankets && <div className="border-t border-forge-border pt-2">{blankets}</div>}

      <div className="flex flex-col gap-2 border-t border-forge-border pt-2">
        <div className="grid grid-cols-3 w-3/4 mx-auto">
          <Stat label="Level" value={stats.level} />
          <Stat label="Body" value={stats.body ?? '-'} />
          <Stat label="Strength" value={stats.strength} />
        </div>
        <div className="grid grid-cols-4">
          <Stat label="CP total" value={stats.cpTotal} />
          <Stat label="CP spent" value={stats.cpSpent} />
          <Stat label="CP left" value={stats.cpRemaining} warn={stats.cpRemaining < 0} />
          <Stat label="Frags" value={stats.frags} />
        </div>
      </div>

      {(race || culture || voc) && (
        <div className="border-t border-forge-border pt-2 flex flex-col gap-1">
          {race && (
            <Collapsible title={<span>About the {build.race}</span>}>
              <Prose text={race.lore} className="text-xs text-forge-dim leading-relaxed mb-2" />
              <ul className="flex flex-col gap-1.5">
                {race.auto.map(t => (
                  <li key={t.name} className="text-xs text-forge-dim">
                    <span className={t.kind === 'advantage' ? 'text-emerald-400' : 'text-red-400'}>{t.name}</span>
                    <Prose text={t.desc} />
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
          {culture && (
            <Collapsible title={<span>{build.culture}</span>}>
              <Prose text={culture.lore} className="text-xs text-forge-dim leading-relaxed mb-2" />
              <p className="text-xs text-forge-dim"><span className="text-forge-accent">Look:</span> {culture.racialCharacteristicAddition}</p>
              <p className="text-xs text-forge-accent mt-1">Indoctrination</p>
              <Prose text={culture.indoctrination} className="text-xs text-forge-dim leading-relaxed" />
            </Collapsible>
          )}
          {voc && (
            <Collapsible title={<span>{build.vocation}</span>}>
              <Prose text={voc.lore} className="text-xs text-forge-dim leading-relaxed mb-2" />
              <p className="text-xs text-forge-dim"><span className="text-forge-accent">Prerequisites:</span> {voc.prereqs}</p>
              <p className="text-xs text-forge-dim mt-1">
                Replaces occupational abilities with {voc.abilities.map(a => a.name).join(', ')}.
              </p>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}
