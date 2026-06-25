import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../useAuth'
import { MarketManager } from './MarketManager'

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

function renderMM() {
  return render(
    <AuthProvider>
      <MarketManager />
    </AuthProvider>,
  )
}

describe('MarketManager', () => {
  it('shows loading spinner initially', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))

    const { container } = renderMM()

    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  it('shows login button when unauthenticated', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error', message: 'Not authenticated' }), { status: 401 }))

    renderMM()

    const button = await screen.findByText('Login with Discord')
    expect(button).toBeInTheDocument()
  })

  it('calls login when Discord button is clicked', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))

    renderMM()

    const button = await screen.findByText('Login with Discord')
    await userEvent.click(button)

    expect(window.location.href).toContain('discord.com/api/oauth2/authorize')
  })

  it('shows welcome message when authenticated', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      payload: { id: 'u1', discord_id: 'd1', username: 'TestUser#0001', avatar: 'hash', guild_member: true, has_role: true },
    }), { status: 200 }))

    renderMM()

    await waitFor(() => {
      expect(screen.getByText('Welcome, TestUser#0001')).toBeInTheDocument()
    })
  })

  it('shows market data placeholder when authenticated', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({
      status: 'ok',
      payload: { id: 'u1', discord_id: 'd1', username: 'TestUser#0001', avatar: 'hash', guild_member: true, has_role: true },
    }), { status: 200 }))

    renderMM()

    await waitFor(() => {
      expect(screen.getByText('Market data coming soon.')).toBeInTheDocument()
    })
  })
})
