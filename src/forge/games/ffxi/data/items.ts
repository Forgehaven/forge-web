export type ClammingItemDef = {
  id: string
  name: string
  vendorPrice: number
  defaultAHPrice: number       // 0 = no known single-item AH price
  defaultAHStackPrice: number  // 0 = no known stack AH price
  stackSize: number            // 0 = not stackable on AH

  // Override auto-calculation when set. Leave undefined to use fee math.
  // 'ah_single' — sell one at a time on AH
  // 'ah_stack'  — sell full stacks on AH
  // 'vendor'    — sell to NPC vendor (typically low AH throughput)
  devRecommended?: 'ah_single' | 'ah_stack' | 'vendor'
}

// Update defaultAHPrice / defaultAHStackPrice periodically as server prices shift.
// devRecommended is only set when it should OVERRIDE the fee math
// (e.g. AH technically wins but the item moves too slowly to bother listing).
export const ITEMS: ClammingItemDef[] = [
  { id: 'nebimonite',        name: 'Nebimonite',                vendorPrice: 53,    defaultAHPrice: 300,   defaultAHStackPrice: 2900,   stackSize: 12 },
  { id: 'shall-shell',       name: 'Shall Shell',               vendorPrice: 300,   defaultAHPrice: 833,   defaultAHStackPrice: 10000,  stackSize: 12 },
  { id: 'titanictus-shell',  name: 'Titanictus Shell',          vendorPrice: 350,   defaultAHPrice: 500,   defaultAHStackPrice: 6000,   stackSize: 12 },
  { id: 'coral-fragment',    name: 'Coral Fragment',            vendorPrice: 1750,  defaultAHPrice: 2400,  defaultAHStackPrice: 32000,  stackSize: 12 },
  { id: 'elm-log',           name: 'Elm Log',                   vendorPrice: 384,   defaultAHPrice: 4000,  defaultAHStackPrice: 55000,  stackSize: 12 },
  { id: 'lacquer-tree-log',  name: 'Lacquer Tree Log',          vendorPrice: 3500,  defaultAHPrice: 6000,  defaultAHStackPrice: 80000,  stackSize: 12 },
  { id: 'petrified-log',     name: 'Petrified Log',             vendorPrice: 2193,  defaultAHPrice: 3000,  defaultAHStackPrice: 45000,  stackSize: 12 },
  { id: 'bibiki-slug',       name: 'Bibiki Slug',               vendorPrice: 10,    defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'bibiki-urchin',     name: 'Bibiki Urchin',             vendorPrice: 750,   defaultAHPrice: 500,   defaultAHStackPrice: 8000,   stackSize: 12 },
  { id: 'crab-shell',        name: 'Crab Shell',                vendorPrice: 383,   defaultAHPrice: 300,   defaultAHStackPrice: 4000,   stackSize: 12 },
  { id: 'fish-scales',       name: 'Fish Scales',               vendorPrice: 23,    defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'hq-crab-shell',     name: 'High-Quality Crab Shell',   vendorPrice: 3325,  defaultAHPrice: 3000,  defaultAHStackPrice: 50000,  stackSize: 12 },
  { id: 'hq-pugil-scales',   name: 'High-Quality Pugil Scales', vendorPrice: 260,   defaultAHPrice: 300,   defaultAHStackPrice: 4000,   stackSize: 12, devRecommended: 'vendor' },
  { id: 'hobgoblin-bread',   name: 'Hobgoblin Bread',           vendorPrice: 91,    defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'hobgoblin-pie',     name: 'Hobgoblin Pie',             vendorPrice: 150,   defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'jacknife',          name: 'Jacknife',                  vendorPrice: 53,    defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'maple-log',         name: 'Maple Log',                 vendorPrice: 15,    defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12   },
  { id: 'oxblood',           name: 'Oxblood',                   vendorPrice: 13250, defaultAHPrice: 12000, defaultAHStackPrice: 160000, stackSize: 12, devRecommended: 'vendor' },
  { id: 'pamtam-kelp',       name: 'Pamtam Kelp',               vendorPrice: 8,     defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'pebble',            name: 'Pebble',                    vendorPrice: 1,     defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 99 },
  { id: 'pugil-scales',      name: 'Pugil Scales',              vendorPrice: 23,    defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'seashell',          name: 'Seashell',                  vendorPrice: 30,    defaultAHPrice: 0,     defaultAHStackPrice: 0,      stackSize: 12 },
  { id: 'tropical-clam',     name: 'Tropical Clam',             vendorPrice: 5100,  defaultAHPrice: 5000,  defaultAHStackPrice: 60000,  stackSize: 12 },
  { id: 'turtle-shell',      name: 'Turtle Shell',              vendorPrice: 1190,  defaultAHPrice: 1250,  defaultAHStackPrice: 15000,  stackSize: 12, devRecommended: 'vendor' },
  { id: 'uragnite-shell',    name: 'Uragnite Shell',            vendorPrice: 1500,  defaultAHPrice: 1300,  defaultAHStackPrice: 17000,  stackSize: 12 },
  { id: 'vongola-clam',      name: 'Vongola Clam',              vendorPrice: 192,   defaultAHPrice: 100,   defaultAHStackPrice: 2000,   stackSize: 12 },
  { id: 'white-sand',        name: 'White Sand',                vendorPrice: 258,   defaultAHPrice: 200,   defaultAHStackPrice: 2000,   stackSize: 12 },
]
