import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/styles/global.scss'
import { vReveal } from './directives/reveal'

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
app.mount('#app')
