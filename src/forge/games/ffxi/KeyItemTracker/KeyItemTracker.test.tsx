import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { KeyItemTracker } from './KeyItemTracker'

const SK = 'forgegames_ffxi_keyitems_v1'
const NOSYNC = 'forgegames_ffxi_keyitems_nosync_v1'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

beforeEach(() => {
  fetchSpy.mockReset()
  fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))
  localStorage.clear()
  window.matchMedia = window.matchMedia || (((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia)
})

function renderTracker() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <KeyItemTracker />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('KeyItemTracker logged out', () => {
  it('toggling persists to localStorage and hide-collected hides the row', async () => {
    renderTracker()

    const map = screen.getByLabelText("Map of Al'Taieu")
    await userEvent.click(map)

    // Hide collected is on by default: the row disappears.
    expect(screen.queryByLabelText("Map of Al'Taieu")).toBeNull()
    expect(JSON.parse(localStorage.getItem(SK)!).collected["Map of Al'Taieu"]).toBe(true)

    // Turning hide off brings it back, checked.
    await userEvent.click(screen.getByLabelText('Hide collected'))
    expect(screen.getByLabelText("Map of Al'Taieu")).toBeChecked()
  })

  it('search looks across all categories', async () => {
    renderTracker()

    // Maps tab active, but a Gate Crystal matches the search.
    await userEvent.type(screen.getByPlaceholderText('Search all key items…'), 'holla gate')

    expect(screen.getByText('Holla Gate Crystal')).toBeInTheDocument()
    expect(screen.queryByText("Map of Al'Taieu")).toBeNull()
  })

  it('category tabs switch the list and show counts', async () => {
    localStorage.setItem(SK, JSON.stringify({ collected: { 'Holla Gate Crystal': true } }))

    renderTracker()

    await userEvent.click(screen.getByText('Gate Crystals'))

    expect(screen.getByText('1/6')).toBeInTheDocument()
    // Collected crystal hidden by default, the other five visible.
    expect(screen.queryByText('Holla Gate Crystal')).toBeNull()
    expect(screen.getByText('Dem Gate Crystal')).toBeInTheDocument()
  })
})

describe('KeyItemTracker synced', () => {
  function mockApi(blob: unknown) {
    fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/auth/me')) {
        return Promise.resolve(ok({
          id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {},
        }))
      }
      if (u.includes('/data/key_item_tracker')) {
        if (init?.method === 'PUT') return Promise.resolve(ok(null))
        return Promise.resolve(ok({ data: blob, updated_at: null }))
      }
      if (u.includes('/game/ffxi/char/')) {
        return Promise.resolve(ok({ name: 'Mychar', nation: 1, rank: 'Rank 7', avatar: null }))
      }
      if (u.includes('/game/ffxi/characters')) {
        return Promise.resolve(ok([{ id: 'c1', name: 'Mychar', nation: 1, avatar: null }]))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
    })
  }

  it('loads the character blob, saves toggles to it, mirrors localStorage', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi({ collected: { 'Dem Gate Crystal': true } })

    const { unmount } = renderTracker()

    expect(await screen.findByText('Mychar')).toBeInTheDocument()
    expect(await screen.findByText('· Rank 7')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Gate Crystals'))
    // Wait for the server blob (save gate opens with it).
    await waitFor(() => expect(screen.getByText('1/6')).toBeInTheDocument())

    await userEvent.click(screen.getByLabelText('Holla Gate Crystal'))
    unmount()

    const put = fetchSpy.mock.calls.find(call =>
      String(call[0]).includes('/characters/c1/data/key_item_tracker')
        && (call[1] as RequestInit | undefined)?.method === 'PUT')
    expect(put).toBeTruthy()
    const body = JSON.parse(String((put![1] as RequestInit).body))
    expect(body.data.collected['Holla Gate Crystal']).toBe(true)
    expect(body.data.collected['Dem Gate Crystal']).toBe(true)
    const local = JSON.parse(localStorage.getItem(SK)!)
    expect(local.collected['Holla Gate Crystal']).toBe(true)
    expect(local.collected['Dem Gate Crystal']).toBe(true)
  })

  it('Import keeps the pre-sync local copy even after synced toggles mirror over it', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    localStorage.setItem(SK, JSON.stringify({ collected: { "Map of Al'Taieu": true } }))
    mockApi({})

    const { unmount } = renderTracker()

    expect(await screen.findByText('This browser has unsynced Key Item data.')).toBeInTheDocument()
    // Toggle while the banner is up: the mirror overwrites localStorage.
    await userEvent.click(screen.getByText('Gate Crystals'))
    await userEvent.click(screen.getByLabelText('Holla Gate Crystal'))
    await userEvent.click(screen.getByText('Save it to Mychar'))
    unmount()

    const puts = fetchSpy.mock.calls.filter(call =>
      String(call[0]).includes('/data/key_item_tracker')
        && (call[1] as RequestInit | undefined)?.method === 'PUT')
    expect(puts.length).toBeGreaterThan(0)
    const body = JSON.parse(String((puts.at(-1)![1] as RequestInit).body))
    expect(body.data.collected["Map of Al'Taieu"]).toBe(true)
    expect(body.data.collected['Holla Gate Crystal']).toBe(true)
  })

  it("does not offer migration when local data is another character's mirror", async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    localStorage.setItem(SK, JSON.stringify({ collected: { 'Map of Norg': true } }))
    localStorage.setItem('forgegames_ffxi_keyitems_mirrorchar_v1', 'other-char')
    mockApi({})

    renderTracker()

    await screen.findByText('Mychar')
    await new Promise(r => setTimeout(r, 50))
    expect(screen.queryByText('This browser has unsynced Key Item data.')).toBeNull()
  })

  it('offers migration for unsynced local data and remembers a decline', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    localStorage.setItem(SK, JSON.stringify({ collected: { 'Map of Norg': true } }))
    mockApi({})

    renderTracker()

    expect(await screen.findByText('This browser has unsynced Key Item data.')).toBeInTheDocument()
    await userEvent.click(screen.getByText('No thanks'))

    expect(screen.queryByText('This browser has unsynced Key Item data.')).toBeNull()
    expect(JSON.parse(localStorage.getItem(NOSYNC)!)).toEqual(['c1'])
  })
})
