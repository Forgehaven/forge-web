// FFXI Spell Data — HorizonXI
// Source: horizonffxi.wiki (scraped May 2026)
// Jobs: WHM, BLM, RDM, PLD, DRK, BRD, SMN, NIN, BLU
//
// Each spell has a `jobs` record mapping job abbreviation → minimum level to learn.
// Schools: white_magic, black_magic, songs, ninjutsu, summoning_magic, blue_magic

export type JobAbbr = 'WHM' | 'BLM' | 'RDM' | 'PLD' | 'DRK' | 'BRD' | 'SMN' | 'NIN' | 'BLU'

export interface Spell {
  name: string
  jobs: Partial<Record<JobAbbr, number>>
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
  { name: 'Cure',         jobs: { WHM: 1,  RDM: 3,  PLD: 5  } },
  { name: 'Dia',          jobs: { WHM: 3,  RDM: 1           } },
  { name: 'Paralyze',     jobs: { WHM: 4,  RDM: 6           } },
  { name: 'Banish',       jobs: { WHM: 5,  PLD: 7           } },
  { name: 'Barstonra',    jobs: { WHM: 5                    } },
  { name: 'Poisona',      jobs: { WHM: 6                    } },
  { name: 'Barsleepra',   jobs: { WHM: 7                    } },
  { name: 'Protect',      jobs: { WHM: 7,  RDM: 7,  PLD: 10 } },
  { name: 'Protectra',    jobs: { WHM: 7                    } },
  { name: 'Barwatera',    jobs: { WHM: 9                    } },
  { name: 'Paralyna',     jobs: { WHM: 9                    } },
  { name: 'Aquaveil',     jobs: { WHM: 10, RDM: 12          } },
  { name: 'Barpoisonra',  jobs: { WHM: 10                   } },
  { name: 'Cure II',      jobs: { WHM: 11, RDM: 14, PLD: 17 } },
  { name: 'Barparalyzra', jobs: { WHM: 12                   } },
  { name: 'Baraera',      jobs: { WHM: 13                   } },
  { name: 'Slow',         jobs: { WHM: 13, RDM: 13          } },
  { name: 'Blindna',      jobs: { WHM: 14                   } },
  { name: 'Banishga',     jobs: { WHM: 15                   } },
  { name: 'Deodorize',    jobs: { WHM: 15, RDM: 15          } },
  { name: 'Silence',      jobs: { WHM: 15, RDM: 18          } },
  { name: 'Curaga',       jobs: { WHM: 16                   } },
  { name: 'Barfira',      jobs: { WHM: 17                   } },
  { name: 'Shell',        jobs: { WHM: 17, RDM: 17, PLD: 20 } },
  { name: 'Shellra',      jobs: { WHM: 17                   } },
  { name: 'Barblindra',   jobs: { WHM: 18                   } },
  { name: 'Diaga',        jobs: { WHM: 18, RDM: 15          } },
  { name: 'Blink',        jobs: { WHM: 19, RDM: 23          } },
  { name: 'Silena',       jobs: { WHM: 19                   } },
  { name: 'Sneak',        jobs: { WHM: 20, RDM: 20          } },
  { name: 'Barblizzara',  jobs: { WHM: 21                   } },
  { name: 'Cure III',     jobs: { WHM: 21, RDM: 26, PLD: 30 } },
  { name: 'Regen',        jobs: { WHM: 21, RDM: 21          } },
  { name: 'Barsilencera', jobs: { WHM: 23                   } },
  { name: 'Barthundra',   jobs: { WHM: 25                   } },
  { name: 'Invisible',    jobs: { WHM: 25, RDM: 25          } },
  { name: 'Raise',        jobs: { WHM: 25, RDM: 38, PLD: 50 } },
  { name: 'Reraise',      jobs: { WHM: 25                   } },
  { name: 'Protect II',   jobs: { WHM: 27, RDM: 27, PLD: 30 } },
  { name: 'Protectra II', jobs: { WHM: 27                   } },
  { name: 'Stoneskin',    jobs: { WHM: 28, RDM: 34          } },
  { name: 'Cursna',       jobs: { WHM: 29                   } },
  { name: 'Banish II',    jobs: { WHM: 30, PLD: 34          } },
  { name: 'Curaga II',    jobs: { WHM: 31                   } },
  { name: 'Erase',        jobs: { WHM: 32                   } },
  { name: 'Viruna',       jobs: { WHM: 34                   } },
  { name: 'Dia II',       jobs: { WHM: 36, RDM: 31          } },
  { name: 'Teleport-Dem', jobs: { WHM: 36                   } },
  { name: 'Teleport-Holla',jobs: { WHM: 36                  } },
  { name: 'Teleport-Mea', jobs: { WHM: 36                   } },
  { name: 'Shell II',     jobs: { WHM: 37, RDM: 37, PLD: 40 } },
  { name: 'Shellra II',   jobs: { WHM: 37                   } },
  { name: 'Teleport-Altep',jobs: { WHM: 38                  } },
  { name: 'Teleport-Yhoat',jobs: { WHM: 38                  } },
  { name: 'Barvira',      jobs: { WHM: 39, RDM: 39          } },
  { name: 'Stona',        jobs: { WHM: 39                   } },
  { name: 'Banishga II',  jobs: { WHM: 40                   } },
  { name: 'Haste',        jobs: { WHM: 40, RDM: 48          } },
  { name: 'Cure IV',      jobs: { WHM: 41, RDM: 48, PLD: 55 } },
  { name: 'Teleport-Vahzl',jobs: { WHM: 42                  } },
  { name: 'Barpetra',     jobs: { WHM: 43, RDM: 43          } },
  { name: 'Regen II',     jobs: { WHM: 44                   } },
  { name: 'Flash',        jobs: { WHM: 45, PLD: 37          } },
  { name: 'Protect III',  jobs: { WHM: 47, RDM: 47, PLD: 50 } },
  { name: 'Protectra III',jobs: { WHM: 47                   } },
  { name: 'Holy',         jobs: { WHM: 50, PLD: 55          } },
  { name: 'Curaga III',   jobs: { WHM: 51                   } },
  { name: 'Raise II',     jobs: { WHM: 56                   } },
  { name: 'Reraise II',   jobs: { WHM: 56                   } },
  { name: 'Shell III',    jobs: { WHM: 57, RDM: 57, PLD: 60 } },
  { name: 'Shellra III',  jobs: { WHM: 57                   } },
  { name: 'Cure V',       jobs: { WHM: 61                   } },
  { name: 'Protect IV',   jobs: { WHM: 63, RDM: 63, PLD: 70 } },
  { name: 'Protectra IV', jobs: { WHM: 63                   } },
  { name: 'Banish III',   jobs: { WHM: 65                   } },
  { name: 'Regen III',    jobs: { WHM: 66                   } },
  { name: 'Shell IV',     jobs: { WHM: 68, RDM: 68          } },
  { name: 'Shellra IV',   jobs: { WHM: 68                   } },
  { name: 'Raise III',    jobs: { WHM: 70                   } },
  { name: 'Reraise III',  jobs: { WHM: 70                   } },
  { name: 'Curaga IV',    jobs: { WHM: 71                   } },
  { name: 'Protectra V',  jobs: { WHM: 75                   } },
  { name: 'Shellra V',    jobs: { WHM: 75                   } },
  // RDM-only white magic spells
  { name: 'Barstone',     jobs: { RDM: 5                    } },
  { name: 'Barsleep',     jobs: { RDM: 7                    } },
  { name: 'Barwater',     jobs: { RDM: 9                    } },
  { name: 'Barpoison',    jobs: { RDM: 10                   } },
  { name: 'Barparalyze',  jobs: { RDM: 12                   } },
  { name: 'Baraero',      jobs: { RDM: 13                   } },
  { name: 'Barfire',      jobs: { RDM: 17                   } },
  { name: 'Barblind',     jobs: { RDM: 18                   } },
  { name: 'Barblizzard',  jobs: { RDM: 21                   } },
  { name: 'Barsilence',   jobs: { RDM: 23                   } },
  { name: 'Barthunder',   jobs: { RDM: 25                   } },
  { name: 'Gravity',      jobs: { RDM: 21                   } },
  { name: 'Dispel',       jobs: { RDM: 32                   } },
  { name: 'Phalanx',      jobs: { RDM: 33                   } },
  { name: 'Refresh',      jobs: { RDM: 41                   } },
  { name: 'Barvirus',     jobs: { RDM: 39                   } },
  { name: 'Barpetrify',   jobs: { RDM: 43                   } },
  // Enspell (RDM only, technically white magic category)
  { name: 'Enthunder',    jobs: { RDM: 16                   } },
  { name: 'Enstone',      jobs: { RDM: 18                   } },
  { name: 'Enaero',       jobs: { RDM: 20                   } },
  { name: 'Enblizzard',   jobs: { RDM: 22                   } },
  { name: 'Enfire',       jobs: { RDM: 24                   } },
  { name: 'Enwater',      jobs: { RDM: 27                   } },
  // PLD-only white magic
  { name: 'Enlight',      jobs: { PLD: 40                   } },
]

