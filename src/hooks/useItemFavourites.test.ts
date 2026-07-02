import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useItemFavourites } from './useItemFavourites'
import { STORAGE_KEYS } from '../config/storageKeys'

const item = { id: 'T4_BAG', name: "Adept's Bag", tier: 4, enchant: 0 }

describe('useItemFavourites', () => {
  beforeEach(() => localStorage.clear())

  it('toggles an item on and off', () => {
    const { result } = renderHook(() => useItemFavourites())

    expect(result.current.isFavourite('T4_BAG')).toBe(false)

    act(() => result.current.toggle(item))
    expect(result.current.isFavourite('T4_BAG')).toBe(true)
    expect(result.current.items).toHaveLength(1)

    act(() => result.current.toggle(item))
    expect(result.current.isFavourite('T4_BAG')).toBe(false)
    expect(result.current.items).toHaveLength(0)
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useItemFavourites())
    act(() => result.current.toggle(item))

    const raw = localStorage.getItem(STORAGE_KEYS.albionItemFavourites)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toEqual([item])
  })

  it('loads existing favourites from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.albionItemFavourites, JSON.stringify([item]))
    const { result } = renderHook(() => useItemFavourites())
    expect(result.current.isFavourite('T4_BAG')).toBe(true)
    expect(result.current.items).toHaveLength(1)
  })
})
