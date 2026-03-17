import { useState, useEffect, createContext, useContext } from 'react'
import { authApi } from '../services/api'

interface User {
  username: string
  role: string
  fullName: string
  token: string
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    const data = res.data
    const u: User = {
      username: data.username,
      role: data.role,
      fullName: data.fullName,
      token: data.token
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return { user, loading, login, logout }
}