// ---------------------------------------------------------------------------
// BLACK MAGIC
// Job sources: BLM job page, RDM job page, DRK job page, individual spell pages
// Note: Scholar (SCH) and Geomancer (GEO) are not playable on HorizonXI.
// ---------------------------------------------------------------------------
export const blackMagic: Spell[] = [
  { name: 'Stone',      jobs: { BLM: 1,  RDM: 4,  DRK: 5  } },
  { name: 'Poison',     jobs: { BLM: 3,  RDM: 5,  DRK: 6  } },
  { name: 'Blind',      jobs: { BLM: 4,  RDM: 8           } },
  { name: 'Water',      jobs: { BLM: 5,  RDM: 9,  DRK: 11 } },
  { name: 'Bind',       jobs: { BLM: 7,  RDM: 11, DRK: 20 } },
  { name: 'Aero',       jobs: { BLM: 9,  RDM: 14, DRK: 17 } },
  { name: 'Bio',        jobs: { BLM: 10, RDM: 10, DRK: 15 } },
  { name: 'Blaze Spikes',jobs: { BLM: 10, RDM: 20         } },
  { name: 'Drain',      jobs: { BLM: 12, DRK: 10          } },
  { name: 'Fire',       jobs: { BLM: 13, RDM: 19, DRK: 23 } },
  { name: 'Stonega',    jobs: { BLM: 15                    } },
  { name: 'Shock',      jobs: { BLM: 16                    } },
  { name: 'Blizzard',   jobs: { BLM: 17, RDM: 24, DRK: 29 } },
  { name: 'Warp',       jobs: { BLM: 17                    } },
  { name: 'Rasp',       jobs: { BLM: 18                    } },
  { name: 'Waterga',    jobs: { BLM: 19                    } },
  { name: 'Choke',      jobs: { BLM: 20                    } },
  { name: 'Ice Spikes', jobs: { BLM: 20, RDM: 40          } },
  { name: 'Sleep',      jobs: { BLM: 20, RDM: 25, DRK: 30 } },
  { name: 'Thunder',    jobs: { BLM: 21, RDM: 29, DRK: 35 } },
  { name: 'Frost',      jobs: { BLM: 22                    } },
  { name: 'Aeroga',     jobs: { BLM: 23                    } },
  { name: 'Burn',       jobs: { BLM: 24                    } },
  { name: 'Poisonga',   jobs: { BLM: 24, DRK: 26          } },
  { name: 'Aspir',      jobs: { BLM: 25, DRK: 20          } },
  { name: 'Tractor',    jobs: { BLM: 25, DRK: 32          } },
  { name: 'Stone II',   jobs: { BLM: 26, RDM: 35, DRK: 42 } },
  { name: 'Drown',      jobs: { BLM: 27                    } },
  { name: 'Firaga',     jobs: { BLM: 28                    } },
  { name: 'Escape',     jobs: { BLM: 29                    } },
  { name: 'Shock Spikes',jobs: { BLM: 30, RDM: 60         } },
  { name: 'Water II',   jobs: { BLM: 30, RDM: 40, DRK: 48 } },
  { name: 'Sleepga',    jobs: { BLM: 31                    } },
  { name: 'Blizzaga',   jobs: { BLM: 32                    } },
  { name: 'Aero II',    jobs: { BLM: 34, RDM: 45, DRK: 54 } },
  { name: 'Bio II',     jobs: { BLM: 35, RDM: 36, DRK: 40 } },
  { name: 'Thundaga',   jobs: { BLM: 36                    } },
  { name: 'Fire II',    jobs: { BLM: 38, RDM: 50, DRK: 60 } },
  { name: 'Stonega II', jobs: { BLM: 40                    } },
  { name: 'Warp II',    jobs: { BLM: 40                    } },
  { name: 'Sleep II',   jobs: { BLM: 41, RDM: 46, DRK: 56 } },
  { name: 'Blizzard II',jobs: { BLM: 42, RDM: 55, DRK: 66 } },
  { name: 'Poison II',  jobs: { BLM: 43, RDM: 46, DRK: 46 } },
  { name: 'Waterga II', jobs: { BLM: 44                    } },
  { name: 'Stun',       jobs: { BLM: 45, DRK: 37          } },
  { name: 'Thunder II', jobs: { BLM: 46, RDM: 60, DRK: 72 } },
  { name: 'Aeroga II',  jobs: { BLM: 48                    } },
  { name: 'Freeze',     jobs: { BLM: 50                    } },
  { name: 'Stone III',  jobs: { BLM: 51, RDM: 65          } },
  { name: 'Tornado',    jobs: { BLM: 52                    } },
  { name: 'Firaga II',  jobs: { BLM: 53                    } },
  { name: 'Quake',      jobs: { BLM: 54                    } },
  { name: 'Water III',  jobs: { BLM: 55, RDM: 67          } },
  { name: 'Burst',      jobs: { BLM: 56                    } },
  { name: 'Sleepga II', jobs: { BLM: 56                    } },
  { name: 'Blizzaga II',jobs: { BLM: 57                    } },
  { name: 'Flood',      jobs: { BLM: 58                    } },
  { name: 'Aero III',   jobs: { BLM: 59, RDM: 69          } },
  { name: 'Flare',      jobs: { BLM: 60                    } },
  { name: 'Thundaga II',jobs: { BLM: 61                    } },
  { name: 'Fire III',   jobs: { BLM: 62, RDM: 71          } },
  { name: 'Stonega III',jobs: { BLM: 63                    } },
  { name: 'Blizzard III',jobs: { BLM: 64, RDM: 73         } },
  { name: 'Waterga III',jobs: { BLM: 65                    } },
  { name: 'Thunder III',jobs: { BLM: 66, RDM: 75          } },
  { name: 'Aeroga III', jobs: { BLM: 67                    } },
  { name: 'Stone IV',   jobs: { BLM: 68                    } },
  { name: 'Firaga III', jobs: { BLM: 69                    } },
  { name: 'Water IV',   jobs: { BLM: 70                    } },
  { name: 'Blizzaga III',jobs: { BLM: 71                   } },
  { name: 'Aero IV',    jobs: { BLM: 72                    } },
  { name: 'Fire IV',    jobs: { BLM: 73                    } },
  { name: 'Thundaga III',jobs: { BLM: 73                   } },
  { name: 'Blizzard IV',jobs: { BLM: 74                    } },
  { name: 'Thunder IV', jobs: { BLM: 75                    } },
  // DRK-exclusive dark magic (Absorb line)
  { name: 'Absorb-MND', jobs: { DRK: 31                    } },
  { name: 'Absorb-CHR', jobs: { DRK: 33                    } },
  { name: 'Absorb-VIT', jobs: { DRK: 35                    } },
  { name: 'Absorb-AGI', jobs: { DRK: 37                    } },
  { name: 'Absorb-INT', jobs: { DRK: 39                    } },
  { name: 'Absorb-DEX', jobs: { DRK: 41                    } },
  { name: 'Absorb-STR', jobs: { DRK: 43                    } },
]

