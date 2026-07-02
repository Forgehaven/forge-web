import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthProvider'
import { SidebarFooter } from './SidebarFooter'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

const AVATAR_URL = 'https://cdn.discordapp.com/avatars/d1/hash.png'

function ok(payload: unknown) {
  return new Response(JSON.stringify({ status: 'ok', message: '', payload }), { status: 200 })
}

beforeEach(() => {
  fetchSpy.mockReset()
  localStorage.clear()
})

function renderFooter(path = '/tools') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <SidebarFooter onOpenSettings={() => {}} onOpenLogin={() => {}} />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('SidebarFooter', () => {
  it('shows the person icon when logged out', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error' }), { status: 401 }))

    const { container } = renderFooter()

    expect(await screen.findByText('Login')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('shows the Discord avatar when logged in', async () => {
    fetchSpy.mockResolvedValue(ok({
      id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: AVATAR_URL,
      guilds: { running_dawn: { is_member: true, roles: { albion_guild: true } } },
    }))

    const { container } = renderFooter()

    expect(await screen.findByText('Tester#0001')).toBeInTheDocument()
    const img = container.querySelector('button img')
    expect(img).toHaveAttribute('src', AVATAR_URL)
  })

  it('falls back to the icon when the user has no avatar', async () => {
    fetchSpy.mockResolvedValue(ok({
      id: 'u1', discord_id: 'd1', username: 'Tester#0001', avatar: null,
      guilds: {},
    }))

    const { container } = renderFooter()

    expect(await screen.findByText('Tester#0001')).toBeInTheDocument()
    expect(container.querySelector('button img')).toBeNull()
  })
})
