import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InteractiveMap } from './InteractiveMap'
import { MAPS } from './maps'
import { NM_SPAWNS } from './nms'

function renderMap(initialEntry: string | { pathname: string; state?: object } = '/games/ffxi/map') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/games/ffxi/map" element={<InteractiveMap />} />
        <Route path="/games/ffxi/map/:zoneId" element={<InteractiveMap />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('maps index', () => {
  it('covers all bundled zones with beautified names', () => {
    expect(MAPS.length).toBe(319)
    const byId = new Map(MAPS.map(m => [m.id, m.name]))
    expect(byId.get('northern_san_doria')).toBe("Northern San d'Oria")
    expect(byId.get('rulude_gardens')).toBe("Ru'Lude Gardens")
    expect(byId.get('psoxja_10')).toBe("Pso'Xja (10)")
    expect(byId.get('the_sanctuary_of_zitah')).toBe("The Sanctuary of Zi'Tah")
    expect(byId.get('lower_delkfutts_tower_2')).toBe("Lower Delkfutt's Tower (2)")
    // horizonffxi.wiki fills
    expect(byId.get('feiyin_1')).toBe("Fei'Yin (1)")
    expect(byId.get('king_ranperres_tomb_1')).toBe("King Ranperre's Tomb (1)")
    expect(byId.get('hall_of_the_gods')).toBe('Hall of the Gods')
    expect(byId.get('carpenters_landing_2')).toBe("Carpenters' Landing (2)")
  })
})

describe('InteractiveMap', () => {
  beforeEach(() => localStorage.clear())

  it('prompts for a zone when nothing was picked before', () => {
    renderMap()
    expect(screen.getByText('Pick a zone to view its map')).toBeInTheDocument()
    expect(screen.getByText(/spalose · Remapster/)).toBeInTheDocument()
  })

  it('shows the zone from the URL so views can be shared', () => {
    renderMap('/games/ffxi/map/xarcabard')
    expect(screen.getByAltText('Xarcabard')).toHaveAttribute('src', '/ffxi_maps/xarcabard.webp')
  })

  it('restores the last viewed zone from localStorage', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'valkurm_dunes' }))
    renderMap()

    const img = screen.getByAltText('Valkurm Dunes')
    expect(img).toHaveAttribute('src', '/ffxi_maps/valkurm_dunes.webp')
    expect(screen.getByTestId('zoom-pan')).toBeInTheDocument()
  })

  it('renders clickable exits for annotated zones and navigates on click', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'upper_jeuno' }))
    renderMap()

    fireEvent.click(screen.getByLabelText('Go to Lower Jeuno'))

    expect(screen.getByAltText('Lower Jeuno')).toHaveAttribute('src', '/ffxi_maps/lower_jeuno.webp')
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_map_v1')!)).toEqual({ last: 'lower_jeuno', nm: false, exp: false, legend: true })
    // Round trip exists in the seed data.
    expect(screen.getByLabelText('Go to Upper Jeuno')).toBeInTheDocument()
  })

  it('shows the number badge for marked entrances', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'batallia_downs' }))
    renderMap()

    const entrance = screen.getByLabelText('Go to Eldieme Necropolis #6')
    expect(entrance).toHaveTextContent('6')

    fireEvent.click(entrance)
    expect(screen.getByAltText('The Eldieme Necropolis (3)')).toBeInTheDocument()
  })

  it('jumps to a zone via the teleport quick links', () => {
    renderMap()

    fireEvent.click(screen.getByRole('button', { name: 'DEM' }))

    expect(screen.getByAltText('Konschtat Highlands')).toHaveAttribute('src', '/ffxi_maps/konschtat_highlands.webp')
  })

  it('jumps to a city via the city quick links', () => {
    renderMap()

    fireEvent.click(screen.getByRole('button', { name: /BASTOK/ }))

    expect(screen.getByAltText('Bastok Markets')).toHaveAttribute('src', '/ffxi_maps/bastok_markets.webp')
  })

  it('toggles NM spawn circles and persists the preference', () => {
    renderMap('/games/ffxi/map/batallia_downs')
    expect(screen.queryByLabelText('Ahtu (wiki)')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'NM' }))

    const circle = screen.getByLabelText('Ahtu (wiki)')
    expect(circle).toHaveAttribute('href', 'https://horizonffxi.wiki/Ahtu')
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_map_v1')!).nm).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'NM' }))
    expect(screen.queryByLabelText('Ahtu (wiki)')).not.toBeInTheDocument()
  })

  it('restores the NM toggle from storage', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'batallia_downs', nm: true }))
    renderMap()
    expect(screen.getByLabelText('Ahtu (wiki)')).toBeInTheDocument()
  })

  it('legend lists the zone NMs and highlights shapes on hover', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'batallia_downs', nm: true }))
    renderMap()

    const legendRow = screen.getByRole('link', { name: 'Ahtu' })
    expect(legendRow).toHaveAttribute('href', 'https://horizonffxi.wiki/Ahtu')

    const shape = screen.getByLabelText('Ahtu (wiki)')
    expect(shape).not.toHaveAttribute('data-highlighted')
    fireEvent.mouseEnter(legendRow)
    expect(shape).toHaveAttribute('data-highlighted')
    fireEvent.mouseLeave(legendRow)
    expect(shape).not.toHaveAttribute('data-highlighted')
  })

  it('legend lists unmarked NMs with a badge and wiki link but no shape', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'xarcabard', nm: true }))
    renderMap()

    const row = screen.getByRole('link', { name: /Biast/ })
    expect(row).toHaveAttribute('href', 'https://horizonffxi.wiki/Biast')
    expect(row).toHaveTextContent('unmarked')
    expect(screen.queryByLabelText('Biast (wiki)')).not.toBeInTheDocument()
    // a marked NM in the same zone still gets a shape and no badge
    expect(screen.getByLabelText('Boreal Coeurl (wiki)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Boreal Coeurl' })).not.toHaveTextContent('unmarked')
    // marked rows sort above unmarked rows (Biast would otherwise precede Boreal Coeurl)
    const coeurlRow = screen.getByRole('link', { name: 'Boreal Coeurl' })
    expect(coeurlRow.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('legend spans every floor of the zone, badges the map number, and jumps on first click', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'ifrits_cauldron_1', nm: true }))
    renderMap()

    // Vouivre lives on floor 3; floor 1 still lists it, badged with its map
    // number (the accessible name concatenates the row spans without a space)
    const row = screen.getByRole('link', { name: 'Vouivremap 3' })
    expect(row).toHaveAttribute('href', 'https://horizonffxi.wiki/Vouivre')
    expect(screen.queryByLabelText('Vouivre (wiki)')).not.toBeInTheDocument()

    // unmarked NMs from other floors keep the unmarked badge and plain wiki link
    const ashDragon = screen.getByRole('link', { name: /Ash Dragon/ })
    expect(ashDragon).toHaveTextContent('unmarked')
    expect(ashDragon).not.toHaveAttribute('title')

    // first click jumps to the NM's floor instead of opening the wiki
    expect(fireEvent.click(row)).toBe(false)
    expect(screen.getByAltText("Ifrit's Cauldron (3)")).toBeInTheDocument()
    expect(screen.getByLabelText('Vouivre (wiki)')).toHaveAttribute('data-highlighted')

    // on the right floor the row turns back into a plain wiki link
    expect(screen.getByRole('link', { name: 'Vouivremap 3' })).not.toHaveAttribute('title')
  })

  it('legend collapse persists', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'batallia_downs', nm: true }))
    renderMap()

    fireEvent.click(screen.getByRole('button', { name: /NMs \(/ }))
    expect(screen.queryByRole('link', { name: 'Ahtu' })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_map_v1')!).legend).toBe(false)
  })

  it('searches NMs globally, jumps to the zone, and highlights the shape', () => {
    renderMap('/games/ffxi/map/xarcabard')

    const input = screen.getByRole('combobox', { name: 'Search NMs' })
    fireEvent.change(input, { target: { value: 'ahtu' } })
    fireEvent.click(screen.getByText('Ahtu · Batallia Downs'))

    expect(screen.getByAltText('Batallia Downs')).toHaveAttribute('src', '/ffxi_maps/batallia_downs.webp')
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_map_v1')!)).toMatchObject({ last: 'batallia_downs', nm: true })
    expect(screen.getByLabelText('Ahtu (wiki)')).toHaveAttribute('data-highlighted')
  })

  it('nm search flash decays after a timeout', () => {
    vi.useFakeTimers()
    try {
      renderMap('/games/ffxi/map/xarcabard')

      const input = screen.getByRole('combobox', { name: 'Search NMs' })
      fireEvent.change(input, { target: { value: 'ahtu' } })
      fireEvent.click(screen.getByText('Ahtu · Batallia Downs'))
      expect(screen.getByLabelText('Ahtu (wiki)')).toHaveAttribute('data-highlighted')

      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByLabelText('Ahtu (wiki)')).not.toHaveAttribute('data-highlighted')
    } finally {
      vi.useRealTimers()
    }
  })

  it('toggles EXP camp dots with level + description hover text and persists', () => {
    renderMap('/games/ffxi/map/ghelsba_outpost_1')
    expect(screen.queryAllByLabelText(/^Lv 10-12/).length).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'EXP' }))

    const dots = screen.getAllByLabelText(/^Lv 10-12 · This "camp" is a roaming loop/)
    expect(dots.length).toBe(4)
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_map_v1')!).exp).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'EXP' }))
    expect(screen.queryAllByLabelText(/^Lv 10-12/).length).toBe(0)
  })

  it('turns the EXP layer on and highlights the camp when arriving from the table', () => {
    renderMap({ pathname: '/games/ffxi/map/ghelsba_outpost_1', state: { flashCamp: 'standard-ghelsba_outpost-1' } })

    const dots = screen.getAllByLabelText(/^Lv 10-12/)
    expect(dots.length).toBe(4)
    for (const d of dots) expect(d).toHaveAttribute('data-highlighted')
    expect(JSON.parse(localStorage.getItem('forgegames_ffxi_map_v1')!).exp).toBe(true)
  })

  it('area annotate mode traces an outline and copies a spawn snippet', () => {
    localStorage.setItem('forgegames_ffxi_map_v1', JSON.stringify({ last: 'batallia_downs' }))
    renderMap()

    fireEvent.click(screen.getByLabelText('annotate mode'))
    fireEvent.click(screen.getByLabelText('area (NM spawn outline)'))

    const surface = screen.getByTestId('zoom-pan')
    fireEvent.click(surface, { clientX: 100, clientY: 100 })
    fireEvent.click(surface, { clientX: 200, clientY: 100 })
    fireEvent.click(surface, { clientX: 150, clientY: 200 })
    expect(screen.getByText('3 pts')).toBeInTheDocument()
    expect(screen.getByTestId('trace-preview')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'finish' }))
    // jsdom rect is 0x0 and the map starts centered at (-512,-512), scale 1.
    expect(screen.getByText(
      "{ name: '', page: '', x: 662, y: 645, r: 0, points: [[612, 612], [712, 612], [662, 712]] },",
    )).toBeInTheDocument()
  })
})