// ---------------------------------------------------------------------------
// SONGS (Bard only)
// Source: horizonffxi.wiki/Bard job page
// ---------------------------------------------------------------------------
export const songs: Spell[] = [
  { name: "Knight's Minne",    jobs: { BRD: 1  } },
  { name: 'Valor Minuet',      jobs: { BRD: 3  } },
  { name: "Army's Paeon",      jobs: { BRD: 5  } },
  { name: 'Foe Requiem',       jobs: { BRD: 7  } },
  { name: 'Herb Pastoral',     jobs: { BRD: 9  } },
  { name: 'Light Threnody',    jobs: { BRD: 10 } },
  { name: 'Sword Madrigal',    jobs: { BRD: 11 } },
  { name: 'Dark Threnody',     jobs: { BRD: 12 } },
  { name: 'Sheepfoe Mambo',    jobs: { BRD: 13 } },
  { name: 'Earth Threnody',    jobs: { BRD: 14 } },
  { name: "Army's Paeon II",   jobs: { BRD: 15 } },
  { name: 'Foe Lullaby',       jobs: { BRD: 16 } },
  { name: 'Water Threnody',    jobs: { BRD: 16 } },
  { name: 'Foe Requiem II',    jobs: { BRD: 17 } },
  { name: 'Wind Threnody',     jobs: { BRD: 18 } },
  { name: "Scop's Operetta",   jobs: { BRD: 19 } },
  { name: 'Fire Threnody',     jobs: { BRD: 20 } },
  { name: "Knight's Minne II", jobs: { BRD: 21 } },
  { name: 'Enchanting Etude',  jobs: { BRD: 22 } },
  { name: 'Ice Threnody',      jobs: { BRD: 22 } },
  { name: 'Valor Minuet II',   jobs: { BRD: 23 } },
  { name: 'Lightning Threnody',jobs: { BRD: 24 } },
  { name: 'Spirited Etude',    jobs: { BRD: 24 } },
  { name: "Mage's Ballad",     jobs: { BRD: 25 } },
  { name: 'Learned Etude',     jobs: { BRD: 26 } },
  { name: 'Horde Lullaby',     jobs: { BRD: 27 } },
  { name: 'Quick Etude',       jobs: { BRD: 28 } },
  { name: 'Advancing March',   jobs: { BRD: 29 } },
  { name: 'Vivacious Etude',   jobs: { BRD: 30 } },
  { name: "Hunter's Prelude",  jobs: { BRD: 31 } },
  { name: 'Dextrous Etude',    jobs: { BRD: 32 } },
  { name: 'Fowl Aubade',       jobs: { BRD: 33 } },
  { name: 'Magic Finale',      jobs: { BRD: 33 } },
  { name: 'Sinewy Etude',      jobs: { BRD: 34 } },
  { name: "Army's Paeon III",  jobs: { BRD: 35 } },
  { name: 'Light Carol',       jobs: { BRD: 36 } },
  { name: 'Foe Requiem III',   jobs: { BRD: 37 } },
  { name: 'Earth Carol',       jobs: { BRD: 38 } },
  { name: 'Battlefield Elegy', jobs: { BRD: 39 } },
  { name: 'Water Carol',       jobs: { BRD: 40 } },
  { name: "Knight's Minne III",jobs: { BRD: 41 } },
  { name: 'Wind Carol',        jobs: { BRD: 42 } },
  { name: 'Valor Minuet III',  jobs: { BRD: 43 } },
  { name: 'Fire Carol',        jobs: { BRD: 44 } },
  { name: "Army's Paeon IV",   jobs: { BRD: 45 } },
  { name: 'Ice Carol',         jobs: { BRD: 46 } },
  { name: 'Foe Requiem IV',    jobs: { BRD: 47 } },
  { name: 'Lightning Carol',   jobs: { BRD: 48 } },
  { name: 'Goblin Gavotte',    jobs: { BRD: 49 } },
  { name: 'Dark Carol',        jobs: { BRD: 50 } },
  { name: 'Blade Madrigal',    jobs: { BRD: 51 } },
  { name: 'Dragonfoe Mambo',   jobs: { BRD: 53 } },
  { name: 'Gold Capriccio',    jobs: { BRD: 54 } },
  { name: "Mage's Ballad II",  jobs: { BRD: 55 } },
  { name: 'Shining Fantasia',  jobs: { BRD: 56 } },
  { name: 'Foe Requiem V',     jobs: { BRD: 57 } },
  { name: 'Carnage Elegy',     jobs: { BRD: 59 } },
  { name: 'Victory March',     jobs: { BRD: 60 } },
  { name: "Knight's Minne IV", jobs: { BRD: 61 } },
  { name: 'Bewitching Etude',  jobs: { BRD: 62 } },
  { name: 'Valor Minuet IV',   jobs: { BRD: 63 } },
  { name: 'Logical Etude',     jobs: { BRD: 64 } },
  { name: "Army's Paeon V",    jobs: { BRD: 65 } },
  { name: 'Sage Etude',        jobs: { BRD: 66 } },
  { name: 'Foe Requiem VI',    jobs: { BRD: 67 } },
  { name: 'Swift Etude',       jobs: { BRD: 68 } },
  { name: "Puppet's Operetta", jobs: { BRD: 69 } },
  { name: 'Vital Etude',       jobs: { BRD: 70 } },
  { name: "Archer's Prelude",  jobs: { BRD: 71 } },
  { name: "Goddess's Hymnus",  jobs: { BRD: 71 } },
  { name: 'Uncanny Etude',     jobs: { BRD: 72 } },
  { name: 'Chocobo Mazurka',   jobs: { BRD: 73 } },
  { name: 'Warding Round',     jobs: { BRD: 73 } },
  { name: 'Herculean Etude',   jobs: { BRD: 74 } },
  { name: "Maiden's Virelai",  jobs: { BRD: 75 } },
]

