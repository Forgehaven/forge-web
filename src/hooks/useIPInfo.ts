import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { ipFetchStarted, ipFetchSucceeded, ipFetchFailed, IP_TTL } from '../store/ipSlice'
export type { IPInfo } from '../store/ipSlice'

// Prevents duplicate in-flight fetches when multiple components call this hook
let fetchInFlight = false
export function resetFetchInFlight() { fetchInFlight = false }

export function useIPInfo() {
  const dispatch = useAppDispatch()
  const { data, fetchedAt, status } = useAppSelector(s => s.ip)

  useEffect(() => {
    const fresh = data && fetchedAt && Date.now() - fetchedAt < IP_TTL
    if (fresh || fetchInFlight || status === 'loading' || status === 'error') return
    fetchInFlight = true
    dispatch(ipFetchStarted())

    fetch('https://ipapi.co/json/')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        if (!d.ip) throw new Error('API returned no IP')
        dispatch(ipFetchSucceeded({
          ip: d.ip ?? '',
          city: d.city ?? '',
          country_code: d.country_code ?? '',
          latitude: d.latitude ?? 0,
          longitude: d.longitude ?? 0,
          timezone: d.timezone ?? '',
          org: d.org ?? '',
        }))
      })
      .catch(() => dispatch(ipFetchFailed()))
      .finally(() => { fetchInFlight = false })
  }, [data, fetchedAt, status, dispatch])

  return {
    data,
    loading: status === 'idle' || status === 'loading',
    error: status === 'error',
  }
}
