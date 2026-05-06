import ReactSelect from 'react-select'
import { MOBS, MOB_CATEGORIES, toResistanceMap } from '../data/mobs'
import type { ResistanceMap } from './engine'

type Option = { value: string; label: string }
type GroupOption = { label: string; options: Option[] }

const GROUPED_OPTIONS: GroupOption[] = MOB_CATEGORIES
  .map(cat => ({
    label: cat,
    options: MOBS
      .filter(m => m.category === cat)
      .map(m => ({ value: m.name, label: m.name })),
  }))
  .filter(g => g.options.length > 0)

type Props = {
  selectedMobName: string | null
  onSelect: (resistances: ResistanceMap | null, name: string | null) => void
}

export function MobSelector({ selectedMobName, onSelect }: Props) {
  const value = selectedMobName
    ? { value: selectedMobName, label: selectedMobName }
    : null

  function handleChange(opt: Option | null) {
    if (!opt) { onSelect(null, null); return }
    const mob = MOBS.find(m => m.name === opt.value)
    onSelect(mob ? toResistanceMap(mob.modifiers) : null, opt.value)
  }

  return (
    <ReactSelect<Option>
      unstyled
      isSearchable
      isClearable
      placeholder="Load a mob resistance profile..."
      value={value}
      options={GROUPED_OPTIONS}
      onChange={handleChange}
      noOptionsMessage={() => 'No mobs found'}
      maxMenuHeight={320}
      styles={{
        menu: base => ({ ...base, zIndex: 9999 }),
        menuList: () => ({ maxHeight: 320, overflowY: 'auto' as const }),
      }}
      classNames={{
        container:          () => 'w-full',
        control:            ({ isFocused }) =>
          `flex items-center bg-[#0f1117] border ${isFocused ? 'border-[#c4af64]' : 'border-[#2a2d3a]'} rounded px-2 py-[3px] cursor-pointer min-h-0`,
        valueContainer:     () => 'flex items-center flex-1',
        indicatorsContainer: () => 'flex items-center shrink-0',
        menu:               () => 'bg-[#1a1d27] border border-[#2a2d3a] rounded-lg mt-1 shadow-xl overflow-hidden',
        menuList:           () => 'py-1',
        groupHeading:       () => 'px-3 pt-2 pb-0.5 text-[10px] uppercase tracking-widest text-[#6b7280] font-semibold',
        option:             ({ isFocused, isSelected }) =>
          `px-3 py-1.5 text-sm cursor-pointer ${
            isSelected
              ? 'bg-[#c4af64]/15 text-[#c4af64]'
              : isFocused
              ? 'bg-[#2a2d3a] text-[#e2e4ed]'
              : 'text-[#9ca3af]'
          }`,
        singleValue:        () => 'text-[#e2e4ed] text-sm',
        input:              () => 'text-[#e2e4ed] text-sm',
        placeholder:        () => 'text-[#6b7280] text-sm',
        indicatorSeparator: () => 'hidden',
        dropdownIndicator:  () => 'text-[#6b7280] hover:text-[#e2e4ed] pl-1',
        clearIndicator:     () => 'text-[#6b7280] hover:text-[#e2e4ed] pl-1 cursor-pointer',
        noOptionsMessage:   () => 'text-[#6b7280] text-sm px-3 py-2',
      }}
    />
  )
}
