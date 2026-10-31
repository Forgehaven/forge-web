import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext } from '../../../../auth/authContext'
import CharacterPlanner from './CharacterPlanner'

const loggedOut = {
  user: null, loading: false, isAuthenticated: false,
  login: vi.fn(), logout: vi.fn(), clearAuth: vi.fn(),
}

// The saves bar and sandbox list start collapsed; open them.
function openCards() {
  for (const b of screen.queryAllByRole('button', { name: /^▸(Saves|Skills\/Magic List)/, expanded: false })) fireEvent.click(b)
}

function renderPlanner() {
  const view = render(
    <AuthContext.Provider value={loggedOut}>
      <CharacterPlanner />
    </AuthContext.Provider>,
  )
  openCards()
  return view
}

// Most tests drive the +/- buttons; the count picker test opts back in.
beforeEach(() => { localStorage.clear(); localStorage.setItem('forgegames_uw_skillinput_v1', 'buttons') })

describe('CharacterPlanner', () => {
  it('buys skills on the selected timeline step and keeps the draft locally', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await user.selectOptions(screen.getByLabelText('Race'), 'Human')
    await user.click(screen.getByRole('radio', { name: 'Blanket timeline' }))
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(screen.getByRole('button', { name: '+ Add blanket' }))
    await user.click(screen.getByRole('button', { name: 'Add Read & Write' }))

    // Read Magic is now buyable; Read Magic: Advanced still is not.
    expect(screen.getByRole('button', { name: 'Add Read Magic' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Add Read Magic: Advanced' })).toBeDisabled()

    const timeline = screen.getByRole('heading', { name: 'Timeline' }).closest('section')!
    const blanket = within(timeline).getByText('Blanket 1').closest('li')!
    expect(within(blanket).getByText('Read & Write')).toBeInTheDocument()
    const draft = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!)
    expect(draft.build.mode).toBe('timeline')
    expect(draft.build.purchases).toMatchObject([{ skill: 'read-write', at: 1 }])
    expect(screen.getByText(/only kept in this browser/)).toBeInTheDocument()
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
    await user.click(screen.getByRole('radio', { name: 'Blanket timeline' }))
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
    expect(draft.build.simple).toMatchObject({ blankets: 1, purchases: [{ skill: 'read-write' }, { skill: 'read-magic' }] })
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
    await user.selectOptions(screen.getByLabelText('Fill through circle'), '1-2')
    expect(screen.getByText(/Adds Read & Write, Read Magic, Sphere of Magic: 1st, 3 spell slots/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add to plan' }))

    const draft = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!)
    expect(draft.build.simple.purchases.map((p: { skill: string; choice?: string }) => p.choice ?? p.skill))
      .toEqual(['read-write', 'read-magic', 'sphere-1', '1', '1', '2'])
  })

  it('fills a second pyramid on top of the first, all legal', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(screen.getByRole('tab', { name: 'Magic' }))
    await user.click(screen.getByText('Fill the spell pyramid'))
    await user.selectOptions(screen.getByLabelText('Fill through circle'), '2-10')
    expect(screen.getByText(/Read Magic: Advanced, 90 spell slots/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add to plan' }))
    expect(screen.queryByText(/invalid/)).toBeNull()
    expect(screen.queryAllByLabelText(/Add \w+ circle slot/)).toEqual([])
    expect(screen.getByRole('button', { name: 'Spell slots full' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Remove last spell slot (9th)' }))
    expect(screen.getByRole('button', { name: /Add next spell slot \(9th/ })).toBeEnabled()
    expect(screen.getAllByLabelText(/Add \w+ circle slot/).map(b => b.getAttribute('aria-label'))).toEqual(['Add 9th circle slot'])
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
    expect(screen.getByRole('button', { name: /^Grak/ })).toHaveAttribute('title', 'Saved on this device')

    await user.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByLabelText('Character name')).toHaveValue('')
    await user.type(screen.getByLabelText('Character name'), 'Vex')
    // Unsaved edits: switching asks first.
    await user.click(screen.getByRole('button', { name: /^Grak/ }))
    await user.click(screen.getByRole('button', { name: 'Discard and continue' }))
    expect(screen.getByLabelText('Character name')).toHaveValue('Grak')
    expect(JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!).local).toHaveLength(1)
  })

  it('levels up an existing trade or starts another', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(screen.getByRole('button', { name: 'Add Tradesman' }))
    await user.type(screen.getByLabelText('Trade name'), 'Miner')
    await user.selectOptions(screen.getByLabelText('Tradesman choice'), 'Blacksmith')
    await user.click(screen.getByRole('button', { name: 'Add Tradesman' }))
    await user.selectOptions(screen.getByLabelText('Tradesman choice'), 'Miner (Blacksmith) to level 2')
    await user.click(screen.getByRole('button', { name: 'Add Tradesman' }))
    await user.type(screen.getByLabelText('Trade name'), 'Herb|alist')
    await user.selectOptions(screen.getByLabelText('Tradesman choice'), 'Alchemy')

    const picks = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!).build.simple.purchases
    expect(picks.map((p: { choice: string }) => p.choice)).toEqual(['Blacksmith|Miner', 'Blacksmith|Miner', 'Alchemy|Herbalist'])
  })

  it('locks a complete build until it is back to planning', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mercenary')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.selectOptions(screen.getByLabelText('Status'), 'complete')
    expect(screen.getByRole('button', { name: 'Add Shield' })).toBeDisabled()
    expect(screen.getByLabelText('Occupation')).toBeDisabled()
    // Read-only still lets you browse the rules.
    fireEvent.click(within(screen.getByRole('heading', { name: /^WarriorRules/ })).getByRole('button', { name: 'Rules' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Rules' })).getByRole('button', { name: /^Shield/ }))
    expect(screen.getByText(/A buckler cannot be larger/)).toBeInTheDocument()
    expect(screen.getByText(/iron bound shields have a threshold of 20/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close rules' }))
    await user.click(screen.getByRole('button', { name: 'Back to planning' }))
    expect(screen.getByRole('button', { name: 'Add Shield' })).toBeEnabled()
  })

  it('favourites float to the top and keep their order', async () => {
    const user = userEvent.setup()
    renderPlanner()
    for (const name of ['Grak', 'Vex']) {
      await user.click(screen.getByRole('button', { name: 'New' }))
      await user.type(screen.getByLabelText('Character name'), name)
      await user.click(screen.getByRole('button', { name: 'Save' }))
    }
    const names = () => screen.getAllByRole('button', { name: /^(Grak|Vex)/ }).map(b => b.textContent?.match(/Grak|Vex/)?.[0])
    expect(names()).toEqual(['Vex', 'Grak'])
    await user.click(screen.getByRole('button', { name: 'Favourite Grak' }))
    expect(names()).toEqual(['Grak', 'Vex'])
    const local = JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!).local
    expect(local.map((l: { name: string; favourite: boolean }) => [l.name, l.favourite])).toEqual([['Grak', true], ['Vex', false]])
  })

  it('autosaves a saved build and undoes edits', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.type(screen.getByLabelText('Character name'), 'Grak')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')

    const stored = () => JSON.parse(localStorage.getItem('forgegames_uw_planner_v1')!)
    await vi.waitFor(() => expect(stored().local[0].build.occupation).toBe('Mage'))
    expect(screen.getByRole('button', { name: 'Saved' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByLabelText('Occupation')).toHaveValue('')
    await vi.waitFor(() => expect(stored().local[0].build.occupation).toBe(''))
  })

  it('buys skills with a count picker, or +/- when set', async () => {
    localStorage.setItem('forgegames_uw_skillinput_v1', 'number')
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    const count = screen.getByLabelText('Alchemy count')
    await user.selectOptions(count, '3')
    expect(screen.getByText('3/10')).toBeInTheDocument()
    await user.selectOptions(count, '1')
    expect(screen.getByText('1/10')).toBeInTheDocument()
    expect(screen.getByLabelText('Heavy Armour count')).toHaveValue('0')

    localStorage.setItem('forgegames_uw_skillinput_v1', 'buttons')
    fireEvent(window, new Event('storage'))
    expect(await screen.findByRole('button', { name: 'Add Alchemy' })).toBeEnabled()
    expect(screen.queryByLabelText('Alchemy count')).toBeNull()
  })

  it('ignores the level 16 warning per character and can bring it back', async () => {
    const user = userEvent.setup()
    renderPlanner()
    fireEvent.change(screen.getByLabelText('Blankets'), { target: { value: '90' } })
    expect(screen.getByText(/reaches level 16/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ignore' }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.queryByText(/reaches level 16/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Show ignored warnings' }))
    expect(screen.getByText(/reaches level 16/)).toBeInTheDocument()
  })

  it('drills through the rules drawer and only expands locked rows', async () => {
    const user = userEvent.setup()
    renderPlanner()
    await user.selectOptions(screen.getByLabelText('Occupation'), 'Mage')
    await user.click(within(screen.getByRole('heading', { name: /^Production/ })).getByRole('button', { name: 'Rules' }))
    const drawer = screen.getByRole('dialog', { name: 'Rules' })
    await user.click(within(drawer).getByRole('button', { name: /^Alchemy/ }))
    expect(within(drawer).getByText(/opens up the world of Alchemy/)).toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Antidote' }))
    expect(within(drawer).getByText('Ingested')).toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Back' }))
    expect(within(drawer).getByRole('button', { name: 'Antidote' })).toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Production' }))
    expect(within(drawer).getByRole('button', { name: /^Artifice/ })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Rules' })).toBeNull()

    // Racial lists the race's built-in traits; a click outside closes, the link toggles.
    await user.selectOptions(screen.getByLabelText('Race'), 'Human')
    const racial = within(screen.getByRole('heading', { name: /^RacialRules/ })).getByRole('button', { name: 'Rules' })
    await user.click(racial)
    expect(within(screen.getByRole('dialog', { name: 'Rules' })).getByRole('button', { name: /Character Point Bonus/ })).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog', { name: 'Rules' })).toBeNull()
    await user.click(racial)
    await user.click(racial)
    expect(screen.queryByRole('dialog', { name: 'Rules' })).toBeNull()

    expect(screen.queryByText(/opens up the world of Alchemy/)).toBeNull()
    await user.click(screen.getByText('Artifice'))
    expect(screen.getAllByText('Requires 10x Blacksmith').some(e => e.tagName === 'P')).toBe(true)
  })
})
