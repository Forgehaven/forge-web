import type { KeyboardEvent } from 'react'

// Expand/collapse control as a role="button" element: unlike <button>, a
// disabled <fieldset> (read-only builds) does not disable it.
export const toggleProps = (open: boolean, onToggle: () => void) => ({
  role: 'button',
  tabIndex: 0,
  'aria-expanded': open,
  onClick: onToggle,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onToggle()
  },
})
