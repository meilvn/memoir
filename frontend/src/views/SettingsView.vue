<template>
  <div class="settings-page">
    <h1 class="page-title">⚙️ 个人设置</h1>

    <div class="settings-grid">
      <div class="settings-card card">
        <h2>👤 个人信息</h2>
        <form @submit.prevent="handleUpdateProfile">
          <div class="form-group">
            <label>昵称</label>
            <input v-model="profileForm.nickname" type="text" placeholder="设置一个昵称" />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </form>
      </div>

      <div class="settings-card card">
        <h2>🔒 修改密码</h2>
        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label>当前密码</label>
            <input v-model="passwordForm.currentPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="passwordForm.newPassword" type="password" required minlength="6" />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '更新中...' : '更新密码' }}
          </button>
        </form>
      </div>

      <div class="settings-card card">
        <h2>🎨 外观</h2>
        <div class="theme-options">
          <button class="theme-btn active" @click="settingsStore.setTheme('warm')">
            🌅 温馨模式
          </button>
          <button class="theme-btn" @click="settingsStore.setTheme('light')">
            ☀️ 明亮模式
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toast = useToast()
const saving = ref(false)

const profileForm = ref({ nickname: '' })
const passwordForm = ref({ currentPassword: '', newPassword: '' })

onMounted(() => {
  if (authStore.user) {
    profileForm.value.nickname = authStore.user.nickname || ''
  }
})

async function handleUpdateProfile() {
  try {
    saving.value = true
    const data = await settingsStore.updateProfile(profileForm.value)
    authStore.setUser({ ...authStore.user, ...data })
    toast.success('个人信息已更新 ✨')
  } catch {
    toast.error('更新失败')
  } finally {
    saving.value = false
  }
}

async function handleChangePassword() {
  try {
    saving.value = true
    await settingsStore.changePassword(passwordForm.value)
    toast.success('密码已更新 🔒')
    passwordForm.value = { currentPassword: '', newPassword: '' }
  } catch (err) {
    toast.error(err?.response?.data?.message || '密码更新失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-family: $font-serif;
  font-size: 2rem;
  margin-bottom: 24px;
}

.settings-grid {
  display: grid;
  gap: 20px;
}

.settings-card {
  h2 {
    font-size: 1.1rem;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid $border;
  }
}

.theme-options {
  display: flex;
  gap: 12px;

  .theme-btn {
    flex: 1;
    padding: 12px;
    border: 2px solid $border;
    border-radius: $radius-sm;
    background: $bg-card;
    transition: $transition;

    &:hover {
      border-color: $primary;
    }

    &.active {
      border-color: $primary;
      background: rgba($primary, 0.05);
      color: $primary;
      font-weight: 600;
    }
  }
}
</style>
