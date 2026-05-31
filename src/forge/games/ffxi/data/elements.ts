export type Element = 'Fire' | 'Ice' | 'Wind' | 'Earth' | 'Lightning' | 'Water' | 'Light' | 'Dark'

export type SCAttr =
  | 'Liquefaction' | 'Impaction' | 'Detonation' | 'Scission'
  | 'Reverberation' | 'Transfixion' | 'Compression' | 'Induration'
  | 'Fusion' | 'Gravitation' | 'Distortion' | 'Fragmentation'
  | 'Light' | 'Darkness'

export type SCResonance = {
  closer: SCAttr
  result: string
  level: 1 | 2 | 3
  elements: Element[]
}

// Keyed by opener attribute. Each entry lists what closer attributes can follow
// and what skillchain they produce.
// HorizonXI skillchain resonance. L2 chains form from specific L1+L1 pairs
// (not from L1 opener + L2 attr closer as in retail). L2 attrs (Fusion etc.)
// only appear as openers/closers in the four continuation entries.
export const SC_RESONANCES: Partial<Record<SCAttr, SCResonance[]>> = {
  // ── L1 openers ────────────────────────────────────────────────────────────────
  Impaction: [
    { closer: 'Liquefaction', result: 'Liquefaction', level: 1, elements: ['Fire'] },
    { closer: 'Detonation',   result: 'Detonation',   level: 1, elements: ['Wind'] },
  ],
  Scission: [
    { closer: 'Liquefaction',  result: 'Liquefaction',  level: 1, elements: ['Fire'] },
    { closer: 'Detonation',    result: 'Detonation',    level: 1, elements: ['Wind'] },
    { closer: 'Reverberation', result: 'Reverberation', level: 1, elements: ['Water'] },
  ],
  Reverberation: [
    { closer: 'Impaction',  result: 'Impaction',  level: 1, elements: ['Lightning'] },
    { closer: 'Induration', result: 'Induration', level: 1, elements: ['Ice'] },
  ],
  Induration: [
    { closer: 'Impaction',     result: 'Impaction',     level: 1, elements: ['Lightning'] },
    { closer: 'Compression',   result: 'Compression',   level: 1, elements: ['Dark'] },
    { closer: 'Reverberation', result: 'Fragmentation', level: 2, elements: ['Wind', 'Lightning'] },
  ],
  Compression: [
    { closer: 'Detonation',  result: 'Detonation',  level: 1, elements: ['Wind'] },
    { closer: 'Transfixion', result: 'Transfixion', level: 1, elements: ['Light'] },
  ],
  Liquefaction: [
    { closer: 'Scission',  result: 'Scission', level: 1, elements: ['Earth'] },
    { closer: 'Impaction', result: 'Fusion',   level: 2, elements: ['Fire', 'Light'] },
  ],
  Detonation: [
    { closer: 'Scission',    result: 'Scission',    level: 1, elements: ['Earth'] },
    { closer: 'Compression', result: 'Gravitation', level: 2, elements: ['Earth', 'Dark'] },
  ],
  Transfixion: [
    { closer: 'Reverberation', result: 'Reverberation', level: 1, elements: ['Water'] },
    { closer: 'Compression',   result: 'Compression',   level: 1, elements: ['Dark'] },
    { closer: 'Scission',      result: 'Distortion',    level: 2, elements: ['Ice', 'Water'] },
  ],
  // ── L2 openers (continuation chains and L3) ───────────────────────────────────
  Distortion: [
    { closer: 'Fusion',      result: 'Fusion',    level: 2, elements: ['Fire', 'Light'] },
    { closer: 'Gravitation', result: 'Darkness',  level: 3, elements: ['Dark', 'Earth', 'Ice', 'Water'] },
  ],
  Gravitation: [
    { closer: 'Fragmentation', result: 'Fragmentation', level: 2, elements: ['Wind', 'Lightning'] },
    { closer: 'Distortion',    result: 'Darkness',      level: 3, elements: ['Dark', 'Earth', 'Ice', 'Water'] },
  ],
  Fusion: [
    { closer: 'Gravitation',   result: 'Gravitation', level: 2, elements: ['Earth', 'Dark'] },
    { closer: 'Fragmentation', result: 'Light',       level: 3, elements: ['Fire', 'Light', 'Lightning', 'Wind'] },
  ],
  Fragmentation: [
    { closer: 'Distortion', result: 'Distortion', level: 2, elements: ['Ice', 'Water'] },
    { closer: 'Fusion',     result: 'Light',      level: 3, elements: ['Fire', 'Light', 'Lightning', 'Wind'] },
  ],
}
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

// Resistance types — stored here so both engine and mob data can import them
// without a cross-tool dependency.
export type ResistanceState = 'weak' | 'neutral' | 'resistant'
export type ResistanceMap = Partial<Record<DamageType, ResistanceState>>