// ---------------------------------------------------------------------------
// NINJUTSU (Ninja only)
// Source: horizonffxi.wiki/Ninja job page
// Note: All ninjutsu are NIN-only. The Ichi elemental spells are learnable at
// 12 but only usable from level 15 per wiki note.
// ---------------------------------------------------------------------------
export const ninjutsu: Spell[] = [
  { name: 'Tonko: Ichi',    jobs: { NIN: 9  } },
  { name: 'Doton: Ichi',    jobs: { NIN: 12 } },
  { name: 'Huton: Ichi',    jobs: { NIN: 12 } },
  { name: 'Hyoton: Ichi',   jobs: { NIN: 12 } },
  { name: 'Katon: Ichi',    jobs: { NIN: 12 } },
  { name: 'Raiton: Ichi',   jobs: { NIN: 12 } },
  { name: 'Suiton: Ichi',   jobs: { NIN: 12 } },
  { name: 'Utsusemi: Ichi', jobs: { NIN: 12 } },
  { name: 'Kurayami: Ichi', jobs: { NIN: 19 } },
  { name: 'Hojo: Ichi',     jobs: { NIN: 23 } },
  { name: 'Dokumori: Ichi', jobs: { NIN: 27 } },
  { name: 'Jubaku: Ichi',   jobs: { NIN: 30 } },
  { name: 'Tonko: Ni',      jobs: { NIN: 34 } },
  { name: 'Utsusemi: Ni',   jobs: { NIN: 37 } },
  { name: 'Doton: Ni',      jobs: { NIN: 40 } },
  { name: 'Huton: Ni',      jobs: { NIN: 40 } },
  { name: 'Hyoton: Ni',     jobs: { NIN: 40 } },
  { name: 'Katon: Ni',      jobs: { NIN: 40 } },
  { name: 'Raiton: Ni',     jobs: { NIN: 40 } },
  { name: 'Suiton: Ni',     jobs: { NIN: 40 } },
  { name: 'Kurayami: Ni',   jobs: { NIN: 44 } },
  { name: 'Hojo: Ni',       jobs: { NIN: 48 } },
]

