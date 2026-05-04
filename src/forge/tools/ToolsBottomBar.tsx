import { BottomBar, BottomBarDivider } from '../../components/BottomBar'
import { BottomBarIP } from '../../components/BottomBar/BottomBarIP'
import { BottomBarLocation } from '../../components/BottomBar/BottomBarLocation'
import { BottomBarWeather } from '../../components/BottomBar/BottomBarWeather'
import { BottomBarClock } from '../../components/BottomBar/BottomBarClock'
import { BottomBarRefresh } from '../../components/BottomBar/BottomBarRefresh'

export function ToolsBottomBar() {
  return (
    <BottomBar>
      <BottomBarIP />
      <BottomBarDivider />
      <BottomBarLocation />
      <BottomBarDivider />
      <BottomBarWeather />
      <div className="ml-auto flex items-center gap-3">
        <BottomBarClock />
        <BottomBarRefresh />
      </div>
    </BottomBar>
  )
}
