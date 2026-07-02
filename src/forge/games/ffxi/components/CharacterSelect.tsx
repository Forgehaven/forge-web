import { useEffect } from 'react'
import { Select } from '../../../../components/Select'
import { storeSelectedCharId } from '../selectedChar'
import type { FfxiCharacter } from '../api'

// Dropdown over the account's registered characters. Selection is shared
// across FFXI tools via localStorage so switching tools keeps the same char.
export function CharacterSelect({
  characters,
  selectedId,
  onSelect,
}: {
  characters: FfxiCharacter[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Auto-pick when nothing valid is selected yet (first login, deleted char).
  useEffect(() => {
    if (characters.length === 0) return
    if (selectedId && characters.some(c => c.id === selectedId)) return
    storeSelectedCharId(characters[0].id)
    onSelect(characters[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, selectedId])

  if (characters.length === 0) return null

  const options = characters.map(c => ({ value: c.id, label: c.name }))
  const selected = options.find(o => o.value === selectedId) ?? null

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#6b7280] shrink-0">Character</span>
      <div className="w-44">
        <Select
          options={options}
          value={selected}
          onChange={opt => {
            if (!opt) return
            storeSelectedCharId(opt.value)
            onSelect(opt.value)
          }}
        />
      </div>
    </div>
  )
}
