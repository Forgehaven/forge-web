import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { HamburgerIcon } from '../../components/Icons'
import { GamesBottomBar } from './GamesBottomBar'
import { Modal } from '../../components/Modal'
import { NotFound } from '../../components/NotFound'
import { GamesSidebar } from './GamesSidebar'
import { GamesSettings } from './GamesSettings'
import { GamesHome } from './GamesHome'
import { SkillchainCalc } from './ffxi/SkillchainCalc'


function GamesShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const sidebarOpenRef = useRef(sidebarOpen)

  useEffect(() => { sidebarOpenRef.current = sidebarOpen }, [sidebarOpen])


  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      touchStartX.current = t.clientX
      touchStartY.current = t.clientY
    }

    function onTouchEnd(e: TouchEvent) {
      if (touchStartX.current === null || touchStartY.current === null) return
      const startX = touchStartX.current
      const startY = touchStartY.current
      touchStartX.current = null
      touchStartY.current = null

      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = Math.abs(t.clientY - startY)

      if (dy > 80) return
      if (!sidebarOpenRef.current && startX <= 24 && dx > 48) setSidebarOpen(true)
      else if (sidebarOpenRef.current && dx < -48) setSidebarOpen(false)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div className="flex w-full h-full">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <GamesSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false) }}
      />

      <div className="relative flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="flex md:hidden items-center px-4 h-12 bg-[#1a1d27] border-b border-[#2a2d3a] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
          <Link to="/games" className="absolute left-1/2 -translate-x-1/2 text-[#e2e4ed] font-semibold text-base tracking-wide hover:opacity-75 transition-opacity">
            Forge<span className="text-[#c4af64]">Games</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0f1117]">
          <div className="px-5 py-6 md:pl-12 md:pr-8 md:py-8">
            <Outlet />
          </div>
        </main>
        <GamesBottomBar />
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <GamesSettings />
      </Modal>
    </div>
  )
}

export default function GamesLayout() {
  return (
    <Routes>
      <Route element={<GamesShell />}>
        <Route index element={<GamesHome />} />
        <Route path="skillchain-calc" element={<SkillchainCalc />} />
        <Route path="*" element={<NotFound backTo="/games" backLabel="Back to games" />} />
      </Route>
    </Routes>
  )
}
