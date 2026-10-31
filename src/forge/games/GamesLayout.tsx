import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ForgeLayout } from '../../components/ForgeLayout'
import { GamesBottomBar } from './GamesBottomBar'
import { NotFound } from '../../components/NotFound'
import { GamesSidebar } from './GamesSidebar'
import { GamesHome } from './GamesHome'
import { FFxiSplash } from './ffxi/FFxiSplash'
import { SkillchainCalc } from './ffxi/SkillchainCalc/SkillchainCalc'
import { ClammingTracker } from './ffxi/ClammingTracker/ClammingTracker'
import { QuestTracker } from './ffxi/QuestTracker/QuestTracker'
import { SpellTracker } from './ffxi/SpellTracker/SpellTracker'
import { KeyItemTracker } from './ffxi/KeyItemTracker/KeyItemTracker'
import { FactionConquest } from './ffxi/FactionConquest/FactionConquest'
import { FriendViewer } from './ffxi/FriendViewer/FriendViewer'
import { VanaTimers } from './ffxi/VanaTimers/VanaTimers'
import { LockoutTracker } from './ffxi/LockoutTracker/LockoutTracker'
import { InteractiveMap } from './ffxi/InteractiveMap/InteractiveMap'
import { ExpCampsPage } from './ffxi/ExpCamps/ExpCampsPage'
import { AlarmProvider } from '../../components/alarms/AlarmProvider'
import { ffxiAlarmTargets } from './ffxi/alarms'
import { UnderworldSplash } from './underworld/UnderworldSplash'
import { lazyWithReload } from '../../lib/lazyWithReload'
import { GamesSettings } from './GamesSettings'

// Lazy: the Underworld rules data is large and only these pages need it.
const CharacterPlanner = lazyWithReload(() => import('./underworld/CharacterPlanner/CharacterPlanner'))
const RulesCompendium = lazyWithReload(() => import('./underworld/RulesCompendium/RulesCompendium'))
const lazyPage = (Page: React.ComponentType) => <Suspense fallback={null}><Page /></Suspense>

export default function GamesLayout() {
  return (
      <>
      <AlarmProvider sources={{ ffxi: ffxiAlarmTargets }}>
      <Routes>
        <Route element={
          <ForgeLayout
            title="Games"
            homePath="/games"
            sidebar={GamesSidebar}
            bottomBar={GamesBottomBar}
            settings={GamesSettings}
          />
        }>
          <Route index element={<GamesHome />} />
          <Route path="ffxi" element={<FFxiSplash />} />
          <Route path="ffxi/skillchain-calc" element={<SkillchainCalc />} />
          <Route path="ffxi/quest-tracker" element={<QuestTracker />} />
          <Route path="ffxi/clamming-tracker" element={<ClammingTracker />} />
          <Route path="ffxi/spell-tracker" element={<SpellTracker />} />
          <Route path="ffxi/key-item-tracker" element={<KeyItemTracker />} />
          <Route path="ffxi/faction-conquest" element={<FactionConquest />} />
          <Route path="ffxi/teleport-cost" element={<Navigate to="/games/ffxi/faction-conquest" replace />} />
          <Route path="ffxi/friend-viewer" element={<FriendViewer />} />
          <Route path="ffxi/vana-timers" element={<VanaTimers />} />
          <Route path="ffxi/lockouts" element={<LockoutTracker />} />
          <Route path="ffxi/exp-camps" element={<ExpCampsPage />} />
          <Route path="ffxi/map" element={<InteractiveMap />} />
          <Route path="ffxi/map/:zoneId" element={<InteractiveMap />} />
          <Route path="underworld" element={<UnderworldSplash />} />
          <Route path="underworld/planner" element={lazyPage(CharacterPlanner)} />
          <Route path="underworld/compendium" element={lazyPage(RulesCompendium)} />
          <Route path="underworld/reference" element={<Navigate to="/games/underworld/compendium" replace />} />
          <Route path="*" element={<NotFound backTo="/games" backLabel="Back to games" />} />
        </Route>
      </Routes>
      </AlarmProvider>
      </>
  )
}
