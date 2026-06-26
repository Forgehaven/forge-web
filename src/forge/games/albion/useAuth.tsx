import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { API_URLS } from '../../../config/apiUrls'
import { setOnUnauthenticated } from './api'
import { AuthContext, type AuthUser } from './authContext'

declare const __DISCORD_CLIENT_ID__: string | undefined
const DISCORD_CLIENT_ID = __DISCORD_CLIENT_ID__ ?? 'your_discord_client_id_here'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = useCallback(() => {
    setUser(null)
  }, [])

  useEffect(() => {
    setOnUnauthenticated(clearAuth)
  }, [clearAuth])

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const res = await fetch(`${API_URLS.forgeAPI}/auth/me`, { credentials: 'include' })
        if (cancelled) return
        const body = await res.json()
        if (!cancelled && body.status === 'ok' && !localStorage.getItem('forge_logged_out')) {
          setUser(body.payload)
        }
      } catch {
        /* not authenticated */
      } finally {
        if (!cancelled) { localStorage.removeItem('forge_logged_out'); setLoading(false) }
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(() => {
    sessionStorage.setItem('auth_return_path', window.location.pathname)
    const redirectUri = `${window.location.origin}/auth/callback`
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds guilds.members.read',
    })
    window.location.href = `${API_URLS.discordAuthorize}?${params}`
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URLS.forgeAPI}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      /* ignore */
    }
    setUser(null)
    localStorage.setItem('forge_logged_out', 'true')
    ;['', '; domain=forgehaven.io', '; Secure'].forEach(suffix => {
      document.cookie = `forge_session=; Max-Age=0; path=/${suffix}`
    })
    window.location.href = '/games'
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout, clearAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
