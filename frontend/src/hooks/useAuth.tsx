import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '../types'
import { authApi } from '../api/services'

interface AuthCtx {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('access_token')
    const u = localStorage.getItem('user')
    if (t && u) {
      setToken(t)
      try { setUser(JSON.parse(u)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.access_token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, token, login, logout, loading }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
