import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
    if (u.includes('/game/albion/recipes/')) {
      return Promise.resolve(ok([
        {
          item_id: 'T4_BAG', craftable: true,
          recipe: [{ item_id: 'T4_LEATHER', name: 'Worked Leather', count: 8, craftable: true, recipe: [] }],
        },
      ]))
    }
    if (u.includes('/game/albion/items')) {
      return Promise.resolve(ok([{ id: 'T4_BAG', name: "Adept's Bag" }]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
})

describe('ItemIndexPage (universal)', () => {
  it('searches items and shows price-free craft columns (station, BOM, category)', async () => {
    render(<MemoryRouter><ItemIndexPage /></MemoryRouter>)

    expect(screen.getByPlaceholderText(/item name/i)).toBeInTheDocument()

    // Item resolves from the search endpoint.
    expect(await screen.findByText("Adept's Bag")).toBeInTheDocument()

    // Price-free columns (columnheader role avoids clashing with the filter labels).
    expect(screen.getByRole('columnheader', { name: 'Station' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Materials' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Your Cost' })).toBeInTheDocument()

    // Derived station + category for a bag (cell role avoids the filter <option>s).
    expect(screen.getByRole('cell', { name: 'Toolmaker' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Bag' })).toBeInTheDocument()

    // Bill of materials from the recipe endpoint.
    expect(await screen.findByText('8× T4 Worked Leather')).toBeInTheDocument()
  })
})
