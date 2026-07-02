import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { ClammingTracker } from './ClammingTracker'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

function mockApi({ blob = {} }: { blob?: unknown } = {}) {
  fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
    const u = String(url)
    if (u.includes('/auth/me')) {
      return Promise.resolve(ok({
        id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {},
      }))
    }
    if (u.includes('/user-data/clamming') && init?.method === 'PUT') {
      return Promise.resolve(ok(null))
    }
    if (u.includes('/user-data/clamming')) {
      return Promise.resolve(ok({ data: blob, updated_at: null }))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
}

beforeEach(() => {
  fetchSpy.mockReset()
  localStorage.clear()
})

function renderTracker() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ClammingTracker />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ClammingTracker sync', () => {
  it('flashes Save when local prices differ from the server, then saves', async () => {
    localStorage.setItem(STORAGE_KEYS.ffxiClamming, JSON.stringify({
      overrides: { nebimonite: { ah: 500 } },
    }))
    mockApi({ blob: {} })

    renderTracker()

    const save = await screen.findByRole('button', { name: 'Save' })
    expect(save.className).toContain('animate-pulse')

    await userEvent.click(save)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument()
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.forgehaven.io/game/ffxi/user-data/clamming',
      expect.objectContaining({ method: 'PUT' }),
    )
    const put = fetchSpy.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PUT')
    expect(JSON.parse((put![1] as RequestInit).body as string).data.overrides.nebimonite.ah).toBe(500)
  })

  it('loads the account blob from the server and shows Saved', async () => {
    // coral-fragment: AH 2400 beats vendor 1750, so it lands in the AH section
    // where the editable price input renders.
    mockApi({ blob: { overrides: { 'coral-fragment': { ah: 2400 } }, exceptions: {}, disabledRec: {} } })

    renderTracker()

    // Wait on the price input itself - the button label alone can also match
    // the transient empty-baseline state while the blob request is in flight.
    expect(await screen.findByDisplayValue('2400')).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'Saved' })
    expect(save.className).not.toContain('animate-pulse')
  })
})
