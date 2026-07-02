import type { ReactNode } from 'react'
import { API_URLS } from '../../../../config/apiUrls'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export type NationMeta = { name: string; symbol: string; color: string; icon?: string }

type Props = {
  charName: string
  avatar: string | null
  nation: NationMeta | null
  fetchStatus: FetchStatus
  onCharNameChange: (name: string) => void
  onFetch: () => void
  onClear: () => void
  extra?: ReactNode
}

export function CharacterHeader({
  charName, avatar, nation, fetchStatus,
  onCharNameChange, onFetch, onClear, extra,
}: Props) {
  if (nation !== null) {
    return (
      <div className="flex items-center gap-4">
        {avatar && (
          <img
            src={`${API_URLS.horizonXiAvatarBase}/${avatar}.webp`}
            alt={charName}
            className="w-16 h-16 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div>
          {charName && <h2 className="text-2xl font-bold text-[#e2e4ed] tracking-wide">{charName}</h2>}
          <p className={`font-medium flex items-center gap-1.5 ${charName ? 'text-sm mt-0.5' : 'text-lg'}`}>
            {nation.icon
              ? <img src={nation.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
              : <span style={{ color: nation.color }}>{nation.symbol}</span>
            }
            <span style={{ color: nation.color }}>{nation.name}</span>
          </p>
          <button
            onClick={onClear}
            className="text-xs text-[#374151] hover:text-[#6b7280] transition-colors cursor-pointer mt-1"
          >
            change
          </button>
        </div>
      </div>
    )
  }

  const inputRow = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-[#6b7280] shrink-0">Character</span>
      <input
        type="text"
        value={charName}
        onChange={e => onCharNameChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onFetch() }}
        placeholder="Character name"
        className="px-2 py-1 text-sm rounded border bg-[#0f1117] text-[#e2e4ed] border-[#2a2d3a] hover:border-[#3a4060] focus:border-[#4a5070] focus:outline-none w-44"
      />
      <button
        onClick={onFetch}
        disabled={!charName.trim() || fetchStatus === 'loading'}
        className="text-xs px-3 py-1 rounded border border-[#2a2d3a] text-[#6b7280] hover:text-[#e2e4ed] hover:border-[#3a4060] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        {fetchStatus === 'loading' ? 'Loading…' : 'Fetch'}
      </button>
      {fetchStatus === 'success' && <span className="text-xs text-[#4ade80]">Loaded</span>}
      {fetchStatus === 'error'   && <span className="text-xs text-red-400">Not found</span>}
    </div>
  )

  if (!extra) return inputRow

  return (
    <div className="flex flex-col gap-2">
      {inputRow}
      {extra}
    </div>
  )
}
