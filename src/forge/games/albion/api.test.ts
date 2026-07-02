import { describe, it, expect, vi, beforeEach } from 'vitest'
import { albionFetch } from './api'
import { setOnUnauthenticated } from '../../../auth/unauthorized'

const fetchSpy = vi.fn()
globalThis.fetch = fetchSpy

beforeEach(() => {
  fetchSpy.mockReset()
})

describe('albionFetch', () => {
  it('sends credentials include and Content-Type json', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'ok', payload: { data: 1 } }), { status: 200 }))

    const result = await albionFetch('/albion/test')

    expect(fetchSpy).toHaveBeenCalledWith('https://api.forgehaven.io/albion/test', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(result).toEqual({ status: 'ok', payload: { data: 1 } })
  })

  it('calls onUnauthenticated callback on 401', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message: 'Not authenticated' }), { status: 401 }))

    const cb = vi.fn()
    setOnUnauthenticated(cb)

    const result = await albionFetch('/albion/test')

    expect(cb).toHaveBeenCalledOnce()
    expect(result).toEqual({ status: 'error', message: 'Not authenticated' })
  })

  it('does not call onUnauthenticated on non-401 errors', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'error', message: 'Bad request' }), { status: 400 }))

    const cb = vi.fn()
    setOnUnauthenticated(cb)

    const result = await albionFetch('/albion/test')

    expect(cb).not.toHaveBeenCalled()
    expect(result).toEqual({ status: 'error', message: 'Bad request' })
  })

  it('normalizes FastAPI {detail} bodies (e.g. 403 from require_guild) to the envelope', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ detail: 'Missing required role' }), { status: 403 }))

    const cb = vi.fn()
    setOnUnauthenticated(cb)

    const result = await albionFetch('/albion/test')

    expect(cb).not.toHaveBeenCalled()
    expect(result).toEqual({ status: 'error', message: 'Missing required role' })
  })

  it('merges custom headers', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ status: 'ok', payload: null }), { status: 200 }))

    await albionFetch('/test', { headers: { 'X-Custom': 'val' } })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.forgehaven.io/test',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'val' },
      }),
    )
  })
})
