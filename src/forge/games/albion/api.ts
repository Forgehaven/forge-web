import { API_URLS } from '../../../config/apiUrls'

let _onUnauthenticated: (() => void) | null = null

export function setOnUnauthenticated(cb: () => void) {
  _onUnauthenticated = cb
}

export async function albionFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: 'ok'; payload: T } | { status: 'error'; message: string }> {
  const res = await fetch(`${API_URLS.forgeAPI}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    _onUnauthenticated?.()
    return { status: 'error', message: 'Not authenticated' }
  }

  return res.json()
}
