import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { LoginModal } from './LoginModal'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

const AVATAR_URL = 'https://cdn.discordapp.com/avatars/d1/somehash.png'

function tester(member: boolean) {
  return {
    id: 'u1',
    discord_id: 'd1',
    username: 'Tester#0001',
    avatar: AVATAR_URL,
    guilds: {
      running_dawn: { is_member: member, roles: {} },
      forgehaven: { is_member: true, roles: {} },
    },
  }
}

beforeEach(() => {
  fetchSpy.mockReset()
  localStorage.clear()
})

function renderModal(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <LoginModal open onClose={() => {}} />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginModal', () => {
  it('logged out: shows Discord login + the optional-login note', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))

    renderModal()

    expect(await screen.findByText('Login with Discord')).toBeInTheDocument()
    expect(screen.getByText(/FFXI Spell Tracker/)).toBeInTheDocument()
    expect(screen.getByText(/login is optional/i)).toBeInTheDocument()
  })

  it('logged in on a games route: account + Tools statement + per-guild access', async () => {
    fetchSpy.mockResolvedValue(ok(tester(true)))

    renderModal('/games/ffxi/spell-tracker')

    expect(await screen.findByText('Tester#0001')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    expect(screen.getByText(/Nothing you do in Tools/i)).toBeInTheDocument()
    // every reported guild renders
    expect(screen.getByText('Running Dawn')).toBeInTheDocument()
    expect(screen.getByText('Forgehaven')).toBeInTheDocument()
    expect(screen.getAllByText('✓ Member')).toHaveLength(2)
  })

  it('names WoW roles and hides a missing leadership chip', async () => {
    const user = tester(true)
    user.guilds.running_dawn.roles = { wow_member: true, wow_leadership: false }
    fetchSpy.mockResolvedValue(ok(user))

    renderModal('/games/wow-forever')

    expect(await screen.findByText('✓ WoW Guild Member')).toBeInTheDocument()
    expect(screen.queryByText(/WoW Guild Leadership/)).not.toBeInTheDocument()
  })

  it('logged in: avatar renders the backend URL verbatim', async () => {
    fetchSpy.mockResolvedValue(ok(tester(true)))

    const { container } = renderModal('/games/ffxi/spell-tracker')

    await screen.findByText('Tester#0001')
    const img = container.querySelector('img.rounded-full')
    expect(img).toHaveAttribute('src', AVATAR_URL)
  })

  it('logged in on an FFXI route: lists and registers characters', async () => {
    fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/auth/me')) return Promise.resolve(ok(tester(true)))
      if (u.includes('/game/ffxi/characters') && init?.method === 'POST') {
        return Promise.resolve(ok({ id: 'c2', name: 'Newchar', nation: 1, avatar: null }))
      }
      if (u.includes('/game/ffxi/characters')) {
        return Promise.resolve(ok([{ id: 'c1', name: 'Mychar', nation: 2, avatar: 'Hm1' }]))
      }
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
    })

    renderModal('/games/ffxi/spell-tracker')

    expect(await screen.findByText('Mychar')).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Character name'), 'Newchar')
    await userEvent.click(screen.getByText('Add'))

    expect(await screen.findByText('Newchar')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.forgehaven.io/game/ffxi/characters',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Newchar' }) }),
    )
  })

  it('FFXI registration surfaces backend errors', async () => {
    fetchSpy.mockImplementation((url: string | URL, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/auth/me')) return Promise.resolve(ok(tester(true)))
      if (u.includes('/game/ffxi/characters') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({
          status: 'error', message: 'Character not found on HorizonXI', payload: null,
        }), { status: 200 }))
      }
      if (u.includes('/game/ffxi/characters')) return Promise.resolve(ok([]))
      return Promise.resolve(new Response(JSON.stringify({ status: 'error' }), { status: 404 }))
    })

    renderModal('/games/ffxi/spell-tracker')

    const input = await screen.findByPlaceholderText('Character name')
    await userEvent.type(input, 'Ghost')
    await userEvent.click(screen.getByText('Add'))

    expect(await screen.findByText('Character not found on HorizonXI')).toBeInTheDocument()
  })
})
