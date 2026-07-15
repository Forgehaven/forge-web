import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { AlarmProvider, AlertBell } from './AlarmProvider'
import { useAlarmSource, type AlarmTarget } from './alarmContext'
import { playChime } from '../../lib/chime'

vi.mock('../../lib/chime', () => ({
  ensureAudio: vi.fn(),
  hookAudioGesture: vi.fn(),
  playChime: vi.fn(),
  setChimeVolume: vi.fn(),
}))

function DummyPage() {
  const alarms = useAlarmSource('dummy')
  return (
    <AlertBell target="Test Event" armed={alarms.has('Test Event')} onToggle={alarms.toggle} />
  )
}

const dummySource = (): AlarmTarget[] => [{ key: 'Test Event', inMs: 90_000 }]

describe('AlarmProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)
  })
  afterEach(() => vi.useRealTimers())

  it('a generic source can arm, fire, and auto-disarm with no game code involved', () => {
    render(
      <AlarmProvider sources={{ dummy: dummySource }}>
        <DummyPage />
      </AlarmProvider>,
    )

    fireEvent.click(screen.getByLabelText('Toggle alert for Test Event'))
    fireEvent.click(screen.getByLabelText('Chime 2m before'))

    expect(screen.getByText(/Alarms \(1\)/)).toBeInTheDocument()
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    let stored = JSON.parse(localStorage.getItem('forgegames_alarms_v1')!)
    expect(stored.armed).toEqual([{ key: 'dummy:Test Event', lead: 120_000 }])

    act(() => { vi.advanceTimersByTime(300) })

    expect(playChime).toHaveBeenCalledTimes(1)
    stored = JSON.parse(localStorage.getItem('forgegames_alarms_v1')!)
    expect(stored.armed).toEqual([])
  })
})
