import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { LayoutOverrideProvider } from '../../../../components/LayoutOverride'
import { BestValuePage } from './BestValuePage'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

const PAYLOAD = {
  computed_at: '2026-07-02T10:00:00+00:00',
  rows: [
    {
      item_id: 'T4_MAIN_SWORD', name: 'Broadsword', tier: 4, enchant: 0,
      city: 'Martlock', quality: 1, sell_price_min: 5000,
      craft_cost_base: 300, craft_cost_optimized: 200, profit: 4475, return_pct: 2237.5,
    },
    {
      item_id: 'T4_MAIN_SWORD', name: 'Broadsword', tier: 4, enchant: 0,
      city: 'Caerleon', quality: 1, sell_price_min: 1000,
      craft_cost_base: null, craft_cost_optimized: 200, profit: 735, return_pct: 367.5,
    },
  ],
}

beforeEach(() => {
  fetchSpy.mockReset()
  localStorage.clear()
  fetchSpy.mockImplementation((url: string | URL) => {
    const u = String(url)
    if (u.includes('/auth/me')) {
      return Promise.resolve(ok({
        id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: 'h',
        guilds: { running_dawn: { is_member: true, roles: { albion_guild: true } } },
      }))
    }
    if (u.includes('/game/albion/best-value')) {
      return Promise.resolve(ok(PAYLOAD))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LayoutOverrideProvider>
          <BestValuePage />
        </LayoutOverrideProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('BestValuePage', () => {
  it('renders (item, city) rows across cities with returns and detail links', async () => {
    renderPage()

    // same item appears once per city
    expect(await screen.findAllByText('Broadsword')).toHaveLength(2)
    expect(screen.getByText('Martlock')).toBeInTheDocument()
    expect(screen.getByText('Caerleon')).toBeInTheDocument()
    expect(screen.getByText('+2237.5%')).toBeInTheDocument()
    expect(screen.getByText('+4,475')).toBeInTheDocument()

    const links = screen.getAllByText('Broadsword').map(el => el.closest('a')!.getAttribute('href'))
    expect(links).toContain('/games/albion/market-manager/item/T4_MAIN_SWORD?quality=1&city=Martlock')

    // no filter controls - only the per-user premium flag rides the request
    expect(screen.queryByLabelText(/city/i)).toBeNull()
    const url = fetchSpy.mock.calls.map(c => String(c[0])).find(u => u.includes('best-value'))!
    expect(url).toContain('/game/albion/best-value?premium=true&focus=false')
  })
})
