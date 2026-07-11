import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { FavouritesPage } from './FavouritesPage'

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
      return Promise.resolve(ok([{ item_id: 'T4_BAG', craftable: false, recipe: [] }]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
})

describe('FavouritesPage (universal)', () => {
  it('shows the empty state with no favourites', () => {
    render(<MemoryRouter><FavouritesPage /></MemoryRouter>)
    expect(screen.getByText(/no favourites yet/i)).toBeInTheDocument()
  })

  it('renders starred items from localStorage', async () => {
    localStorage.setItem(
      STORAGE_KEYS.albionItemFavourites,
      JSON.stringify([{ id: 'T4_BAG', name: "Adept's Bag", tier: 4, enchant: 0 }]),
    )
    render(<MemoryRouter><FavouritesPage /></MemoryRouter>)
    expect(await screen.findByText("Adept's Bag")).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Toolmaker' })).toBeInTheDocument()
  })
})
