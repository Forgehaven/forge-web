import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../../../../auth/AuthProvider'
import { LayoutOverrideProvider } from '../../../../../components/LayoutOverride'
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
    const u = String(url)
    if (u.includes('/auth/me')) {
      return Promise.resolve(ok({
        id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: 'h',
        guilds: { running_dawn: { is_member: true, roles: { albion_guild: true } } },
      }))
    }
    if (u.includes('/game/albion/prices/history/')) {
      return Promise.resolve(ok([
        {
          item_id: 'T5_MAIN_SWORD', location: 'Caerleon', quality: 1,
          data: [
            { timestamp: new Date(Date.now() - 3_600_000).toISOString().replace('Z', ''), avg_price: 5000, item_count: 3 },
            { timestamp: new Date().toISOString().replace('Z', ''), avg_price: 5200, item_count: 2 },
          ],
        },
        {
          item_id: 'T5_MAIN_SWORD', location: 'Caerleon', quality: 2,
          data: [{ timestamp: new Date().toISOString().replace('Z', ''), avg_price: 6100, item_count: 1 }],
        },
      ]))
    }
    if (u.includes('/game/albion/recipes/')) {
      const requestedId = decodeURIComponent(u.split('/recipes/')[1].split(',')[0])
      return Promise.resolve(ok([{
        item_id: requestedId, name: "Expert's Broadsword", count: 1, craftable: true,
        recipe: [
          {
            item_id: 'T5_METALBAR', name: 'Metal Bar', count: 16, craftable: true,
            recipe: [{ item_id: 'T5_ORE', name: 'Iron Ore', count: 2, craftable: false, recipe: [] }],
          },
          { item_id: 'T5_LEATHER', name: 'Leather', count: 8, craftable: false, recipe: [] },
        ],
      }]))
    }
    if (u.includes('/game/albion/prices/')) {
      return Promise.resolve(ok([
        { item_id: 'T5_MAIN_SWORD', city: 'Caerleon', quality: 1, sell_price_min: 5100, buy_price_max: 4500 },
        { item_id: 'T5_MAIN_SWORD', city: 'Caerleon', quality: 2, sell_price_min: 6200, buy_price_max: 5000 },
        { item_id: 'T5_METALBAR', city: 'Caerleon', quality: 1, sell_price_min: 100, buy_price_max: 90 },
        { item_id: 'T5_LEATHER', city: 'Caerleon', quality: 1, sell_price_min: 50, buy_price_max: 40 },
        { item_id: 'T5_ORE', city: 'Caerleon', quality: 1, sell_price_min: 60, buy_price_max: 50 },
      ]))
    }
    if (u.includes('/game/albion/items')) {
      return Promise.resolve(ok([{ id: 'T5_MAIN_SWORD', name: 'Broadsword' }]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
})

function renderPage(initial = '/games/albion/market-manager/item/T5_MAIN_SWORD?quality=1&city=Caerleon') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <LayoutOverrideProvider>
          <Routes>
            <Route path="/games/albion/market-manager/item/:itemId" element={<ItemDetailPage />} />
          </Routes>
        </LayoutOverrideProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ItemDetailPage', () => {
  it('shows the item with per-quality prices, variant switchers, and craft stats', async () => {
    renderPage()

    expect(await screen.findByText("Expert's Broadsword")).toBeInTheDocument()
    // quality strip + stat cards both show the Q1/Q2 sells
    expect(await screen.findAllByText('5,100')).not.toHaveLength(0)
    expect(screen.getAllByText('6,200')).not.toHaveLength(0)
    // variant switchers
    expect(screen.getByText('T8')).toBeInTheDocument()
    expect(screen.getByText('.4')).toBeInTheDocument()
    // craft: base = optimized = 16×100 + 8×50 = 2000 at 15.2% base return → 1696
    expect(await screen.findAllByText('1,696')).not.toHaveLength(0)
  })

  it('scales the aggregated shopping list by quantity', async () => {
    renderPage()
    expect(await screen.findByText("Expert's Broadsword")).toBeInTheDocument()
    await screen.findAllByText('1,696')

    // rr 15.2%: 16×0.848 = 13.57 → ceil 14 metalbars for qty 1; label carries tier + name
    expect(await screen.findByText(/14× T5 Metal Bar/)).toBeInTheDocument()

    const qtyInput = screen.getByLabelText('Crafting tree quantity')
    fireEvent.change(qtyInput, { target: { value: '10' } })

    // 13.57 × 10 = 135.7 → 136
    await waitFor(() => {
      expect(screen.getByText(/136× T5 Metal Bar/)).toBeInTheDocument()
    })
    expect(screen.getByText('Total for 10')).toBeInTheDocument()
  })

  it('crafting tree toggles between optimized and full expansion and scales by qty', async () => {
    renderPage()
    expect(await screen.findByText("Expert's Broadsword")).toBeInTheDocument()
    expect(await screen.findByText('Crafting Tree')).toBeInTheDocument()

    // Optimized: metalbar craft (2×60×0.85 = 102) loses to buy (100) → ore stays hidden.
    expect(screen.queryByText(/Iron Ore/)).toBeNull()

    await userEvent.click(screen.getByText('Full tree'))
    // Full tree refines from raw: 16×0.848 = 13.57 metalbars → 2×0.848×13.57 = 23.01 → 24 ore.
    // Ore appears in the tree AND the aggregated list beside it.
    expect(await screen.findAllByText(/Iron Ore/)).toHaveLength(2)
    expect(screen.getByText('24×')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Crafting tree quantity'), { target: { value: '10' } })
    await waitFor(() => {
      // 2×0.848×135.68 = 230.1 → 231 ore for 10 swords.
      expect(screen.getByText('231×')).toBeInTheDocument()
    })
  })

  it('strategy toggles reconfigure the profit card and mat prices', async () => {
    renderPage()
    expect(await screen.findByText("Expert's Broadsword")).toBeInTheDocument()
    await screen.findAllByText('1,696')
    expect(screen.getByText(/profit \(sell, optimized\)/i)).toBeInTheDocument()

    // Two "Base mats" buttons on the page: StrategyToggles (first) and the
    // crafting-tree mode switch. The strategy one drives the profit card.
    await userEvent.click(screen.getAllByText('Base mats')[0])
    expect(screen.getByText(/profit \(sell, base mats\)/i)).toBeInTheDocument()

    // Buy orders: metalbar min(buy 90, craft 2×50×0.848=84.8)=84.8; leather 40
    // → 13.568×84.8 + 6.784×40 = 1421.9 → 1,422
    await userEvent.click(screen.getByText('Buy orders'))
    expect(await screen.findAllByText('1,422')).not.toHaveLength(0)
  })

  it('resources have no quality strip or quality label', async () => {
    renderPage('/games/albion/market-manager/item/T5_PLANKS?city=Caerleon')

    expect(await screen.findByText('Crafting Tree')).toBeInTheDocument()
    // gear pages show the per-quality strip; resources hide it entirely
    expect(screen.queryByText('Masterpiece')).toBeNull()
    expect(screen.queryByText('Outstanding')).toBeNull()
  })

  it('gear pages keep the quality strip', async () => {
    renderPage()
    expect(await screen.findByText("Expert's Broadsword")).toBeInTheDocument()
    expect(screen.getByText('Masterpiece')).toBeInTheDocument()
  })

  it('switching enchant navigates to the @n variant', async () => {
    renderPage()
    expect(await screen.findByText("Expert's Broadsword")).toBeInTheDocument()

    await userEvent.click(screen.getByText('.2'))
    await waitFor(() => {
      const calls = fetchSpy.mock.calls.map(c => String(c[0]))
      expect(calls.some(u => u.includes('T5_MAIN_SWORD%402') || u.includes('T5_MAIN_SWORD@2'))).toBe(true)
    })
  })
})
