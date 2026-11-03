import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, usersApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  async function login(identifier, password) {
    const data = await authApi.login({ identifier, password })
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('auth', JSON.stringify({ token: data.access_token, user: data.user }))
    return data
  }

  async function register(username, email, password) {
    const data = await authApi.register({ username, email, password })
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('token', data.access_token)
    return data
  }

  async function fetchMe() {
    const data = await usersApi.getMe()
    user.value = data
    return data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('auth')
  }

  function setUser(userData) {
    user.value = userData
  }

  return { token, user, isLoggedIn, isAdmin, login, register, fetchMe, logout, setUser }
})