// ---------------------------------------------------------------------------
// SUMMONING MAGIC (Summoner only)
// Source: horizonffxi.wiki/Summoner, /Avatar pages
// All avatars and spirits are technically SMN:1 (quest/trial gated, not level
// gated). Spirits are listed separately from combat avatars for clarity.
// Blood Pacts are job abilities, not spells — only the summon itself is listed
// as the "spell" (i.e. what you learn on your spell list).
// ---------------------------------------------------------------------------
export const summoningMagic: Spell[] = [
  // Prime avatars — obtained via Trial by <Element> quests, usable at SMN:1
  { name: 'Carbuncle',     jobs: { SMN: 1 } },
  { name: 'Ifrit',         jobs: { SMN: 1 } },
  { name: 'Titan',         jobs: { SMN: 1 } },
  { name: 'Leviathan',     jobs: { SMN: 1 } },
  { name: 'Garuda',        jobs: { SMN: 1 } },
  { name: 'Shiva',         jobs: { SMN: 1 } },
  { name: 'Ramuh',         jobs: { SMN: 1 } },
  { name: 'Fenrir',        jobs: { SMN: 1 } },
  { name: 'Diabolos',      jobs: { SMN: 1 } },
  // Elemental spirits — purchased as scrolls, usable at SMN:1
  { name: 'Fire Spirit',   jobs: { SMN: 1 } },
  { name: 'Ice Spirit',    jobs: { SMN: 1 } },
  { name: 'Air Spirit',    jobs: { SMN: 1 } },
  { name: 'Earth Spirit',  jobs: { SMN: 1 } },
  { name: 'Thunder Spirit',jobs: { SMN: 1 } },
  { name: 'Water Spirit',  jobs: { SMN: 1 } },
  { name: 'Light Spirit',  jobs: { SMN: 1 } },
  { name: 'Dark Spirit',   jobs: { SMN: 1 } },
]

