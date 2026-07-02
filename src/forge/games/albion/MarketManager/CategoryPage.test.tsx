import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { LayoutOverrideProvider } from '../../../../components/LayoutOverride'
import { CategoryPage } from './CategoryPage'

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
    if (u.includes('/game/albion/items/by-category/warrior-weapons/sword')) {
      return Promise.resolve(ok([
        { id: 'T4_MAIN_SWORD', name: 'Broadsword' },
        { id: 'T5_MAIN_SWORD', name: 'Broadsword' },
        { id: 'T4_MAIN_SWORD@1', name: 'Broadsword' },
      ]))
    }
    if (u.includes('/game/albion/recipe/')) {
      return Promise.resolve(ok({ item_id: 'T4_MAIN_SWORD', craftable: false, recipe: [] }))
    }
    if (u.includes('/game/albion/prices/')) {
      return Promise.resolve(ok([
        { item_id: 'T4_MAIN_SWORD', city: 'Caerleon', quality: 1, sell_price_min: 4321, buy_price_max: 4000 },
      ]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LayoutOverrideProvider>
          <CategoryPage slug="warrior-weapons/sword" />
        </LayoutOverrideProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('CategoryPage', () => {
  it('loads the category items with live prices and craft columns', async () => {
    renderPage()

    expect(screen.getByText('Sword')).toBeInTheDocument()
    expect(await screen.findAllByText('Broadsword')).toHaveLength(3)
    expect(await screen.findByText('4,321')).toBeInTheDocument()
    expect(screen.getByText('Craft (base)')).toBeInTheDocument()
    expect(screen.getByText('Craft (optimized)')).toBeInTheDocument()
  })

  it('narrows rows with the tier filter and the name filter', async () => {
    renderPage()
    expect(await screen.findAllByText('Broadsword')).toHaveLength(3)

    await userEvent.type(screen.getByPlaceholderText(/filter sword items/i), 't5_')
    expect(screen.getAllByText('Broadsword')).toHaveLength(1)
    expect(screen.getByText('T5')).toBeInTheDocument()

    await userEvent.clear(screen.getByPlaceholderText(/filter sword items/i))
    expect(screen.getAllByText('Broadsword')).toHaveLength(3)
  })
})
