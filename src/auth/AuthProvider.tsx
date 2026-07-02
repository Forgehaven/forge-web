import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { API_URLS, DISCORD_CLIENT_ID } from '../config/apiUrls'
import { setOnUnauthenticated } from './unauthorized'
import { AuthContext, type AuthUser } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = useCallback(() => { setUser(null) }, [])

  useEffect(() => {
    setOnUnauthenticated(() => {
      setUser(null)
      localStorage.setItem('forge_logged_out', 'true')
    })
  }, [])

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
    // A stale logged-out flag (set by the 401 handler) would make the post-login
    // /auth/me check discard the fresh session; clear it before leaving.
    localStorage.removeItem('forge_logged_out')
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
    // The session cookie is HttpOnly, so only the backend can delete it. Best-effort:
    // if the request fails, the logged-out flag still hides the session client-side.
    try {
      await fetch(`${API_URLS.forgeAPI}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      /* offline or API down - proceed with the client-side logout */
    }
    setUser(null)
    localStorage.setItem('forge_logged_out', 'true')
    window.location.reload()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout, clearAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
