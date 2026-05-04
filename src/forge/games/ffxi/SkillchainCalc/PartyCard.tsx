import { Select } from '../../../../components/Select'
import type { SelectOption } from '../../../../components/Select'
import { JOBS } from './data/jobs'
import type { Job, JobInfo } from './data/jobs'
import type { WeaponType } from './data/weaponSkills'
import { getBurstSpells } from './data/spells'
import type { Element } from './data/elements'
import { ELEMENT_COLORS } from './data/elements'
import { getAvailableWSes } from './engine'
import type { PartyMember } from './engine'

export type { PartyMember }

const JOB_OPTIONS: SelectOption[] = JOBS
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(j => ({ value: j.name, label: `${j.name} — ${j.fullName}` }))

function weaponOptions(jobInfo: JobInfo): SelectOption[] {
  const weapons = Object.keys(jobInfo.weapons) as WeaponType[]
  const sorted = jobInfo.isRanged
    ? [
        ...weapons.filter(w => w === 'Archery' || w === 'Marksmanship'),
        ...weapons.filter(w => w !== 'Archery' && w !== 'Marksmanship'),
      ]
    : weapons
  return sorted.map(w => ({ value: w, label: w }))
}

type PartyCardProps = {
  member: PartyMember
  onChange: (m: PartyMember) => void
  onReset: () => void
  levelSync: number
  index: number
}

export function PartyCard({ member, onChange, onReset, levelSync, index }: PartyCardProps) {
  const jobInfo = member.job ? JOBS.find(j => j.name === member.job) : undefined
  const isMage = jobInfo?.isMage ?? false

  const wsOptions = jobInfo ? weaponOptions(jobInfo) : []
  const burstSpells = isMage && member.job ? getBurstSpells(member.job, levelSync) : null
  const wsCount = !isMage && member.job && member.weaponType
    ? getAvailableWSes(member.job, member.weaponType, levelSync).length
    : null

  const hasData = !!(member.job || member.name || member.weaponType)

  function handleJobChange(opt: SelectOption | null) {
    onChange({ ...member, job: (opt?.value as Job) ?? null, weaponType: null })
  }

  function handleWeaponChange(opt: SelectOption | null) {
    onChange({ ...member, weaponType: (opt?.value as WeaponType) ?? null })
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-4 py-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-[#6b7280] uppercase tracking-widest shrink-0">Slot {index + 1}</span>
          {hasData && (
            <span className="text-xs text-[#6b7280] truncate">
              {[member.name, member.job].filter(Boolean).join(' — ')}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          disabled={!hasData}
          className="text-xs text-[#4b5563] hover:text-[#6b7280] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          Reset
        </button>
      </div>

      <input
        className="forge-input text-sm"
        placeholder="Name (optional)"
        value={member.name}
        onChange={e => onChange({ ...member, name: e.target.value })}
      />

      <Select
        options={JOB_OPTIONS}
        value={member.job ? JOB_OPTIONS.find(o => o.value === member.job) ?? null : null}
        onChange={handleJobChange}
        placeholder="Job…"
        isSearchable
      />

      {!isMage && (
        <Select
          options={wsOptions}
          value={member.weaponType ? { value: member.weaponType, label: member.weaponType } : null}
          onChange={handleWeaponChange}
          placeholder="Weapon…"
          isDisabled={!member.job}
        />
      )}

      {wsCount !== null && (
        <p className="text-xs text-[#6b7280]">{wsCount} WS available at this level</p>
      )}

      {isMage && burstSpells && Object.keys(burstSpells).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {(Object.entries(burstSpells) as [Element, NonNullable<typeof burstSpells[Element]>][])
            .filter(([, s]) => s != null)
            .map(([el, spell]) => (
              <span
                key={el}
                className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{
                  color: ELEMENT_COLORS[el],
                  background: `${ELEMENT_COLORS[el]}15`,
                  border: `1px solid ${ELEMENT_COLORS[el]}40`,
                }}
              >
                {spell.name}
              </span>
            ))
          }
        </div>
      )}

      {isMage && member.job && (!burstSpells || Object.keys(burstSpells).length === 0) && (
        <p className="text-xs text-[#374151] italic">No spells at this level</p>
      )}
    </div>
  )
}
