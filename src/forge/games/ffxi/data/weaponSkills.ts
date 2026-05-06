import type { PhysicalType } from './elements'

export type SCAttr =
  | 'Liquefaction' | 'Impaction' | 'Detonation' | 'Scission'
  | 'Reverberation' | 'Transfixion' | 'Compression' | 'Induration'
  | 'Fusion' | 'Gravitation' | 'Distortion' | 'Fragmentation'
  | 'Light' | 'Darkness'

export type WeaponType =
  | 'Hand-to-Hand' | 'Dagger' | 'Sword' | 'Great Sword'
  | 'Axe' | 'Great Axe' | 'Scythe' | 'Polearm'
  | 'Katana' | 'Great Katana' | 'Club' | 'Staff'
  | 'Archery' | 'Marksmanship'

export interface WeaponSkill {
  name: string
  weapon: WeaponType
  attrs: SCAttr[]
  skillReq: number
  questLevel?: number
}

export const WEAPON_TYPES: WeaponType[] = [
  'Hand-to-Hand', 'Dagger', 'Sword', 'Great Sword',
  'Axe', 'Great Axe', 'Scythe', 'Polearm',
  'Katana', 'Great Katana', 'Club', 'Staff',
  'Archery', 'Marksmanship',
]

export const WEAPON_DAMAGE_TYPE: Record<WeaponType, PhysicalType> = {
  'Hand-to-Hand': 'Blunt',
  'Dagger':       'Piercing',
  'Sword':        'Slashing',
  'Great Sword':  'Slashing',
  'Axe':          'Slashing',
  'Great Axe':    'Slashing',
  'Scythe':       'Slashing',
  'Polearm':      'Piercing',
  'Katana':       'Slashing',
  'Great Katana': 'Slashing',
  'Club':         'Blunt',
  'Staff':        'Blunt',
  'Archery':      'Piercing',
  'Marksmanship': 'Piercing',
}

