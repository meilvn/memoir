<template>
  <div class="settings-page">
    <h1 class="page-title serif">设置</h1>

    <!-- 用户资料 -->
    <section class="settings-section" data-reveal>
      <h2 class="section-title"><AppIcon name="user" :size="16" />个人资料</h2>
      <div class="settings-card card">
        <div class="profile-row">
          <div class="profile-avatar">
            {{ avatarText }}
          </div>
          <div class="profile-info">
            <p class="profile-name">{{ authStore.user?.nickname || authStore.user?.username || '用户' }}</p>
            <p class="profile-email">{{ authStore.user?.email || '' }}</p>
            <span class="profile-role">{{ roleLabel }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 偏好设置 -->
    <section class="settings-section" data-reveal>
      <h2 class="section-title"><AppIcon name="sliders" :size="16" />偏好设置</h2>
      <div class="settings-card card">
        <div class="setting-item">
          <div class="setting-info">
            <p class="setting-label">自动播放幻灯片</p>
            <p class="setting-desc">在灯箱中打开图片时自动轮播</p>
          </div>
          <label class="toggle">
            <input v-model="prefs.autoplay" type="checkbox" @change="savePrefs" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <p class="setting-label">灯箱进度条</p>
            <p class="setting-desc">幻灯片播放时显示倒计时进度</p>
          </div>
          <label class="toggle">
            <input v-model="prefs.showProgress" type="checkbox" @change="savePrefs" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <p class="setting-label">动画效果</p>
            <p class="setting-desc">页面切换和元素入场动画</p>
          </div>
          <label class="toggle">
            <input v-model="prefs.animations" type="checkbox" @change="savePrefs" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </section>

    <!-- 账号安全 -->
    <section class="settings-section" data-reveal>
      <h2 class="section-title"><AppIcon name="check" :size="16" />账号安全</h2>
      <div class="settings-card card">
        <div class="setting-item">
          <div class="setting-info">
            <p class="setting-label">登录状态</p>
            <p class="setting-desc">Token 有效期 7 天</p>
          </div>
          <span class="status-badge online">已登录</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <p class="setting-label">退出登录</p>
            <p class="setting-desc">清除本地登录状态</p>
          </div>
          <button class="btn btn-ghost danger" @click="handleLogout">退出</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const avatarText = ref(
  authStore.user?.nickname?.[0] || authStore.user?.username?.[0] || 'U',
)

const roleLabel = {
  ADMIN: '管理员',
  USER: '普通用户',
}[authStore.user?.role] || '用户'

const prefs = reactive({
  autoplay: true,
  showProgress: true,
  animations: true,
})

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('memoir-prefs') || '{}')
    Object.assign(prefs, saved)
  } catch {
    // ignore
  }

  // 确保用户信息已加载
  if (!authStore.user && authStore.isLoggedIn) {
    authStore.fetchMe().catch(() => {})
  }
})

function savePrefs() {
  localStorage.setItem('memoir-prefs', JSON.stringify(prefs))
  toast.success('偏好已保存')
}

function handleLogout() {
  authStore.logout()
  toast.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped lang="scss">
.settings-page {
  max-width: 720px;
  margin: 0 auto;
}

.page-title {
  font-size: $text-3xl;
  font-weight: 600;
  margin-bottom: $space-6;
}

.settings-section {
  margin-bottom: $space-6;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: $text-sm;
  font-weight: 600;
  color: $text-secondary;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: $space-3;
}

.settings-card {
  padding: $space-1;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-4 $space-5;

  &:not(:last-child) {
    border-bottom: 1px solid $border;
  }
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-weight: 500;
  font-size: $text-base;
  margin-bottom: 2px;
}

.setting-desc {
  font-size: $text-sm;
  color: $text-muted;
}

/* 开关按钮 */
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    inset: 0;
    background: $border-strong;
    border-radius: $radius-full;
    transition: $transition-fast;

    &::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: $transition-fast;
    }
  }

  input:checked + .toggle-slider {
    background: $primary;

    &::before {
      transform: translateX(20px);
    }
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px $space-3;
  border-radius: $radius-full;
  font-size: $text-xs;
  font-weight: 500;

  &.online {
    background: rgba($success, 0.12);
    color: $success;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $success;
    }
  }
}

.btn.danger {
  color: $error;

  &:hover {
    background: rgba($error, 0.08);
  }
}

/* 用户资料 */
.profile-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4 $space-5;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: $primary;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: $text-xl;
  font-weight: 600;
  font-family: $font-serif;
  flex-shrink: 0;
}

.profile-name {
  font-size: $text-lg;
  font-weight: 600;
  margin-bottom: 2px;
}

.profile-email {
  font-size: $text-sm;
  color: $text-muted;
  margin-bottom: 4px;
}

.profile-role {
  display: inline-block;
  font-size: $text-xs;
  padding: 2px 10px;
  border-radius: $radius-full;
  background: $primary-soft;
  color: $primary;
  font-weight: 500;
}
</style>
