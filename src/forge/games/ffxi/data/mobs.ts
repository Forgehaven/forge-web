// HorizonXI mob damage modifier profiles
// Values are fractional change from baseline: +0.5 = mob takes 50% more damage (weak),
// -0.5 = mob takes 50% less damage (resistant), -1.0 = immune/absorbed, +1.0 = double damage.
// Physical type modifiers are ±0.125 on HorizonXI (reduced from retail's ±0.25).
// Omitted types default to 0 (neutral). Sources: horizonffxi.wiki

import type { DamageType, ResistanceMap, ResistanceState } from './elements'

export type DamageModifiers = Partial<Record<DamageType, number>>

export interface Mob {
  name: string
  category: string
  modifiers: DamageModifiers
}

// Positive = weak (takes extra damage), negative = resistant (takes reduced damage)
export function toResistanceMap(modifiers: DamageModifiers): ResistanceMap {
  const result: ResistanceMap = {}
  for (const [type, mod] of Object.entries(modifiers) as [DamageType, number][]) {
    const state: ResistanceState = mod > 0 ? 'weak' : mod < 0 ? 'resistant' : 'neutral'
    if (state !== 'neutral') result[type] = state
  }
  return result
}

export const MOBS: Mob[] = [
  // --- Elemental ---
  // FFXI element cycle: Fire > Ice > Wind > Earth > Lightning > Water > Fire
  // Each elemental absorbs its own element (-1.0) and takes double damage from its counter (+1.0).
  { name: 'Fire Elemental',      category: 'Elemental', modifiers: { Fire: -1.0, Water: +1.0 } },
  { name: 'Ice Elemental',       category: 'Elemental', modifiers: { Ice: -1.0,  Fire: +1.0  } },
  { name: 'Wind Elemental',      category: 'Elemental', modifiers: { Wind: -1.0, Ice: +1.0   } },
  { name: 'Earth Elemental',     category: 'Elemental', modifiers: { Earth: -1.0, Wind: +1.0  } },
  { name: 'Lightning Elemental', category: 'Elemental', modifiers: { Lightning: -1.0, Earth: +1.0 } },
  { name: 'Water Elemental',     category: 'Elemental', modifiers: { Water: -1.0, Lightning: +1.0 } },
  { name: 'Light Elemental',     category: 'Elemental', modifiers: { Light: -1.0, Dark: +1.0  } },
  { name: 'Dark Elemental',      category: 'Elemental', modifiers: { Dark: -1.0,  Light: +1.0 } },

  // --- Undead ---
  { name: 'Skeleton', category: 'Undead', modifiers: { Fire: +0.5, Light: +0.5, Ice: -0.5, Dark: -0.5, Blunt: +0.125, Slashing: -0.125 } },
  { name: 'Zombie',   category: 'Undead', modifiers: { Fire: +0.5, Light: +0.5, Ice: -0.5, Dark: -0.5, Blunt: +0.125 } },
  { name: 'Fomor',    category: 'Undead', modifiers: { Fire: +0.5, Light: +0.5, Ice: -0.5, Dark: -0.5 } },
  { name: 'Ghost',    category: 'Undead', modifiers: { Fire: +0.5, Light: +0.5, Dark: -0.5 } },
  { name: 'Corse',    category: 'Undead', modifiers: { Light: +0.5, Dark: -1.0 } },
  { name: 'Shadow',   category: 'Undead', modifiers: { Fire: +0.5, Light: +0.5 } },

  // --- Amorph ---
  { name: 'Leech',    category: 'Amorph', modifiers: { Light: +0.5 } },
  { name: 'Ooze',     category: 'Amorph', modifiers: { Fire: +0.5, Water: -0.5 } },
  { name: 'Worm',     category: 'Amorph', modifiers: { Earth: -0.5 } },
  { name: 'Slime',    category: 'Amorph', modifiers: { Fire: +0.5, Water: -0.5, Slashing: -0.5, Piercing: -0.5, Blunt: -0.75 } },
  { name: 'Toad',     category: 'Amorph', modifiers: { Ice: +0.5, Lightning: +0.5, Water: -0.5, Light: -1.0 } },

  // --- Arcana ---
  { name: 'Golem',    category: 'Arcana', modifiers: { Lightning: +0.5 } },
  { name: 'Doll',     category: 'Arcana', modifiers: { Lightning: +0.5 } },
  { name: 'Cluster',  category: 'Arcana', modifiers: { Fire: +0.5 } },

  // --- Vermin ---
  { name: 'Beetle',   category: 'Vermin', modifiers: { Ice: +0.5, Light: +0.5 } },
  { name: 'Bee',      category: 'Vermin', modifiers: { Ice: +0.5, Piercing: +0.125 } },
  { name: 'Fly',      category: 'Vermin', modifiers: { Ice: +0.5, Piercing: +0.125 } },
  { name: 'Spider',   category: 'Vermin', modifiers: { Ice: +0.5 } },
  { name: 'Crawler',  category: 'Vermin', modifiers: { Dark: +0.5 } },
  { name: 'Scorpion', category: 'Vermin', modifiers: { Ice: +0.5, Light: +0.5 } },
  { name: 'Antlion',  category: 'Vermin', modifiers: { Wind: +0.5, Light: +0.5, Earth: -0.5, Dark: -0.5 } },
  { name: 'Diremite', category: 'Vermin', modifiers: { Water: +0.5 } },

  // --- Plantoid ---
  { name: 'Mandragora',  category: 'Plantoid', modifiers: { Fire: +0.5, Dark: +0.5, Ice: +0.5, Lightning: +0.5, Wind: +0.5 } },
  { name: 'Funguar',     category: 'Plantoid', modifiers: { Light: +0.5, Slashing: +0.125, Dark: -0.5, Water: -0.5 } },
  { name: 'Treant',      category: 'Plantoid', modifiers: { Fire: +0.5, Dark: +0.5 } },
  { name: 'Morbol',      category: 'Plantoid', modifiers: { Fire: +0.5, Water: -0.5 } },
  { name: 'Sabotender',  category: 'Plantoid', modifiers: { Dark: +0.5, Ice: +0.5, Lightning: +0.5, Water: -1.0 } },

  // --- Beast ---
  { name: 'Hound',     category: 'Beast', modifiers: { Fire: +0.5, Light: +0.5, Ice: -0.5, Dark: -0.5, Slashing: -0.125 } },
  { name: 'Tiger',     category: 'Beast', modifiers: { Fire: +0.5, Lightning: +0.5, Ice: -0.5 } },
  { name: 'Coeurl',    category: 'Beast', modifiers: { Earth: +0.5, Lightning: -1.0 } },
  { name: 'Rabbit',    category: 'Beast', modifiers: { Water: +0.5, Dark: +0.5, Lightning: +0.5 } },
  { name: 'Dhalmel',   category: 'Beast', modifiers: { Wind: +0.5, Lightning: +0.5 } },
  { name: 'Buffalo',   category: 'Beast', modifiers: { Water: +0.5 } },
  { name: 'Goobbue',   category: 'Beast', modifiers: { Fire: +0.5, Dark: +0.5 } },
  { name: 'Opo-opo',   category: 'Beast', modifiers: { Ice: +0.5 } },
  { name: 'Sheep',     category: 'Beast', modifiers: {} },
  { name: 'Ram',       category: 'Beast', modifiers: { Ice: -0.5 } },

  // --- Bird ---
  { name: 'Bird',        category: 'Bird', modifiers: { Ice: +0.5, Piercing: +0.125 } },
  { name: 'Colibri',     category: 'Bird', modifiers: { Ice: +0.5, Piercing: +0.125 } },
  { name: 'Cockatrice',  category: 'Bird', modifiers: { Ice: +0.5 } },
  { name: 'Raptor',      category: 'Bird', modifiers: { Ice: +0.5 } },
  { name: 'Hippogryph',  category: 'Bird', modifiers: { Ice: +0.5 } },
  { name: 'Bat',         category: 'Bird', modifiers: { Light: +0.5, Wind: +0.5, Piercing: +0.125, Dark: -0.5 } },

  // --- Lizard ---
  { name: 'Lizard',  category: 'Lizard', modifiers: { Ice: +0.5, Wind: +0.5 } },
  { name: 'Bugard',  category: 'Lizard', modifiers: { Ice: +0.5 } },
  { name: 'Eft',     category: 'Lizard', modifiers: { Ice: +0.5 } },
  { name: 'Peiste',  category: 'Lizard', modifiers: { Ice: +0.5 } },
  { name: 'Wivre',   category: 'Lizard', modifiers: { Ice: +0.5, Wind: +0.5 } },

  // --- Aquan ---
  { name: 'Pugil',     category: 'Aquan', modifiers: { Ice: +0.5, Lightning: +0.5, Water: -0.5 } },
  { name: 'Crab',      category: 'Aquan', modifiers: { Ice: +0.5, Lightning: +0.5, Blunt: +0.125 } },
  { name: 'Sea Monk',  category: 'Aquan', modifiers: { Ice: +0.5, Lightning: +0.5, Water: -0.5 } },

  // --- Dragon ---
  // Wyrm family (generic): weak to Water and Lightning, resistant to Fire and Ice
  { name: 'Wyrm',       category: 'Dragon', modifiers: { Water: +0.5, Lightning: +0.5, Fire: -0.5, Ice: -0.5 } },
  { name: 'Wyvern',     category: 'Dragon', modifiers: { Dark: +0.5 } },
  { name: 'Fafnir',     category: 'Dragon', modifiers: { Water: +0.5, Lightning: +0.5, Fire: -0.75, Ice: -0.75 } },
  { name: 'Nidhogg',    category: 'Dragon', modifiers: { Water: +0.5, Lightning: +0.5, Fire: -0.75, Ice: -0.75 } },
  { name: 'Tiamat',     category: 'Dragon', modifiers: { Water: +0.5, Lightning: +0.5, Fire: -0.5, Ice: -0.5 } },
  { name: 'Vrtra',      category: 'Dragon', modifiers: { Light: +0.5, Fire: +0.5, Dark: -0.5 } },
  { name: 'Jormungand', category: 'Dragon', modifiers: { Fire: +0.5, Ice: -0.5 } },

  // --- Humanoid (Beastmen) ---
  { name: 'Orc',       category: 'Humanoid', modifiers: { Water: +0.5 } },
  { name: 'Yagudo',    category: 'Humanoid', modifiers: { Ice: +0.5 } },
  { name: 'Quadav',    category: 'Humanoid', modifiers: { Lightning: +0.5, Water: -0.5 } },
  { name: 'Goblin',    category: 'Humanoid', modifiers: { Light: +0.5 } },
  { name: 'Sahagin',   category: 'Humanoid', modifiers: { Lightning: +0.5, Water: -0.5 } },
  { name: 'Gigas',     category: 'Humanoid', modifiers: { Earth: +0.5, Ice: -0.5, Lightning: -0.5 } },
  { name: 'Tonberry',  category: 'Humanoid', modifiers: { Ice: +0.5, Light: -0.5 } },
  { name: 'Mamool Ja', category: 'Humanoid', modifiers: { Ice: +0.5, Wind: -0.5, Light: -0.5 } },
  { name: 'Qiqirn',    category: 'Humanoid', modifiers: { Wind: +0.5 } },

  // --- Demon ---
  { name: 'Demon',    category: 'Demon', modifiers: { Light: +0.5, Dark: -0.5 } },
  { name: 'Ahriman',  category: 'Demon', modifiers: { Light: +0.5 } },
  { name: 'Diabolos', category: 'Demon', modifiers: { Light: +0.5, Dark: -0.5 } },
  { name: 'Imp',      category: 'Demon', modifiers: { Light: +0.5, Dark: -0.5, Piercing: +0.125 } },

  // --- Sky Gods ---
  { name: 'Byakko', category: 'Sky Gods', modifiers: { Dark: +0.5 } },
  { name: 'Suzaku', category: 'Sky Gods', modifiers: { Water: +0.5, Ice: -0.5, Fire: -0.5 } },
  { name: 'Seiryu', category: 'Sky Gods', modifiers: { Ice: +0.5, Fire: -0.5, Wind: -0.5 } },
  { name: 'Genbu',  category: 'Sky Gods', modifiers: { Lightning: +0.5, Earth: -0.5, Water: -0.5 } },
  { name: 'Kirin',  category: 'Sky Gods', modifiers: { Wind: +0.5 } },

  // --- HNM ---
  { name: 'Behemoth',      category: 'HNM', modifiers: {} },
  { name: 'King Behemoth', category: 'HNM', modifiers: {} },
  { name: 'Adamantoise',   category: 'HNM', modifiers: { Ice: +0.5 } },
  { name: 'Aspidochelone', category: 'HNM', modifiers: { Ice: +0.5, Earth: -0.5 } },
  { name: 'Roc',           category: 'HNM', modifiers: { Ice: +0.5, Piercing: +0.125 } },
  { name: 'Serket',        category: 'HNM', modifiers: { Ice: +0.5, Light: +0.5, Earth: -0.5 } },

  // --- Dynamis ---
  { name: 'Dynamis Lord', category: 'Dynamis', modifiers: { Light: +0.5 } },
  { name: 'Shadow Lord',  category: 'Dynamis', modifiers: { Light: +0.5 } },
]

export const MOB_CATEGORIES = [
  'Elemental', 'Undead', 'Amorph', 'Arcana', 'Vermin', 'Plantoid',
  'Beast', 'Bird', 'Lizard', 'Aquan', 'Dragon', 'Humanoid', 'Demon',
  'Sky Gods', 'HNM', 'Dynamis',
] as const
