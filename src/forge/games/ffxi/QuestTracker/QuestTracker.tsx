import { useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { getCharData, putCharData } from '../api'
import { useFfxiCharacters } from '../hooks/useFfxiCharacters'
import { useSyncedBlob } from '../hooks/useSyncedBlob'
import { useCharRank } from '../hooks/useCharRank'
import { SyncedCharacterHeader } from '../components/SyncedCharacterHeader'
import { loadSelectedCharId } from '../selectedChar'
import { lastConquestReset, formatNextReset } from '../conquest'
import { CHAR_NATIONS, type NationMeta } from '../nations'

const getNow = () => Date.now()

const SK = STORAGE_KEYS.ffxiQuestTracker

type EcoKey = 'sandoria' | 'bastok' | 'windurst'

// Completion timestamps (ms epoch). Weekly state is derived against the
// conquest tally, never stored: a stale timestamp simply reads as "not done".
type QuestBlob = {
  eco: Partial<Record<EcoKey, number>>
  highwind: number | null
}

type EcoQuest = {
  key: EcoKey
  nation: NationMeta
  zone: string
  target: string
  wikiPage: string
}

const ECO_QUESTS: EcoQuest[] = [
  { key: 'sandoria', nation: CHAR_NATIONS[0], zone: "Ordelle's Caves",   target: 'Necroplasm',  wikiPage: "Eco-Warrior_(San_d'Oria)" },
  { key: 'bastok',   nation: CHAR_NATIONS[1], zone: 'Gusgen Mines',      target: '2x Pudding',  wikiPage: 'Eco-Warrior_(Bastok)' },
  { key: 'windurst', nation: CHAR_NATIONS[2], zone: 'Maze of Shakhrami', target: '3x Wyrmfly',  wikiPage: 'Eco-Warrior_(Windurst)' },
]

const ECO_KEYS = ECO_QUESTS.map(q => q.key)

function wikiUrl(page: string) {
  return `https://horizonffxi.wiki/${encodeURIComponent(page)}`
}

function loadState(): QuestBlob {
  try {
    const raw = localStorage.getItem(SK)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { eco: {}, highwind: null, ...parsed }
    }
  } catch { /* ignore */ }
  return { eco: {}, highwind: null }
}

// The Eco rotation (all three before repeats) restarts once every quest is
// done and the newest completion predates the current conquest week.
function effectiveEco(eco: QuestBlob['eco'], reset: number): QuestBlob['eco'] {
  const times = ECO_KEYS.map(k => eco[k]).filter((t): t is number => t !== undefined)
  if (times.length === ECO_KEYS.length && Math.max(...times) < reset) return {}
  return eco
}

