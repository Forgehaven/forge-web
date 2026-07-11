import { useEffect } from 'react'
import { useAuth } from '../../../../../auth/authContext'
import { getUserBlob, putUserBlob } from './api'
import {
  getCraftSettings, replaceCraftSettings, subscribeCraftSettings,
  type UserCraftSettings,
} from './craftSettings'
import { getPriceMap, replacePrices, subscribePrices, type PriceMap } from '../prices/userStore'

// True only while we are applying a server blob to the local stores, so the change-subscribers
// below don't immediately PUT the freshly-loaded data straight back.
let applyingServer = false

// Keeps the per-user prices + craft settings in sync with the account when logged in: loads the
// server blobs on login and debounced-saves local edits back. Logged out, it does nothing and
// the stores stay purely on localStorage. Mounted once (GamesLayout).
export function useAlbionUserSync(): void {
  const { isAuthenticated } = useAuth()

  // Load on login.
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    Promise.all([
      getUserBlob<Partial<UserCraftSettings>>('craft-settings'),
      getUserBlob<PriceMap>('prices'),
    ]).then(([cs, pr]) => {
      if (cancelled) return
      applyingServer = true
      if (cs) replaceCraftSettings(cs)
      if (pr) replacePrices(pr)
      applyingServer = false
    })
    return () => { cancelled = true }
  }, [isAuthenticated])

  // Debounced save on local edits.
  useEffect(() => {
    if (!isAuthenticated) return
    let csTimer: ReturnType<typeof setTimeout> | null = null
    let prTimer: ReturnType<typeof setTimeout> | null = null

    const unsubCs = subscribeCraftSettings(() => {
      if (applyingServer) return
      if (csTimer) clearTimeout(csTimer)
      csTimer = setTimeout(() => { putUserBlob('craft-settings', getCraftSettings()) }, 1000)
    })
    const unsubPr = subscribePrices(() => {
      if (applyingServer) return
      if (prTimer) clearTimeout(prTimer)
      prTimer = setTimeout(() => { putUserBlob('prices', getPriceMap()) }, 1000)
    })

    return () => {
      unsubCs()
      unsubPr()
      if (csTimer) clearTimeout(csTimer)
      if (prTimer) clearTimeout(prTimer)
    }
  }, [isAuthenticated])
}
