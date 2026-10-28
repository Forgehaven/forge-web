import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataReference from './DataReference'

describe('DataReference', () => {
  it('searches every section from the All tab', async () => {
    const user = userEvent.setup()
    render(<DataReference />)
    expect(screen.getByText(/Search races, cultures/)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search everything…'), 'goblin')
    expect(screen.getByRole('heading', { name: 'Races' })).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Search everything…'))
    await user.type(screen.getByPlaceholderText('Search everything…'), 'zzqx')
    expect(screen.getByText('Nothing matches "zzqx".')).toBeInTheDocument()
  })
})
