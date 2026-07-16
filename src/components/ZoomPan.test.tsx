import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ZoomPan } from './ZoomPan'

function transformDiv() {
  return screen.getByTestId('zoom-pan').firstElementChild as HTMLElement
}

describe('ZoomPan', () => {
  it('anchors top-left without contentSize', () => {
    render(<ZoomPan><div>content</div></ZoomPan>)
    expect(transformDiv().style.transform).toBe('translate(0px, 0px) scale(1)')
  })

  it('centers the content in the viewport when contentSize is given', () => {
    // jsdom rects are 0x0, so centering yields -contentSize/2 offsets.
    render(<ZoomPan contentSize={1024} resetKey="a"><div>content</div></ZoomPan>)
    expect(transformDiv().style.transform).toBe('translate(-512px, -512px) scale(1)')
  })

  it('double-click returns to the centered home view', () => {
    render(<ZoomPan contentSize={1024} resetKey="a"><div>content</div></ZoomPan>)
    const surface = screen.getByTestId('zoom-pan')
    fireEvent.wheel(surface, { deltaY: -100, clientX: 10, clientY: 10 })
    expect(transformDiv().style.transform).not.toBe('translate(-512px, -512px) scale(1)')

    fireEvent.doubleClick(surface)
    expect(transformDiv().style.transform).toBe('translate(-512px, -512px) scale(1)')
  })
})
