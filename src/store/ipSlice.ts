import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface IPInfo {
  ip: string
  city: string
  country_code: string
  latitude: number
  longitude: number
  timezone: string
  org: string
}

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

interface IPState {
  data: IPInfo | null
  fetchedAt: number | null
  status: FetchStatus
}

const CACHE_KEY = 'forge_ip_v1'
export const IP_TTL = 60 * 60 * 1000

function loadCache(): IPState {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return { data: null, fetchedAt: null, status: 'idle' }
    const s = JSON.parse(raw) as Pick<IPState, 'data' | 'fetchedAt'> & { error?: boolean }
    if (s.fetchedAt && Date.now() - s.fetchedAt < IP_TTL) {
      return { data: s.data, fetchedAt: s.fetchedAt, status: s.error ? 'error' : 'success' }
    }
  } catch {
    /* ignore parse errors */
  }
  return { data: null, fetchedAt: null, status: 'idle' }
}

const ipSlice = createSlice({
  name: 'ip',
  initialState: loadCache(),
  reducers: {
    ipFetchStarted(state) {
      state.status = 'loading'
    },
    ipFetchSucceeded(state, action: PayloadAction<IPInfo>) {
      state.data = action.payload
      state.fetchedAt = Date.now()
      state.status = 'success'
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: action.payload, fetchedAt: state.fetchedAt }))
      } catch {
        /* storage unavailable */
      }
    },
    ipFetchFailed(state) {
      state.status = 'error'
      state.fetchedAt = Date.now()
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: state.data, fetchedAt: state.fetchedAt, error: true }))
      } catch { /* storage unavailable */ }
    },
    clearIP(state) {
      state.data = null
      state.fetchedAt = null
      state.status = 'idle'
      try { localStorage.removeItem(CACHE_KEY) } catch { /* storage unavailable */ }
    },
  },
})

export const { ipFetchStarted, ipFetchSucceeded, ipFetchFailed, clearIP } = ipSlice.actions
export default ipSlice.reducer
