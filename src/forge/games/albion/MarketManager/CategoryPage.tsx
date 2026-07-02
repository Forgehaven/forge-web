import { PlaceholderPage } from './PlaceholderPage'
import { MARKET_CATEGORIES } from './marketCategories'

// One dynamic page for every item-backed category (Ore, Fire Staff, Helm Cloth, …). Replaces
// the 36 near-identical stub files; routes are generated from MARKET_CATEGORIES in GamesLayout.
//
// Today it renders the shared placeholder shell. Once forge-api exposes item categories, swap
// PlaceholderPage for the filtered ItemTable (reuse useItemPrices + buildItemColumns) keyed off
// the slug - a one-file change here.
export function CategoryPage({ slug }: { slug: string }) {
  const label = MARKET_CATEGORIES.find(c => c.slug === slug)?.label ?? slug
  return <PlaceholderPage title={label} />
}
