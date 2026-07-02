import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { TeleportCost } from './TeleportCost'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

beforeEach(() => {
  fetchSpy.mockReset()
  localStorage.clear()
  window.matchMedia = window.matchMedia || (((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia)
})

function renderTool() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TeleportCost />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('TeleportCost conquest sync', () => {
  it('applies the community conquest map from the public endpoint', async () => {
    const updated = new Date().toISOString()
    fetchSpy.mockImplementation((url: string | URL) => {
      const u = String(url)
      if (u.includes('/game/ffxi/conquest')) {
        return Promise.resolve(ok({ owners: { Ronfaure: 2 }, updated_at: updated }))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))
    })

    renderTool()

    expect(await screen.findByText(/Community conquest map/)).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.forgehaven.io/game/ffxi/conquest',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('shows the registered-character dropdown with the mapped nation', async () => {
    fetchSpy.mockImplementation((url: string | URL) => {
      const u = String(url)
      if (u.includes('/auth/me')) {
        return Promise.resolve(ok({
          id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {},
        }))
      }
      if (u.includes('/game/ffxi/conquest')) {
        return Promise.resolve(ok({ owners: {}, updated_at: null }))
      }
      if (u.includes('/game/ffxi/char/')) {
        return Promise.resolve(ok({ name: 'Mychar', nation: 0, rank: 'Rank 6', avatar: null }))
      }
      if (u.includes('/game/ffxi/characters')) {
        // char-API nation 0 = San d'Oria (maps to this tool's id 3)
        return Promise.resolve(ok([{ id: 'c1', name: 'Mychar', nation: 0, avatar: null }]))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
    })

    renderTool()

    expect(await screen.findByText('Mychar')).toBeInTheDocument()
    expect(await screen.findByText("San d'Oria")).toBeInTheDocument()
    // live nation rank from the public char lookup
    expect(await screen.findByText('· Rank 6')).toBeInTheDocument()
    // free-text header replaced
    expect(screen.queryByPlaceholderText('Character name')).toBeNull()
    // logged in: resetting would blank the shared community map - button hidden
    expect(screen.queryByText('Reset Conquest')).toBeNull()
  })

  it('logged out shows the home-nation picker instead of a character fetch', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    fetchSpy.mockImplementation((url: string | URL) => {
      const u = String(url)
      if (u.includes('/game/ffxi/conquest')) {
        return Promise.resolve(ok({ owners: {}, updated_at: null }))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))
    })

    renderTool()

    expect(await screen.findByText('Home Nation:')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Character name')).toBeNull()
    // Beastmen own outposts but are not a pickable home nation.
    expect(screen.queryByText('Beastmen')).toBeNull()

    await userEvent.click(screen.getByText('Bastok'))
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_teleportcost_v1')!).nation).toBe(1)
  })

  it('shows no community note when the week is blank', async () => {
    fetchSpy.mockImplementation((url: string | URL) => {
      const u = String(url)
      if (u.includes('/game/ffxi/conquest')) {
        return Promise.resolve(ok({ owners: {}, updated_at: null }))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))
    })

    renderTool()

    expect(await screen.findByText('Teleport')).toBeInTheDocument()
    expect(screen.queryByText(/Community conquest map/)).toBeNull()
    // logged out: local-only data, reset stays available
    expect(screen.getByText('Reset Conquest')).toBeInTheDocument()
  })
})
