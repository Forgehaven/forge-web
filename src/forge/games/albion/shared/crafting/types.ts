// forge-api contract types for the Albion crafting tools. All ride albionFetch's
// { status, message, payload } envelope; field naming is snake_case to match the backend.

// GET /game/albion/items?limit=0  → payload: AlbionItem[] (every tradeable item).
export interface AlbionItem {
  id: string   // Albion UniqueName - also the icon CDN id: "T4_BAG", "T4_MAIN_SWORD@1"
  name: string // localized English name
}

// GET /game/albion/recipes/{ids}  → payload: RecipeNode[].
// Recursive bill of materials down to raw resources, enchant-aware: an @n item's materials are
// the _LEVELn@n market variants, and `upgrade` carries the transmute path from the enchant
// level below. `count` is the quantity required as a child ingredient (1 on the root).
export interface RecipeNode {
  item_id: string
  name?: string       // localized display name (annotated by the endpoint)
  count?: number      // quantity when this node is an ingredient of its parent
  craftable: boolean
  recipe: RecipeNode[]
  silver?: number     // flat crafting fee (resource transmutes); absent when 0
  amount?: number     // units produced per craft (batch consumables); absent when 1
  upgrade?: {
    from: RecipeNode  // full tree of the item one enchant level below
    materials: { item_id: string; name?: string; count: number }[] // runes/souls/relics at market
  }
  item_value?: number // optional; for station-fee calc later
  has_quality?: boolean // root only: whether the item supports quality tiers (equippable gear)
}

// One top-level material line in a craft breakdown, with the cheapest acquisition mode chosen.
export interface CraftMaterial {
  id: string
  name: string            // localized name; falls back to the id when unknown
  count: number
  mode: 'buy' | 'craft' | 'upgrade'
  unitCost: number | null // chosen per-unit acquisition cost
  subtotal: number | null // unitCost × count × (1 − returnRate); upgrade mats skip the rate
}

// Production-cost analysis for one item: cheapest path plus the two reference strategies.
export interface CraftAnalysis {
  optimal: number | null   // min over every buy-vs-craft-vs-upgrade choice in the tree
  fullBuy: number | null   // craft the item, buy ALL direct materials at market
  fullCraft: number | null // refine every craftable material from raw
  materials: CraftMaterial[]     // top-level breakdown under the optimal path
  baseMaterials: CraftMaterial[] // top-level materials all bought at market (fullBuy's breakdown)
  shopping: { id: string; name: string; count: number; unitCost: number | null }[]
  // ^ aggregated market buys along the optimal path (per finished unit)
  shoppingSilver: number   // flat crafting fees accumulated along the optimal path
  silver: number           // flat crafting fee on the item's own recipe
  amount: number           // units produced per craft
  stationFee: number       // flat station usage fee (Craft Settings) folded into the costs
}

