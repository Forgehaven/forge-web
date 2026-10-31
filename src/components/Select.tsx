import ReactSelect from 'react-select'
import type { Props } from 'react-select'

export type SelectOption = { value: string; label: string }

const sharedClassNames: Props<SelectOption, false>['classNames'] = {
  container: () => 'min-w-max',
  control: ({ isFocused }) =>
    `flex items-center bg-forge-bg border ${isFocused ? 'border-forge-accent' : 'border-forge-border'} rounded px-2 py-[3px] cursor-pointer min-h-0`,
  valueContainer: () => 'flex items-center flex-1',
  indicatorsContainer: () => 'flex items-center shrink-0',
  menu: () =>
    'bg-forge-surface border border-forge-border rounded-lg mt-1 shadow-xl overflow-hidden min-w-max',
  menuList: () => 'py-1',
  option: ({ isFocused, isSelected }) =>
    `px-3 py-2 text-sm cursor-pointer ${
      isSelected
        ? 'bg-forge-accent/15 text-forge-accent'
        : isFocused
        ? 'bg-forge-border text-forge-text'
        : 'text-forge-dim'
    }`,
  singleValue: () => 'text-forge-text text-sm whitespace-nowrap',
  input: () => 'text-forge-text text-sm',
  placeholder: () => 'text-forge-muted text-sm',
  indicatorSeparator: () => 'hidden',
  dropdownIndicator: () => 'text-forge-muted hover:text-forge-text pl-1',
  noOptionsMessage: () => 'text-forge-muted text-sm px-3 py-2',
}

export function Select({ classNames, ...props }: Props<SelectOption, false>) {
  return (
    <ReactSelect<SelectOption, false>
      unstyled
      isSearchable={false}
      maxMenuHeight={480}
      styles={{
        menu: base => ({ ...base, zIndex: 9999 }),
        menuList: () => ({ maxHeight: 480, overflowY: 'auto' }),
      }}
      classNames={{ ...sharedClassNames, ...classNames }}
      {...props}
    />
  )
}