// Skill thresholds and SC attributes sourced from horizonffxi.wiki
// HorizonXI-specific changes called out in comments where they differ from retail.
export const WEAPON_SKILLS: WeaponSkill[] = [
  // ── Hand-to-Hand ────────────────────────────────────────────────────────────
  { name: 'Combo',           weapon: 'Hand-to-Hand', skillReq: 5,   attrs: ['Impaction'] },
  { name: 'Shoulder Tackle', weapon: 'Hand-to-Hand', skillReq: 40,  attrs: ['Reverberation'] },
  { name: 'One Inch Punch',  weapon: 'Hand-to-Hand', skillReq: 75,  attrs: ['Compression'] },
  { name: 'Backhand Blow',   weapon: 'Hand-to-Hand', skillReq: 100, attrs: ['Detonation'] },
  { name: 'Raging Fists',    weapon: 'Hand-to-Hand', skillReq: 125, attrs: ['Impaction'] },
  { name: 'Spinning Attack', weapon: 'Hand-to-Hand', skillReq: 150, attrs: ['Scission'] },
  { name: 'Howling Fist',    weapon: 'Hand-to-Hand', skillReq: 200, attrs: ['Impaction', 'Fragmentation'] },
  { name: 'Dragon Kick',     weapon: 'Hand-to-Hand', skillReq: 225, attrs: ['Scission', 'Detonation'] },
  { name: 'Asuran Fists',    weapon: 'Hand-to-Hand', skillReq: 250, questLevel: 71, attrs: ['Gravitation', 'Distortion'] },

  // ── Dagger ──────────────────────────────────────────────────────────────────
  { name: 'Wasp Sting',   weapon: 'Dagger', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Gust Slash',   weapon: 'Dagger', skillReq: 40,  attrs: ['Detonation'] },
  { name: 'Shadowstitch', weapon: 'Dagger', skillReq: 70,  attrs: ['Reverberation'] },
  { name: 'Viper Bite',   weapon: 'Dagger', skillReq: 100, attrs: ['Scission'] },
  { name: 'Cyclone',      weapon: 'Dagger', skillReq: 125, attrs: ['Detonation'] },
  { name: 'Energy Steal', weapon: 'Dagger', skillReq: 150, attrs: ['Impaction'] },
  { name: 'Energy Drain', weapon: 'Dagger', skillReq: 175, attrs: ['Impaction'] },
  { name: 'Dancing Edge', weapon: 'Dagger', skillReq: 200, attrs: ['Scission', 'Detonation'] },
  { name: 'Shark Bite',   weapon: 'Dagger', skillReq: 225, attrs: ['Impaction'] },
  { name: 'Evisceration', weapon: 'Dagger', skillReq: 230, questLevel: 71, attrs: ['Gravitation', 'Transfixion'] },

  // ── Sword ────────────────────────────────────────────────────────────────────
  { name: 'Fast Blade',      weapon: 'Sword', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Burning Blade',   weapon: 'Sword', skillReq: 30,  attrs: ['Liquefaction'] },
  { name: 'Red Lotus Blade', weapon: 'Sword', skillReq: 50,  attrs: ['Liquefaction'] },
  { name: 'Flat Blade',      weapon: 'Sword', skillReq: 75,  attrs: ['Impaction'] },
  { name: 'Shining Blade',   weapon: 'Sword', skillReq: 100, attrs: ['Transfixion'] },
  { name: 'Seraph Blade',    weapon: 'Sword', skillReq: 125, attrs: ['Transfixion'] },
  { name: 'Circle Blade',    weapon: 'Sword', skillReq: 150, attrs: ['Scission'] },
  { name: 'Spirits Within',  weapon: 'Sword', skillReq: 175, attrs: ['Transfixion'] },
  { name: 'Vorpal Blade',    weapon: 'Sword', skillReq: 200, attrs: ['Scission', 'Impaction'] },
  { name: 'Swift Blade',     weapon: 'Sword', skillReq: 225, attrs: ['Gravitation'] },
  { name: 'Savage Blade',    weapon: 'Sword', skillReq: 240, questLevel: 71, attrs: ['Fusion'] },

  // ── Great Sword ──────────────────────────────────────────────────────────────
  { name: 'Hard Slash',     weapon: 'Great Sword', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Power Slash',    weapon: 'Great Sword', skillReq: 30,  attrs: ['Scission'] },
  { name: 'Frostbite',      weapon: 'Great Sword', skillReq: 70,  attrs: ['Induration'] },
  { name: 'Freezebite',     weapon: 'Great Sword', skillReq: 100, attrs: ['Induration', 'Distortion'] },
  { name: 'Shockwave',      weapon: 'Great Sword', skillReq: 150, attrs: ['Reverberation'] },
  { name: 'Crescent Moon',  weapon: 'Great Sword', skillReq: 175, attrs: ['Scission', 'Compression'] },
  { name: 'Sickle Moon',    weapon: 'Great Sword', skillReq: 200, attrs: ['Scission', 'Reverberation'] },
  { name: 'Spinning Slash', weapon: 'Great Sword', skillReq: 225, attrs: ['Gravitation'] },
  { name: 'Ground Strike',  weapon: 'Great Sword', skillReq: 250, questLevel: 71, attrs: ['Gravitation'] },

  // ── Axe ──────────────────────────────────────────────────────────────────────
  { name: 'Raging Axe',    weapon: 'Axe', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Smash Axe',     weapon: 'Axe', skillReq: 40,  attrs: ['Scission'] },
  { name: 'Gale Axe',      weapon: 'Axe', skillReq: 70,  attrs: ['Detonation'] },
  { name: 'Avalanche Axe', weapon: 'Axe', skillReq: 100, attrs: ['Induration'] },          // HorizonXI: primary changed from Scission
  { name: 'Spinning Axe',  weapon: 'Axe', skillReq: 150, attrs: ['Liquefaction', 'Scission'] },
  { name: 'Rampage',       weapon: 'Axe', skillReq: 175, attrs: ['Scission', 'Detonation'] },
  { name: 'Calamity',      weapon: 'Axe', skillReq: 200, attrs: ['Detonation', 'Gravitation'] },
  { name: 'Mistral Axe',   weapon: 'Axe', skillReq: 225, attrs: ['Fragmentation'] },
  { name: 'Decimation',    weapon: 'Axe', skillReq: 240, questLevel: 71, attrs: ['Fusion', 'Detonation'] }, // HorizonXI: secondary changed from Reverberation

  // ── Great Axe ────────────────────────────────────────────────────────────────
  { name: 'Shield Break',  weapon: 'Great Axe', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Iron Tempest',  weapon: 'Great Axe', skillReq: 40,  attrs: ['Scission'] },
  { name: 'Sturmwind',     weapon: 'Great Axe', skillReq: 70,  attrs: ['Scission', 'Reverberation'] },
  { name: 'Armor Break',   weapon: 'Great Axe', skillReq: 100, attrs: ['Impaction'] },
  { name: 'Keen Edge',     weapon: 'Great Axe', skillReq: 150, attrs: ['Compression'] },
  { name: 'Weapon Break',  weapon: 'Great Axe', skillReq: 175, attrs: ['Impaction'] },
  { name: 'Raging Rush',   weapon: 'Great Axe', skillReq: 200, attrs: ['Induration', 'Reverberation'] },
  { name: 'Full Break',    weapon: 'Great Axe', skillReq: 225, attrs: ['Distortion'] },
  { name: 'Steel Cyclone', weapon: 'Great Axe', skillReq: 240, questLevel: 71, attrs: ['Distortion', 'Detonation'] },

  // ── Scythe ───────────────────────────────────────────────────────────────────
  { name: 'Slice',            weapon: 'Scythe', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Dark Harvest',     weapon: 'Scythe', skillReq: 30,  attrs: ['Scission'] },
  { name: 'Shadow of Death',  weapon: 'Scythe', skillReq: 70,  attrs: ['Compression'] },
  { name: 'Nightmare Scythe', weapon: 'Scythe', skillReq: 100, attrs: ['Compression'] },
  { name: 'Spinning Scythe',  weapon: 'Scythe', skillReq: 125, attrs: ['Scission', 'Reverberation'] },
  { name: 'Vorpal Scythe',    weapon: 'Scythe', skillReq: 150, attrs: ['Scission'] },
  { name: 'Guillotine',       weapon: 'Scythe', skillReq: 200, attrs: ['Scission', 'Gravitation'] },
  { name: 'Cross Reaper',     weapon: 'Scythe', skillReq: 225, attrs: ['Scission'] },
  { name: 'Spiral Hell',      weapon: 'Scythe', skillReq: 240, questLevel: 71, attrs: ['Gravitation', 'Compression'] },

  // ── Polearm ──────────────────────────────────────────────────────────────────
  { name: 'Double Thrust',   weapon: 'Polearm', skillReq: 5,   attrs: ['Impaction'] },
  { name: 'Thunder Thrust',  weapon: 'Polearm', skillReq: 30,  attrs: ['Impaction'] },
  { name: 'Raiden Thrust',   weapon: 'Polearm', skillReq: 70,  attrs: ['Impaction', 'Fragmentation'] },
  { name: 'Leg Sweep',       weapon: 'Polearm', skillReq: 100, attrs: ['Scission'] },
  { name: 'Penta Thrust',    weapon: 'Polearm', skillReq: 150, attrs: ['Fusion', 'Transfixion'] },
  { name: 'Vorpal Thrust',   weapon: 'Polearm', skillReq: 175, attrs: ['Reverberation', 'Transfixion'] },
  { name: 'Skewer',          weapon: 'Polearm', skillReq: 200, attrs: ['Transfixion', 'Induration'] },
  { name: 'Wheeling Thrust', weapon: 'Polearm', skillReq: 225, attrs: ['Fusion', 'Gravitation'] },
  { name: 'Impulse Drive',   weapon: 'Polearm', skillReq: 240, questLevel: 71, attrs: ['Impaction', 'Transfixion'] },

  // ── Katana ───────────────────────────────────────────────────────────────────
  { name: 'Blade: Rin',  weapon: 'Katana', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Blade: Retsu',weapon: 'Katana', skillReq: 30,  attrs: ['Scission', 'Detonation'] },
  { name: 'Blade: Teki', weapon: 'Katana', skillReq: 70,  attrs: ['Reverberation'] },
  { name: 'Blade: To',   weapon: 'Katana', skillReq: 100, attrs: ['Impaction'] },
  { name: 'Blade: Chi',  weapon: 'Katana', skillReq: 150, attrs: ['Scission', 'Reverberation'] },
  { name: 'Blade: Ei',   weapon: 'Katana', skillReq: 175, attrs: ['Impaction'] },
  { name: 'Blade: Jin',  weapon: 'Katana', skillReq: 200, attrs: ['Impaction', 'Detonation'] },
  { name: 'Blade: Ten',  weapon: 'Katana', skillReq: 225, attrs: ['Gravitation'] },
  { name: 'Blade: Ku',   weapon: 'Katana', skillReq: 250, questLevel: 71, attrs: ['Fragmentation'] },

  // ── Great Katana ─────────────────────────────────────────────────────────────
  { name: 'Tachi: Enpi',     weapon: 'Great Katana', skillReq: 5,   attrs: ['Impaction'] },
  { name: 'Tachi: Hobaku',   weapon: 'Great Katana', skillReq: 30,  attrs: ['Reverberation'] },
  { name: 'Tachi: Goten',    weapon: 'Great Katana', skillReq: 70,  attrs: ['Impaction', 'Transfixion'] },
  { name: 'Tachi: Kagero',   weapon: 'Great Katana', skillReq: 100, attrs: ['Detonation'] },
  { name: 'Tachi: Jinpu',    weapon: 'Great Katana', skillReq: 150, attrs: ['Detonation', 'Fragmentation'] },
  { name: 'Tachi: Koki',     weapon: 'Great Katana', skillReq: 175, attrs: ['Transfixion'] },
  { name: 'Tachi: Yukikaze', weapon: 'Great Katana', skillReq: 200, attrs: ['Distortion', 'Scission'] },
  { name: 'Tachi: Gekko',    weapon: 'Great Katana', skillReq: 225, attrs: ['Distortion', 'Reverberation'] },
  { name: 'Tachi: Kasha',    weapon: 'Great Katana', skillReq: 250, questLevel: 71, attrs: ['Fusion', 'Scission'] },

  // ── Club ─────────────────────────────────────────────────────────────────────
  // HorizonXI reordered Starlight (retail 5→HX 40) and Seraph Strike (retail 40→HX 100)
  { name: 'Shining Strike', weapon: 'Club', skillReq: 5,   attrs: ['Impaction'] },
  { name: 'Starlight',      weapon: 'Club', skillReq: 40,  attrs: ['Reverberation'] },
  { name: 'Brainshaker',    weapon: 'Club', skillReq: 70,  attrs: ['Reverberation'] },
  { name: 'Seraph Strike',  weapon: 'Club', skillReq: 100, attrs: ['Impaction', 'Transfixion'] },
  { name: 'Moonlight',      weapon: 'Club', skillReq: 125, attrs: ['Reverberation'] },
  { name: 'Skullbreaker',   weapon: 'Club', skillReq: 150, attrs: ['Reverberation'] },
  { name: 'True Strike',    weapon: 'Club', skillReq: 175, attrs: ['Impaction'] },
  { name: 'Judgment',       weapon: 'Club', skillReq: 200, attrs: ['Fusion', 'Transfixion'] },
  { name: 'Hexa Strike',    weapon: 'Club', skillReq: 220, attrs: ['Transfixion'] },
  { name: 'Black Halo',     weapon: 'Club', skillReq: 230, questLevel: 71, attrs: ['Gravitation', 'Compression'] },

  // ── Staff ────────────────────────────────────────────────────────────────────
  { name: 'Heavy Swing',   weapon: 'Staff', skillReq: 5,   attrs: ['Scission'] },
  { name: 'Rock Crusher',  weapon: 'Staff', skillReq: 40,  attrs: ['Scission', 'Reverberation'] },
  { name: 'Earth Crusher', weapon: 'Staff', skillReq: 70,  attrs: ['Scission', 'Reverberation'] },
  { name: 'Starburst',     weapon: 'Staff', skillReq: 100, attrs: ['Impaction', 'Detonation'] },
  { name: 'Sunburst',      weapon: 'Staff', skillReq: 150, attrs: ['Transfixion', 'Detonation'] },
  { name: 'Shell Crusher', weapon: 'Staff', skillReq: 175, attrs: ['Scission'] },
  { name: 'Full Swing',    weapon: 'Staff', skillReq: 200, attrs: ['Scission', 'Transfixion'] },
  { name: 'Spirit Taker',  weapon: 'Staff', skillReq: 215, attrs: [] },  // No SC alignment per wiki
  { name: 'Retribution',   weapon: 'Staff', skillReq: 230, questLevel: 71, attrs: ['Compression', 'Fusion'] },

  // ── Archery ──────────────────────────────────────────────────────────────────
  { name: 'Flaming Arrow',  weapon: 'Archery', skillReq: 5,   attrs: ['Liquefaction', 'Transfixion'] },
  { name: 'Piercing Arrow', weapon: 'Archery', skillReq: 40,  attrs: ['Induration', 'Transfixion'] },  // HorizonXI: primary changed from Reverberation
  { name: 'Dulling Arrow',  weapon: 'Archery', skillReq: 80,  attrs: ['Liquefaction', 'Transfixion'] },
  { name: 'Sidewinder',     weapon: 'Archery', skillReq: 175, attrs: ['Reverberation', 'Transfixion', 'Detonation'] },
  { name: 'Blast Arrow',    weapon: 'Archery', skillReq: 200, attrs: ['Induration', 'Transfixion'] },
  { name: 'Arching Arrow',  weapon: 'Archery', skillReq: 225, attrs: ['Fusion'] },
  { name: 'Empyreal Arrow', weapon: 'Archery', skillReq: 250, questLevel: 71, attrs: ['Fusion', 'Transfixion'] },

  // ── Marksmanship ─────────────────────────────────────────────────────────────
  { name: 'Hot Shot',    weapon: 'Marksmanship', skillReq: 5,   attrs: ['Liquefaction', 'Transfixion'] },
  { name: 'Split Shot',  weapon: 'Marksmanship', skillReq: 40,  attrs: ['Reverberation', 'Transfixion'] },
  { name: 'Sniper Shot', weapon: 'Marksmanship', skillReq: 80,  attrs: ['Liquefaction', 'Transfixion'] },
  { name: 'Slug Shot',   weapon: 'Marksmanship', skillReq: 175, attrs: ['Reverberation', 'Transfixion', 'Detonation'] },
  { name: 'Blast Shot',  weapon: 'Marksmanship', skillReq: 200, attrs: ['Induration', 'Transfixion'] },
  { name: 'Heavy Shot',  weapon: 'Marksmanship', skillReq: 225, attrs: ['Fusion'] },
  { name: 'Detonator',   weapon: 'Marksmanship', skillReq: 250, questLevel: 71, attrs: ['Fusion', 'Transfixion'] },
]
