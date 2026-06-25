import { createContext, useContext } from 'react'

export interface AuthUser {
  id: string
  discord_id: string
  username: string
  avatar: string
  guild_member: boolean
  has_role: boolean
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
