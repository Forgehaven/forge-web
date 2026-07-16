import { useLayoutEffect, useRef, useState, type ReactNode, type WheelEvent, type PointerEvent, type MouseEvent } from 'react'

// Dependency-free pan/zoom surface for fixed-size images (game maps).
// Wheel zooms toward the cursor, pointer-drag pans, double-click resets.
// `children` may be a function of the current scale (for counter-scaled
// overlays); `onPointClick` reports clicks in untransformed content space.
// With `contentSize`, the content starts centered in the viewport and
// re-centers whenever `resetKey` changes.
export function ZoomPan({ children, minScale = 0.5, maxScale = 6, onPointClick, contentSize, resetKey }: {
  children: ReactNode | ((scale: number) => ReactNode)
  minScale?: number
  maxScale?: number
  onPointClick?: (x: number, y: number) => void
  contentSize?: number
  resetKey?: unknown
}) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function homeView() {
    if (!contentSize) return { x: 0, y: 0, scale: 1 }
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0, scale: 1 }
    return { x: (rect.width - contentSize) / 2, y: (rect.height - contentSize) / 2, scale: 1 }
  }

  useLayoutEffect(() => {
    if (contentSize == null) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial centering must run before paint
    setView(homeView())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-center only when the content changes
  }, [resetKey])

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top
    setView(prev => {
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2
      const scale = Math.min(maxScale, Math.max(minScale, prev.scale * factor))
      const ratio = scale / prev.scale
      return {
        scale,
        x: cursorX - (cursorX - prev.x) * ratio,
        y: cursorY - (cursorY - prev.y) * ratio,
      }
    })
  }

  const moved = useRef(false)

  function onPointerDown(e: PointerEvent) {
    // Presses on interactive children (exit markers) must complete their own
    // click: capturing the pointer here would retarget pointerup to the
    // container and swallow it.
    if ((e.target as HTMLElement).closest('button, a')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    moved.current = false
    drag.current = { startX: e.clientX, startY: e.clientY, originX: view.x, originY: view.y }
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag.current) return
    const { startX, startY, originX, originY } = drag.current
    if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 4) moved.current = true
    setView(prev => ({ ...prev, x: originX + e.clientX - startX, y: originY + e.clientY - startY }))
  }

  function onPointerUp() {
    drag.current = null
  }

  function onClick(e: MouseEvent) {
    if (!onPointClick || moved.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left - view.x) / view.scale
    const y = (e.clientY - rect.top - view.y) / view.scale
    onPointClick(Math.round(x), Math.round(y))
  }

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDoubleClick={() => setView(homeView())}
      onClick={onClick}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      data-testid="zoom-pan"
    >
      <div
        className="origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        {typeof children === 'function' ? children(view.scale) : children}
      </div>
    </div>
  )
}
