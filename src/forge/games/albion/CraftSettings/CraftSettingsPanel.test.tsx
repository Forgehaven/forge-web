import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../../auth/AuthProvider'
import { CraftSettingsPanel } from './CraftSettingsPanel'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

beforeEach(() => {
  fetchSpy.mockReset()
  localStorage.clear()
  // Logged out: /auth/me fails, panel stays on the localStorage path.
  fetchSpy.mockResolvedValue(
    new Response(JSON.stringify({ status: 'error', message: '' }), { status: 401 }),
  )
})

describe('CraftSettingsPanel', () => {
  it('renders per-user toggles, the station-fee grid and city bonuses', async () => {
    render(<MemoryRouter><AuthProvider><CraftSettingsPanel /></AuthProvider></MemoryRouter>)

    expect(await screen.findByText(/i have premium/i)).toBeInTheDocument()
    expect(screen.getByText(/i craft with focus/i)).toBeInTheDocument()
    expect(screen.getByText('Station Fees')).toBeInTheDocument()
    expect(screen.getByText('City Production Bonuses')).toBeInTheDocument()
    // Bridgewatch shows up in the default-town select + fee grid + bonus table.
    expect(screen.getAllByText('Bridgewatch').length).toBeGreaterThan(0)
    // Logged out copy.
    expect(screen.getByText(/saved to this browser/i)).toBeInTheDocument()
  })
})
