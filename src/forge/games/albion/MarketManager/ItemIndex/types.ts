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
  timestamp?: string | null // when ADP last observed this price in game
}

// GET /game/albion/recipe/{id}  → payload: RecipeNode.
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

// GET /game/albion/prices/history/{id}?locations=&qualities=&time-scale=  → one series per
// item × location × quality with hourly (time-scale 1) or daily (24) averaged points.
export interface RawHistorySeries {
  item_id: string
  location: string
  quality: number
  data: { timestamp: string; avg_price: number; item_count: number }[]
}

// GET /game/albion/best-value?city=&quality=&tax=&return_rate=&limit=  → server-computed
// top craft-and-resell returns for one city (materials at quality 1, resale at `quality`).
export interface BestValueRow {
  item_id: string
  name: string
  tier: number
  enchant: number
  city: string
  quality: number
  sell_price_min: number
  data_at?: string | null // when ADP last scanned this row's market
  craft_cost_base: number | null
  craft_cost_optimized: number
  profit: number
  return_pct: number
}

export interface BestValuePayload {
  computed_at: string
  data_updated_at?: string | null // newest lake observation the sweep used
  rows: BestValueRow[]
}

// GET/PUT /game/albion/craft-settings - community-shared flat per-station-type usage fees
// (silver) per city. Sales tax is premium-based (4%/8%, a per-user toggle) and return rates
// are fixed bonus-aware constants - both live server-side, not in this blob.
export interface CityCraftSettings {
  station_fees: Record<string, number> // keyed by station type, flat silver per craft
}

export interface CraftSettings {
  cities: Record<string, CityCraftSettings>
}

export interface CraftSettingsPayload {
  settings: CraftSettings
  updated_at: string | null
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
