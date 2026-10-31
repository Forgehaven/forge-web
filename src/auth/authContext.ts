import { createContext, useContext } from 'react'

export interface GuildStatus {
  is_member: boolean
  roles: Record<string, boolean>
  // Display text per role and roles to hide when missing; absent from older APIs.
  labels?: Record<string, string>
  quiet?: string[]
}

export interface AuthUser {
  id: string
  discord_id: string
  username: string
  avatar: string | null
  guilds: Record<string, GuildStatus>
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => Promise<void>
  clearAuth: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
