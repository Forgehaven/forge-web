import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { LandingPage } from './forge/LandingPage'
import { NotFoundLanding } from './forge/NotFoundLanding'

import './index.css'

const ToolsLayout = lazy(() => import('./forge/tools/ToolsLayout'))

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
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
          <Route path="*" element={<NotFoundLanding />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}
