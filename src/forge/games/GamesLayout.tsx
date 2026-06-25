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
import { SpellTracker } from './ffxi/SpellTracker'
import { TeleportCost } from './ffxi/TeleportCost'
import { FriendViewer } from './ffxi/FriendViewer'
import { AlbionSplash } from './albion/AlbionSplash'
import { MarketManager } from './albion/MarketManager'
import { GuildDataPage } from './albion/MarketManager/GuildDataPage'
import { AuthProvider } from './albion/useAuth'
import { LayoutOverrideProvider } from '../../components/LayoutOverride'

export default function GamesLayout() {
  return (
    <AuthProvider>
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
          <Route path="ffxi/clamming-tracker" element={<ClammingTracker />} />
          <Route path="ffxi/spell-tracker" element={<SpellTracker />} />
          <Route path="ffxi/teleport-cost" element={<TeleportCost />} />
          <Route path="ffxi/friend-viewer" element={<FriendViewer />} />
          <Route path="albion" element={<AlbionSplash />} />
          <Route path="albion/market-manager" element={<MarketManager />} />
          <Route path="albion/market-manager/guild-data" element={<GuildDataPage />} />
          <Route path="*" element={<NotFound backTo="/games" backLabel="Back to games" />} />
        </Route>
      </Routes>
      </LayoutOverrideProvider>
    </AuthProvider>
  )
}
