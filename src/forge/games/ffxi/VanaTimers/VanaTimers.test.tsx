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
    expect(screen.getByText('Waning Gibbous · waning')).toBeInTheDocument()
    expect(screen.getByText('76%')).toBeInTheDocument()
    expect(screen.getByText('Next conquest tally')).toBeInTheDocument()
    expect(screen.getByText("Jeuno → San d'Oria")).toBeInTheDocument()
    expect(screen.getByText('01:13')).toBeInTheDocument()
    expect(screen.getByText('Selbina → Mhaura')).toBeInTheDocument()
  })
})
