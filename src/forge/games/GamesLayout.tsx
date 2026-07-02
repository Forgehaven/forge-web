import { Routes, Route } from 'react-router-dom'
import { ForgeLayout } from '../../components/ForgeLayout'
import { GamesBottomBar } from './GamesBottomBar'
import { NotFound } from '../../components/NotFound'
import { GamesSidebar } from './GamesSidebar'
import { GamesSettings } from './GamesSettings'
import { GamesHome } from './GamesHome'
import { FFxiSplash } from './ffxi/FFxiSplash'
import { SkillchainCalc } from './ffxi/SkillchainCalc'
import { ClammingTracker } from './ffxi/ClammingTracker'
import { QuestTracker } from './ffxi/QuestTracker'
import { SpellTracker } from './ffxi/SpellTracker'
import { KeyItemTracker } from './ffxi/KeyItemTracker'
import { TeleportCost } from './ffxi/TeleportCost'
import { FriendViewer } from './ffxi/FriendViewer'
import { AlbionSplash } from './albion/AlbionSplash'
import { MarketManager } from './albion/MarketManager'
import { GoldPricePage } from './albion/MarketManager/Gold/GoldPricePage'
import { ItemIndexPage } from './albion/MarketManager/ItemIndex/ItemIndexPage'
import { GuildDataPage } from './albion/MarketManager/GuildData/GuildDataPage'
import { FavouritesPage } from './albion/MarketManager/FavouritesPage'
import { BestValuePage } from './albion/MarketManager/BestValuePage'
import { CraftSettingsPage } from './albion/MarketManager/CraftSettingsPage'
import { XCityArbitragePage } from './albion/MarketManager/MarketFixing/XCityArbitragePage'
import { VelocityFlipPage } from './albion/MarketManager/MarketFixing/VelocityFlipPage'
import { RouteRiskRewardPage } from './albion/MarketManager/MarketFixing/RouteRiskRewardPage'
import { BMVolumePredictPage } from './albion/MarketManager/MarketFixing/BMVolumePredictPage'
import { CategoryPage } from './albion/MarketManager/CategoryPage'
import { ItemDetailPage } from './albion/MarketManager/ItemDetail/ItemDetailPage'
import { ComparePage } from './albion/MarketManager/ItemDetail/ComparePage'
import { MARKET_CATEGORIES } from './albion/MarketManager/marketCategories'
import { LayoutOverrideProvider } from '../../components/LayoutOverride'

export default function GamesLayout() {
  return (
      <LayoutOverrideProvider>
      <Routes>
        <Route element={
          <ForgeLayout
            title="Games"
            homePath="/games"
            sidebar={GamesSidebar}
            settings={GamesSettings}
            bottomBar={GamesBottomBar}
          />
        }>
          <Route index element={<GamesHome />} />
          <Route path="ffxi" element={<FFxiSplash />} />
          <Route path="ffxi/skillchain-calc" element={<SkillchainCalc />} />
          <Route path="ffxi/quest-tracker" element={<QuestTracker />} />
          <Route path="ffxi/clamming-tracker" element={<ClammingTracker />} />
          <Route path="ffxi/spell-tracker" element={<SpellTracker />} />
          <Route path="ffxi/key-item-tracker" element={<KeyItemTracker />} />
          <Route path="ffxi/teleport-cost" element={<TeleportCost />} />
          <Route path="ffxi/friend-viewer" element={<FriendViewer />} />
          <Route path="albion" element={<AlbionSplash />} />
          <Route path="albion/market-manager" element={<MarketManager />} />
          <Route path="albion/market-manager/gold" element={<GoldPricePage />} />
          <Route path="albion/market-manager/item-index" element={<ItemIndexPage />} />
          <Route path="albion/market-manager/guild-data" element={<GuildDataPage />} />
          <Route path="albion/market-manager/favourites" element={<FavouritesPage />} />
          <Route path="albion/market-manager/best-value" element={<BestValuePage />} />
          <Route path="albion/market-manager/craft-settings" element={<CraftSettingsPage />} />
          <Route path="albion/market-manager/market-fixing/x-city-arbitrage" element={<XCityArbitragePage />} />
          <Route path="albion/market-manager/market-fixing/velocity-flip" element={<VelocityFlipPage />} />
          <Route path="albion/market-manager/market-fixing/route-risk-reward" element={<RouteRiskRewardPage />} />
          <Route path="albion/market-manager/market-fixing/bm-volume-predict" element={<BMVolumePredictPage />} />
          <Route path="albion/market-manager/item/:itemId" element={<ItemDetailPage />} />
          <Route path="albion/market-manager/compare" element={<ComparePage />} />
          {MARKET_CATEGORIES.map(c => (
            <Route
              key={c.slug}
              path={`albion/market-manager/${c.slug}`}
              element={<CategoryPage slug={c.slug} />}
            />
          ))}
          <Route path="*" element={<NotFound backTo="/games" backLabel="Back to games" />} />
        </Route>
      </Routes>
      </LayoutOverrideProvider>
  )
}
