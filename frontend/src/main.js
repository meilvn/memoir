import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/styles/global.scss'
import { vReveal } from './directives/reveal'
import { PLACEHOLDER } from '@/stores/media'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeButton: false,
  icon: true,
  pauseOnHover: true,
})
app.directive('reveal', vReveal)

// Global image error handler: replace broken images with placeholder
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') {
    e.target.src = PLACEHOLDER
    e.target.style.opacity = '0.5'
  }
}, true)

app.mount('#app')
