import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext } from '../../../../auth/authContext'
import CharacterPlanner from './CharacterPlanner'

const loggedOut = {
  user: null, loading: false, isAuthenticated: false,
  login: vi.fn(), logout: vi.fn(), clearAuth: vi.fn(),
}

function renderPlanner() {
  return render(
    <AuthContext.Provider value={loggedOut}>
      <CharacterPlanner />
    </AuthContext.Provider>,
  )
}

beforeEach(() => localStorage.clear())

describe('CharacterPlanner', () => {
  it('buys skills on the selected timeline step and keeps the draft locally', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await user.selectOptions(screen.getByLabelText('Race'), 'Human')
    await user.click(screen.getByLabelText(/Use blanket timeline/))
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(screen.getByRole('button', { name: '+ Add blanket' }))
    await user.click(screen.getByRole('button', { name: 'Add Read & Write' }))

    const timeline = screen.getByRole('heading', { name: 'Timeline' }).closest('section')!
    const blanket = within(timeline).getByText('Blanket 1').closest('li')!
    expect(within(blanket).getByText('Read & Write')).toBeInTheDocument()

    // Read Magic is now buyable; Read Magic: Advanced still is not.
    expect(screen.getByRole('button', { name: 'Add Read Magic' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Add Read Magic: Advanced' })).toBeDisabled()

    const draft = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!)
    expect(draft.build.useTimeline).toBe(true)
    expect(draft.build.purchases).toMatchObject([{ skill: 'Read & Write', at: 1 }])
    expect(screen.getByText(/only saved in this browser/)).toBeInTheDocument()
  })

  it('flags purchases whose prereq is removed', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(screen.getByRole('button', { name: 'Add Read & Write' }))
    await user.click(screen.getByRole('button', { name: 'Add Read Magic' }))
    await user.click(screen.getByRole('button', { name: 'Remove Read & Write' }))

    expect(screen.getByText(/1 purchase is invalid/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove them' }))
    expect(screen.queryByRole('button', { name: 'Remove Read Magic' })).toBeNull()
  })
})

describe('CharacterPlanner timeline', () => {
  it('back-fills past blankets and adds a blanket in a chosen month', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.click(screen.getByLabelText(/Use blanket timeline/))
    await user.selectOptions(screen.getByLabelText('Character created year'), '2025')
    await user.selectOptions(screen.getByLabelText('Character created month'), 'Jan')

    await user.click(screen.getByText('Building on an existing character?'))
    await user.type(screen.getByLabelText('Blankets applied'), '9')
    await user.click(screen.getByRole('button', { name: 'Add history' }))
    expect(screen.getByText('Blanket 9')).toBeInTheDocument()
    expect(screen.getByLabelText('Blanket 9 month')).toHaveDisplayValue('May')
    expect(screen.getByLabelText('Blanket 9 year')).toHaveDisplayValue('2025')

    await user.selectOptions(screen.getByLabelText('Next blanket month'), 'Aug')
    await user.click(screen.getByRole('button', { name: '+ Add blanket' }))
    expect(screen.getByLabelText('Blanket 10 month')).toHaveDisplayValue('Aug')
  })
})

describe('CharacterPlanner simple mode', () => {
  it('free-picks against a blanket count, shows overspend, and unbuys from the catalog', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mercenary')
    // Mercenary, 0 blankets: 150 CP. Read & Write 70 + Read Magic 45 + Shield 50 = 165.
    await user.click(screen.getByRole('button', { name: 'Add Read & Write' }))
    await user.click(screen.getByRole('button', { name: 'Add Read Magic' }))
    await user.click(screen.getByRole('button', { name: 'Add Shield' }))
    expect(screen.getByText('15 CP over. Add blankets or drop a skill.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'One more blanket' }))
    expect(screen.queryByText(/CP over/)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Remove one Shield' }))
    expect(screen.queryByRole('button', { name: 'Remove one Shield' })).toBeNull()
    const draft = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!)
    expect(draft.build.simple).toMatchObject({ blankets: 1, purchases: [{ skill: 'Read & Write' }, { skill: 'Read Magic' }] })
    expect(draft.build.purchases).toEqual([])
  })
})

describe('CharacterPlanner magic', () => {
  it('fills the pyramid including missing prerequisites', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(screen.getByRole('tab', { name: 'Magic' }))
    await user.click(screen.getByText('Fill the spell pyramid'))
    await user.selectOptions(screen.getByLabelText('Fill through circle'), '2')
    expect(screen.getByText(/Adds Read & Write, Read Magic, Sphere of Magic: 1st, 3 spell slots/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add to plan' }))

    const draft = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!)
    expect(draft.build.simple.purchases.map((p: { skill: string; choice?: string }) => p.choice ?? p.skill))
      .toEqual(['Read & Write', 'Read Magic', 'Sphere of Magic: 1st', '1', '1', '2'])
  })
})

describe('CharacterPlanner build bar', () => {
  it('clears skills but keeps the character', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.type(screen.getByLabelText('Character name'), 'Grak')
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(screen.getByRole('button', { name: 'Add Read & Write' }))
    await user.click(screen.getByRole('button', { name: 'Clear skills' }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))

    const draft = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!)
    expect(draft.build).toMatchObject({ name: 'Grak', occupation: 'Mage', simple: { purchases: [] } })
  })

  it('saves to the device when logged out and reopens from the list', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.type(screen.getByLabelText('Character name'), 'Grak')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: /Grak/ })).toHaveAttribute('title', 'Saved on this device')

    await user.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByLabelText('Character name')).toHaveValue('')
    await user.type(screen.getByLabelText('Character name'), 'Vex')
    // Unsaved edits: switching asks first.
    await user.click(screen.getByRole('button', { name: /Grak/ }))
    await user.click(screen.getByRole('button', { name: 'Discard and continue' }))
    expect(screen.getByLabelText('Character name')).toHaveValue('Grak')
    expect(JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!).local).toHaveLength(1)
  })
})
