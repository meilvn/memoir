<template>
  <nav class="navbar">
    <router-link to="/" class="logo">
      <span class="logo-mark"><AppIcon name="home" :size="17" /></span>
      <span>家庭回忆录</span>
    </router-link>

    <!-- 桌面端导航（与移动端同一份 navLinks，7 项一致） -->
    <div class="nav-links">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        :title="link.label"
      >
        <AppIcon :name="link.icon" :size="16" /><span class="nav-label">{{ link.label }}</span>
      </router-link>
    </div>

    <!-- 移动端汉堡按钮 -->
    <button
      class="hamburger"
      :class="{ open: mobileOpen }"
      :aria-expanded="mobileOpen ? 'true' : 'false'"
      aria-label="打开导航"
      @click="mobileOpen = !mobileOpen"
    >
      <span></span><span></span><span></span>
    </button>

    <!-- 移动端：抽屉 + 遮罩（Teleport 到 body，避免被 navbar 的 backdrop-filter 困住） -->
    <Teleport to="body">
      <transition name="scrim">
        <div v-if="mobileOpen" class="mobile-scrim" @click="mobileOpen = false"></div>
      </transition>
      <transition name="drawer">
        <aside v-if="mobileOpen" class="mobile-drawer" aria-label="主导航">
          <div class="drawer-head">
            <span class="eyebrow">Navigation</span>
            <button class="drawer-close" aria-label="关闭导航" @click="mobileOpen = false">
              <AppIcon name="close" :size="18" />
            </button>
          </div>
          <nav class="drawer-links">
            <router-link
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="mobile-link"
              @click="mobileOpen = false"
            >
              <AppIcon :name="link.icon" :size="18" />
              {{ link.label }}
            </router-link>
          </nav>
        </aside>
      </transition>
    </Teleport>

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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const userStore = useAuthStore()
const toast = useToast()

const mobileOpen = ref(false)

function onKeydown(e) {
  if (e.key === 'Escape') mobileOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

// 抽屉展开时锁定页面滚动
watch(mobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

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
  background: var(--primary);
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
    background: var(--text-primary);
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

/* ===== 移动端：抽屉 + 遮罩 ===== */
.mobile-scrim {
  position: fixed;
  inset: 64px 0 0 0;
  background: rgba(26, 26, 26, 0.42);
  backdrop-filter: blur(2px);
  z-index: 98;
}

.mobile-drawer {
  position: fixed;
  top: 64px;
  right: 0;
  bottom: 0;
  width: min(300px, 82vw);
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  box-shadow: $shadow-lg;
  padding: $space-4 $space-4 $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  overflow-y: auto;
  z-index: 99;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px $space-2;
  border-bottom: 1px solid var(--border);
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: $radius-sm;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--bg-light);
    color: var(--text-primary);
  }
}

.drawer-links {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-3;
  border-radius: $radius-sm;
  color: var(--text-secondary);
  font-size: $text-base;
  text-decoration: none;
  transition: $transition-fast;

  &:hover {
    background: var(--bg-light);
    color: var(--text-primary);
  }

  &.router-link-active {
    background: $primary-soft;
    color: var(--primary-text);
  }
}

.scrim-enter-active,
.scrim-leave-active {
  transition: opacity 0.24s $ease-out;
}
.scrim-enter-from,
.scrim-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.24s $ease-out;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
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

/* 769–1023px：7 项会挤，收起文字只留图标（悬停看 tooltip） */
@media (min-width: 769px) and (max-width: 1023px) {
  .nav-link .nav-label {
    display: none;
  }

  .nav-link {
    padding: 8px 10px !important;
  }
}
</style>
