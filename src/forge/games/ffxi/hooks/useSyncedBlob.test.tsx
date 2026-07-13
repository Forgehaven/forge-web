import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSyncedBlob } from './useSyncedBlob'
import type { Envelope } from '../../../../lib/api'
import type { PutResult, ToolBlob } from '../api'

type Blob = { learned: Record<string, boolean> }
type TestSaver = (data: Blob, base: string | null) => Promise<Envelope<PutResult>>

function okBlob(data: unknown, updatedAt: string | null = null): Envelope<ToolBlob<Blob>> {
  return { status: 'ok', message: '', payload: { data: data as Blob, updated_at: updatedAt } }
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

  async function readyHook(save: TestSaver, key = 'c1', loadedAt: string | null = null) {
    const load = vi.fn().mockResolvedValue(okBlob({ learned: {} }, loadedAt))
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
    expect(save).toHaveBeenCalledWith({ learned: { B: true } }, null)
  })

  it('flushes a pending save on unmount', async () => {
    const save = vi.fn().mockResolvedValue({ status: 'ok' })
    const { result, unmount } = await readyHook(save)

    act(() => { result.current.scheduleSave({ learned: { A: true } }) })
    unmount()

    expect(save).toHaveBeenCalledOnce()
    expect(save).toHaveBeenCalledWith({ learned: { A: true } }, null)
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
    const makeSave = (id: string): TestSaver =>
      vi.fn((data: Blob) => {
        savedTo.push([id, data])
        return Promise.resolve({ status: 'ok', message: '', payload: { updated_at: null } } as Envelope<PutResult>)
      })
    const saveA = makeSave('A')
    const saveB = makeSave('B')
    const load = vi.fn().mockResolvedValue(okBlob({ learned: {} }))

    const { result, rerender } = renderHook(
      ({ k, s }: { k: string; s: TestSaver }) =>
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

  it('sends the loaded updated_at as the save base and advances it on ok', async () => {
    const save = vi.fn()
      .mockResolvedValueOnce({ status: 'ok', message: '', payload: { updated_at: 'T2' } })
      .mockResolvedValueOnce({ status: 'ok', message: '', payload: { updated_at: 'T3' } })
    const { result } = await readyHook(save as unknown as TestSaver, 'c1', 'T1')

    act(() => { result.current.scheduleSave({ learned: { A: true } }) })
    await act(async () => { vi.advanceTimersByTime(1100); await Promise.resolve() })
    expect(save).toHaveBeenNthCalledWith(1, { learned: { A: true } }, 'T1')

    act(() => { result.current.scheduleSave({ learned: { B: true } }) })
    await act(async () => { vi.advanceTimersByTime(1100); await Promise.resolve() })
    expect(save).toHaveBeenNthCalledWith(2, { learned: { B: true } }, 'T2')
  })

  it('conflict reply means server wins: blob fed back through onLoaded', async () => {
    const onLoaded = vi.fn()
    const save = vi.fn().mockResolvedValue({
      status: 'error',
      message: 'conflict',
      payload: { data: { learned: { Server: true } }, updated_at: 'T9' },
    })
    const load = vi.fn().mockResolvedValue(okBlob({ learned: {} }, 'T1'))
    const { result } = renderHook(() =>
      useSyncedBlob<Blob>({ key: 'c1', load, save: save as unknown as TestSaver, onLoaded }))
    await act(async () => { await Promise.resolve() })

    act(() => { result.current.scheduleSave({ learned: { Local: true } }) })
    await act(async () => { vi.advanceTimersByTime(1100); await Promise.resolve() })

    expect(onLoaded).toHaveBeenLastCalledWith({ learned: { Server: true } })

    // Next save uses the conflict's updated_at as its new base.
    act(() => { result.current.scheduleSave({ learned: { Retry: true } }) })
    await act(async () => { vi.advanceTimersByTime(1100); await Promise.resolve() })
    expect(save).toHaveBeenLastCalledWith({ learned: { Retry: true } }, 'T9')
  })
})
