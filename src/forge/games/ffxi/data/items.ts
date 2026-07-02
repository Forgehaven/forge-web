export type ClammingItemDef = {
  id: string
  name: string
  vendorPrice: number
  stackSize: number            // 0 = not stackable on AH

  // Override auto-calculation when set. Leave undefined to use fee math.
  // 'ah_single' - sell one at a time on AH
  // 'ah_stack'  - sell full stacks on AH
  // 'vendor'    - sell to NPC vendor (typically low AH throughput)
  devRecommended?: 'ah_single' | 'ah_stack' | 'vendor'
}

// AH prices are user-entered (per character when logged in) - there are no
// baked-in defaults. devRecommended is only set when it should OVERRIDE the
// fee math (e.g. AH technically wins but the item moves too slowly to bother).
export const ITEMS: ClammingItemDef[] = [
  { id: 'nebimonite',        name: 'Nebimonite',                vendorPrice: 53,    stackSize: 12 },
  { id: 'shall-shell',       name: 'Shall Shell',               vendorPrice: 300,   stackSize: 12 },
  { id: 'titanictus-shell',  name: 'Titanictus Shell',          vendorPrice: 350,   stackSize: 12 },
  { id: 'coral-fragment',    name: 'Coral Fragment',            vendorPrice: 1750,  stackSize: 12 },
  { id: 'elm-log',           name: 'Elm Log',                   vendorPrice: 384,   stackSize: 12 },
  { id: 'lacquer-tree-log',  name: 'Lacquer Tree Log',          vendorPrice: 3500,  stackSize: 12 },
  { id: 'petrified-log',     name: 'Petrified Log',             vendorPrice: 2193,  stackSize: 12 },
  { id: 'bibiki-slug',       name: 'Bibiki Slug',               vendorPrice: 10,    stackSize: 12 },
  { id: 'bibiki-urchin',     name: 'Bibiki Urchin',             vendorPrice: 750,   stackSize: 12 },
  { id: 'crab-shell',        name: 'Crab Shell',                vendorPrice: 383,   stackSize: 12 },
  { id: 'fish-scales',       name: 'Fish Scales',               vendorPrice: 23,    stackSize: 12 },
  { id: 'hq-crab-shell',     name: 'High-Quality Crab Shell',   vendorPrice: 3325,  stackSize: 12 },
  { id: 'hq-pugil-scales',   name: 'High-Quality Pugil Scales', vendorPrice: 260,   stackSize: 12, devRecommended: 'vendor' },
  { id: 'hobgoblin-bread',   name: 'Hobgoblin Bread',           vendorPrice: 91,    stackSize: 12 },
  { id: 'hobgoblin-pie',     name: 'Hobgoblin Pie',             vendorPrice: 150,   stackSize: 12 },
  { id: 'jacknife',          name: 'Jacknife',                  vendorPrice: 53,    stackSize: 12 },
  { id: 'maple-log',         name: 'Maple Log',                 vendorPrice: 15,    stackSize: 12 },
  { id: 'oxblood',           name: 'Oxblood',                   vendorPrice: 13250, stackSize: 12, devRecommended: 'vendor' },
  { id: 'pamtam-kelp',       name: 'Pamtam Kelp',               vendorPrice: 8,     stackSize: 12 },
  { id: 'pebble',            name: 'Pebble',                    vendorPrice: 1,     stackSize: 99 },
  { id: 'pugil-scales',      name: 'Pugil Scales',              vendorPrice: 23,    stackSize: 12 },
  { id: 'seashell',          name: 'Seashell',                  vendorPrice: 30,    stackSize: 12 },
  { id: 'tropical-clam',     name: 'Tropical Clam',             vendorPrice: 5100,  stackSize: 12 },
  { id: 'turtle-shell',      name: 'Turtle Shell',              vendorPrice: 1190,  stackSize: 12, devRecommended: 'vendor' },
  { id: 'uragnite-shell',    name: 'Uragnite Shell',            vendorPrice: 1500,  stackSize: 12 },
  { id: 'vongola-clam',      name: 'Vongola Clam',              vendorPrice: 192,   stackSize: 12 },
  { id: 'white-sand',        name: 'White Sand',                vendorPrice: 258,   stackSize: 12 },
]
