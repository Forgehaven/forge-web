import { useState } from 'react'

// localStorage-backed list state shared by the favourites hooks.
export function useLocalList<T, Id>(key: string, idOf: (item: T) => Id) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]')
    } catch {
      return []
    }
  })

  function save(next: T[]) {
    localStorage.setItem(key, JSON.stringify(next))
    return next
  }

  function toggle(item: T) {
    setItems(prev => save(
      prev.some(i => idOf(i) === idOf(item))
        ? prev.filter(i => idOf(i) !== idOf(item))
        : [...prev, item]
    ))
  }

  function has(id: Id) {
    return items.some(i => idOf(i) === id)
  }

  function move(from: number, to: number) {
    setItems(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return save(next)
    })
  }

  return { items, toggle, has, move }
}
