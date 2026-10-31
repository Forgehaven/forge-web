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
          `flex items-center bg-forge-bg border ${isFocused ? 'border-forge-accent' : 'border-forge-border'} rounded px-2 py-[3px] cursor-pointer min-h-0`,
        valueContainer:     () => 'flex items-center flex-1',
        indicatorsContainer: () => 'flex items-center shrink-0',
        menu:               () => 'bg-forge-surface border border-forge-border rounded-lg mt-1 shadow-xl overflow-hidden',
        menuList:           () => 'py-1',
        groupHeading:       () => 'px-3 pt-2 pb-0.5 text-[10px] uppercase tracking-widest text-forge-muted font-semibold',
        option:             ({ isFocused, isSelected }) =>
          `px-3 py-1.5 text-sm cursor-pointer ${
            isSelected
              ? 'bg-forge-accent/15 text-forge-accent'
              : isFocused
              ? 'bg-forge-border text-forge-text'
              : 'text-forge-dim'
          }`,
        singleValue:        () => 'text-forge-text text-sm',
        input:              () => 'text-forge-text text-sm',
        placeholder:        () => 'text-forge-muted text-sm',
        indicatorSeparator: () => 'hidden',
        dropdownIndicator:  () => 'text-forge-muted hover:text-forge-text pl-1',
        clearIndicator:     () => 'text-forge-muted hover:text-forge-text pl-1 cursor-pointer',
        noOptionsMessage:   () => 'text-forge-muted text-sm px-3 py-2',
      }}
    />
  )
}
