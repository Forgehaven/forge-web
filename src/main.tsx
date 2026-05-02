import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Restore path saved by public/404.html (GitHub Pages SPA redirect)
const ghpRedirect = sessionStorage.getItem('ghp-redirect')
if (ghpRedirect) {
  sessionStorage.removeItem('ghp-redirect')
  window.history.replaceState(null, '', ghpRedirect)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