// ---------------------------------------------------------------------------
// BLUE MAGIC (Blue Mage only)
// Source: horizonffxi.wiki/Blue_Magic category page
// Note: "Unbridled Learning" spells require the UL job ability to cast.
// ---------------------------------------------------------------------------
export const blueMagic: Spell[] = [
  { name: 'Sandspin',           jobs: { BLU: 1  } },
  { name: 'Pollen',             jobs: { BLU: 1  } },
  { name: 'Foot Kick',          jobs: { BLU: 1  } },
  { name: 'Power Attack',       jobs: { BLU: 4  } },
  { name: 'Sprout Smack',       jobs: { BLU: 4  } },
  { name: 'Wild Oats',          jobs: { BLU: 4  } },
  { name: 'Metallic Body',      jobs: { BLU: 8  } },
  { name: 'Cocoon',             jobs: { BLU: 8  } },
  { name: 'Queasyshroom',       jobs: { BLU: 8  } },
  { name: 'Battle Dance',       jobs: { BLU: 12 } },
  { name: 'Head Butt',          jobs: { BLU: 12 } },
  { name: 'Feather Storm',      jobs: { BLU: 12 } },
  { name: 'Helldive',           jobs: { BLU: 16 } },
  { name: 'Healing Breeze',     jobs: { BLU: 16 } },
  { name: 'Sheep Song',         jobs: { BLU: 16 } },
  { name: 'Bludgeon',           jobs: { BLU: 18 } },
  { name: 'Cursed Sphere',      jobs: { BLU: 18 } },
  { name: 'Blastbomb',          jobs: { BLU: 18 } },
  { name: 'Blood Drain',        jobs: { BLU: 20 } },
  { name: 'Claw Cyclone',       jobs: { BLU: 20 } },
  { name: 'Poison Breath',      jobs: { BLU: 22 } },
  { name: 'Soporific',          jobs: { BLU: 24 } },
  { name: 'Screwdriver',        jobs: { BLU: 26 } },
  { name: 'Bomb Toss',          jobs: { BLU: 28 } },
  { name: 'Grand Slam',         jobs: { BLU: 30 } },
  { name: 'Wild Carrot',        jobs: { BLU: 30 } },
  { name: 'Sound Blast',        jobs: { BLU: 32 } },
  { name: 'Chaotic Eye',        jobs: { BLU: 32 } },
  { name: 'Death Ray',          jobs: { BLU: 34 } },
  { name: 'Smite of Rage',      jobs: { BLU: 34 } },
  { name: 'Digest',             jobs: { BLU: 36 } },
  { name: 'Pinecone Bomb',      jobs: { BLU: 36 } },
  { name: 'Jet Stream',         jobs: { BLU: 38 } },
  { name: 'Uppercut',           jobs: { BLU: 38 } },
  { name: 'Blank Gaze',         jobs: { BLU: 38 } },
  { name: 'Mysterious Light',   jobs: { BLU: 40 } },
  { name: 'Terror Touch',       jobs: { BLU: 40 } },
  { name: 'Venom Shell',        jobs: { BLU: 42 } },
  { name: 'MP Drainkiss',       jobs: { BLU: 42 } },
  { name: 'Mandibular Bite',    jobs: { BLU: 44 } },
  { name: 'Blitzstrahl',        jobs: { BLU: 44 } },
  { name: 'Stinking Gas',       jobs: { BLU: 44 } },
  { name: 'Magnetite Cloud',    jobs: { BLU: 46 } },
  { name: 'Geist Wall',         jobs: { BLU: 46 } },
  { name: 'Awful Eye',          jobs: { BLU: 46 } },
  { name: 'Sickle Slash',       jobs: { BLU: 48 } },
  { name: 'Blood Saber',        jobs: { BLU: 48 } },
  { name: 'Refueling',          jobs: { BLU: 48 } },
  { name: 'Jettatura',          jobs: { BLU: 48 } },
  { name: 'Frightful Roar',     jobs: { BLU: 50 } },
  { name: 'Ice Break',          jobs: { BLU: 50 } },
  { name: 'Self-Destruct',      jobs: { BLU: 50 } },
  { name: 'Filamented Hold',    jobs: { BLU: 52 } },
  { name: 'Cold Wave',          jobs: { BLU: 52 } },
  { name: 'Hecatomb Wave',      jobs: { BLU: 54 } },
  { name: 'Radiant Breath',     jobs: { BLU: 54 } },
  { name: 'Feather Barrier',    jobs: { BLU: 56 } },
  { name: 'Flying Hip Press',   jobs: { BLU: 58 } },
  { name: 'Light of Penance',   jobs: { BLU: 58 } },
  { name: 'Magic Fruit',        jobs: { BLU: 58 } },
  { name: 'Death Scissors',     jobs: { BLU: 60 } },
  { name: 'Dimensional Death',  jobs: { BLU: 60 } },
  { name: 'Spiral Spin',        jobs: { BLU: 60 } },
  { name: 'Seedspray',          jobs: { BLU: 61 } },
  { name: 'Eyes On Me',         jobs: { BLU: 61 } },
  { name: 'Maelstrom',          jobs: { BLU: 61 } },
  { name: 'Bad Breath',         jobs: { BLU: 61 } },
  { name: 'Body Slam',          jobs: { BLU: 62 } },
  { name: 'Memento Mori',       jobs: { BLU: 62 } },
  { name: '1000 Needles',       jobs: { BLU: 62 } },
  { name: 'Spinal Cleave',      jobs: { BLU: 63 } },
  { name: 'Frenetic Rip',       jobs: { BLU: 63 } },
  { name: 'Frypan',             jobs: { BLU: 63 } },
  { name: 'Hydro Shot',         jobs: { BLU: 63 } },
  { name: 'Feather Tickle',     jobs: { BLU: 64 } },
  { name: 'Yawn',               jobs: { BLU: 64 } },
  { name: 'Voracious Trunk',    jobs: { BLU: 64 } },
  { name: 'Infrasonics',        jobs: { BLU: 65 } },
  { name: 'Zephyr Mantle',      jobs: { BLU: 65 } },
  { name: 'Frost Breath',       jobs: { BLU: 66 } },
  { name: 'Sandspray',          jobs: { BLU: 66 } },
  { name: 'Corrosive Ooze',     jobs: { BLU: 66 } },
  { name: 'Enervation',         jobs: { BLU: 67 } },
  { name: 'Diamondhide',        jobs: { BLU: 67 } },
  { name: 'Warm-Up',            jobs: { BLU: 68 } },
  { name: 'Firespit',           jobs: { BLU: 68 } },
  { name: 'Tail Slap',          jobs: { BLU: 69 } },
  { name: 'Hysteric Barrage',   jobs: { BLU: 69 } },
  { name: 'Regurgitation',      jobs: { BLU: 69 } },
  { name: 'Amplification',      jobs: { BLU: 70 } },
  { name: 'Cannonball',         jobs: { BLU: 70 } },
  { name: 'Asuran Claws',       jobs: { BLU: 70 } },
  { name: 'Lowing',             jobs: { BLU: 71 } },
  { name: 'Heat Breath',        jobs: { BLU: 71 } },
  { name: 'Triumphant Roar',    jobs: { BLU: 71 } },
  { name: 'Disseverment',       jobs: { BLU: 72 } },
  { name: 'Saline Coat',        jobs: { BLU: 72 } },
  { name: 'Sub-zero Smash',     jobs: { BLU: 72 } },
  { name: 'Ram Charge',         jobs: { BLU: 73 } },
  { name: 'Temporal Shift',     jobs: { BLU: 73 } },
  { name: 'Mind Blast',         jobs: { BLU: 73 } },
  { name: 'Actinic Burst',      jobs: { BLU: 74 } },
  { name: 'Reactor Cool',       jobs: { BLU: 74 } },
  { name: 'Magic Hammer',       jobs: { BLU: 74 } },
  { name: 'Plasma Charge',      jobs: { BLU: 75 } },
  { name: 'Vertical Cleave',    jobs: { BLU: 75 } },
  { name: 'Exuviation',         jobs: { BLU: 75 } },
  { name: 'Plenilune Embrace',  jobs: { BLU: 76 } },
  { name: 'Acrid Stream',       jobs: { BLU: 77 } },
  { name: 'Leafstorm',          jobs: { BLU: 77 } },
  { name: 'Cimicine Discharge', jobs: { BLU: 78 } },
  { name: 'Regeneration',       jobs: { BLU: 78 } },
  { name: 'Animating Wail',     jobs: { BLU: 79 } },
  { name: 'Battery Charge',     jobs: { BLU: 79 } },
  { name: 'Blazing Bound',      jobs: { BLU: 80 } },
  { name: 'Demoralizing Roar',  jobs: { BLU: 80 } },
  { name: 'Final Sting',        jobs: { BLU: 81 } },
  { name: 'Goblin Rush',        jobs: { BLU: 81 } },
  { name: 'Vanity Dive',        jobs: { BLU: 82 } },
  { name: 'Magic Barrier',      jobs: { BLU: 82 } },
  { name: 'Whirl of Rage',      jobs: { BLU: 83 } },
  { name: 'Benthic Typhoon',    jobs: { BLU: 83 } },
  { name: 'Auroral Drape',      jobs: { BLU: 84 } },
  { name: 'Osmosis',            jobs: { BLU: 84 } },
  { name: 'Quadratic Continuum',jobs: { BLU: 85 } },
  { name: 'Fantod',             jobs: { BLU: 85 } },
  { name: 'Thermal Pulse',      jobs: { BLU: 86 } },
  { name: 'Dream Flower',       jobs: { BLU: 87 } },
  { name: 'Empty Thrash',       jobs: { BLU: 87 } },
  { name: 'Charged Whisker',    jobs: { BLU: 88 } },
  { name: 'Occultation',        jobs: { BLU: 88 } },
  { name: 'Delta Thrust',       jobs: { BLU: 89 } },
  { name: 'Winds of Promyvion', jobs: { BLU: 89 } },
  { name: "Everyone's Grudge",  jobs: { BLU: 90 } },
  { name: 'Reaving Wind',       jobs: { BLU: 90 } },
  { name: 'Barrier Tusk',       jobs: { BLU: 91 } },
  { name: 'Mortal Ray',         jobs: { BLU: 91 } },
  { name: 'Heavy Strike',       jobs: { BLU: 92 } },
  { name: 'Water Bomb',         jobs: { BLU: 92 } },
  { name: 'Dark Orb',           jobs: { BLU: 93 } },
  { name: 'White Wind',         jobs: { BLU: 94 } },
  { name: 'Sudden Lunge',       jobs: { BLU: 95 } },
  { name: 'Harden Shell',       jobs: { BLU: 95 } },
  { name: 'Thunderbolt',        jobs: { BLU: 95 } }, // Unbridled Learning
  { name: 'Absolute Terror',    jobs: { BLU: 96 } }, // Unbridled Learning
  { name: 'Quadrastrike',       jobs: { BLU: 96 } },
  { name: 'Vapor Spray',        jobs: { BLU: 96 } },
  { name: 'Gates of Hades',     jobs: { BLU: 97 } }, // Unbridled Learning
  { name: 'Tourbillion',        jobs: { BLU: 97 } }, // Unbridled Learning
  { name: 'Thunder Breath',     jobs: { BLU: 97 } },
  { name: 'Amorphic Spikes',    jobs: { BLU: 98 } },
  { name: 'Orcish Counterstance',jobs: { BLU: 98 } },
  { name: 'Pyric Bulwark',      jobs: { BLU: 98 } }, // Unbridled Learning
  { name: 'Barbed Crescent',    jobs: { BLU: 99 } },
  { name: 'Bilgestorm',         jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Bloodrake',          jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Wind Breath',        jobs: { BLU: 99 } },
  { name: "Nature's Meditation",jobs: { BLU: 99 } },
  { name: 'Tempestuous Upheaval',jobs: { BLU: 99 } },
  { name: 'Rending Deluge',     jobs: { BLU: 99 } },
  { name: 'Embalming Earth',    jobs: { BLU: 99 } },
  { name: 'Paralyzing Triad',   jobs: { BLU: 99 } },
  { name: 'Foul Waters',        jobs: { BLU: 99 } },
  { name: 'Glutinous Dart',     jobs: { BLU: 99 } },
  { name: 'Retinal Glare',      jobs: { BLU: 99 } },
  { name: 'Droning Whirlwind',  jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Carcharian Verve',   jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Blistering Roar',    jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Erratic Flutter',    jobs: { BLU: 99 } },
  { name: 'Subduction',         jobs: { BLU: 99 } },
  { name: 'Thrashing Assault',  jobs: { BLU: 99 } },
  { name: 'Sinker Drill',       jobs: { BLU: 99 } },
  { name: 'Restoral',           jobs: { BLU: 99 } },
  { name: 'Rail Cannon',        jobs: { BLU: 99 } },
  { name: 'Diffusion Ray',      jobs: { BLU: 99 } },
  { name: 'Uproot',             jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Crashing Thunder',   jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Polar Roar',         jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Sweeping Gouge',     jobs: { BLU: 99 } },
  { name: 'Searing Tempest',    jobs: { BLU: 99 } },
  { name: 'Blinding Fulgor',    jobs: { BLU: 99 } },
  { name: 'Spectral Floe',      jobs: { BLU: 99 } },
  { name: 'Scouring Spate',     jobs: { BLU: 99 } },
  { name: 'Anvil Lightning',    jobs: { BLU: 99 } },
  { name: 'Silent Storm',       jobs: { BLU: 99 } },
  { name: 'Entomb',             jobs: { BLU: 99 } },
  { name: 'Tenebral Crush',     jobs: { BLU: 99 } },
  { name: 'Saurian Slide',      jobs: { BLU: 99 } },
  { name: 'Palling Salvo',      jobs: { BLU: 99 } },
  { name: 'Molting Plumage',    jobs: { BLU: 99 } },
  { name: 'Nectarous Deluge',   jobs: { BLU: 99 } },
  { name: 'Atramentous Libations',jobs: { BLU: 99 } },
  { name: 'Mighty Guard',       jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Cruel Joke',         jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Cesspool',           jobs: { BLU: 99 } }, // Unbridled Learning
  { name: 'Tearing Gust',       jobs: { BLU: 99 } }, // Unbridled Learning
]

// ---------------------------------------------------------------------------
// Master export — all schools
// ---------------------------------------------------------------------------
export const allSpellSchools: SpellSchool[] = [
  { school: 'White Magic',     spells: whiteMagic     },
  { school: 'Black Magic',     spells: blackMagic     },
  { school: 'Songs',           spells: songs          },
  { school: 'Ninjutsu',        spells: ninjutsu       },
  { school: 'Summoning Magic', spells: summoningMagic },
  { school: 'Blue Magic',      spells: blueMagic      },
]

// Convenience: flat map of spell name → school
export const spellSchoolMap: Record<string, string> = {}
for (const { school, spells } of allSpellSchools) {
  for (const spell of spells) {
    spellSchoolMap[spell.name] = school
  }
}

// ---------------------------------------------------------------------------
// Spell skill map — maps spell name → magic skill used when casting
// White/Black Magic spells can use different skills; other schools are 1:1.
// ---------------------------------------------------------------------------
const HEALING_SPELLS = new Set([
  'Cure', 'Cure II', 'Cure III', 'Cure IV', 'Cure V',
  'Curaga', 'Curaga II', 'Curaga III', 'Curaga IV',
  'Raise', 'Raise II', 'Raise III',
  'Reraise', 'Reraise II', 'Reraise III',
  'Poisona', 'Paralyna', 'Blindna', 'Silena', 'Cursna', 'Viruna', 'Stona', 'Erase',
])

const ENHANCING_SPELLS = new Set([
  'Protect', 'Protect II', 'Protect III', 'Protect IV',
  'Protectra', 'Protectra II', 'Protectra III', 'Protectra IV', 'Protectra V',
  'Shell', 'Shell II', 'Shell III', 'Shell IV',
  'Shellra', 'Shellra II', 'Shellra III', 'Shellra IV', 'Shellra V',
  'Haste', 'Blink', 'Stoneskin', 'Aquaveil', 'Phalanx', 'Refresh',
  'Sneak', 'Invisible', 'Deodorize',
  'Regen', 'Regen II', 'Regen III',
  'Barstone', 'Barfire', 'Barwater', 'Baraero', 'Barblizzard', 'Barthunder',
  'Barpoison', 'Barsleep', 'Barparalyze', 'Barblind', 'Barsilence',
  'Barvirus', 'Barpetrify',
  'Barstonra', 'Barwatera', 'Baraera', 'Barfira', 'Barblizzara', 'Barthundra',
  'Barpoisonra', 'Barsleepra', 'Barparalyzra', 'Barblindra', 'Barsilencera',
  'Barvira', 'Barpetra',
  'Enthunder', 'Enstone', 'Enaero', 'Enblizzard', 'Enfire', 'Enwater', 'Enlight',
  'Blaze Spikes', 'Ice Spikes', 'Shock Spikes',
  'Teleport-Dem', 'Teleport-Holla', 'Teleport-Mea',
  'Teleport-Altep', 'Teleport-Yhoat', 'Teleport-Vahzl',
])

const ENFEEBLING_SPELLS = new Set([
  'Dia', 'Dia II', 'Diaga',
  'Slow', 'Paralyze', 'Blind', 'Silence', 'Bind', 'Gravity', 'Dispel',
  'Poison', 'Poison II', 'Poisonga',
])

const DIVINE_SPELLS = new Set([
  'Banish', 'Banish II', 'Banish III',
  'Banishga', 'Banishga II',
  'Holy', 'Flash',
])

const ELEMENTAL_SPELLS = new Set([
  'Stone', 'Stone II', 'Stone III', 'Stone IV',
  'Stonega', 'Stonega II', 'Stonega III',
  'Water', 'Water II', 'Water III', 'Water IV',
  'Waterga', 'Waterga II', 'Waterga III',
  'Fire', 'Fire II', 'Fire III', 'Fire IV',
  'Firaga', 'Firaga II', 'Firaga III',
  'Aero', 'Aero II', 'Aero III', 'Aero IV',
  'Aeroga', 'Aeroga II', 'Aeroga III',
  'Blizzard', 'Blizzard II', 'Blizzard III', 'Blizzard IV',
  'Blizzaga', 'Blizzaga II', 'Blizzaga III',
  'Thunder', 'Thunder II', 'Thunder III', 'Thunder IV',
  'Thundaga', 'Thundaga II', 'Thundaga III',
  'Shock', 'Rasp', 'Choke', 'Frost', 'Burn', 'Drown',
  'Freeze', 'Tornado', 'Quake', 'Burst', 'Flood', 'Flare',
])

const DARK_SPELLS = new Set([
  'Drain', 'Aspir',
  'Bio', 'Bio II',
  'Sleep', 'Sleep II', 'Sleepga', 'Sleepga II',
  'Stun',
  'Warp', 'Warp II', 'Tractor', 'Escape',
  'Absorb-MND', 'Absorb-CHR', 'Absorb-VIT', 'Absorb-AGI',
  'Absorb-INT', 'Absorb-DEX', 'Absorb-STR',
])

export const spellSkillMap: Record<string, string> = {}
for (const spell of [...whiteMagic, ...blackMagic]) {
  const n = spell.name
  if      (HEALING_SPELLS.has(n))    spellSkillMap[n] = 'Healing Magic'
  else if (ENHANCING_SPELLS.has(n))  spellSkillMap[n] = 'Enhancing Magic'
  else if (ENFEEBLING_SPELLS.has(n)) spellSkillMap[n] = 'Enfeebling Magic'
  else if (DIVINE_SPELLS.has(n))     spellSkillMap[n] = 'Divine Magic'
  else if (ELEMENTAL_SPELLS.has(n))  spellSkillMap[n] = 'Elemental Magic'
  else if (DARK_SPELLS.has(n))       spellSkillMap[n] = 'Dark Magic'
}
for (const spell of songs)          spellSkillMap[spell.name] = 'Singing'
for (const spell of ninjutsu)       spellSkillMap[spell.name] = 'Ninjutsu'
for (const spell of summoningMagic) spellSkillMap[spell.name] = 'Summoning Magic'
for (const spell of blueMagic)      spellSkillMap[spell.name] = 'Blue Magic'
