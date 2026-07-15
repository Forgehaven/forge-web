import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { AlarmProvider } from '../../../../components/alarms/AlarmProvider'
import { ffxiAlarmTargets } from '../alarms'
import { LockoutTracker, LOCKOUT_MS } from './LockoutTracker'

vi.mock('../../../../lib/chime', () => ({
  ensureAudio: vi.fn(),
  hookAudioGesture: vi.fn(),
  playChime: vi.fn(),
  setChimeVolume: vi.fn(),
}))

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

// Wed 2026-07-15 12:00 UTC: the last conquest tally was Sun 2026-07-12 14:59:59 UTC.
const NOW = Date.UTC(2026, 6, 15, 12, 0, 0)

function mockApi(blob: unknown) {
  fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
    const u = String(url)
    if (u.includes('/auth/me')) {
      return Promise.resolve(ok({
        id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null, guilds: {},
      }))
    }
    if (u.includes('/data/lockout_tracker')) {
      if (init?.method === 'PUT') return Promise.resolve(ok({ updated_at: null }))
      return Promise.resolve(ok({ data: blob, updated_at: null }))
    }
    if (u.includes('/game/ffxi/char/')) {
      return Promise.resolve(ok({ name: 'Mychar', nation: 2, rank: 'Rank 5', avatar: null }))
    }
    if (u.includes('/game/ffxi/characters')) {
      return Promise.resolve(ok([{ id: 'c1', name: 'Mychar', nation: 2, avatar: null }]))
    }
    return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
  })
}

const renderPage = () => render(
  <MemoryRouter>
    <AuthProvider>
      <AlarmProvider sources={{ ffxi: ffxiAlarmTargets }}>
        <LockoutTracker />
      </AlarmProvider>
    </AuthProvider>
  </MemoryRouter>,
)

describe('LockoutTracker', () => {
  beforeEach(() => {
    fetchSpy.mockReset()
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('shows dynamis countdown, tally usage, and a ready limbus', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi({
      dynamis: [NOW - 3_600_000, NOW - 5 * 86_400_000],
      limbus: NOW - LOCKOUT_MS - 1_000,
    })
    renderPage()
    await act(async () => { await Promise.resolve() })

    // Last entry 1h ago -> ready in 71h.
    expect(screen.getByText(/in 2d 23h/)).toBeInTheDocument()
    // Only the 1h-ago entry falls inside the current tally week.
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getByText('READY')).toBeInTheDocument()
  })

  it('logs a dynamis entry, mirrors it, and syncs it to the blob', async () => {
    localStorage.setItem('forgegames_ffxi_selectedchar_v1', 'c1')
    mockApi({ dynamis: [], limbus: null })
    const { unmount } = renderPage()
    await act(async () => { await Promise.resolve() })

    fireEvent.click(screen.getByText('Log entry now'))

    const mirror = JSON.parse(localStorage.getItem('forgegames_ffxi_lockouts_v1')!)
    expect(mirror.dynamis).toEqual([NOW])
    expect(mirror.charName).toBe('Mychar')

    unmount()
    const put = fetchSpy.mock.calls.find(([u, init]) =>
      String(u).includes('/data/lockout_tracker') && (init as RequestInit | undefined)?.method === 'PUT')
    expect(put).toBeTruthy()
    const body = JSON.parse((put![1] as RequestInit).body as string)
    expect(body.data.dynamis).toEqual([NOW])
  })

  it('exposes lockout alarm targets from the localStorage mirror', () => {
    localStorage.setItem('forgegames_ffxi_lockouts_v1', JSON.stringify({
      dynamis: [NOW - 3_600_000], limbus: NOW - 3_600_000,
    }))
    const targets = ffxiAlarmTargets(NOW)
    expect(targets.find(t => t.key === 'Dynamis ready')?.inMs).toBe(71 * 3_600_000)
    expect(targets.find(t => t.key === 'Limbus ready')?.inMs).toBe(71 * 3_600_000)
  })
})
