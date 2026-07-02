// Real forge-api contract for the Albion item search + prices endpoints, plus the planned
// recipe endpoint. All ride albionFetch's { status, message, payload } envelope. Field naming
// is snake_case to match the backend (same convention as GoldStats / ticker).

// GET /game/albion/items?query=  → payload: AlbionItem[]
// No query returns the first 100 items; a query returns up to 50 search matches.
export interface AlbionItem {
  id: string   // Albion UniqueName - also the icon CDN id: "T4_BAG", "T4_MAIN_SWORD@1"
  name: string // localized English name
}

// GET /game/albion/prices/{ids}?locations=&qualities=  → payload: RawItemPrice[]
// One entry per item × city × quality combination.
export interface RawItemPrice {
  item_id: string
  city: string
  quality: number
  sell_price_min: number
  buy_price_max: number
}

// GET /game/albion/items/recipes/{ids}  → payload: RecipeNode[] (one per requested id).
// Recursive bill of materials down to raw resources. `count` is the quantity required as a
// child ingredient (omitted on the root). Non-craftable / raw nodes have an empty recipe.
export interface RecipeNode {
  item_id: string
  count?: number      // quantity when this node is an ingredient of its parent
  craftable: boolean
  recipe: RecipeNode[]
  item_value?: number // optional; for station-fee calc later
}

// One top-level material line in a craft breakdown, with the cheaper acquisition mode chosen.
export interface CraftMaterial {
  id: string
  count: number
  mode: 'buy' | 'craft'
  unitCost: number | null // chosen per-unit acquisition cost
  subtotal: number | null // unitCost × count × (1 − returnRate)
}

// Craft-cost analysis for one item: cheapest path plus the two reference strategies.
export interface CraftAnalysis {
  optimal: number | null   // min over every buy-vs-craft choice in the tree
  fullBuy: number | null   // craft the item, buy ALL direct materials at market
  fullCraft: number | null // refine every craftable material from raw
  materials: CraftMaterial[] // top-level breakdown under the optimal path
}

// An item enriched with meta derived from its id (tier/enchant), its live price, and (when a
// recipe is available) its craft-cost analysis, for table display.
export interface ItemRow {
  id: string
  name: string
  tier: number    // derived from the id (T4_… → 4)
  enchant: number // derived from the id (…@1 → 1)
  price: RawItemPrice | null
  craft?: CraftAnalysis | null
}