describe('NM_SPAWNS', () => {
  it('references valid maps with sane circles', () => {
    const ids = new Set(MAPS.map(m => m.id))
    for (const [id, spawns] of Object.entries(NM_SPAWNS)) {
      expect(ids.has(id)).toBe(true)
      expect(spawns.length).toBeGreaterThan(0)
      for (const s of spawns) {
        if (s.unmarked) {
          expect(s.x).toBeUndefined()
          expect(s.points).toBeUndefined()
          expect(s.page.length).toBeGreaterThan(0)
          continue
        }
        expect(s.r).toBeGreaterThan(0)
        expect(s.x).toBeGreaterThanOrEqual(0)
        expect(s.x).toBeLessThanOrEqual(1024)
        expect(s.y).toBeGreaterThanOrEqual(0)
        expect(s.y).toBeLessThanOrEqual(1024)
        expect(s.page.length).toBeGreaterThan(0)
        if (s.points) {
          expect(s.points.length).toBeGreaterThanOrEqual(3)
          for (const [px, py] of s.points) {
            expect(px).toBeGreaterThanOrEqual(0)
            expect(px).toBeLessThanOrEqual(1024)
            expect(py).toBeGreaterThanOrEqual(0)
            expect(py).toBeLessThanOrEqual(1024)
          }
        }
      }
    }
  })
})
