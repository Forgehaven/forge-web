import { useState } from 'react'

const KEY = 'forgetools_favourites'

function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useFavourites() {
  const [favourites, setFavourites] = useState<string[]>(load)

  function toggle(path: string) {
    setFavourites(prev => {
      const next = prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  function isFavourite(path: string) {
    return favourites.includes(path)
  }

  return { favourites, toggle, isFavourite }
}
