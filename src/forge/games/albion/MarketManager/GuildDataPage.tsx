import { useEffect } from 'react'
import { GuildRoster } from './GuildRoster'
import { useLayoutOverride } from '../../../../components/LayoutOverride'
import { MarketManagerSidebar } from './MarketManagerSidebar'
import { MarketManagerBottomBar } from './MarketManagerBottomBar'

export function GuildDataPage() {
  const { setSidebar, setBottomBar } = useLayoutOverride()

  useEffect(() => {
    setSidebar(MarketManagerSidebar)
    setBottomBar(MarketManagerBottomBar)
    return () => { setSidebar(null); setBottomBar(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-1 tracking-wide">
        Albion Online <span className="text-[#c4af64]">Guild Data</span>
      </h1>
      <p className="text-sm text-[#6b7280] mb-6">Running Dawn Roster</p>
      <GuildRoster />
    </div>
  )
}
