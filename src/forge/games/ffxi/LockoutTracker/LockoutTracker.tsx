import { useState } from 'react'
import { useNow } from '../../../../hooks/useNow'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { AlertBell } from '../../../../components/alarms/AlarmProvider'
import { useAlarmSource } from '../../../../components/alarms/alarmContext'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { getCharData, putCharData } from '../api'
import { useFfxiCharacters } from '../hooks/useFfxiCharacters'
import { useCharRank } from '../hooks/useCharRank'
import { useSyncedBlob } from '../hooks/useSyncedBlob'
import { SyncedCharacterHeader } from '../components/SyncedCharacterHeader'
import { loadSelectedCharId } from '../selectedChar'
import { CHAR_NATIONS } from '../nations'
import { lastConquestReset, formatNextReset } from '../conquest'
import { formatLongWait } from '../data/vanaTime'

const SK = STORAGE_KEYS.ffxiLockouts
export const LOCKOUT_MS = 72 * 3_600_000

type LockoutBlob = {
  dynamis: number[]
  limbus: number | null
}

const EMPTY: LockoutBlob = { dynamis: [], limbus: null }

function loadState(): LockoutBlob {
  try {
    const p = JSON.parse(localStorage.getItem(SK) ?? '')
    return {
      dynamis: Array.isArray(p?.dynamis) ? p.dynamis.filter((n: unknown) => typeof n === 'number') : [],
      limbus: typeof p?.limbus === 'number' ? p.limbus : null,
    }
  } catch { /* fall through */ }
  return EMPTY
}

const fmtStamp = (t: number) =>
  new Date(t).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function ReadyLine({ label, anchor, nowMs }: { label: string; anchor: number | null; nowMs: number }) {
  if (anchor === null) {
    return <div className="text-sm text-[#6b7280]">{label}: no entry logged</div>
  }
  const readyAt = anchor + LOCKOUT_MS
  const ready = nowMs >= readyAt
  return (
    <div className="text-sm text-[#9ca3af]">
      {label}: {ready
        ? <span className="text-[#4ade80] font-semibold">READY</span>
        : <span className="tabular-nums">ready {fmtStamp(readyAt)} · in {formatLongWait(readyAt - nowMs)}</span>}
    </div>
  )
}

export function LockoutTracker() {
  const now = useNow(1000)
  const ms = now.getTime()
  const alarms = useAlarmSource('ffxi')
  const { isAuthenticated } = useAuth()
  const { characters } = useFfxiCharacters()
  const [selectedCharId, setSelectedCharId] = useState<string | null>(loadSelectedCharId)
  const [saved, setSaved] = useState<LockoutBlob>(loadState)

  const selectedChar = isAuthenticated
    ? characters.find(c => c.id === selectedCharId) ?? null
    : null
  const synced = selectedChar !== null
  const syncedRank = useCharRank(selectedChar?.name ?? null)

  const { scheduleSave } = useSyncedBlob<LockoutBlob>({
    key: selectedChar?.id ?? null,
    load: selectedChar
      ? () => getCharData<LockoutBlob>(selectedChar.id, 'lockout_tracker')
      : null,
    save: selectedChar
      ? (data, base) => putCharData(selectedChar.id, 'lockout_tracker', data, base)
      : null,
    onLoaded: data => {
      const next: LockoutBlob = {
        dynamis: data?.dynamis ?? [],
        limbus: data?.limbus ?? null,
      }
      setSaved(next)
      if (data) writeLocal(next)
    },
  })

  // The localStorage copy is both the logged-out store and the synced mirror;
  // the global alarm source reads it so lockout bells ring on any /games page.
  function writeLocal(next: LockoutBlob) {
    localStorage.setItem(SK, JSON.stringify({ ...next, charName: selectedChar?.name ?? null }))
  }

  function persist(next: LockoutBlob) {
    setSaved(next)
    writeLocal(next)
    if (synced) scheduleSave(next)
  }

  function logDynamis() {
    // Keep a short history; anything older than two tallies is noise. `ms`
    // ticks at 1s, plenty for a 72h timer.
    const pruned = [...saved.dynamis, ms].sort((a, b) => b - a).slice(0, 6)
    persist({ ...saved, dynamis: pruned })
  }

  function removeDynamis(ts: number) {
    persist({ ...saved, dynamis: saved.dynamis.filter(t => t !== ts) })
  }

  const lastDynamis = saved.dynamis.length ? Math.max(...saved.dynamis) : null
  const tallyEntries = saved.dynamis.filter(t => t >= lastConquestReset()).length

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">
      {synced && (
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

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Lockout <span className="text-[#c4af64]">Tracker</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280]">Next conquest tally</div>
          <div className="text-sm text-[#c4af64] tabular-nums">{formatNextReset()}</div>
        </div>
      </div>

      <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af]">Dynamis</span>
          <AlertBell target="Dynamis ready" armed={alarms.has('Dynamis ready')} onToggle={alarms.toggle} size={14} />
        </div>
        <ReadyLine label="Re-entry (72h from entry)" anchor={lastDynamis} nowMs={ms} />
        <div className="text-sm text-[#9ca3af]">
          This tally:{' '}
          <span className={`tabular-nums font-semibold ${tallyEntries >= 2 ? 'text-[#fb923c]' : 'text-[#e2e4ed]'}`}>
            {tallyEntries}/2
          </span>
          <span className="text-[#6b7280]"> · Horizon allows two entries per conquest tally</span>
        </div>
        {saved.dynamis.length > 0 && (
          <div className="flex flex-col gap-1 text-xs text-[#6b7280]">
            {saved.dynamis.map(ts => (
              <div key={ts} className="flex items-center gap-2">
                <span className="tabular-nums">{fmtStamp(ts)}</span>
                <button
                  onClick={() => removeDynamis(ts)}
                  aria-label={`Remove Dynamis entry ${ts}`}
                  className="text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={logDynamis}
          className="self-start text-sm px-3 py-1 rounded border border-[#c4af64]/60 text-[#c4af64] hover:bg-[#c4af64]/10 transition-colors cursor-pointer"
        >
          Log entry now
        </button>
      </div>

      <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af]">Limbus</span>
          <AlertBell target="Limbus ready" armed={alarms.has('Limbus ready')} onToggle={alarms.toggle} size={14} />
        </div>
        <ReadyLine label="Cosmo-Cleanse (72h from purchase)" anchor={saved.limbus} nowMs={ms} />
        {saved.limbus !== null && (
          <div className="text-xs text-[#6b7280] tabular-nums">bought {fmtStamp(saved.limbus)}</div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => persist({ ...saved, limbus: ms })}
            className="text-sm px-3 py-1 rounded border border-[#c4af64]/60 text-[#c4af64] hover:bg-[#c4af64]/10 transition-colors cursor-pointer"
          >
            Bought Cosmo-Cleanse now
          </button>
          {saved.limbus !== null && (
            <ConfirmButton
              label="Clear"
              onConfirm={() => persist({ ...saved, limbus: null })}
              className="text-xs text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
            />
          )}
        </div>
      </div>

      <p className="text-xs text-[#6b7280]">
        Both timers are 72 Earth hours. Dynamis counts from your hourglass trade; Limbus counts
        from buying the Cosmo-Cleanse (Horizon 1.1 change). Bells ring on any games page.
      </p>
    </div>
  )
}
