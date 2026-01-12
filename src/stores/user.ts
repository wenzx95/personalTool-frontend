import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin } from '@/api/auth'

export interface User {
  id: string
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  gender?: number
  status: number
  sort?: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)

  // Actions
  const setUser = (userData: User) => {
    user.value = userData
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await apiLogin(username, password)

      setUser(response.user)
      setToken(response.token)

      // Persist user data
      localStorage.setItem('user', JSON.stringify(response.user))

      return true
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const restoreSession = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    setUser,
    setToken,
    login,
    logout,
    restoreSession
  }
})
