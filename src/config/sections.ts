import { MARKET_CATEGORIES } from '../forge/games/albion/MarketManager/marketCategories'

export const SECTION_TITLES: [string, string][] = [
  ['/tools', 'Forge Tools'],
  ['/games/albion/market-manager/gold', 'AOMM - Gold'],
  ['/games/albion/market-manager/item-index', 'AOMM - Item Index'],
  ['/games/albion/market-manager/guild-data', 'AOMM - Guild Data'],
  ['/games/albion/market-manager/favourites', 'AOMM - Favourites'],
  ['/games/albion/market-manager/best-value', 'AOMM - Best Value'],
  ['/games/albion/market-manager/market-fixing/x-city-arbitrage', 'AOMM - X-City Arbitrage'],
  ['/games/albion/market-manager/market-fixing/velocity-flip', 'AOMM - Velocity Flip'],
  ['/games/albion/market-manager/market-fixing/route-risk-reward', 'AOMM - Route Risk/Reward'],
  ['/games/albion/market-manager/market-fixing/bm-volume-predict', 'AOMM - BM Volume Predict'],
  // Generated from the category config - keep before the '/games/albion/market-manager' catch-all
  // below, since the title lookup matches on the first startsWith().
  ...MARKET_CATEGORIES.map(c => [`/games/albion/market-manager/${c.slug}`, `AOMM - ${c.label}`] as [string, string]),
  ['/games/albion/market-manager', 'AOMM'],
  ['/games', 'Forge Games'],
  ['/', 'FORGEHAVEN'],
]
