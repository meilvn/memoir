import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '@/api'

const STORAGE_KEY = 'theme'
const VALID = ['light', 'dark', 'system']

function readStored() {
  const v = localStorage.getItem(STORAGE_KEY)
  // 旧值（如 'warm'）一律归一为 system，避免出现无样式主题
  return VALID.includes(v) ? v : 'system'
}

function resolve(t) {
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return t
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref(readStored())
  let mql = null

  function apply(t) {
    document.documentElement.setAttribute('data-theme', resolve(t))
  }

  function setTheme(t) {
    if (!VALID.includes(t)) t = 'system'
    theme.value = t
    localStorage.setItem(STORAGE_KEY, t)
    apply(t)
  }

  // 挂载前调用：恢复用户选择，并在“跟随系统”时监听系统变化
  function initTheme() {
    apply(theme.value)
    if (!mql) {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
      mql.addEventListener?.('change', () => {
        if (theme.value === 'system') apply('system')
      })
    }
  }

  async function updateProfile(data) {
    return usersApi.updateProfile(data)
  }

  async function changePassword(data) {
    return usersApi.changePassword(data)
  }

  return { theme, setTheme, initTheme, updateProfile, changePassword }
})
