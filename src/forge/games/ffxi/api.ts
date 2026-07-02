import { forgeFetch } from '../../../lib/api'

export interface FfxiCharacter {
  id: string
  name: string
  nation: number | null
  avatar: string | null
}

export interface ToolBlob<T> {
  data: T
  updated_at: string | null
}

export interface ConquestState {
  owners: Record<string, number | null>
  updated_at: string | null
}

export type CharacterTool = 'spell_tracker' | 'quest_tracker' | 'key_item_tracker'
export type UserTool = 'friend_viewer' | 'clamming'

// Public HorizonXI character lookup (no login). Error envelope = not found.
export interface CharPayload {
  jobs?: Record<string, number>
  nation?: number | null
  rank?: string | null
  avatar?: string | null
}

export function fetchChar(name: string) {
  return forgeFetch<CharPayload>(`/game/ffxi/char/${encodeURIComponent(name)}`)
}

export function listCharacters() {
  return forgeFetch<FfxiCharacter[]>('/game/ffxi/characters')
}

export function registerCharacter(name: string) {
  return forgeFetch<FfxiCharacter>('/game/ffxi/characters', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function deleteCharacter(id: string) {
  return forgeFetch<null>(`/game/ffxi/characters/${id}`, { method: 'DELETE' })
}

export function getCharData<T>(id: string, tool: CharacterTool) {
  return forgeFetch<ToolBlob<T>>(`/game/ffxi/characters/${id}/data/${tool}`)
}

export function putCharData(id: string, tool: CharacterTool, data: unknown) {
  return forgeFetch<null>(`/game/ffxi/characters/${id}/data/${tool}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  })
}

export function getUserData<T>(tool: UserTool) {
  return forgeFetch<ToolBlob<T>>(`/game/ffxi/user-data/${tool}`)
}

export function putUserData(tool: UserTool, data: unknown) {
  return forgeFetch<null>(`/game/ffxi/user-data/${tool}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  })
}

export function getConquest() {
  return forgeFetch<ConquestState>('/game/ffxi/conquest')
}

export function putConquest(owners: Record<string, number | null>) {
  return forgeFetch<null>('/game/ffxi/conquest', {
    method: 'PUT',
    body: JSON.stringify({ owners }),
  })
}
