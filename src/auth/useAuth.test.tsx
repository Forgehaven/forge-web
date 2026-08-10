import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth, type AuthUser } from './authContext'
import { AuthProvider } from './AuthProvider'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function user(member = true, role = true): AuthUser {
  return {
    id: 'u1',
    discord_id: 'd1',
    username: 'Test#0001',
    avatar: 'https://cdn.discordapp.com/avatars/d1/hash.png',
    guilds: { running_dawn: { is_member: member, roles: { albion_guild: role } } },
  }
}

const origLocation = window.location

beforeEach(() => {
  fetchSpy.mockReset()
  sessionStorage.clear()
  localStorage.clear()

  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...origLocation, href: '', pathname: '/games/albion/item-index', origin: 'https://forgehaven.io', reload: vi.fn() },
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', { writable: true, value: origLocation })
})

function renderAuthHook() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

describe('AuthProvider', () => {
  it('starts in loading state and checks /auth/me on mount', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      payload: user(),
    }), { status: 200 }))

    const { result } = renderAuthHook()

    expect(result.current.loading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchSpy).toHaveBeenCalledWith('https://api.forgehaven.io/auth/me', { credentials: 'include' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.username).toBe('Test#0001')
  })

  it('sets unauthenticated when /auth/me returns error', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error', message: 'Not authenticated' }), { status: 401 }))

    const { result } = renderAuthHook()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('sets unauthenticated when /auth/me network fails', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'))

    const { result } = renderAuthHook()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('login stores return path and redirects to Discord', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))

    const { result } = renderAuthHook()
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.login())

    expect(sessionStorage.getItem('auth_return_path')).toBe('/games/albion/item-index')
    expect(window.location.href).toContain('https://discord.com/api/oauth2/authorize')
    expect(window.location.href).toContain('client_id=1519734763139633354')
    expect(window.location.href).toContain('redirect_uri=https%3A%2F%2Fforgehaven.io%2Fauth%2Fcallback')
    expect(window.location.href).toContain('response_type=code')
    expect(window.location.href).toContain('scope=identify')
  })

  it('clearAuth resets user to null', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      payload: user(),
    }), { status: 200 }))

    const { result } = renderAuthHook()
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    act(() => result.current.clearAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('logout calls backend and resets user', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      payload: user(),
    }), { status: 200 }))

    const { result } = renderAuthHook()
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    await act(async () => result.current.logout())

    // The cookie is HttpOnly: only the backend route can actually delete it.
    expect(fetchSpy).toHaveBeenCalledWith('https://api.forgehaven.io/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    expect(localStorage.getItem('forge_logged_out')).toBe('true')
    expect(window.location.reload).toHaveBeenCalled()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('logout still clears client state when the backend call fails', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({
      status: 'ok',
      payload: user(),
    }), { status: 200 }))

    const { result } = renderAuthHook()
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    fetchSpy.mockRejectedValueOnce(new Error('API down'))
    await act(async () => result.current.logout())

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('forge_logged_out')).toBe('true')
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('login clears a stale logged-out flag before redirecting', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))

    const { result } = renderAuthHook()
    await waitFor(() => expect(result.current.loading).toBe(false))

    localStorage.setItem('forge_logged_out', 'true')
    act(() => result.current.login())

    expect(localStorage.getItem('forge_logged_out')).toBeNull()
    expect(window.location.href).toContain('discord.com/api/oauth2/authorize')
  })

  it('throws if useAuth is used outside provider', () => {
    expect(() => renderHook(() => useAuth()).result.current).toThrow('useAuth must be used within an AuthProvider')
  })
})
