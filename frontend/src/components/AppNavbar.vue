<template>
  <nav class="navbar">
    <router-link to="/" class="logo">
      <span class="logo-mark"><AppIcon name="home" :size="17" /></span>
      <span>家庭回忆录</span>
    </router-link>
    <div class="nav-links">
      <router-link to="/" class="nav-link">
        <AppIcon name="home" :size="16" />首页
      </router-link>
      <router-link to="/gallery" class="nav-link">
        <AppIcon name="image" :size="16" />画廊
      </router-link>
      <router-link to="/stories" class="nav-link">
        <AppIcon name="book" :size="16" />故事
      </router-link>
      <router-link to="/timeline" class="nav-link">
        <AppIcon name="clock" :size="16" />时间线
      </router-link>
      <router-link to="/stats" class="nav-link">
        <AppIcon name="chart" :size="16" />洞察
      </router-link>
    </div>
    <div class="nav-actions">
      <router-link to="/settings" class="avatar" :title="userStore.user?.nickname || userStore.user?.username">
        {{ avatarText }}
      </router-link>
      <button class="btn btn-ghost logout-btn" @click="handleLogout">
        <AppIcon name="logout" :size="15" />退出
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const userStore = useAuthStore()
const toast = useToast()

const avatarText = computed(
  () => userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U',
)

function handleLogout() {
  userStore.logout()
  toast.success('再见，记得常回来看看')
  router.push('/login')
}
</script>

<style scoped>
.logo {
  text-decoration: none;
  color: inherit;
}

.logo-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: $primary;
  color: #fff;
  display: grid;
  place-items: center;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  text-decoration: none;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