function WikiLink({ page, title }: { page: string; title: string }) {
  return (
    <a
      href={wikiUrl(page)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#6b7280] hover:text-[#e2e4ed] transition-colors text-xs"
      title={`${title} on HorizonXI wiki`}
    >
      ↗
    </a>
  )
}

export function QuestTracker() {
  const [saved, setSaved] = useState<QuestBlob>(loadState)
  const { isAuthenticated } = useAuth()
  const { characters } = useFfxiCharacters()
  const [selectedCharId, setSelectedCharId] = useState<string | null>(loadSelectedCharId)

  const selectedChar = isAuthenticated
    ? characters.find(c => c.id === selectedCharId) ?? null
    : null
  const synced = selectedChar !== null
  const syncedRank = useCharRank(selectedChar?.name ?? null)
  // Once synced this mount, never fall back to writing localStorage: if the
  // session dies mid-use, `saved` holds server data and writing it would
  // destroy the logged-out browser copy.
  const wasSynced = useRef(false)
  useEffect(() => {
    if (synced) wasSynced.current = true
  }, [synced])

  const { scheduleSave } = useSyncedBlob<QuestBlob>({
    key: selectedChar?.id ?? null,
    load: selectedChar
      ? () => getCharData<QuestBlob>(selectedChar.id, 'quest_tracker')
      : null,
    save: selectedChar
      ? data => putCharData(selectedChar.id, 'quest_tracker', data)
      : null,
    onLoaded: data => {
      setSaved({ eco: data?.eco ?? {}, highwind: data?.highwind ?? null })
    },
  })

  function persist(next: QuestBlob) {
    setSaved(next)
    if (synced) scheduleSave(next)
    else if (!wasSynced.current) localStorage.setItem(SK, JSON.stringify(next))
  }

  const reset = lastConquestReset()
  const eco = effectiveEco(saved.eco, reset)
  const ecoDoneThisWeek = ECO_KEYS.some(k => (eco[k] ?? 0) >= reset)
  const highwindDone = saved.highwind !== null && saved.highwind >= reset

  function toggleEco(key: EcoKey) {
    const next = { ...eco }
    if (next[key] !== undefined) delete next[key]
    else next[key] = getNow()
    persist({ ...saved, eco: next })
  }

  function toggleHighwind() {
    persist({ ...saved, highwind: highwindDone ? null : getNow() })
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">

      {isAuthenticated && characters.length > 0 && (
        <SyncedCharacterHeader
          characters={characters}
          selectedId={selectedCharId}
          onSelect={setSelectedCharId}
          avatar={selectedChar?.avatar}
          name={selectedChar?.name}
          nation={
            selectedChar && selectedChar.nation !== null
              ? CHAR_NATIONS[selectedChar.nation] ?? null
              : null
          }
          rank={syncedRank}
        />
      )}

      {/* Title + next reset */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Quest <span className="text-[#c4af64]">Tracker</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon · weekly repeatables</p>
        </div>
        <div className="text-right mt-1 shrink-0">
          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Next reset</p>
          <p className="text-xs text-[#c4af64] tabular-nums">{formatNextReset()}</p>
        </div>
      </div>

      {/* Eco-Warrior */}
      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[#2a2d3a] bg-[#1a1d27]/40 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-[#e2e4ed]">Eco-Warrior</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              One per conquest week · all three before repeats · 10,000 gil each
            </p>
          </div>
          <span className={`text-xs shrink-0 ${ecoDoneThisWeek ? 'text-[#4ade80]' : 'text-[#c4af64]'}`}>
            {ecoDoneThisWeek ? 'Done this week' : '1 available this week'}
          </span>
        </div>
        <table className="w-full">
          <tbody>
            {ECO_QUESTS.map(quest => {
              const doneAt = eco[quest.key]
              const done = doneAt !== undefined
              const thisWeek = done && doneAt >= reset
              return (
                <tr
                  key={quest.key}
                  className={`border-b last:border-0 ${
                    done ? 'bg-[#166534]/10 border-[#166534]/25' : 'border-[#1a1d27]'
                  }`}
                >
                  <td className={`pl-4 pr-2 py-2.5 w-10 border-l-2 ${done ? 'border-l-[#22c55e]/70' : 'border-l-transparent'}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleEco(quest.key)}
                      aria-label={`Eco-Warrior ${quest.nation.name}`}
                      className="w-3.5 h-3.5 cursor-pointer accent-[#c4af64]"
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      {quest.nation.icon
                        ? <img src={quest.nation.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
                        : <span style={{ color: quest.nation.color }}>{quest.nation.symbol}</span>
                      }
                      <span style={{ color: quest.nation.color }}>{quest.nation.name}</span>
                      {thisWeek && <span className="text-[10px] text-[#4ade80]">this week</span>}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-[#9ca3af] hidden sm:table-cell">{quest.zone}</td>
                  <td className="py-2.5 pr-3 text-xs text-[#6b7280] hidden sm:table-cell">{quest.target}</td>
                  <td className="py-2.5 pr-4 text-right w-8">
                    <WikiLink page={quest.wikiPage} title={`Eco-Warrior (${quest.nation.name})`} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Highwind */}
      <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[#2a2d3a] bg-[#1a1d27]/40 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-[#e2e4ed]">Highwind</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Airship NM · 3,000 gil + 3,000 exp · once per conquest tally
            </p>
          </div>
          <span className={`text-xs shrink-0 ${highwindDone ? 'text-[#4ade80]' : 'text-[#c4af64]'}`}>
            {highwindDone ? 'Done this week' : 'Available'}
          </span>
        </div>
        <div className={`flex items-center gap-3 pl-4 pr-4 py-2.5 border-l-2 ${
          highwindDone ? 'bg-[#166534]/10 border-l-[#22c55e]/70' : 'border-l-transparent'
        }`}>
          <input
            type="checkbox"
            checked={highwindDone}
            onChange={toggleHighwind}
            aria-label="Highwind killed this week"
            className="w-3.5 h-3.5 cursor-pointer accent-[#c4af64]"
          />
          <span className="text-sm text-[#e2e4ed] flex-1">Killed this week</span>
          <span className="text-xs text-[#6b7280] hidden sm:inline">respawns 4h per airship</span>
          <WikiLink page="Highwind" title="Highwind" />
        </div>
      </div>
    </div>
  )
}
