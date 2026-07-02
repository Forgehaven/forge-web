import { API_URLS } from '../../../../config/apiUrls'
import { CharacterSelect } from './CharacterSelect'
import type { NationMeta } from './CharacterHeader'
import type { FfxiCharacter } from '../api'

// Logged-in replacement for CharacterHeader: round avatar + registered
// character dropdown + nation line. `nation` is pre-resolved by the caller
// because tools use different nation id spaces (SpellTracker 0-2, TeleportCost 1-4).
export function SyncedCharacterHeader({
  characters,
  selectedId,
  onSelect,
  avatar,
  name,
  nation,
  rank,
}: {
  characters: FfxiCharacter[]
  selectedId: string | null
  onSelect: (id: string) => void
  avatar: string | null | undefined
  name: string | undefined
  nation: NationMeta | null
  rank?: string | null
}) {
  return (
    <div className="flex items-center gap-4">
      {avatar && (
        <img
          src={`${API_URLS.horizonXiAvatarBase}/${avatar}.webp`}
          alt={name ?? ''}
          className="w-16 h-16 object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="flex flex-col gap-1.5">
        <CharacterSelect
          characters={characters}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        {nation && (
          <p className="text-sm font-medium flex items-center gap-1.5">
            {nation.icon
              ? <img src={nation.icon} alt="" className="w-4 h-4 object-contain shrink-0" />
              : <span style={{ color: nation.color }}>{nation.symbol}</span>
            }
            <span style={{ color: nation.color }}>{nation.name}</span>
            {rank && <span className="text-[#9ca3af]">· {rank}</span>}
          </p>
        )}
      </div>
    </div>
  )
}
