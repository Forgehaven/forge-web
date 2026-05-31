import type { Element } from './elements'
import type { Job } from './jobs'

export interface BurstSpell {
  name: string
  job: Job
  element: Element
  minLevel: number
}

// Elemental spells available for magic bursts — sourced from horizonffxi.wiki
export const BURST_SPELLS: BurstSpell[] = [
  // Black Mage — tier I
  { name: 'Stone',    job: 'BLM', element: 'Earth',     minLevel: 1  },
  { name: 'Water',    job: 'BLM', element: 'Water',     minLevel: 5  },
  { name: 'Aero',     job: 'BLM', element: 'Wind',      minLevel: 9  },
  { name: 'Fire',     job: 'BLM', element: 'Fire',      minLevel: 13 },
  { name: 'Blizzard', job: 'BLM', element: 'Ice',       minLevel: 17 },
  { name: 'Thunder',  job: 'BLM', element: 'Lightning', minLevel: 21 },
  // tier II
  { name: 'Stone II',    job: 'BLM', element: 'Earth',     minLevel: 26 },
  { name: 'Water II',    job: 'BLM', element: 'Water',     minLevel: 30 },
  { name: 'Aero II',     job: 'BLM', element: 'Wind',      minLevel: 34 },
  { name: 'Fire II',     job: 'BLM', element: 'Fire',      minLevel: 38 },
  { name: 'Blizzard II', job: 'BLM', element: 'Ice',       minLevel: 42 },
  { name: 'Thunder II',  job: 'BLM', element: 'Lightning', minLevel: 46 },
  // tier III
  { name: 'Stone III',    job: 'BLM', element: 'Earth',     minLevel: 51 },
  { name: 'Water III',    job: 'BLM', element: 'Water',     minLevel: 55 },
  { name: 'Aero III',     job: 'BLM', element: 'Wind',      minLevel: 59 },
  { name: 'Fire III',     job: 'BLM', element: 'Fire',      minLevel: 62 },
  { name: 'Blizzard III', job: 'BLM', element: 'Ice',       minLevel: 64 },
  { name: 'Thunder III',  job: 'BLM', element: 'Lightning', minLevel: 66 },
  // tier IV
  { name: 'Stone IV',    job: 'BLM', element: 'Earth',     minLevel: 68 },
  { name: 'Water IV',    job: 'BLM', element: 'Water',     minLevel: 70 },
  { name: 'Aero IV',     job: 'BLM', element: 'Wind',      minLevel: 72 },
  { name: 'Fire IV',     job: 'BLM', element: 'Fire',      minLevel: 73 },
  { name: 'Blizzard IV', job: 'BLM', element: 'Ice',       minLevel: 74 },
  { name: 'Thunder IV',  job: 'BLM', element: 'Lightning', minLevel: 75 },

  // White Mage
  { name: 'Banish',    job: 'WHM', element: 'Light', minLevel: 5  },
  { name: 'Banish II', job: 'WHM', element: 'Light', minLevel: 30 },
  { name: 'Holy',      job: 'WHM', element: 'Light', minLevel: 50 },

  // Ninja — elemental ninjutsu (can burst off skillchains; no :San tier on HorizonXI)
  { name: 'Katon: Ichi',  job: 'NIN', element: 'Fire',      minLevel: 12 },
  { name: 'Hyoton: Ichi', job: 'NIN', element: 'Ice',       minLevel: 12 },
  { name: 'Huton: Ichi',  job: 'NIN', element: 'Wind',      minLevel: 12 },
  { name: 'Raiton: Ichi', job: 'NIN', element: 'Lightning', minLevel: 12 },
  { name: 'Doton: Ichi',  job: 'NIN', element: 'Earth',     minLevel: 12 },
  { name: 'Suiton: Ichi', job: 'NIN', element: 'Water',     minLevel: 15 },
  { name: 'Katon: Ni',    job: 'NIN', element: 'Fire',      minLevel: 40 },
  { name: 'Hyoton: Ni',   job: 'NIN', element: 'Ice',       minLevel: 40 },
  { name: 'Huton: Ni',    job: 'NIN', element: 'Wind',      minLevel: 40 },
  { name: 'Raiton: Ni',   job: 'NIN', element: 'Lightning', minLevel: 40 },
  { name: 'Doton: Ni',    job: 'NIN', element: 'Earth',     minLevel: 40 },
  { name: 'Suiton: Ni',   job: 'NIN', element: 'Water',     minLevel: 40 },

  // Red Mage — tier I
  { name: 'Stone',    job: 'RDM', element: 'Earth',     minLevel: 4  },
  { name: 'Water',    job: 'RDM', element: 'Water',     minLevel: 9  },
  { name: 'Aero',     job: 'RDM', element: 'Wind',      minLevel: 14 },
  { name: 'Fire',     job: 'RDM', element: 'Fire',      minLevel: 19 },
  { name: 'Blizzard', job: 'RDM', element: 'Ice',       minLevel: 24 },
  { name: 'Thunder',  job: 'RDM', element: 'Lightning', minLevel: 29 },
  // tier II
  { name: 'Stone II',    job: 'RDM', element: 'Earth',     minLevel: 35 },
  { name: 'Water II',    job: 'RDM', element: 'Water',     minLevel: 40 },
  { name: 'Aero II',     job: 'RDM', element: 'Wind',      minLevel: 45 },
  { name: 'Fire II',     job: 'RDM', element: 'Fire',      minLevel: 50 },
  { name: 'Blizzard II', job: 'RDM', element: 'Ice',       minLevel: 55 },
  { name: 'Thunder II',  job: 'RDM', element: 'Lightning', minLevel: 60 },
  // tier III (RDM caps at III)
  { name: 'Stone III',    job: 'RDM', element: 'Earth',     minLevel: 65 },
  { name: 'Water III',    job: 'RDM', element: 'Water',     minLevel: 67 },
  { name: 'Aero III',     job: 'RDM', element: 'Wind',      minLevel: 69 },
  { name: 'Fire III',     job: 'RDM', element: 'Fire',      minLevel: 71 },
  { name: 'Blizzard III', job: 'RDM', element: 'Ice',       minLevel: 73 },
  { name: 'Thunder III',  job: 'RDM', element: 'Lightning', minLevel: 75 },
]

// Returns the highest available spell per element for a job at the given level
export function getBurstSpells(job: Job, level: number): Partial<Record<Element, BurstSpell>> {
  const result: Partial<Record<Element, BurstSpell>> = {}
  for (const spell of BURST_SPELLS) {
    if (spell.job !== job || spell.minLevel > level) continue
    const existing = result[spell.element]
    if (!existing || spell.minLevel > existing.minLevel) {
      result[spell.element] = spell
    }
  }
  return result
}
