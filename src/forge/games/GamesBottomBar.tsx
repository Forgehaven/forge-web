import { useLocation } from 'react-router-dom'
import { BottomBar, BottomBarDivider } from '../../components/BottomBar'
import { BottomBarIP } from '../../components/BottomBar/BottomBarIP'
import { BottomBarLocation } from '../../components/BottomBar/BottomBarLocation'
import { BottomBarClock } from '../../components/BottomBar/BottomBarClock'
import { BottomBarRefresh } from '../../components/BottomBar/BottomBarRefresh'

const G = '/games'

export function GamesBottomBar() {
  const { pathname } = useLocation()

  if (pathname === `${G}/market-manager`) return null

  return (
    <BottomBar>
      <BottomBarIP />
      <BottomBarDivider />
      <BottomBarLocation />
      <div className="ml-auto flex items-center gap-3">
        <BottomBarClock />
        <BottomBarRefresh />
      </div>
    </BottomBar>
  )
}
