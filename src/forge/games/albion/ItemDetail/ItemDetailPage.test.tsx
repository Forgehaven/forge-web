import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { ItemDetailPage } from './ItemDetailPage'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

beforeEach(() => {
  fetchSpy.mockReset()
  localStorage.clear()
  fetchSpy.mockImplementation((url: string | URL) => {
    if (String(url).includes('/game/albion/recipes/')) {
      return Promise.resolve(ok([
        {
          item_id: 'T4_BAG', name: "Adept's Bag", craftable: true, item_value: 0,
          recipe: [{ item_id: 'T4_LEATHER', name: 'Worked Leather', count: 8, craftable: false, recipe: [] }],
        },
      ]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/games/albion/item/:itemId" element={<ItemDetailPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ItemDetailPage', () => {
  it('renders the header, cost/margin scaffold, craft tree and per-material price entry', async () => {
    renderAt('/games/albion/item/T4_BAG?city=Bridgewatch')

    expect(await screen.findByText("Adept's Bag")).toBeInTheDocument()
    expect(screen.getByText('Craft Cost')).toBeInTheDocument()
    expect(screen.getByText('Margin')).toBeInTheDocument()
    expect(screen.getByText('Crafting Tree')).toBeInTheDocument()
    expect(screen.getByText('Your Material Prices')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Optimized' })).toBeInTheDocument()
    // The one material is offered for pricing.
    expect(await screen.findAllByText(/Worked Leather/)).not.toHaveLength(0)
  })
})
