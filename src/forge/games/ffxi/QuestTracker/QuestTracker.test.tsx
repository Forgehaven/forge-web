import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { QuestTracker } from './QuestTracker'
import { lastConquestReset } from '../conquest'

const SK = 'forgegames_ffxi_questtracker_v1'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

beforeEach(() => {
  fetchSpy.mockReset()
  fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))
  localStorage.clear()
})

function renderTracker() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <QuestTracker />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('QuestTracker logged out', () => {
  it('toggles persist to localStorage', async () => {
    renderTracker()

    await userEvent.click(screen.getByLabelText("Eco-Warrior San d'Oria"))
    await userEvent.click(screen.getByLabelText('Highwind killed this week'))

    const stored = JSON.parse(localStorage.getItem(SK)!)
    expect(stored.eco.sandoria).toBeGreaterThan(0)
    expect(stored.highwind).toBeGreaterThan(0)
    // Both the Eco and Highwind sections flip to done.
    expect(screen.getAllByText('Done this week')).toHaveLength(2)
  })

  it('a stale Highwind kill reads as not done this week', () => {
    localStorage.setItem(SK, JSON.stringify({
      eco: {},
      highwind: lastConquestReset() - 1000,
    }))

    renderTracker()

    expect(screen.getByLabelText('Highwind killed this week')).not.toBeChecked()
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('a fully completed stale rotation restarts unchecked', () => {
    const old = lastConquestReset() - 1000
    localStorage.setItem(SK, JSON.stringify({
      eco: { sandoria: old, bastok: old - 1, windurst: old - 2 },
      highwind: null,
    }))

    renderTracker()

    expect(screen.getByLabelText("Eco-Warrior San d'Oria")).not.toBeChecked()
    expect(screen.getByLabelText('Eco-Warrior Bastok')).not.toBeChecked()
    expect(screen.getByLabelText('Eco-Warrior Windurst')).not.toBeChecked()
    expect(screen.getByText('1 available this week')).toBeInTheDocument()
  })

  it('an unfinished rotation persists across weeks', () => {
    localStorage.setItem(SK, JSON.stringify({
      eco: { bastok: lastConquestReset() - 1000 },
      highwind: null,
    }))

    renderTracker()

    // Bastok stays done (rotation), but no Eco was completed THIS week.
    expect(screen.getByLabelText('Eco-Warrior Bastok')).toBeChecked()
    expect(screen.getByText('1 available this week')).toBeInTheDocument()
  })
})

describe('QuestTracker synced', () => {
  function mockApi() {
    fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/auth/me')) {
        return Promise.resolve(ok({
          id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {},
        }))
      }
      if (u.includes('/data/quest_tracker')) {
        if (init?.method === 'PUT') return Promise.resolve(ok(null))
        return Promise.resolve(ok({
          data: { eco: { windurst: Date.now() }, highwind: null }, updated_at: null,
        }))
      }
      if (u.includes('/game/ffxi/char/')) {
        return Promise.resolve(ok({ name: 'Mychar', nation: 2, rank: 'Rank 4', avatar: null }))
      }
      if (u.includes('/game/ffxi/characters')) {
        return Promise.resolve(ok([{ id: 'c1', name: 'Mychar', nation: 2, avatar: null }]))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
    })
  }

  it('loads the character blob and shows the header with rank', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi()

    renderTracker()

    expect(await screen.findByText('Mychar')).toBeInTheDocument()
    expect(await screen.findByText('· Rank 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Eco-Warrior Windurst')).toBeChecked()
    expect(screen.getByText('Done this week')).toBeInTheDocument()
  })

  it('toggling saves to the character blob, not localStorage', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi()

    const { unmount } = renderTracker()

    await screen.findByText('Mychar')
    expect(screen.getByLabelText('Eco-Warrior Windurst')).toBeChecked()
    await userEvent.click(screen.getByLabelText('Eco-Warrior Bastok'))
    // Unmount flushes the debounced save immediately.
    unmount()

    const put = fetchSpy.mock.calls.find(call =>
      String(call[0]).includes('/characters/c1/data/quest_tracker')
        && (call[1] as RequestInit | undefined)?.method === 'PUT')
    expect(put).toBeTruthy()
    const body = JSON.parse(String((put![1] as RequestInit).body))
    expect(body.data.eco.bastok).toBeGreaterThan(0)
    expect(body.data.eco.windurst).toBeGreaterThan(0)
    expect(localStorage.getItem(SK)).toBeNull()
  })
})
