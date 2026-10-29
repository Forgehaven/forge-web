// FFXI Spell Data - HorizonXI
// Source: horizonffxi.wiki (scraped May 2026; ToAU additions 2026-10-29)
// Elements and skills sourced from individual spell pages on horizonffxi.wiki.
// Jobs: WHM, BLM, RDM, PLD, DRK, BRD, SMN, NIN, BLU

import type { Element } from './elements'

export type JobAbbr = 'WHM' | 'BLM' | 'RDM' | 'PLD' | 'DRK' | 'BRD' | 'SMN' | 'NIN' | 'BLU'

export type MagicSkill =
  | 'Healing Magic' | 'Enhancing Magic' | 'Enfeebling Magic'
  | 'Divine Magic'  | 'Elemental Magic'  | 'Dark Magic'
  | 'Singing'       | 'Ninjutsu'         | 'Summoning Magic' | 'Blue Magic'

export interface Spell {
  name: string
  jobs: Partial<Record<JobAbbr, number>>
  skill?: MagicSkill
  element?: Element
}

export interface SpellSchool {
  school: string
  spells: Spell[]
}

// ---------------------------------------------------------------------------
// WHITE MAGIC
// Job sources: WHM job page, RDM job page, PLD job page, individual spell pages
// Note: Scholar (SCH) is not a playable job on HorizonXI and is excluded.
// ---------------------------------------------------------------------------
export const whiteMagic: Spell[] = [
  { name: 'Cure',         jobs: { WHM: 1,  RDM: 3,  PLD: 5  }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Dia',          jobs: { WHM: 3,  RDM: 1           }, skill: 'Enfeebling Magic', element: 'Light'     },
  { name: 'Paralyze',     jobs: { WHM: 4,  RDM: 6           }, skill: 'Enfeebling Magic', element: 'Ice'       },
  { name: 'Banish',       jobs: { WHM: 5,  PLD: 7           }, skill: 'Divine Magic',     element: 'Light'     },
  { name: 'Barstonra',    jobs: { WHM: 5                    }, skill: 'Enhancing Magic',  element: 'Earth'     },
  { name: 'Poisona',      jobs: { WHM: 6                    }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Barsleepra',   jobs: { WHM: 7                    }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Protect',      jobs: { WHM: 7,  RDM: 7,  PLD: 10 }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Protectra',    jobs: { WHM: 7                    }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barwatera',    jobs: { WHM: 9                    }, skill: 'Enhancing Magic',  element: 'Water'     },
  { name: 'Paralyna',     jobs: { WHM: 9                    }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Aquaveil',     jobs: { WHM: 10, RDM: 12          }, skill: 'Enhancing Magic',  element: 'Water'     },
  { name: 'Barpoisonra',  jobs: { WHM: 10                   }, skill: 'Enhancing Magic',  element: 'Lightning' },
  { name: 'Cure II',      jobs: { WHM: 11, RDM: 14, PLD: 17 }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Barparalyzra', jobs: { WHM: 12                   }, skill: 'Enhancing Magic',  element: 'Fire'      },
  { name: 'Baraera',      jobs: { WHM: 13                   }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Slow',         jobs: { WHM: 13, RDM: 13          }, skill: 'Enfeebling Magic', element: 'Earth'     },
  { name: 'Blindna',      jobs: { WHM: 14                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Banishga',     jobs: { WHM: 15                   }, skill: 'Divine Magic',     element: 'Light'     },
  { name: 'Deodorize',    jobs: { WHM: 15, RDM: 15          }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Silence',      jobs: { WHM: 15, RDM: 18          }, skill: 'Enfeebling Magic', element: 'Wind'      },
  { name: 'Curaga',       jobs: { WHM: 16                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Barfira',      jobs: { WHM: 17                   }, skill: 'Enhancing Magic',  element: 'Fire'      },
  { name: 'Shell',        jobs: { WHM: 17, RDM: 17, PLD: 20 }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Shellra',      jobs: { WHM: 17                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barblindra',   jobs: { WHM: 18                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Diaga',        jobs: { WHM: 18, RDM: 15          }, skill: 'Enfeebling Magic', element: 'Light'     },
  { name: 'Blink',        jobs: { WHM: 19, RDM: 23          }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Silena',       jobs: { WHM: 19                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Sneak',        jobs: { WHM: 20, RDM: 20          }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Barblizzara',  jobs: { WHM: 21                   }, skill: 'Enhancing Magic',  element: 'Ice'       },
  { name: 'Cure III',     jobs: { WHM: 21, RDM: 26, PLD: 30 }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Regen',        jobs: { WHM: 21, RDM: 21          }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barsilencera', jobs: { WHM: 23                   }, skill: 'Enhancing Magic',  element: 'Ice'       },
  { name: 'Barthundra',   jobs: { WHM: 25                   }, skill: 'Enhancing Magic',  element: 'Lightning' },
  { name: 'Invisible',    jobs: { WHM: 25, RDM: 25          }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Raise',        jobs: { WHM: 25, RDM: 38, PLD: 50 }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Reraise',      jobs: { WHM: 25                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Protect II',   jobs: { WHM: 27, RDM: 27, PLD: 30 }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Protectra II', jobs: { WHM: 27                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Stoneskin',    jobs: { WHM: 28, RDM: 34          }, skill: 'Enhancing Magic',  element: 'Earth'     },
  { name: 'Cursna',       jobs: { WHM: 29                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Banish II',    jobs: { WHM: 30, PLD: 34          }, skill: 'Divine Magic',     element: 'Light'     },
  { name: 'Curaga II',    jobs: { WHM: 31                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Erase',        jobs: { WHM: 32                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Viruna',       jobs: { WHM: 34                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Dia II',       jobs: { WHM: 36, RDM: 31          }, skill: 'Enfeebling Magic', element: 'Light'     },
  { name: 'Teleport-Dem',  jobs: { WHM: 36                  }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Teleport-Holla',jobs: { WHM: 36                  }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Teleport-Mea',  jobs: { WHM: 36                  }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Shell II',     jobs: { WHM: 37, RDM: 37, PLD: 40 }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Shellra II',   jobs: { WHM: 37                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Teleport-Altep',jobs: { WHM: 38                  }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Teleport-Yhoat',jobs: { WHM: 38                  }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barvira',      jobs: { WHM: 39, RDM: 39          }, skill: 'Enhancing Magic',  element: 'Water'     },
  { name: 'Stona',        jobs: { WHM: 39                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Banishga II',  jobs: { WHM: 40                   }, skill: 'Divine Magic',     element: 'Light'     },
  { name: 'Haste',        jobs: { WHM: 40, RDM: 48          }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Cure IV',      jobs: { WHM: 41, RDM: 48, PLD: 55 }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Teleport-Vahzl',jobs: { WHM: 42                  }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barpetra',     jobs: { WHM: 43, RDM: 43          }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Regen II',     jobs: { WHM: 44                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Flash',        jobs: { WHM: 45, PLD: 37          }, skill: 'Divine Magic',     element: 'Light'     },
  { name: 'Protect III',  jobs: { WHM: 47, RDM: 47, PLD: 50 }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Protectra III',jobs: { WHM: 47                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Holy',         jobs: { WHM: 50, PLD: 55          }, skill: 'Divine Magic',     element: 'Light'     },
  { name: 'Curaga III',   jobs: { WHM: 51                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Raise II',     jobs: { WHM: 56                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Reraise II',   jobs: { WHM: 56                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Shell III',    jobs: { WHM: 57, RDM: 57, PLD: 60 }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Shellra III',  jobs: { WHM: 57                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Cure V',       jobs: { WHM: 61                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Protect IV',   jobs: { WHM: 63, RDM: 63, PLD: 70 }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Protectra IV', jobs: { WHM: 63                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Banish III',   jobs: { WHM: 65                   }, skill: 'Divine Magic',     element: 'Light'     },
  { name: 'Regen III',    jobs: { WHM: 66                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Shell IV',     jobs: { WHM: 68, RDM: 68          }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Shellra IV',   jobs: { WHM: 68                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Raise III',    jobs: { WHM: 70                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Reraise III',  jobs: { WHM: 70                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Curaga IV',    jobs: { WHM: 71                   }, skill: 'Healing Magic',    element: 'Light'     },
  { name: 'Protectra V',  jobs: { WHM: 75                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Shellra V',    jobs: { WHM: 75                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  // RDM-only white magic
  { name: 'Barstone',     jobs: { RDM: 5                    }, skill: 'Enhancing Magic',  element: 'Earth'     },
  { name: 'Barsleep',     jobs: { RDM: 7                    }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barwater',     jobs: { RDM: 9                    }, skill: 'Enhancing Magic',  element: 'Water'     },
  { name: 'Barpoison',    jobs: { RDM: 10                   }, skill: 'Enhancing Magic',  element: 'Lightning' },
  { name: 'Barparalyze',  jobs: { RDM: 12                   }, skill: 'Enhancing Magic',  element: 'Fire'      },
  { name: 'Baraero',      jobs: { RDM: 13                   }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Barfire',      jobs: { RDM: 17                   }, skill: 'Enhancing Magic',  element: 'Fire'      },
  { name: 'Barblind',     jobs: { RDM: 18                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barblizzard',  jobs: { RDM: 21                   }, skill: 'Enhancing Magic',  element: 'Ice'       },
  { name: 'Barsilence',   jobs: { RDM: 23                   }, skill: 'Enhancing Magic',  element: 'Ice'       },
  { name: 'Barthunder',   jobs: { RDM: 25                   }, skill: 'Enhancing Magic',  element: 'Lightning' },
  { name: 'Phalanx',      jobs: { RDM: 33                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Refresh',      jobs: { RDM: 41                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  { name: 'Barvirus',     jobs: { RDM: 39                   }, skill: 'Enhancing Magic',  element: 'Water'     },
  { name: 'Barpetrify',   jobs: { RDM: 43                   }, skill: 'Enhancing Magic',  element: 'Wind'      },
  // Enspell (RDM only)
  { name: 'Enthunder',    jobs: { RDM: 16                   }, skill: 'Enhancing Magic',  element: 'Lightning' },
  { name: 'Enstone',      jobs: { RDM: 18                   }, skill: 'Enhancing Magic',  element: 'Earth'     },
  { name: 'Enaero',       jobs: { RDM: 20                   }, skill: 'Enhancing Magic',  element: 'Wind'      },
  { name: 'Enblizzard',   jobs: { RDM: 22                   }, skill: 'Enhancing Magic',  element: 'Ice'       },
  { name: 'Enfire',       jobs: { RDM: 24                   }, skill: 'Enhancing Magic',  element: 'Fire'      },
  { name: 'Enwater',      jobs: { RDM: 27                   }, skill: 'Enhancing Magic',  element: 'Water'     },
  // PLD-only white magic
  { name: 'Enlight',      jobs: { PLD: 40                   }, skill: 'Enhancing Magic',  element: 'Light'     },
  // ToAU: Horizon sells these as level 75 scrolls instead of gating them behind RDM Group 2 merits
  { name: 'Dia III',      jobs: { RDM: 75                   }, skill: 'Enfeebling Magic', element: 'Light'     },
  { name: 'Slow II',      jobs: { RDM: 75                   }, skill: 'Enfeebling Magic', element: 'Earth'     },
  { name: 'Paralyze II',  jobs: { RDM: 75                   }, skill: 'Enfeebling Magic', element: 'Ice'       },
  { name: 'Phalanx II',   jobs: { RDM: 75                   }, skill: 'Enhancing Magic',  element: 'Light'     },
]

// ---------------------------------------------------------------------------
// BLACK MAGIC
// Job sources: BLM job page, RDM job page, DRK job page, individual spell pages
// Note: Scholar (SCH) and Geomancer (GEO) are not playable on HorizonXI.
// ---------------------------------------------------------------------------
export const blackMagic: Spell[] = [
  { name: 'Stone',        jobs: { BLM: 1,  RDM: 4,  DRK: 5  }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Poison',       jobs: { BLM: 3,  RDM: 5,  DRK: 6  }, skill: 'Enfeebling Magic', element: 'Water'     },
  { name: 'Blind',        jobs: { BLM: 4,  RDM: 8           }, skill: 'Enfeebling Magic', element: 'Dark'      },
  { name: 'Water',        jobs: { BLM: 5,  RDM: 9,  DRK: 11 }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Bind',         jobs: { BLM: 7,  RDM: 11, DRK: 20 }, skill: 'Enfeebling Magic', element: 'Ice'       },
  { name: 'Aero',         jobs: { BLM: 9,  RDM: 14, DRK: 17 }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Bio',          jobs: { BLM: 10, RDM: 10, DRK: 15 }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Blaze Spikes', jobs: { BLM: 10, RDM: 20          }, skill: 'Enhancing Magic',  element: 'Fire'      },
  { name: 'Drain',        jobs: { BLM: 12, DRK: 10          }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Fire',         jobs: { BLM: 13, RDM: 19, DRK: 23 }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Stonega',      jobs: { BLM: 15                    }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Shock',        jobs: { BLM: 16                    }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Blizzard',     jobs: { BLM: 17, RDM: 24, DRK: 29 }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Warp',         jobs: { BLM: 17                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Rasp',         jobs: { BLM: 18                    }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Waterga',      jobs: { BLM: 19                    }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Choke',        jobs: { BLM: 20                    }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Ice Spikes',   jobs: { BLM: 20, RDM: 40          }, skill: 'Enhancing Magic',  element: 'Ice'       },
  { name: 'Sleep',        jobs: { BLM: 20, RDM: 25, DRK: 30 }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Thunder',      jobs: { BLM: 21, RDM: 29, DRK: 35 }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Frost',        jobs: { BLM: 22                    }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Aeroga',       jobs: { BLM: 23                    }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Burn',         jobs: { BLM: 24                    }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Poisonga',     jobs: { BLM: 24, DRK: 26          }, skill: 'Enfeebling Magic', element: 'Water'     },
  { name: 'Aspir',        jobs: { BLM: 25, DRK: 20          }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Tractor',      jobs: { BLM: 25, DRK: 32          }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Stone II',     jobs: { BLM: 26, RDM: 35, DRK: 42 }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Drown',        jobs: { BLM: 27                    }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Firaga',       jobs: { BLM: 28                    }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Escape',       jobs: { BLM: 29                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Shock Spikes', jobs: { BLM: 30, RDM: 60          }, skill: 'Enhancing Magic',  element: 'Lightning' },
  { name: 'Water II',     jobs: { BLM: 30, RDM: 40, DRK: 48 }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Sleepga',      jobs: { BLM: 31                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Blizzaga',     jobs: { BLM: 32                    }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Aero II',      jobs: { BLM: 34, RDM: 45, DRK: 54 }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Bio II',       jobs: { BLM: 35, RDM: 36, DRK: 40 }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Thundaga',     jobs: { BLM: 36                    }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Fire II',      jobs: { BLM: 38, RDM: 50, DRK: 60 }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Stonega II',   jobs: { BLM: 40                    }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Warp II',      jobs: { BLM: 40                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Sleep II',     jobs: { BLM: 41, RDM: 46, DRK: 56 }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Blizzard II',  jobs: { BLM: 42, RDM: 55, DRK: 66 }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Poison II',    jobs: { BLM: 43, RDM: 46, DRK: 46 }, skill: 'Enfeebling Magic', element: 'Water'     },
  { name: 'Waterga II',   jobs: { BLM: 44                    }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Stun',         jobs: { BLM: 45, DRK: 37          }, skill: 'Dark Magic',       element: 'Lightning' },
  { name: 'Thunder II',   jobs: { BLM: 46, RDM: 60, DRK: 72 }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Aeroga II',    jobs: { BLM: 48                    }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Freeze',       jobs: { BLM: 50                    }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Stone III',    jobs: { BLM: 51, RDM: 65          }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Tornado',      jobs: { BLM: 52                    }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Firaga II',    jobs: { BLM: 53                    }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Quake',        jobs: { BLM: 54                    }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Water III',    jobs: { BLM: 55, RDM: 67          }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Burst',        jobs: { BLM: 56                    }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Sleepga II',   jobs: { BLM: 56                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Blizzaga II',  jobs: { BLM: 57                    }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Flood',        jobs: { BLM: 58                    }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Aero III',     jobs: { BLM: 59, RDM: 69          }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Flare',        jobs: { BLM: 60                    }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Thundaga II',  jobs: { BLM: 61                    }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Fire III',     jobs: { BLM: 62, RDM: 71          }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Stonega III',  jobs: { BLM: 63                    }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Blizzard III', jobs: { BLM: 64, RDM: 73          }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Waterga III',  jobs: { BLM: 65                    }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Thunder III',  jobs: { BLM: 66, RDM: 75          }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Aeroga III',   jobs: { BLM: 67                    }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Stone IV',     jobs: { BLM: 68                    }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Firaga III',   jobs: { BLM: 69                    }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Water IV',     jobs: { BLM: 70                    }, skill: 'Elemental Magic',  element: 'Water'     },
  { name: 'Blizzaga III', jobs: { BLM: 71                    }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Aero IV',      jobs: { BLM: 72                    }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Fire IV',      jobs: { BLM: 73                    }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Thundaga III', jobs: { BLM: 73                    }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Blizzard IV',  jobs: { BLM: 74                    }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Thunder IV',   jobs: { BLM: 75                    }, skill: 'Elemental Magic',  element: 'Lightning' },
  // RDM-only black magic
  { name: 'Gravity',      jobs: { RDM: 21                    }, skill: 'Enfeebling Magic', element: 'Wind'      },
  { name: 'Dispel',       jobs: { RDM: 32                    }, skill: 'Enfeebling Magic', element: 'Dark'      },
  // DRK-exclusive dark magic (Absorb line)
  { name: 'Absorb-MND',   jobs: { DRK: 31                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Absorb-CHR',   jobs: { DRK: 33                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Absorb-VIT',   jobs: { DRK: 35                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Absorb-AGI',   jobs: { DRK: 37                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Absorb-INT',   jobs: { DRK: 39                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Absorb-DEX',   jobs: { DRK: 41                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Absorb-STR',   jobs: { DRK: 43                    }, skill: 'Dark Magic',       element: 'Dark'      },
  // ToAU additions
  { name: 'Absorb-TP',    jobs: { DRK: 45                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Absorb-ACC',   jobs: { DRK: 61                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Dread Spikes', jobs: { DRK: 71                    }, skill: 'Dark Magic',       element: 'Dark'      },
  // ToAU: level 75 scrolls on Horizon (RDM Group 2 merits only tune Bio III; BLM merits only cut recast)
  { name: 'Bio III',      jobs: { RDM: 75                    }, skill: 'Dark Magic',       element: 'Dark'      },
  { name: 'Blind II',     jobs: { RDM: 75                    }, skill: 'Enfeebling Magic', element: 'Dark'      },
  { name: 'Flare II',     jobs: { BLM: 75                    }, skill: 'Elemental Magic',  element: 'Fire'      },
  { name: 'Freeze II',    jobs: { BLM: 75                    }, skill: 'Elemental Magic',  element: 'Ice'       },
  { name: 'Tornado II',   jobs: { BLM: 75                    }, skill: 'Elemental Magic',  element: 'Wind'      },
  { name: 'Quake II',     jobs: { BLM: 75                    }, skill: 'Elemental Magic',  element: 'Earth'     },
  { name: 'Burst II',     jobs: { BLM: 75                    }, skill: 'Elemental Magic',  element: 'Lightning' },
  { name: 'Flood II',     jobs: { BLM: 75                    }, skill: 'Elemental Magic',  element: 'Water'     },
]

// ---------------------------------------------------------------------------
// SONGS (Bard only)
// Elements per horizonffxi.wiki - Threnodies/Carols take the element in their
// name; all other song families have a fixed element by type.
// ---------------------------------------------------------------------------
export const songs: Spell[] = [
  { name: "Knight's Minne",     jobs: { BRD: 1  }, skill: 'Singing', element: 'Earth'     },
  { name: 'Valor Minuet',       jobs: { BRD: 3  }, skill: 'Singing', element: 'Fire'      },
  { name: "Army's Paeon",       jobs: { BRD: 5  }, skill: 'Singing', element: 'Light'     },
  { name: 'Foe Requiem',        jobs: { BRD: 7  }, skill: 'Singing', element: 'Light'     },
  { name: 'Herb Pastoral',      jobs: { BRD: 9  }, skill: 'Singing', element: 'Lightning' },
  { name: 'Light Threnody',     jobs: { BRD: 10 }, skill: 'Singing', element: 'Light'     },
  { name: 'Sword Madrigal',     jobs: { BRD: 11 }, skill: 'Singing', element: 'Lightning' },
  { name: 'Dark Threnody',      jobs: { BRD: 12 }, skill: 'Singing', element: 'Dark'      },
  { name: 'Sheepfoe Mambo',     jobs: { BRD: 13 }, skill: 'Singing', element: 'Wind'      },
  { name: 'Earth Threnody',     jobs: { BRD: 14 }, skill: 'Singing', element: 'Earth'     },
  { name: "Army's Paeon II",    jobs: { BRD: 15 }, skill: 'Singing', element: 'Light'     },
  { name: 'Foe Lullaby',        jobs: { BRD: 16 }, skill: 'Singing', element: 'Light'     },
  { name: 'Water Threnody',     jobs: { BRD: 16 }, skill: 'Singing', element: 'Water'     },
  { name: 'Foe Requiem II',     jobs: { BRD: 17 }, skill: 'Singing', element: 'Light'     },
  { name: 'Wind Threnody',      jobs: { BRD: 18 }, skill: 'Singing', element: 'Wind'      },
  { name: "Scop's Operetta",    jobs: { BRD: 19 }, skill: 'Singing', element: 'Ice'       },
  { name: 'Fire Threnody',      jobs: { BRD: 20 }, skill: 'Singing', element: 'Fire'      },
  { name: "Knight's Minne II",  jobs: { BRD: 21 }, skill: 'Singing', element: 'Earth'     },
  { name: 'Enchanting Etude',   jobs: { BRD: 22 }, skill: 'Singing', element: 'Light'     },
  { name: 'Ice Threnody',       jobs: { BRD: 22 }, skill: 'Singing', element: 'Ice'       },
  { name: 'Valor Minuet II',    jobs: { BRD: 23 }, skill: 'Singing', element: 'Fire'      },
  { name: 'Lightning Threnody', jobs: { BRD: 24 }, skill: 'Singing', element: 'Lightning' },
  { name: 'Spirited Etude',     jobs: { BRD: 24 }, skill: 'Singing', element: 'Light'     },
  { name: "Mage's Ballad",      jobs: { BRD: 25 }, skill: 'Singing', element: 'Light'     },
  { name: 'Learned Etude',      jobs: { BRD: 26 }, skill: 'Singing', element: 'Light'     },
  { name: 'Horde Lullaby',      jobs: { BRD: 27 }, skill: 'Singing', element: 'Light'     },
  { name: 'Quick Etude',        jobs: { BRD: 28 }, skill: 'Singing', element: 'Light'     },
  { name: 'Advancing March',    jobs: { BRD: 29 }, skill: 'Singing', element: 'Lightning' },
  { name: 'Vivacious Etude',    jobs: { BRD: 30 }, skill: 'Singing', element: 'Light'     },
  { name: "Hunter's Prelude",   jobs: { BRD: 31 }, skill: 'Singing', element: 'Lightning' },
  { name: 'Dextrous Etude',     jobs: { BRD: 32 }, skill: 'Singing', element: 'Light'     },
  { name: 'Fowl Aubade',        jobs: { BRD: 33 }, skill: 'Singing', element: 'Light'     },
  { name: 'Magic Finale',       jobs: { BRD: 33 }, skill: 'Singing', element: 'Light'     },
  { name: 'Sinewy Etude',       jobs: { BRD: 34 }, skill: 'Singing', element: 'Light'     },
  { name: "Army's Paeon III",   jobs: { BRD: 35 }, skill: 'Singing', element: 'Light'     },
  { name: 'Light Carol',        jobs: { BRD: 36 }, skill: 'Singing', element: 'Light'     },
  { name: 'Foe Requiem III',    jobs: { BRD: 37 }, skill: 'Singing', element: 'Light'     },
  { name: 'Earth Carol',        jobs: { BRD: 38 }, skill: 'Singing', element: 'Earth'     },
  { name: 'Battlefield Elegy',  jobs: { BRD: 39 }, skill: 'Singing', element: 'Earth'     },
  { name: 'Water Carol',        jobs: { BRD: 40 }, skill: 'Singing', element: 'Water'     },
  { name: "Knight's Minne III", jobs: { BRD: 41 }, skill: 'Singing', element: 'Earth'     },
  { name: 'Wind Carol',         jobs: { BRD: 42 }, skill: 'Singing', element: 'Wind'      },
  { name: 'Valor Minuet III',   jobs: { BRD: 43 }, skill: 'Singing', element: 'Fire'      },
  { name: 'Fire Carol',         jobs: { BRD: 44 }, skill: 'Singing', element: 'Fire'      },
  { name: "Army's Paeon IV",    jobs: { BRD: 45 }, skill: 'Singing', element: 'Light'     },
  { name: 'Ice Carol',          jobs: { BRD: 46 }, skill: 'Singing', element: 'Ice'       },
  { name: 'Foe Requiem IV',     jobs: { BRD: 47 }, skill: 'Singing', element: 'Light'     },
  { name: 'Lightning Carol',    jobs: { BRD: 48 }, skill: 'Singing', element: 'Lightning' },
  { name: 'Goblin Gavotte',     jobs: { BRD: 49 }, skill: 'Singing', element: 'Fire'      },
  { name: 'Dark Carol',         jobs: { BRD: 50 }, skill: 'Singing', element: 'Dark'      },
  { name: 'Blade Madrigal',     jobs: { BRD: 51 }, skill: 'Singing', element: 'Lightning' },
  { name: 'Dragonfoe Mambo',    jobs: { BRD: 53 }, skill: 'Singing', element: 'Wind'      },
  { name: 'Gold Capriccio',     jobs: { BRD: 54 }, skill: 'Singing', element: 'Wind'      },
  { name: "Mage's Ballad II",   jobs: { BRD: 55 }, skill: 'Singing', element: 'Light'     },
  { name: 'Shining Fantasia',   jobs: { BRD: 56 }, skill: 'Singing', element: 'Light'     },
  { name: 'Foe Requiem V',      jobs: { BRD: 57 }, skill: 'Singing', element: 'Light'     },
  { name: 'Carnage Elegy',      jobs: { BRD: 59 }, skill: 'Singing', element: 'Earth'     },
  { name: 'Victory March',      jobs: { BRD: 60 }, skill: 'Singing', element: 'Lightning' },
  { name: "Knight's Minne IV",  jobs: { BRD: 61 }, skill: 'Singing', element: 'Earth'     },
  { name: 'Bewitching Etude',   jobs: { BRD: 62 }, skill: 'Singing', element: 'Light'     },
  { name: 'Valor Minuet IV',    jobs: { BRD: 63 }, skill: 'Singing', element: 'Fire'      },
  { name: 'Logical Etude',      jobs: { BRD: 64 }, skill: 'Singing', element: 'Light'     },
  { name: "Army's Paeon V",     jobs: { BRD: 65 }, skill: 'Singing', element: 'Light'     },
  { name: 'Sage Etude',         jobs: { BRD: 66 }, skill: 'Singing', element: 'Light'     },
  { name: 'Foe Requiem VI',     jobs: { BRD: 67 }, skill: 'Singing', element: 'Light'     },
  { name: 'Swift Etude',        jobs: { BRD: 68 }, skill: 'Singing', element: 'Light'     },
  { name: "Puppet's Operetta",  jobs: { BRD: 69 }, skill: 'Singing', element: 'Ice'       },
  { name: 'Vital Etude',        jobs: { BRD: 70 }, skill: 'Singing', element: 'Light'     },
  { name: "Archer's Prelude",   jobs: { BRD: 71 }, skill: 'Singing', element: 'Lightning' },
  { name: "Goddess's Hymnus",   jobs: { BRD: 71 }, skill: 'Singing', element: 'Light'     },
  { name: 'Uncanny Etude',      jobs: { BRD: 72 }, skill: 'Singing', element: 'Light'     },
  { name: 'Chocobo Mazurka',    jobs: { BRD: 73 }, skill: 'Singing', element: 'Wind'      },
  { name: 'Warding Round',      jobs: { BRD: 73 }, skill: 'Singing', element: 'Light'     },
  { name: 'Herculean Etude',    jobs: { BRD: 74 }, skill: 'Singing', element: 'Light'     },
  { name: "Maiden's Virelai",   jobs: { BRD: 75 }, skill: 'Singing', element: 'Light'     },
  { name: 'Foe Sirvente',       jobs: { BRD: 75 }, skill: 'Singing', element: 'Light'     }, // ToAU, quest: A Ballad for the Damned
]

// ---------------------------------------------------------------------------
// NINJUTSU (Ninja only)
// Source: horizonffxi.wiki/Ninja job page
// ---------------------------------------------------------------------------
export const ninjutsu: Spell[] = [
  { name: 'Tonko: Ichi',    jobs: { NIN: 9  }, skill: 'Ninjutsu', element: 'Wind'      },
  { name: 'Doton: Ichi',    jobs: { NIN: 12 }, skill: 'Ninjutsu', element: 'Earth'     },
  { name: 'Huton: Ichi',    jobs: { NIN: 12 }, skill: 'Ninjutsu', element: 'Wind'      },
  { name: 'Hyoton: Ichi',   jobs: { NIN: 12 }, skill: 'Ninjutsu', element: 'Ice'       },
  { name: 'Katon: Ichi',    jobs: { NIN: 12 }, skill: 'Ninjutsu', element: 'Fire'      },
  { name: 'Raiton: Ichi',   jobs: { NIN: 12 }, skill: 'Ninjutsu', element: 'Lightning' },
  { name: 'Suiton: Ichi',   jobs: { NIN: 12 }, skill: 'Ninjutsu', element: 'Water'     },
  { name: 'Utsusemi: Ichi', jobs: { NIN: 12 }, skill: 'Ninjutsu', element: 'Wind'      },
  { name: 'Kurayami: Ichi', jobs: { NIN: 19 }, skill: 'Ninjutsu', element: 'Dark'      },
  { name: 'Hojo: Ichi',     jobs: { NIN: 23 }, skill: 'Ninjutsu', element: 'Earth'     },
  { name: 'Dokumori: Ichi', jobs: { NIN: 27 }, skill: 'Ninjutsu', element: 'Dark'      },
  { name: 'Jubaku: Ichi',   jobs: { NIN: 30 }, skill: 'Ninjutsu', element: 'Ice'       },
  { name: 'Tonko: Ni',      jobs: { NIN: 34 }, skill: 'Ninjutsu', element: 'Wind'      },
  { name: 'Utsusemi: Ni',   jobs: { NIN: 37 }, skill: 'Ninjutsu', element: 'Wind'      },
  { name: 'Doton: Ni',      jobs: { NIN: 40 }, skill: 'Ninjutsu', element: 'Earth'     },
  { name: 'Huton: Ni',      jobs: { NIN: 40 }, skill: 'Ninjutsu', element: 'Wind'      },
  { name: 'Hyoton: Ni',     jobs: { NIN: 40 }, skill: 'Ninjutsu', element: 'Ice'       },
  { name: 'Katon: Ni',      jobs: { NIN: 40 }, skill: 'Ninjutsu', element: 'Fire'      },
  { name: 'Raiton: Ni',     jobs: { NIN: 40 }, skill: 'Ninjutsu', element: 'Lightning' },
  { name: 'Suiton: Ni',     jobs: { NIN: 40 }, skill: 'Ninjutsu', element: 'Water'     },
  { name: 'Kurayami: Ni',   jobs: { NIN: 44 }, skill: 'Ninjutsu', element: 'Dark'      },
  { name: 'Hojo: Ni',       jobs: { NIN: 48 }, skill: 'Ninjutsu', element: 'Earth'     },
]

// ---------------------------------------------------------------------------
// SUMMONING MAGIC (Summoner only)
// Source: horizonffxi.wiki/Summoner, /Avatar pages
// ---------------------------------------------------------------------------
export const summoningMagic: Spell[] = [
  // Prime avatars - obtained via Trial by <Element> quests
  { name: 'Carbuncle',      jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Light'     },
  { name: 'Ifrit',          jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Fire'      },
  { name: 'Titan',          jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Earth'     },
  { name: 'Leviathan',      jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Water'     },
  { name: 'Garuda',         jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Wind'      },
  { name: 'Shiva',          jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Ice'       },
  { name: 'Ramuh',          jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Lightning' },
  { name: 'Fenrir',         jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Dark'      },
  { name: 'Diabolos',       jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Dark'      },
  // Elemental spirits - purchased as scrolls
  { name: 'Fire Spirit',    jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Fire'      },
  { name: 'Ice Spirit',     jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Ice'       },
  { name: 'Air Spirit',     jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Wind'      },
  { name: 'Earth Spirit',   jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Earth'     },
  { name: 'Thunder Spirit', jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Lightning' },
  { name: 'Water Spirit',   jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Water'     },
  { name: 'Light Spirit',   jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Light'     },
  { name: 'Dark Spirit',    jobs: { SMN: 1 }, skill: 'Summoning Magic', element: 'Dark'      },
]

// ---------------------------------------------------------------------------
// BLUE MAGIC (Blue Mage only)
// Source: horizonffxi.wiki Category:Blue_Magic spell list (HorizonXI 75-cap set, 2026-10-29).
// Elements: individual spell pages where scraped, else the list's "X-based" type column.
// Post-75 retail spells are deliberately absent; "Horizon level change" marks wiki {{changes}} rows.
// ---------------------------------------------------------------------------
export const blueMagic: Spell[] = [
  { name: 'Foot Kick',             jobs: { BLU: 1  }, skill: 'Blue Magic'                      },
  { name: 'Pollen',                jobs: { BLU: 1  }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Sandspin',              jobs: { BLU: 1  }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Power Attack',          jobs: { BLU: 4  }, skill: 'Blue Magic'                      },
  { name: 'Sprout Smack',          jobs: { BLU: 4  }, skill: 'Blue Magic'                      },
  { name: 'Wild Oats',             jobs: { BLU: 4  }, skill: 'Blue Magic'                      },
  { name: 'Cocoon',                jobs: { BLU: 8  }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Metallic Body',         jobs: { BLU: 8  }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Queasyshroom',          jobs: { BLU: 8  }, skill: 'Blue Magic'                      },
  { name: 'Battle Dance',          jobs: { BLU: 12 }, skill: 'Blue Magic'                      },
  { name: 'Feather Storm',         jobs: { BLU: 12 }, skill: 'Blue Magic'                      },
  { name: 'Head Butt',             jobs: { BLU: 12 }, skill: 'Blue Magic'                      },
  { name: 'Healing Breeze',        jobs: { BLU: 16 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Helldive',              jobs: { BLU: 16 }, skill: 'Blue Magic'                      },
  { name: 'Sheep Song',            jobs: { BLU: 16 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Blastbomb',             jobs: { BLU: 18 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Bludgeon',              jobs: { BLU: 18 }, skill: 'Blue Magic'                      },
  { name: 'Cursed Sphere',         jobs: { BLU: 18 }, skill: 'Blue Magic', element: 'Water'    },
  { name: 'Blood Drain',           jobs: { BLU: 20 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Claw Cyclone',          jobs: { BLU: 20 }, skill: 'Blue Magic'                      },
  { name: 'Poison Breath',         jobs: { BLU: 22 }, skill: 'Blue Magic', element: 'Water'    },
  { name: 'Soporific',             jobs: { BLU: 24 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Screwdriver',           jobs: { BLU: 26 }, skill: 'Blue Magic'                      },
  { name: 'Bomb Toss',             jobs: { BLU: 28 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Vanity Dive',           jobs: { BLU: 28 }, skill: 'Blue Magic'                      }, // Horizon level change
  { name: 'Grand Slam',            jobs: { BLU: 30 }, skill: 'Blue Magic'                      },
  { name: 'Wild Carrot',           jobs: { BLU: 30 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Chaotic Eye',           jobs: { BLU: 32 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Sound Blast',           jobs: { BLU: 32 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Death Ray',             jobs: { BLU: 34 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Empty Thrash',          jobs: { BLU: 34 }, skill: 'Blue Magic'                      },
  { name: 'Smite of Rage',         jobs: { BLU: 34 }, skill: 'Blue Magic'                      },
  { name: 'Digest',                jobs: { BLU: 36 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Pinecone Bomb',         jobs: { BLU: 36 }, skill: 'Blue Magic'                      },
  { name: 'Blank Gaze',            jobs: { BLU: 38 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Jet Stream',            jobs: { BLU: 38 }, skill: 'Blue Magic'                      },
  { name: 'Occultation',           jobs: { BLU: 38 }, skill: 'Blue Magic', element: 'Wind'     }, // Horizon level change
  { name: 'Uppercut',              jobs: { BLU: 38 }, skill: 'Blue Magic'                      },
  { name: 'Mysterious Light',      jobs: { BLU: 40 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Terror Touch',          jobs: { BLU: 40 }, skill: 'Blue Magic'                      },
  { name: 'Auroral Drape',         jobs: { BLU: 42 }, skill: 'Blue Magic', element: 'Light'    }, // Horizon level change
  { name: 'MP Drainkiss',          jobs: { BLU: 42 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Venom Shell',           jobs: { BLU: 42 }, skill: 'Blue Magic', element: 'Water'    },
  { name: 'Blitzstrahl',           jobs: { BLU: 44 }, skill: 'Blue Magic', element: 'Lightning'},
  { name: 'Mandibular Bite',       jobs: { BLU: 44 }, skill: 'Blue Magic'                      },
  { name: 'Stinking Gas',          jobs: { BLU: 44 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Awful Eye',             jobs: { BLU: 46 }, skill: 'Blue Magic', element: 'Water'    },
  { name: 'Geist Wall',            jobs: { BLU: 46 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Magnetite Cloud',       jobs: { BLU: 46 }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Blood Saber',           jobs: { BLU: 48 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Jettatura',             jobs: { BLU: 48 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Refueling',             jobs: { BLU: 48 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Sickle Slash',          jobs: { BLU: 48 }, skill: 'Blue Magic'                      },
  { name: 'Frightful Roar',        jobs: { BLU: 50 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Ice Break',             jobs: { BLU: 50 }, skill: 'Blue Magic', element: 'Ice'      },
  { name: 'Self-Destruct',         jobs: { BLU: 50 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Cold Wave',             jobs: { BLU: 52 }, skill: 'Blue Magic', element: 'Ice'      },
  { name: 'Filamented Hold',       jobs: { BLU: 52 }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Hecatomb Wave',         jobs: { BLU: 54 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Quadratic Continuum',   jobs: { BLU: 54 }, skill: 'Blue Magic'                      }, // Horizon level change
  { name: 'Radiant Breath',        jobs: { BLU: 54 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Feather Barrier',       jobs: { BLU: 56 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Winds of Promyvion',    jobs: { BLU: 56 }, skill: 'Blue Magic', element: 'Wind'     }, // Horizon level change
  { name: 'Flying Hip Press',      jobs: { BLU: 58 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Light of Penance',      jobs: { BLU: 58 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Magic Fruit',           jobs: { BLU: 58 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Death Scissors',        jobs: { BLU: 60 }, skill: 'Blue Magic'                      },
  { name: 'Dimensional Death',     jobs: { BLU: 60 }, skill: 'Blue Magic'                      },
  { name: 'Bad Breath',            jobs: { BLU: 61 }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Eyes On Me',            jobs: { BLU: 61 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Maelstrom',             jobs: { BLU: 61 }, skill: 'Blue Magic', element: 'Water'    },
  { name: '1000 Needles',          jobs: { BLU: 62 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Body Slam',             jobs: { BLU: 62 }, skill: 'Blue Magic'                      },
  { name: 'Memento Mori',          jobs: { BLU: 62 }, skill: 'Blue Magic', element: 'Ice'      },
  { name: 'Frenetic Rip',          jobs: { BLU: 63 }, skill: 'Blue Magic'                      },
  { name: 'Frypan',                jobs: { BLU: 63 }, skill: 'Blue Magic'                      },
  { name: 'Hydro Shot',            jobs: { BLU: 63 }, skill: 'Blue Magic', element: 'Water'    },
  { name: 'Spinal Cleave',         jobs: { BLU: 63 }, skill: 'Blue Magic'                      },
  { name: 'Feather Tickle',        jobs: { BLU: 64 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Voracious Trunk',       jobs: { BLU: 64 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Yawn',                  jobs: { BLU: 64 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Infrasonics',           jobs: { BLU: 65 }, skill: 'Blue Magic', element: 'Ice'      },
  { name: 'Zephyr Mantle',         jobs: { BLU: 65 }, skill: 'Blue Magic', element: 'Wind'     },
  { name: 'Frost Breath',          jobs: { BLU: 66 }, skill: 'Blue Magic', element: 'Ice'      },
  { name: 'Sandspray',             jobs: { BLU: 66 }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Diamondhide',           jobs: { BLU: 67 }, skill: 'Blue Magic', element: 'Earth'    },
  { name: 'Enervation',            jobs: { BLU: 67 }, skill: 'Blue Magic', element: 'Dark'     },
  { name: 'Firespit',              jobs: { BLU: 68 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Warm-Up',               jobs: { BLU: 68 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Hysteric Barrage',      jobs: { BLU: 69 }, skill: 'Blue Magic'                      },
  { name: 'Tail Slap',             jobs: { BLU: 69 }, skill: 'Blue Magic'                      },
  { name: 'Amplification',         jobs: { BLU: 70 }, skill: 'Blue Magic', element: 'Water'    },
  { name: 'Cannonball',            jobs: { BLU: 70 }, skill: 'Blue Magic'                      },
  { name: 'Heat Breath',           jobs: { BLU: 71 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Lowing',                jobs: { BLU: 71 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Disseverment',          jobs: { BLU: 72 }, skill: 'Blue Magic'                      },
  { name: 'Saline Coat',           jobs: { BLU: 72 }, skill: 'Blue Magic', element: 'Water'    },
  { name: 'Mind Blast',            jobs: { BLU: 73 }, skill: 'Blue Magic', element: 'Lightning'},
  { name: 'Ram Charge',            jobs: { BLU: 73 }, skill: 'Blue Magic'                      },
  { name: 'Temporal Shift',        jobs: { BLU: 73 }, skill: 'Blue Magic', element: 'Lightning'},
  { name: 'Actinic Burst',         jobs: { BLU: 74 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Magic Hammer',          jobs: { BLU: 74 }, skill: 'Blue Magic', element: 'Light'    },
  { name: 'Reactor Cool',          jobs: { BLU: 74 }, skill: 'Blue Magic', element: 'Ice'      },
  { name: 'Exuviation',            jobs: { BLU: 75 }, skill: 'Blue Magic', element: 'Fire'     },
  { name: 'Plasma Charge',         jobs: { BLU: 75 }, skill: 'Blue Magic', element: 'Lightning'},
  { name: 'Vertical Cleave',       jobs: { BLU: 75 }, skill: 'Blue Magic'                      },
]

// ---------------------------------------------------------------------------
// Master export - all schools
// ---------------------------------------------------------------------------
export const allSpellSchools: SpellSchool[] = [
  { school: 'White Magic',     spells: whiteMagic     },
  { school: 'Black Magic',     spells: blackMagic     },
  { school: 'Songs',           spells: songs          },
  { school: 'Ninjutsu',        spells: ninjutsu       },
  { school: 'Summoning Magic', spells: summoningMagic },
  { school: 'Blue Magic',      spells: blueMagic      },
]

// Flat map of spell name → school (White Magic, Black Magic, etc.)
export const spellSchoolMap: Record<string, string> = {}
for (const { school, spells } of allSpellSchools) {
  for (const spell of spells) {
    spellSchoolMap[spell.name] = school
  }
}

// Flat map of spell name → magic skill (Healing Magic, Elemental Magic, etc.)
// Derived from spell.skill - retained for callers that need a name-keyed lookup.
export const spellSkillMap: Record<string, string> = {}
for (const { spells } of allSpellSchools) {
  for (const spell of spells) {
    if (spell.skill) spellSkillMap[spell.name] = spell.skill
  }
}
