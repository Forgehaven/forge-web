export type Element = 'Fire' | 'Ice' | 'Wind' | 'Earth' | 'Lightning' | 'Water' | 'Light' | 'Dark'
export type PhysicalType = 'Blunt' | 'Slashing' | 'Piercing'
export type DamageType = Element | PhysicalType

export const ELEMENTS: Element[] = ['Fire', 'Ice', 'Wind', 'Earth', 'Lightning', 'Water', 'Light', 'Dark']
export const PHYSICAL_TYPES: PhysicalType[] = ['Blunt', 'Slashing', 'Piercing']

export const ELEMENT_COLORS: Record<Element, string> = {
  Fire:      '#f97316',
  Ice:       '#7dd3fc',
  Wind:      '#6ee7b7',
  Earth:     '#d97706',
  Lightning: '#fde68a',
  Water:     '#60a5fa',
  Light:     '#fbbf24',
  Dark:      '#a78bfa',
}

export const PHYSICAL_COLORS: Record<PhysicalType, string> = {
  Blunt:    '#fb923c',
  Slashing: '#f87171',
  Piercing: '#38bdf8',
}

export const SC_COLORS: Record<string, string> = {
  Liquefaction:  '#f87171',
  Impaction:     '#a78bfa',
  Detonation:    '#6ee7b7',
  Scission:      '#d97706',
  Reverberation: '#60a5fa',
  Transfixion:   '#fde68a',
  Compression:   '#7c3aed',
  Induration:    '#93c5fd',
  Fusion:        '#f97316',
  Gravitation:   '#9ca3af',
  Distortion:    '#818cf8',
  Fragmentation: '#34d399',
  Light:         '#fbbf24',
  Darkness:      '#c084fc',
}

// Elements that can magic burst off each skillchain
export const SC_BURST_ELEMENTS: Record<string, Element[]> = {
  Liquefaction:  ['Fire'],
  Impaction:     ['Lightning'],
  Detonation:    ['Wind'],
  Scission:      ['Earth'],
  Reverberation: ['Water'],
  Transfixion:   ['Light'],
  Compression:   ['Dark'],
  Induration:    ['Ice'],
  Fusion:        ['Fire', 'Light'],
  Gravitation:   ['Earth', 'Dark'],
  Distortion:    ['Ice', 'Water'],
  Fragmentation: ['Wind', 'Lightning'],
  Light:         ['Fire', 'Light', 'Lightning', 'Wind'],
  Darkness:      ['Water', 'Ice', 'Earth', 'Dark'],
}
