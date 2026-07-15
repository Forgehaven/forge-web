import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { VanaTimers } from './VanaTimers'
import { AlarmProvider } from '../../../../components/alarms/AlarmProvider'
import { ffxiAlarmTargets } from '../alarms'
import { playChime } from '../../../../lib/chime'

const renderPage = () => render(
  <AlarmProvider sources={{ ffxi: ffxiAlarmTargets }}>
    <VanaTimers />
  </AlarmProvider>,
)

vi.mock('../../../../lib/chime', () => ({
  ensureAudio: vi.fn(),
  hookAudioGesture: vi.fn(),
  playChime: vi.fn(),
  setChimeVolume: vi.fn(),
}))

// Golden instant: Vana 1300-02-03 00:00:00 Firesday, Waning Gibbous 76%.
const V1 = Date.UTC(2018, 3, 29, 12, 7, 12)

describe('VanaTimers', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(V1)
  })
  afterEach(() => vi.useRealTimers())

  it('renders clock, date, moon, tally, and schedules', () => {
    renderPage()

    expect(screen.getByTestId('vana-clock')).toHaveTextContent('00:00:00')
    expect(screen.getByText('1300-02-03')).toBeInTheDocument()
    expect(screen.getByText('Firesday')).toBeInTheDocument()
    expect(screen.getByText('Waning Gibbous')).toBeInTheDocument()
    expect(screen.getByText('76%')).toBeInTheDocument()
    expect(screen.getByTestId('moon-svg')).toBeInTheDocument()
    expect(screen.getByText('Next conquest tally')).toBeInTheDocument()
    expect(screen.getByText('01:13')).toBeInTheDocument()
  })

  it('renders route endpoints with nation icons and centered arrows', () => {
    renderPage()

    expect(screen.getAllByText('Jeuno').length).toBeGreaterThan(0)
    expect(screen.getAllByText("San d'Oria").length).toBeGreaterThan(0)
    expect(screen.getAllByText('Selbina').length).toBeGreaterThan(0)
  })

  it('renders manaclipper, barge, RSE, lunar, day items, and sources', () => {
    renderPage()

    expect(screen.getByText('Maliyakaleya Reef tour')).toBeInTheDocument()
    expect(screen.getAllByText(/Landing/).length).toBeGreaterThan(0)
    expect(screen.getByText('Race specific equipment')).toBeInTheDocument()
    expect(screen.getByText('All races')).toBeInTheDocument()
    expect(screen.getByText('now')).toBeInTheDocument()
    expect(screen.getByText('Full Moon')).toBeInTheDocument()
    expect(screen.getByText('New Moon')).toBeInTheDocument()
    // V1 is Firesday: all three timed items upcoming, sorted; night at Vana midnight.
    expect(screen.getByText('Movalpolos Water')).toBeInTheDocument()
    expect(screen.getByText('Treat Staff')).toBeInTheDocument()
    expect(screen.getByText('Amood')).toBeInTheDocument()
    expect(screen.getByText('Night')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle alert for Sunrise')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle alert for Conquest tally')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle alert for RSE week change')).toBeInTheDocument()
    // Guilds: Firesday is Carpenters' and Weavers' holiday; Fishermen open at 03:00.
    expect(screen.getByText('Crafting guilds & shops')).toBeInTheDocument()
    expect(screen.getAllByText('holiday today')).toHaveLength(2)
    // Fishermen and Tanners both open at 03:00 -> identical countdowns.
    expect(screen.getAllByText('opens in 7m 12s')).toHaveLength(2)
    expect(screen.getByLabelText('Toggle alert for Alchemists opens')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle alert for Full Moon')).toBeInTheDocument()
    expect(screen.getByText('live weather (wiki)')).toHaveAttribute(
      'href', 'https://horizonffxi.wiki/Special:WeatherForecast')
  })

  it('armed alert chimes inside the lead window and auto-disarms', () => {
    // 90 earth seconds before the ferry's 00:00 departure - inside the 2m lead.
    vi.setSystemTime(V1 - 90_000)
    renderPage()

    fireEvent.click(screen.getByLabelText('Toggle alert for Selbina → Mhaura'))
    fireEvent.click(screen.getByLabelText('Chime 2m before'))
    let stored = JSON.parse(localStorage.getItem('forgegames_alarms_v1')!)
    expect(stored.armed).toEqual([{ key: 'ffxi:Selbina → Mhaura', lead: 120_000 }])

    act(() => { vi.advanceTimersByTime(300) })

    expect(playChime).toHaveBeenCalledTimes(1)
    stored = JSON.parse(localStorage.getItem('forgegames_alarms_v1')!)
    expect(stored.armed).toEqual([])

    // Further ticks must not re-fire the same departure instance.
    act(() => { vi.advanceTimersByTime(600) })
    expect(playChime).toHaveBeenCalledTimes(1)

    // Re-arming the same route inside the same window fires again.
    fireEvent.click(screen.getByLabelText('Toggle alert for Selbina → Mhaura'))
    fireEvent.click(screen.getByLabelText('Chime 2m before'))
    act(() => { vi.advanceTimersByTime(300) })
    expect(playChime).toHaveBeenCalledTimes(2)
  })

  it('migrates legacy armed string list using the old global lead', () => {
    localStorage.setItem('forgegames_ffxi_vanatimers_v1', JSON.stringify({
      collapsed: {}, alertLead: 5, armed: ['Full Moon'],
    }))
    renderPage()

    expect(screen.getByText(/Alarms \(1\)/)).toBeInTheDocument()
    expect(screen.getAllByText('5m').length).toBeGreaterThan(0)
  })

  it('floating alarms widget lists armed alerts sorted and disarms via ×', () => {
    vi.setSystemTime(V1 - 90_000)
    renderPage()

    expect(screen.queryByText(/Alarms \(/)).toBeNull()

    fireEvent.click(screen.getByLabelText('Toggle alert for Full Moon'))
    fireEvent.click(screen.getByLabelText('Chime 1h before'))
    fireEvent.click(screen.getByLabelText('Toggle alert for Selbina → Mhaura'))
    fireEvent.click(screen.getByLabelText('Chime 2m before'))

    expect(screen.getByText(/Alarms \(2\)/)).toBeInTheDocument()
    const disarms = screen.getAllByLabelText(/Disarm alarm for/)
    expect(disarms).toHaveLength(2)
    // Ferry departs sooner, so it sorts to the bottom.
    expect(disarms[1]).toHaveAccessibleName('Disarm alarm for Selbina → Mhaura')
    // Per-alarm leads shown on the rows.
    expect(screen.getByText('1h')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Disarm alarm for Full Moon'))
    expect(screen.getAllByLabelText(/Disarm alarm for/)).toHaveLength(1)
    const stored = JSON.parse(localStorage.getItem('forgegames_alarms_v1')!)
    expect(stored.armed).toEqual([{ key: 'ffxi:Selbina → Mhaura', lead: 120_000 }])
  })

  it('volume bars persist the chime level without playing a preview', () => {
    renderPage()

    fireEvent.click(screen.getByLabelText('Chime volume loud'))

    expect(playChime).not.toHaveBeenCalled()
    const stored = JSON.parse(localStorage.getItem('forgegames_alarms_v1')!)
    expect(stored.chimeLevel).toBe('loud')
  })

  it('repeat mode rings until the alarm modal is dismissed', () => {
    vi.setSystemTime(V1 - 90_000)
    renderPage()

    fireEvent.click(screen.getByLabelText('Repeat alarm until dismissed'))
    fireEvent.click(screen.getByLabelText('Toggle alert for Selbina → Mhaura'))
    fireEvent.click(screen.getByLabelText('Chime 2m before'))
    act(() => { vi.advanceTimersByTime(300) })

    expect(screen.getByText('Alarm')).toBeInTheDocument()
    // The full route string only appears in the modal (table cells split endpoints).
    expect(screen.getByText('Selbina → Mhaura')).toBeInTheDocument()
    const callsAfterFire = vi.mocked(playChime).mock.calls.length
    expect(callsAfterFire).toBe(1)

    act(() => { vi.advanceTimersByTime(6500) })
    expect(vi.mocked(playChime).mock.calls.length).toBeGreaterThanOrEqual(callsAfterFire + 2)

    fireEvent.click(screen.getByText('Dismiss'))
    expect(screen.queryByText('Alarm')).toBeNull()

    const callsAfterDismiss = vi.mocked(playChime).mock.calls.length
    act(() => { vi.advanceTimersByTime(7000) })
    expect(vi.mocked(playChime).mock.calls.length).toBe(callsAfterDismiss)
  })
})
