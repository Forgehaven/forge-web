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
import { VanaTimers } from './ffxi/VanaTimers'
import { AlbionSplash } from './albion/Splash/AlbionSplash'
import { ItemIndexPage } from './albion/ItemIndex/ItemIndexPage'
import { ItemDetailPage } from './albion/ItemDetail/ItemDetailPage'
import { FavouritesPage } from './albion/Favourites/FavouritesPage'
import { GoldPricePage } from './albion/Gold/GoldPricePage'
import { LayoutOverrideProvider } from '../../components/LayoutOverride'
import { useAlbionUserSync } from './albion/shared/settings/sync'

function AlbionUserSync() {
  useAlbionUserSync()
  return null
}

export default function GamesLayout() {
  return (
      <LayoutOverrideProvider>
      <AlbionUserSync />
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
          <Route path="ffxi/vana-timers" element={<VanaTimers />} />
          <Route path="albion" element={<AlbionSplash />} />
          <Route path="albion/item-index" element={<ItemIndexPage />} />
          <Route path="albion/item/:itemId" element={<ItemDetailPage />} />
          <Route path="albion/favourites" element={<FavouritesPage />} />
          <Route path="albion/gold" element={<GoldPricePage />} />
          <Route path="*" element={<NotFound backTo="/games" backLabel="Back to games" />} />
        </Route>
      </Routes>
      </LayoutOverrideProvider>
  )
}
