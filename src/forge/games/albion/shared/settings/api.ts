import { albionFetch } from '../api'

// Per-user blob endpoints (GET/PUT /game/albion/user/{kind}). Auth is by the session cookie
// that albionFetch already sends; a logged-out request 401s and the caller falls back to
// localStorage. kind is 'prices' or 'craft-settings'.
interface UserBlob {
  data: Record<string, unknown>
  updated_at: string | null
}

export async function getUserBlob<T = Record<string, unknown>>(kind: string): Promise<T | null> {
  const res = await albionFetch<UserBlob>(`/game/albion/user/${kind}`)
  if (res.status !== 'ok') return null
  const data = res.payload.data
  return data && Object.keys(data).length > 0 ? (data as T) : null
}

export async function putUserBlob(kind: string, data: unknown): Promise<void> {
  await albionFetch(`/game/albion/user/${kind}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  })
}
