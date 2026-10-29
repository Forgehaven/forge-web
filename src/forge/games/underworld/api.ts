import { forgeFetch } from '../../../lib/api'
import type { PutResult } from '../ffxi/api'
import type { Build, BuildStatus } from './engine'

export interface BuildSummary {
  id: string
  name: string
  favourite: boolean
  status: BuildStatus
  updated_at: string | null
}

const BASE = '/game/uwlarp/builds'

export function listBuilds() {
  return forgeFetch<BuildSummary[]>(BASE)
}

export function getBuild(id: string) {
  return forgeFetch<BuildSummary & { data: Build }>(`${BASE}/${id}`)
}

export function createBuild(data: Build) {
  return forgeFetch<BuildSummary>(BASE, { method: 'POST', body: JSON.stringify({ data }) })
}

// Omit baseUpdatedAt to overwrite whatever the server has.
export function putBuild(id: string, data: Build, baseUpdatedAt?: string | null) {
  const body = baseUpdatedAt === undefined ? { data } : { data, base_updated_at: baseUpdatedAt }
  return forgeFetch<PutResult>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

// Sets list placement for the given builds; does not touch updated_at.
export function putOrder(order: string[], favourites: string[]) {
  return forgeFetch<null>(`${BASE}/order`, { method: 'PUT', body: JSON.stringify({ order, favourites }) })
}

export function deleteBuild(id: string) {
  return forgeFetch<null>(`${BASE}/${id}`, { method: 'DELETE' })
}
