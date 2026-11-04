<template>
  <nav class="navbar">
    <router-link to="/" class="logo">
      <span class="logo-mark"><AppIcon name="home" :size="17" /></span>
      <span>家庭回忆录</span>
    </router-link>

    <!-- 桌面端导航 -->
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

    <!-- 移动端汉堡按钮 -->
    <button class="hamburger" :class="{ open: mobileOpen }" @click="mobileOpen = !mobileOpen">
      <span></span><span></span><span></span>
    </button>

    <!-- 移动端下拉菜单 -->
    <transition name="mb">
      <div v-if="mobileOpen" class="mobile-menu" @click.self="mobileOpen = false">
        <router-link v-for="link in navLinks" :key="link.to" :to="link.to" class="mobile-link" @click="mobileOpen = false">
          <AppIcon :name="link.icon" :size="18" />
          {{ link.label }}
        </router-link>
      </div>
    </transition>

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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const userStore = useAuthStore()
const toast = useToast()

const mobileOpen = ref(false)

const avatarText = computed(
  () => userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U',
)

const navLinks = [
  { to: '/', icon: 'home', label: '首页' },
  { to: '/gallery', icon: 'image', label: '画廊' },
  { to: '/albums', icon: 'folder', label: '相册' },
  { to: '/upload', icon: 'upload', label: '上传' },
  { to: '/stories', icon: 'book', label: '故事' },
  { to: '/timeline', icon: 'clock', label: '时间线' },
  { to: '/stats', icon: 'chart', label: '洞察' },
]

function handleLogout() {
  userStore.logout()
  toast.success('再见，记得常回来看看')
  router.push('/login')
}
</script>

<style scoped lang="scss">
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

/* ===== 汉堡按钮 ===== */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;

  span {
    display: block;
    width: 22px;
    height: 2px;
    background: $text-primary;
    border-radius: 2px;
    transition: $transition-fast;
    transform-origin: center;
  }

  &.open {
    span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    span:nth-child(2) {
      opacity: 0;
    }
    span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }
  }
}

/* ===== 移动端下拉菜单 ===== */
.mobile-menu {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg-card;
  border-top: 1px solid $border;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  z-index: 99;
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: $text-base;
  text-decoration: none;
  transition: $transition-fast;

  &:hover, &.router-link-active {
    background: $primary-soft;
    color: $primary;
  }
}

.mb-enter-active,
.mb-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.mb-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.mb-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .hamburger {
    display: flex;
  }

  .logout-btn span {
    display: none;
  }
}
</style>
