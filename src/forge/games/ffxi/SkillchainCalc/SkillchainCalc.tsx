import { useEffect, useMemo, useState } from 'react'
import { ResistanceHeader } from './ResistanceHeader'
import { MobSelector } from './MobSelector'
import { PartyCard } from './PartyCard'
import { ChainCard } from './ChainCard'
import { findBestGroups } from './engine'
import type { ChainGroup, PartyMember, ResistanceMap, ResistanceState, SkillchainLink } from './engine'
import type { DamageType } from '../data/elements'

const SK_PARTY = 'forge_ffxi_sc_party'
const SK_RESISTANCES = 'forge_ffxi_sc_resistances'
const SK_LEVEL = 'forge_ffxi_sc_level'
const SK_FAVOURITE = 'forge_ffxi_sc_favourite'
const SK_MOB = 'forge_ffxi_sc_mob'

function emptyMember(): PartyMember {
  return { job: null, weaponType: null, name: '' }
}

function loadParty(): PartyMember[] {
  try {
    const raw = localStorage.getItem(SK_PARTY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return Array.from({ length: 6 }, emptyMember)
}

function loadResistances(): ResistanceMap {
  try {
    const raw = localStorage.getItem(SK_RESISTANCES)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function loadLevelSync(): number {
  try {
    const raw = localStorage.getItem(SK_LEVEL)
    if (raw) {
      const v = parseInt(raw)
      if (!isNaN(v)) return Math.max(1, Math.min(75, v))
    }
  } catch { /* ignore */ }
  return 75
}

function loadFavourite(): string | null {
  try { return localStorage.getItem(SK_FAVOURITE) } catch { return null }
}

function loadMob(): string | null {
  try { return localStorage.getItem(SK_MOB) } catch { return null }
}

function chainKey(link: SkillchainLink): string {
  return link.steps.map(s => `${s.memberIdx}:${s.ws.name}`).join('|')
}

function groupKey(group: ChainGroup): string {
  return group.links.map(chainKey).sort().join('||')
}

type SectionHeaderProps = {
  label: string
  open: boolean
  onToggle: () => void
  onReset?: () => void
  resetLabel?: string
}

function SectionHeader({ label, open, onToggle, onReset, resetLabel = 'Reset' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <button onClick={onToggle} className="flex items-center gap-1.5 cursor-pointer">
        <p className="forge-label text-xs uppercase tracking-widest">{label}</p>
        <span
          className="text-[#6b7280] text-xs inline-block transition-transform duration-150"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          ▾
        </span>
      </button>
      {onReset && (
        <button
          onClick={onReset}
          className="text-xs text-[#4b5563] hover:text-[#6b7280] transition-colors cursor-pointer"
        >
          {resetLabel}
        </button>
      )}
    </div>
  )
}

type GroupRowProps = {
  group: ChainGroup
  party: PartyMember[]
  rank: number
  compact: boolean
  isFavourite: boolean
  onToggleFavourite: () => void
}

function GroupRow({ group, party, rank, compact, isFavourite, onToggleFavourite }: GroupRowProps) {
  if (group.links.length === 1) {
    return (
      <ChainCard
        link={group.links[0]}
        party={party}
        rank={rank}
        compact={compact}
        isFavourite={isFavourite}
        onToggleFavourite={onToggleFavourite}
      />
    )
  }
  return (
    <div
      className="border rounded-lg bg-[#0f1117] p-3 flex flex-col gap-2.5"
      style={{ borderColor: isFavourite ? '#c4af64' : '#2a2d3a' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#4b5563] uppercase tracking-widest">
          {group.links.length} concurrent chains · #{rank}
        </p>
        <button
          onClick={onToggleFavourite}
          className="text-base leading-none cursor-pointer transition-colors"
          style={{ color: isFavourite ? '#c4af64' : '#374151' }}
        >
          {isFavourite ? '★' : '☆'}
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {group.links.map((link, i) => (
          <ChainCard key={i} link={link} party={party} rank={rank} compact={compact} />
        ))}
      </div>
    </div>
  )
}

export function SkillchainCalc() {
  const [resistances, setResistances] = useState<ResistanceMap>(loadResistances)
  const [selectedMob, setSelectedMob] = useState<string | null>(loadMob)
  const [levelSync, setLevelSync] = useState<number>(loadLevelSync)
  const [levelSyncRaw, setLevelSyncRaw] = useState<string>(() => String(loadLevelSync()))
  const [party, setParty] = useState<PartyMember[]>(loadParty)
  const [resetKeys, setResetKeys] = useState<number[]>(() => Array(6).fill(0))
  const [resistanceOpen, setResistanceOpen] = useState(true)
  const [partyOpen, setPartyOpen] = useState(true)
  const [favourite, setFavourite] = useState<string | null>(loadFavourite)

  useEffect(() => { localStorage.setItem(SK_PARTY, JSON.stringify(party)) }, [party])
  useEffect(() => { localStorage.setItem(SK_RESISTANCES, JSON.stringify(resistances)) }, [resistances])
  useEffect(() => { localStorage.setItem(SK_LEVEL, String(levelSync)) }, [levelSync])
  useEffect(() => {
    if (favourite !== null) localStorage.setItem(SK_FAVOURITE, favourite)
    else localStorage.removeItem(SK_FAVOURITE)
  }, [favourite])
  useEffect(() => {
    if (selectedMob !== null) localStorage.setItem(SK_MOB, selectedMob)
    else localStorage.removeItem(SK_MOB)
  }, [selectedMob])

  function clearFavourite() { setFavourite(null) }

  function handleResistanceChange(type: DamageType, state: ResistanceState) {
    setSelectedMob(null)
    clearFavourite()
    setResistances(prev => ({ ...prev, [type]: state }))
  }

  function handleMobSelect(resistances: ResistanceMap | null, mobName: string | null) {
    setSelectedMob(mobName)
    clearFavourite()
    setResistances(resistances ?? {})
  }

  function handleMemberChange(idx: number, m: PartyMember) {
    clearFavourite()
    setParty(prev => prev.map((old, i) => i === idx ? m : old))
  }

  function handleMemberReset(idx: number) {
    clearFavourite()
    setParty(prev => prev.map((old, i) => i === idx ? emptyMember() : old))
    setResetKeys(prev => prev.map((k, i) => i === idx ? k + 1 : k))
  }

  function handleLevelSync(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setLevelSyncRaw(raw)
    const v = parseInt(raw)
    if (!isNaN(v)) {
      clearFavourite()
      setLevelSync(Math.max(1, Math.min(75, v)))
    }
  }

  function handleLevelSyncBlur() {
    setLevelSyncRaw(String(levelSync))
  }

  function resetResistances() { setSelectedMob(null); clearFavourite(); setResistances({}) }
  function resetParty() {
    clearFavourite()
    setParty(Array.from({ length: 6 }, emptyMember))
    setResetKeys(prev => prev.map(k => k + 1))
  }

  const groups = useMemo(
    () => findBestGroups(party, levelSync, resistances),
    [party, levelSync, resistances],
  )

  const topScore = groups[0]?.totalScore ?? -Infinity

  const sortedGroups = useMemo(() => {
    if (!favourite) return groups
    const favIdx = groups.findIndex(g => groupKey(g) === favourite)
    if (favIdx <= 0) return groups
    const copy = [...groups]
    const [favGroup] = copy.splice(favIdx, 1)
    return [favGroup, ...copy]
  }, [groups, favourite])

  const hasAnyMelee = party.some(m => m.job && m.weaponType)
  const hasResistances = Object.keys(resistances).length > 0
  const hasPartyData = party.some(m => m.job || m.name)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
          Skillchain <span className="text-[#c4af64]">Calc</span>
        </h1>
        <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
      </div>

      <div>
        <SectionHeader
          label="Enemy Damage Profile"
          open={resistanceOpen}
          onToggle={() => setResistanceOpen(o => !o)}
          onReset={hasResistances ? resetResistances : undefined}
        />
        {resistanceOpen && (
          <div className="flex flex-col gap-2">
            <MobSelector
              selectedMobName={selectedMob}
              onSelect={(res, name) => handleMobSelect(res, name)}
            />
            <ResistanceHeader resistances={resistances} onChange={handleResistanceChange} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="forge-label text-xs uppercase tracking-widest shrink-0">Level Sync</label>
        <input
          type="number"
          min={1}
          max={75}
          value={levelSyncRaw}
          onChange={handleLevelSync}
          onBlur={handleLevelSyncBlur}
          className="forge-input-mono w-20 text-sm"
        />
        <span className="text-xs text-[#6b7280]">WS availability and spell tiers are calculated from this level</span>
      </div>

      <div>
        <SectionHeader
          label="Party Setup"
          open={partyOpen}
          onToggle={() => setPartyOpen(o => !o)}
          onReset={hasPartyData ? resetParty : undefined}
        />
        {partyOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {party.map((m, i) => (
              <PartyCard
                key={`slot-${i}-${resetKeys[i]}`}
                member={m}
                onChange={m => handleMemberChange(i, m)}
                onReset={() => handleMemberReset(i)}
                levelSync={levelSync}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {sortedGroups.length > 0 && (
        <div>
          <p className="forge-label text-xs uppercase tracking-widest mb-3">Best Skillchains</p>
          <div className="flex flex-col gap-3">
            {sortedGroups.map((group, gi) => {
              const gKey = groupKey(group)
              const isFavGroup = favourite === gKey
              return (
                <GroupRow
                  key={gi}
                  group={group}
                  party={party}
                  rank={gi + 1}
                  compact={!isFavGroup && group.totalScore < topScore}
                  isFavourite={isFavGroup}
                  onToggleFavourite={() => setFavourite(prev => prev === gKey ? null : gKey)}
                />
              )
            })}
          </div>
        </div>
      )}

      {groups.length === 0 && hasAnyMelee && (
        <div className="forge-card flex items-center justify-center py-6">
          <p className="text-sm text-[#6b7280]">No skillchains found — add more party members or try different weapons.</p>
        </div>
      )}
    </div>
  )
}
