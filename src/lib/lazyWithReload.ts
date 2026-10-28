import { lazy } from 'react'

// On stale deployments, lazy chunk hashes change and the old file returns HTML.
// Reload once to pick up the new index.html and fresh chunk names.
export function lazyWithReload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  const key = 'chunk-reload-attempted'
  return lazy(() =>
    factory().then(mod => {
      // Loaded fine: re-arm the one-time reload for a later stale deploy.
      sessionStorage.removeItem(key)
      return mod
    }).catch(() => {
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
