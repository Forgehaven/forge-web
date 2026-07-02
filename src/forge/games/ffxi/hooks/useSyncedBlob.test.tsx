import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSyncedBlob } from './useSyncedBlob'
import type { Envelope } from '../../../../lib/api'
import type { ToolBlob } from '../api'

type Blob = { learned: Record<string, boolean> }

function okBlob(data: unknown): Envelope<ToolBlob<Blob>> {
  return { status: 'ok', message: '', payload: { data: data as Blob, updated_at: null } }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSyncedBlob', () => {
  it('loads the blob when key appears and reports data', async () => {
    vi.useRealTimers()
    const onLoaded = vi.fn()
    const load = vi.fn().mockResolvedValue(okBlob({ learned: { Cure: true } }))

    renderHook(() => useSyncedBlob<Blob>({ key: 'c1', load, save: null, onLoaded }))

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith({ learned: { Cure: true } }))
    expect(load).toHaveBeenCalledOnce()
  })

  it('reports null for an empty server blob', async () => {
    vi.useRealTimers()
    const onLoaded = vi.fn()
    const load = vi.fn().mockResolvedValue(okBlob({}))

    renderHook(() => useSyncedBlob<Blob>({ key: 'c1', load, save: null, onLoaded }))

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(null))
  })

  it('does nothing without a key or loader', () => {
    vi.useRealTimers()
    const onLoaded = vi.fn()
    const load = vi.fn()

    renderHook(() => useSyncedBlob<Blob>({ key: null, load, save: null, onLoaded }))
    renderHook(() => useSyncedBlob<Blob>({ key: 'c1', load: null, save: null, onLoaded }))

    expect(load).not.toHaveBeenCalled()
    expect(onLoaded).not.toHaveBeenCalled()
  })

  async function readyHook(save: (data: Blob) => Promise<unknown>, key = 'c1') {
    const load = vi.fn().mockResolvedValue(okBlob({ learned: {} }))
    const rendered = renderHook(
      ({ k }: { k: string }) =>
        useSyncedBlob<Blob>({ key: k, load, save, onLoaded: () => {} }),
      { initialProps: { k: key } },
    )
    // Flush the load promise so the ready gate opens for this key.
    await act(async () => { await Promise.resolve() })
    return rendered
  }

  it('debounces saves, keeping only the last value', async () => {
    const save = vi.fn().mockResolvedValue({ status: 'ok' })
    const { result } = await readyHook(save)

    act(() => {
      result.current.scheduleSave({ learned: { A: true } })
      result.current.scheduleSave({ learned: { B: true } })
    })
    expect(save).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(1100) })

    expect(save).toHaveBeenCalledOnce()
    expect(save).toHaveBeenCalledWith({ learned: { B: true } })
  })

  it('flushes a pending save on unmount', async () => {
    const save = vi.fn().mockResolvedValue({ status: 'ok' })
    const { result, unmount } = await readyHook(save)

    act(() => { result.current.scheduleSave({ learned: { A: true } }) })
    unmount()

    expect(save).toHaveBeenCalledOnce()
    expect(save).toHaveBeenCalledWith({ learned: { A: true } })
  })

  it('gates scheduleSave until the load for the current key resolves', () => {
    const save = vi.fn().mockResolvedValue({ status: 'ok' })
    const load = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() =>
      useSyncedBlob<Blob>({ key: 'c1', load, save, onLoaded: () => {} }))

    act(() => {
      result.current.scheduleSave({ learned: { A: true } })
      vi.advanceTimersByTime(2000)
    })

    // Load still in flight: the edit must NOT overwrite the server blob.
    expect(save).not.toHaveBeenCalled()
  })

  it('flushes a pending save to the OLD key when the key switches', async () => {
    const savedTo: Array<[string, Blob]> = []
    const makeSave = (id: string) =>
      vi.fn((data: Blob) => { savedTo.push([id, data]); return Promise.resolve({ status: 'ok' }) })
    const saveA = makeSave('A')
    const saveB = makeSave('B')
    const load = vi.fn().mockResolvedValue(okBlob({ learned: {} }))

    const { result, rerender } = renderHook(
      ({ k, s }: { k: string; s: (data: Blob) => Promise<unknown> }) =>
        useSyncedBlob<Blob>({ key: k, load, save: s, onLoaded: () => {} }),
      { initialProps: { k: 'charA', s: saveA } },
    )
    await act(async () => { await Promise.resolve() })

    // Edit for char A, then switch to char B inside the debounce window.
    act(() => { result.current.scheduleSave({ learned: { Cure: true } }) })
    rerender({ k: 'charB', s: saveB })
    await act(async () => { await Promise.resolve() })
    act(() => { vi.advanceTimersByTime(2000) })

    // The pending edit went to A's saver; B never received A's blob.
    expect(savedTo).toEqual([['A', { learned: { Cure: true } }]])
    expect(saveB).not.toHaveBeenCalled()
  })

  it('ignores scheduleSave when logged out (no saver)', () => {
    const { result } = renderHook(() =>
      useSyncedBlob<Blob>({ key: 'c1', load: null, save: null, onLoaded: () => {} }))

    act(() => {
      result.current.scheduleSave({ learned: { A: true } })
      vi.advanceTimersByTime(2000)
    })
    // No saver registered: nothing to assert beyond "did not throw".
  })
})
