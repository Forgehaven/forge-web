import ReactSelect from 'react-select'
import { Select } from '../../../../components/Select'
import type { SelectOption } from '../../../../components/Select'
import { JOBS } from '../data/jobs'
import type { Job, JobInfo } from '../data/jobs'
import type { WeaponType } from '../data/weaponSkills'
import { getBurstSpells } from '../data/burstSpells'
import type { Element } from '../data/elements'
import { ELEMENT_COLORS } from '../data/elements'
import { getAvailableAvatars, getBloodPacts, type Avatar } from '../data/petSkills'
import { getAvailableWSes } from './engine'
import type { PartyMember } from './engine'

export type { PartyMember }

const JOB_OPTIONS: SelectOption[] = JOBS
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(j => ({ value: j.name, label: `${j.name} — ${j.fullName}` }))

function weaponOptions(jobInfo: JobInfo): SelectOption[] {
  const weapons = Object.keys(jobInfo.weapons) as WeaponType[]
  const sorted = jobInfo.roles.includes('ranged')
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
  isMe?: boolean
  onToggleMe?: () => void
  advanced?: boolean
}

export function PartyCard({ member, onChange, onReset, levelSync, index, isMe, onToggleMe, advanced = false }: PartyCardProps) {
  const jobInfo = member.job ? JOBS.find(j => j.name === member.job) : undefined
  const canWS = jobInfo ? (jobInfo.roles.includes('melee') || jobInfo.roles.includes('ranged')) : false

  const wsOptions = jobInfo ? weaponOptions(jobInfo) : []
  const burstSpells = member.job ? getBurstSpells(member.job, levelSync) : null
  const wsCount = canWS && member.job && member.weaponType
    ? getAvailableWSes(member.job, member.weaponType, levelSync).length
    : null

  const avatarOptions = member.job && getAvailableAvatars(levelSync)
    .map(a => ({ value: a, label: a }))

  const bloodPactCount = member.job === 'SMN' && member.avatar
    ? getBloodPacts(member.avatar, levelSync).length
    : null

  const wsOptionsForPreferred = member.job && member.weaponType
    ? getAvailableWSes(member.job, member.weaponType, levelSync).map(w => ({ value: w.name, label: w.name }))
    : []

  const hasData = !!(member.job || member.name || member.weaponType || member.avatar)

  function handleJobChange(opt: SelectOption | null) {
    onChange({ ...member, job: (opt?.value as Job) ?? null, weaponType: null, avatar: null })
  }

  function handleWeaponChange(opt: SelectOption | null) {
    onChange({ ...member, weaponType: (opt?.value as WeaponType) ?? null, preferredWS: [] })
  }

  function handleAvatarChange(opt: SelectOption | null) {
    onChange({ ...member, avatar: (opt?.value as Avatar) ?? null })
  }

  return (
    <div
      className="bg-[#1a1d27] border rounded-lg px-4 py-3 flex flex-col gap-2 min-w-0 transition-colors"
      style={{ borderColor: isMe ? '#c4af64' : '#2a2d3a' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-[#6b7280] uppercase tracking-widest shrink-0">Slot {index + 1}</span>
          {hasData && (
            <span className="text-xs text-[#6b7280] truncate">
              {[member.name, member.job].filter(Boolean).join(' — ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleMe && (
            <button
              onClick={onToggleMe}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-widest cursor-pointer transition-colors"
              style={isMe
                ? { color: '#c4af64', background: '#c4af6420', border: '1px solid #c4af6440' }
                : { color: '#4b5563', background: 'transparent', border: '1px solid #2a2d3a' }
              }
            >
              ME
            </button>
          )}
          <button
            onClick={onReset}
            disabled={!hasData}
            className="text-xs text-[#4b5563] hover:text-[#6b7280] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
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

      {advanced && member.job && (
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              const newOpener = !member.forceOpener
              onChange({ ...member, forceOpener: newOpener, forceCloser: newOpener ? false : member.forceCloser })
            }}
            className="text-xs px-2 py-0.5 rounded font-medium cursor-pointer transition-all"
            style={member.forceOpener
              ? { color: '#c4af64', background: '#c4af6420', border: '1px solid #c4af6460' }
              : { color: '#4b5563', background: 'transparent', border: '1px solid #2a2d3a' }
            }
          >
            Opener
          </button>
          <button
            onClick={() => {
              const newCloser = !member.forceCloser
              onChange({ ...member, forceCloser: newCloser, forceOpener: newCloser ? false : member.forceOpener })
            }}
            className="text-xs px-2 py-0.5 rounded font-medium cursor-pointer transition-all"
            style={member.forceCloser
              ? { color: '#c4af64', background: '#c4af6420', border: '1px solid #c4af6460' }
              : { color: '#4b5563', background: 'transparent', border: '1px solid #2a2d3a' }
            }
          >
            Closer
          </button>
        </div>
      )}

      {canWS && (
        <Select
          options={wsOptions}
          value={member.weaponType ? { value: member.weaponType, label: member.weaponType } : null}
          onChange={handleWeaponChange}
          placeholder="Weapon…"
          isSearchable
          isClearable
          isDisabled={!member.job}
        />
      )}

      {wsCount !== null && (
        <p className="text-xs text-[#6b7280]">{wsCount} WS available at this level</p>
      )}

      {member.job === 'SMN' && (
        <>
          <Select
            options={avatarOptions ?? []}
            value={member.avatar ? { value: member.avatar, label: member.avatar } : null}
            onChange={handleAvatarChange}
            placeholder="Avatar…"
            isSearchable
            isClearable
          />
          {bloodPactCount !== null && (
            <p className="text-xs text-[#6b7280]">{bloodPactCount} blood pacts available at this level</p>
          )}
        </>
      )}

      {advanced && member.job && member.weaponType && wsOptionsForPreferred.length > 0 && (
        <ReactSelect<SelectOption, true>
          isMulti
          unstyled
          options={wsOptionsForPreferred}
          value={wsOptionsForPreferred.filter(o => member.preferredWS.includes(o.value))}
          onChange={opts => onChange({ ...member, preferredWS: (opts ?? []).map(o => o.value) })}
          placeholder="Preferred WS…"
          isSearchable
          closeMenuOnSelect={false}
          classNames={{
            container: () => 'min-w-0 w-full',
            control: ({ isFocused }) =>
              `flex items-center bg-[#0f1117] border ${isFocused ? 'border-[#c4af64]' : 'border-[#2a2d3a]'} rounded px-2 py-[3px] cursor-pointer min-h-0`,
            valueContainer: () => 'flex items-center flex-1 flex-wrap gap-0.5',
            indicatorsContainer: () => 'flex items-center shrink-0',
            menu: () =>
              'bg-[#1a1d27] border border-[#2a2d3a] rounded-lg mt-1 shadow-xl overflow-hidden min-w-max',
            menuList: () => 'py-1',
            option: ({ isFocused, isSelected }) =>
              `px-3 py-2 text-sm cursor-pointer ${
                isSelected
                  ? 'bg-[#c4af64]/15 text-[#c4af64]'
                  : isFocused
                  ? 'bg-[#2a2d3a] text-[#e2e4ed]'
                  : 'text-[#9ca3af]'
              }`,
            multiValue: () =>
              'flex items-center bg-[#c4af64]/15 border border-[#c4af64]/40 rounded px-1.5 py-0.5 gap-0.5',
            multiValueLabel: () => 'text-xs text-[#c4af64] whitespace-nowrap',
            multiValueRemove: () =>
              'text-[#c4af64]/60 hover:text-[#c4af64] hover:bg-[#c4af64]/10 rounded cursor-pointer px-0.5',
            singleValue: () => 'text-[#e2e4ed] text-sm whitespace-nowrap',
            input: () => 'text-[#e2e4ed] text-sm',
            placeholder: () => 'text-[#6b7280] text-sm',
            indicatorSeparator: () => 'hidden',
            dropdownIndicator: () => 'text-[#6b7280] hover:text-[#e2e4ed] pl-1',
            noOptionsMessage: () => 'text-[#6b7280] text-sm px-3 py-2',
          }}
          styles={{
            control: base => ({ ...base, minHeight: 'auto', height: 'auto' }),
            valueContainer: base => ({ ...base, flexWrap: 'wrap', overflow: 'visible' }),
            menu: base => ({ ...base, zIndex: 9999 }),
            menuList: () => ({ maxHeight: 480, overflowY: 'auto' }),
          }}
        />
      )}

      {burstSpells && Object.keys(burstSpells).length > 0 && (
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

      {jobInfo?.roles.includes('mage') && member.job && Object.keys(burstSpells ?? {}).length === 0 && (
        <p className="text-xs text-[#374151] italic">No spells at this level</p>
      )}
    </div>
  )
}
