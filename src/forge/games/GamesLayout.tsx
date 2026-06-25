import { Routes, Route } from 'react-router-dom'
import { ForgeLayout } from '../../components/ForgeLayout'
import { GamesBottomBar } from './GamesBottomBar'
import { NotFound } from '../../components/NotFound'
import { GamesSidebar } from './GamesSidebar'
import { GamesSettings } from './GamesSettings'
import { GamesHome } from './GamesHome'
import { SkillchainCalc } from './ffxi/SkillchainCalc'
import { ClammingTracker } from './ffxi/ClammingTracker'
import { SpellTracker } from './ffxi/SpellTracker'
import { TeleportCost } from './ffxi/TeleportCost'
import { FriendViewer } from './ffxi/FriendViewer'
import { MarketManager } from './albion/MarketManager'
import { AuthProvider } from './albion/useAuth'

export default function GamesLayout() {
  return (
    <AuthProvider>
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
          <Route path="skillchain-calc" element={<SkillchainCalc />} />
          <Route path="clamming-tracker" element={<ClammingTracker />} />
          <Route path="spell-tracker" element={<SpellTracker />} />
          <Route path="teleport-cost" element={<TeleportCost />} />
          <Route path="friend-viewer" element={<FriendViewer />} />
          <Route path="market-manager" element={<MarketManager />} />
          <Route path="*" element={<NotFound backTo="/games" backLabel="Back to games" />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
