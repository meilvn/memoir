import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '@/api'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref(localStorage.getItem('theme') || 'warm')

  function setTheme(t) {
    theme.value = t
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  async function updateProfile(data) {
    return usersApi.updateProfile(data)
  }

  async function changePassword(data) {
    return usersApi.changePassword(data)
  }

  return { theme, setTheme, updateProfile, changePassword }
})
