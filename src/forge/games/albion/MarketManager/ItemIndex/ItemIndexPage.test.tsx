import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../../auth/AuthProvider'
import { LayoutOverrideProvider } from '../../../../../components/LayoutOverride'
import { ItemIndexPage } from './ItemIndexPage'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
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
    if (u.includes('/game/albion/recipe/')) {
      return Promise.resolve(ok({ item_id: 'T4_BAG', craftable: false, recipe: [] }))
    }
    if (u.includes('/game/albion/prices/')) {
      return Promise.resolve(ok([
        { item_id: 'T4_BAG', city: 'Caerleon', quality: 1, sell_price_min: 1234, buy_price_max: 1000 },
      ]))
    }
    if (u.includes('/game/albion/items')) {
      return Promise.resolve(ok([{ id: 'T4_BAG', name: "Adept's Bag" }]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LayoutOverrideProvider>
          <ItemIndexPage />
        </LayoutOverrideProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ItemIndexPage', () => {
  it('renders the search box and a searched item with its live price', async () => {
    renderPage()

    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument()
    expect(await screen.findByText("Adept's Bag")).toBeInTheDocument()
    // live price merged into the row
    expect(await screen.findByText('1,234')).toBeInTheDocument()
  })
})
