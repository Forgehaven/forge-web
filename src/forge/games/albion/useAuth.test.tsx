import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './authContext'
import { AuthProvider } from './useAuth'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

const origLocation = window.location

beforeEach(() => {
  fetchSpy.mockReset()
  sessionStorage.clear()

  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...origLocation, href: '', pathname: '/games/market-manager', origin: 'https://forgehaven.io' },
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
      payload: { id: 'u1', discord_id: 'd1', username: 'Test#0001', avatar: 'hash', guild_member: true, has_role: true },
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

    expect(sessionStorage.getItem('auth_return_path')).toBe('/games/market-manager')
    expect(window.location.href).toContain('https://discord.com/api/oauth2/authorize')
    expect(window.location.href).toContain('client_id=1519734763139633354')
    expect(window.location.href).toContain('redirect_uri=https%3A%2F%2Fforgehaven.io%2Fauth%2Fcallback')
    expect(window.location.href).toContain('response_type=code')
    expect(window.location.href).toContain('scope=identify')
  })

  it('clearAuth resets user to null', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      payload: { id: 'u1', discord_id: 'd1', username: 'Test#0001', avatar: 'hash', guild_member: true, has_role: true },
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
      payload: { id: 'u1', discord_id: 'd1', username: 'Test#0001', avatar: 'hash', guild_member: true, has_role: true },
    }), { status: 200 }))

    const { result } = renderAuthHook()
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))
    await act(async () => result.current.logout())

    expect(fetchSpy).toHaveBeenCalledWith('https://api.forgehaven.io/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('throws if useAuth is used outside provider', () => {
    expect(() => renderHook(() => useAuth()).result.current).toThrow('useAuth must be used within an AuthProvider')
  })
})
