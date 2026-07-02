import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { SpellTracker } from './SpellTracker'

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

function mockApi() {
  fetchSpy.mockImplementation((url: string | URL) => {
    const u = String(url)
    if (u.includes('/auth/me')) {
      return Promise.resolve(ok({
        id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {},
      }))
    }
    if (u.includes('/data/spell_tracker')) {
      return Promise.resolve(ok({ data: { jobLevels: { WHM: 42 }, learned: {} }, updated_at: null }))
    }
    if (u.includes('/game/ffxi/char/')) {
      return Promise.resolve(ok({ name: 'Mychar', nation: 2, rank: 'Rank 5', avatar: null }))
    }
    if (u.includes('/game/ffxi/characters')) {
      return Promise.resolve(ok([{ id: 'c1', name: 'Mychar', nation: 2, avatar: null }]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
}

function renderTracker() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SpellTracker />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('SpellTracker character selector', () => {
  it('shows the registered-character dropdown even with no prior selection', async () => {
    // No forgegames_ffxi_selectedchar_v1 in localStorage: the selector must
    // still render and auto-pick the first registered character.
    mockApi()

    renderTracker()

    expect(await screen.findByText('Mychar')).toBeInTheDocument()
    expect(await screen.findByText('Windurst')).toBeInTheDocument()
    // Auto-pick persisted the selection for the other FFXI tools.
    expect(localStorage.getItem('forgegames_ffxi_selectedchar_v1')).toBe('c1')
  })

  it('loads the selected character blob from the server', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi()

    renderTracker()

    await screen.findByText('Mychar')
    // WHM tab shows the synced job level from the server blob.
    expect(await screen.findByDisplayValue('42')).toBeInTheDocument()
  })

  it('shows the live nation rank for the selected character', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi()

    renderTracker()

    expect(await screen.findByText('· Rank 5')).toBeInTheDocument()
  })

  it('shows the fetched rank when logged out', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    fetchSpy.mockImplementation((url: string | URL) => {
      const u = String(url)
      if (u.includes('/game/ffxi/char/')) {
        return Promise.resolve(ok({
          name: 'Solochar', nation: 1, rank: 'Rank 3', avatar: null, jobs: { WHM: 30 },
        }))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))
    })

    renderTracker()

    const input = await screen.findByPlaceholderText('Character name')
    await userEvent.type(input, 'Solochar')
    await userEvent.click(screen.getByText('Fetch'))

    expect(await screen.findByText('Bastok')).toBeInTheDocument()
    expect(screen.getByText('· Rank 3')).toBeInTheDocument()
  })
})
