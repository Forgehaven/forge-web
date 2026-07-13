import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

function mockApi(opts: { blob?: unknown; charPayload?: unknown } = {}) {
  const blob = opts.blob ?? { jobLevels: { WHM: 42 }, learned: {} }
  const charPayload = opts.charPayload ?? { name: 'Mychar', nation: 2, rank: 'Rank 5', avatar: null }
  fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
    const u = String(url)
    if (u.includes('/auth/me')) {
      return Promise.resolve(ok({
        id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {},
      }))
    }
    if (u.includes('/data/spell_tracker')) {
      if (init?.method === 'PUT') return Promise.resolve(ok(null))
      return Promise.resolve(ok({ data: blob, updated_at: null }))
    }
    if (u.includes('/game/ffxi/char/')) {
      return Promise.resolve(ok(charPayload))
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

  it('mirrors the loaded blob into localStorage', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi()

    renderTracker()

    await screen.findByDisplayValue('42')
    const local = JSON.parse(localStorage.getItem('forgegames_ffxi_spelltracker_v1')!)
    expect(local.jobLevels).toEqual({ WHM: 42 })
  })

  it('shows the live nation rank for the selected character', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi()

    renderTracker()

    expect(await screen.findByText('· Rank 5')).toBeInTheDocument()
  })

  it('logged out has no character fetch header, just the local tracker', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))

    renderTracker()

    expect(await screen.findByText('Tracker')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Character name')).toBeNull()
    expect(screen.queryByText('Fetch')).toBeNull()
  })
})

describe('SpellTracker live job levels', () => {
  it('overwrites blob levels with live armoury levels', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi({
      blob: { jobLevels: { WHM: 30 }, learned: {} },
      charPayload: { name: 'Mychar', nation: 2, rank: 'Rank 5', avatar: null, jobs: { WHM: 75, BLM: 40, WAR: 60 } },
    })

    renderTracker()

    expect(await screen.findByDisplayValue('75')).toBeInTheDocument()
    fireEvent.click(screen.getByText('BLM'))
    expect(await screen.findByDisplayValue('40')).toBeInTheDocument()
  })

  it('keeps last known levels when the character is /anon', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi({
      blob: { jobLevels: { WHM: 30 }, learned: {} },
      charPayload: { name: 'Mychar', nation: 2, rank: 'Rank 5', avatar: null, jobs: { WHM: 0, BLM: 0 } },
    })

    renderTracker()

    expect(await screen.findByDisplayValue('30')).toBeInTheDocument()
    await new Promise(r => setTimeout(r, 100))
    expect(screen.getByDisplayValue('30')).toBeInTheDocument()
  })

  it('drops manual levels for jobs the armoury reports unleveled', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi({
      blob: { jobLevels: { WHM: 30, NIN: 20 }, learned: {} },
      charPayload: { name: 'Mychar', nation: 2, rank: 'Rank 5', avatar: null, jobs: { WHM: 75, NIN: 0 } },
    })

    renderTracker()

    expect(await screen.findByDisplayValue('75')).toBeInTheDocument()
    fireEvent.click(screen.getByText('NIN'))
    expect(await screen.findByDisplayValue('1')).toBeInTheDocument()
  })

  it('pushes overwritten levels to the character blob', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi({
      blob: { jobLevels: { WHM: 30 }, learned: {} },
      charPayload: { name: 'Mychar', nation: 2, rank: 'Rank 5', avatar: null, jobs: { WHM: 75, BLM: 40 } },
    })

    const { unmount } = renderTracker()
    await screen.findByDisplayValue('75')
    unmount()

    const put = fetchSpy.mock.calls.find(([u, init]) =>
      String(u).includes('/data/spell_tracker') && (init as RequestInit | undefined)?.method === 'PUT')
    expect(put).toBeTruthy()
    const body = JSON.parse((put![1] as RequestInit).body as string)
    expect(body.data.jobLevels).toEqual({ WHM: 75, BLM: 40 })
  })
})
