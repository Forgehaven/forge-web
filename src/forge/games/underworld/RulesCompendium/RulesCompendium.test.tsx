import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext } from '../../../../auth/authContext'
import Compendium from './RulesCompendium'

const loggedOut = {
  user: null, loading: false, isAuthenticated: false,
  login: vi.fn(), logout: vi.fn(), clearAuth: vi.fn(),
}

const RulesCompendium = () => <AuthContext.Provider value={loggedOut}><Compendium /></AuthContext.Provider>

describe('RulesCompendium', () => {
  it('searches every section from the All tab', async () => {
    const user = userEvent.setup()
    render(<RulesCompendium />)
    expect(screen.getByText(/Search races, cultures/)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search everything…'), 'goblin')
    expect(screen.getByRole('heading', { name: 'Races' })).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Search everything…'))
    await user.type(screen.getByPlaceholderText('Search everything…'), 'zzqx')
    expect(screen.getByText('Nothing matches "zzqx".')).toBeInTheDocument()
  })

  it('searches traits and abilities, not just names and lore', async () => {
    const user = userEvent.setup()
    render(<RulesCompendium />)
    await user.type(screen.getByPlaceholderText('Search everything…'), 'parasites')
    expect(screen.getByText('Goblin')).toBeInTheDocument()
  })

  it('lists out of game frag purchases like Spiritual Resolve', async () => {
    const user = userEvent.setup()
    render(<RulesCompendium />)
    await user.type(screen.getByPlaceholderText('Search everything…'), 'spiritual resolve')
    expect(screen.getByText('100 frags at level 1-4, 250 at level 5-9, 500 at level 10-15')).toBeInTheDocument()
  })
})

describe('RulesCompendium favourites', () => {
  it('stars an entry and lists it under the star tab', async () => {
    localStorage.clear()
    const user = userEvent.setup()
    render(<RulesCompendium />)
    await user.click(screen.getByRole('button', { name: 'Favourites' }))
    expect(screen.getByText(/Tap ☆ on any entry/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Races' }))
    await user.click(screen.getAllByRole('button', { name: 'Favourite' })[0])
    await user.click(screen.getByRole('button', { name: 'Favourites' }))
    expect(screen.getAllByRole('button', { name: 'Unfavourite' })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Races' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Unfavourite' }))
    expect(screen.getByText(/Tap ☆ on any entry/)).toBeInTheDocument()
  })
})
