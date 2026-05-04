import { lazy, Suspense, useInsertionEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { LandingPage } from './forge/LandingPage'
import { NotFoundLanding } from './forge/NotFoundLanding'

import './index.css'
import { SECTION_TITLES } from './config/sections'

// On stale deployments, lazy chunk hashes change and the old file returns HTML.
// Reload once to pick up the new index.html and fresh chunk names.
function lazyWithReload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch(() => {
      const key = 'chunk-reload-attempted'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
        return new Promise<{ default: T }>(() => {})
      }
      sessionStorage.removeItem(key)
      throw new Error('Chunk failed to load after reload.')
    })
  )
}

const ToolsLayout = lazyWithReload(() => import('./forge/tools/ToolsLayout'))
const GamesLayout = lazyWithReload(() => import('./forge/games/GamesLayout'))

function TitleSync() {
  const { pathname } = useLocation()
  useInsertionEffect(() => {
    const match = SECTION_TITLES.find(([prefix]) => pathname.startsWith(prefix))
    document.title = match?.[1] ?? 'FORGEHAVEN'
  }, [pathname])
  return null
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <TitleSync />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/tools/*"
            element={
              <Suspense fallback={<div style={{ background: '#0f1117', height: '100vh' }} />}>
                <ToolsLayout />
              </Suspense>
            }
          />
          <Route
            path="/games/*"
            element={
              <Suspense fallback={<div style={{ background: '#0f1117', height: '100vh' }} />}>
                <GamesLayout />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundLanding />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}
