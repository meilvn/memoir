import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/styles/global.scss'
import 'animate.css'
import { vReveal } from './directives/reveal'
import { vFocusable } from './directives/focusable'
import { PLACEHOLDER } from '@/stores/media'
import { useSettingsStore } from '@/stores/settings'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 首帧前恢复主题（浅色/深色/跟随系统），避免闪白
useSettingsStore().initTheme()
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeButton: false,
  icon: true,
  pauseOnHover: true,
  // 动效收敛：默认 bounce 0.75s 换成 240ms 淡入（样式见 global.scss 末尾）
  transition: 'Vue-Toastification__fade',
  maxToasts: 2,
})
app.directive('reveal', vReveal)
app.directive('focusable', vFocusable)

// Global image error handler: replace broken images with placeholder
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') {
    e.target.src = PLACEHOLDER
    e.target.style.opacity = '0.5'
  }
}, true)

app.mount('#app')
