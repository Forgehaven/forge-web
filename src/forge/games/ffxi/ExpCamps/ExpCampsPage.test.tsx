import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { ExpCampsPage } from './ExpCampsPage'
import { EXP_CAMPS } from './camps'
import { MAPS } from '../InteractiveMap/maps'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

function mockApi({ authed = false, serverFavs = [] as string[] } = {}) {
  fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
    const u = String(url)
    if (u.includes('/auth/me')) {
      return authed
        ? Promise.resolve(ok({ id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {} }))
        : Promise.resolve(new Response(JSON.stringify({ status: 'error', message: 'unauthorized' }), { status: 401 }))
    }
    if (u.includes('/user-data/exp_camps') && init?.method === 'PUT') {
      return Promise.resolve(ok({ updated_at: null }))
    }
    if (u.includes('/user-data/exp_camps')) {
      return Promise.resolve(ok({ data: { favs: serverFavs }, updated_at: null }))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ExpCampsPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('EXP_CAMPS data', () => {
  it('has sane generated rows', () => {
    const ids = new Set(MAPS.map(m => m.id))
    const seen = new Set<string>()
    expect(EXP_CAMPS.length).toBeGreaterThan(200)
    for (const c of EXP_CAMPS) {
      expect(seen.has(c.id)).toBe(false)
      seen.add(c.id)
      expect(c.description.length).toBeGreaterThan(0)
      expect(c.zone.length).toBeGreaterThan(0)
      if (c.levels) {
        expect(c.levels[0]).toBeGreaterThan(0)
        expect(c.levels[0]).toBeLessThanOrEqual(c.levels[1])
        expect(c.levels[1]).toBeLessThanOrEqual(99)
      }
      if (c.mapId) expect(ids.has(c.mapId)).toBe(true)
      for (const s of c.spots) {
        expect(ids.has(s.mapId)).toBe(true)
        expect(s.x).toBeGreaterThanOrEqual(0)
        expect(s.x).toBeLessThanOrEqual(1024)
        expect(s.y).toBeGreaterThanOrEqual(0)
        expect(s.y).toBeLessThanOrEqual(1024)
      }
    }
  })
})

describe('ExpCampsPage', () => {
  beforeEach(() => {
    fetchSpy.mockReset()
    localStorage.clear()
    mockApi()
  })

  it('merges server favourites into the table when logged in', async () => {
    mockApi({ authed: true, serverFavs: ['standard-uleguerand_range-1'] })
    renderPage()

    await waitFor(() => expect(screen.getAllByRole('row')[1]).toHaveTextContent('Uleguerand Range'))
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_expcamps_v1')!).favs)
      .toContain('standard-uleguerand_range-1')
  })

  it('pushes a favourite to the server when logged in', async () => {
    mockApi({ authed: true })
    renderPage()
    await waitFor(() => expect(fetchSpy.mock.calls.some(c => String(c[0]).includes('/user-data/exp_camps'))).toBe(true))

    fireEvent.click(screen.getAllByLabelText('Favourite Uleguerand Range camp')[0])

    await waitFor(() => {
      const put = fetchSpy.mock.calls.find(c => String(c[0]).includes('/user-data/exp_camps') && c[1]?.method === 'PUT')
      expect(put).toBeTruthy()
      expect(JSON.parse(put![1]!.body as string).data.favs).toContain('standard-uleguerand_range-1')
    }, { timeout: 3000 })
  })

  it('pins favourited camps to the top and persists them', () => {
    const { unmount } = renderPage()

    // a high-level camp starts far from the top under the default level sort
    fireEvent.click(screen.getAllByLabelText('Favourite Uleguerand Range camp')[0])

    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Uleguerand Range')
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_expcamps_v1')!).favs).toHaveLength(1)

    unmount()
    renderPage()
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Uleguerand Range')
    expect(screen.getAllByLabelText('Unfavourite Uleguerand Range camp')).toHaveLength(1)
  })

  it('lists all camps with zone links into the interactive map', () => {
    renderPage()
    expect(screen.getByText(`${EXP_CAMPS.length} of ${EXP_CAMPS.length} camps`)).toBeInTheDocument()
    const link = screen.getAllByRole('link', { name: 'Ghelsba Outpost' })[0]
    expect(link).toHaveAttribute('href', '/games/ffxi/map/ghelsba_outpost_1')
  })

  it('filters by level', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: '12' } })

    const expected = EXP_CAMPS.filter(c => c.levels && c.levels[0] <= 12 && 12 <= c.levels[1]).length
    expect(screen.getByText(`${expected} of ${EXP_CAMPS.length} camps`)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ghelsba Outpost' }).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('link', { name: 'Uleguerand Range' }).length).toBe(0)
  })

  it('filters by camp type', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'manaburn' } })

    const expected = EXP_CAMPS.filter(c => c.type === 'manaburn').length
    expect(screen.getByText(`${expected} of ${EXP_CAMPS.length} camps`)).toBeInTheDocument()
    expect(screen.queryAllByRole('link', { name: 'Ghelsba Outpost' }).length).toBe(0)
  })

  it('filters by text search', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'valkurm' } })

    expect(screen.getAllByRole('link', { name: 'Valkurm Dunes' }).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('link', { name: 'Ghelsba Outpost' }).length).toBe(0)
  })
})
