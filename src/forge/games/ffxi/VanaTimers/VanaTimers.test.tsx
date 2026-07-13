import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VanaTimers } from './VanaTimers'

// Golden instant: Vana 1300-02-03 00:00:00 Firesday, Waning Gibbous 76%.
const V1 = Date.UTC(2018, 3, 29, 12, 7, 12)

describe('VanaTimers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(V1)
  })
  afterEach(() => vi.useRealTimers())

  it('renders clock, date, moon, tally, and schedules', () => {
    render(<VanaTimers />)

    expect(screen.getByText('00:00:00')).toBeInTheDocument()
    expect(screen.getByText('1300-02-03')).toBeInTheDocument()
    expect(screen.getByText('Firesday')).toBeInTheDocument()
    expect(screen.getByText('Waning Gibbous')).toBeInTheDocument()
    expect(screen.getByText('76%')).toBeInTheDocument()
    expect(screen.getByTestId('moon-svg')).toBeInTheDocument()
    expect(screen.getByText('Next conquest tally')).toBeInTheDocument()
    expect(screen.getByText('01:13')).toBeInTheDocument()
  })

  it('renders route endpoints with nation icons and centered arrows', () => {
    render(<VanaTimers />)

    expect(screen.getAllByText('Jeuno').length).toBeGreaterThan(0)
    expect(screen.getAllByText("San d'Oria").length).toBeGreaterThan(0)
    expect(screen.getAllByText('Selbina').length).toBeGreaterThan(0)
  })

  it('renders manaclipper, barge, RSE, lunar, day items, and sources', () => {
    render(<VanaTimers />)

    expect(screen.getByText('Maliyakaleya Reef tour')).toBeInTheDocument()
    expect(screen.getAllByText(/Landing/).length).toBeGreaterThan(0)
    expect(screen.getByText('Race specific equipment')).toBeInTheDocument()
    expect(screen.getByText('All races')).toBeInTheDocument()
    expect(screen.getByText('now')).toBeInTheDocument()
    expect(screen.getByText('Full Moon')).toBeInTheDocument()
    expect(screen.getByText('New Moon')).toBeInTheDocument()
    // V1 is Firesday: Movalpolos Water shows as upcoming on Lightsday.
    expect(screen.getByText(/Movalpolos Water · Lightsday in/)).toBeInTheDocument()
    expect(screen.getByText('live weather (wiki)')).toHaveAttribute(
      'href', 'https://horizonffxi.wiki/Special:WeatherForecast')
  })
})
