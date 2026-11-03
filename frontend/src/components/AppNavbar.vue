<template>
  <nav class="navbar">
    <div class="logo">
      <span class="logo-icon">🏠</span>
      <span>家庭回忆录</span>
      <span class="heart">❤️</span>
    </div>
    <div class="nav-links">
      <router-link to="/" class="nav-link">🏠 首页</router-link>
      <router-link to="/gallery" class="nav-link">🖼 画廊</router-link>
      <router-link to="/stories" class="nav-link">📖 故事</router-link>
      <router-link to="/timeline" class="nav-link">⏳ 时间线</router-link>
    </div>
    <div class="nav-actions">
      <router-link to="/settings" class="avatar">
        {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || '👤' }}
      </router-link>
      <button class="btn btn-ghost" @click="handleLogout">退出</button>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const userStore = useAuthStore()
const toast = useToast()

function handleLogout() {
  userStore.logout()
  toast.success('再见，记得常回来看看 💛')
  router.push('/login')
}
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
}

.heart {
  display: inline-block;
  animation: heartbeat 1.5s ease-in-out infinite;
  font-size: 1rem;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.2); }
  28% { transform: scale(1); }
  42% { transform: scale(1.15); }
  56% { transform: scale(1); }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  text-decoration: none;
}
</style>
