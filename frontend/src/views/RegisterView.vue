<template>
  <div class="register-page">
    <div class="register-bg">
      <div class="bg-circle c1"></div>
      <div class="bg-circle c2"></div>
      <div class="bg-circle c3"></div>
    </div>

    <div class="register-card card">
      <div class="register-header">
        <span class="register-icon">🎉</span>
        <h1>欢迎加入</h1>
        <p>创建你的家庭回忆录账号</p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名（至少3个字符）" required minlength="3" />
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="请输入邮箱地址" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <div class="input-wrap">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码（至少6个字符）" required minlength="6" />
            <button type="button" class="input-toggle" @click="showPassword = !showPassword">
              <AppIcon :name="showPassword ? 'eyeOff' : 'eye'" :size="16" />
            </button>
          </div>
          <div class="password-strength">
            <span :class="['strength-dot', strengthClass]"></span>
            <span class="strength-text">{{ strengthText }}</span>
          </div>
        </div>
        <button type="submit" class="btn btn-primary register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="register-footer">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

const strengthClass = computed(() => {
  const len = password.value.length
  if (len >= 10) return 'strong'
  if (len >= 6) return 'medium'
  return 'weak'
})

const strengthText = computed(() => {
  const map = { weak: '弱', medium: '中', strong: '强' }
  return map[strengthClass.value] || ''
})

async function handleRegister() {
  try {
    loading.value = true
    await authStore.register(username.value, email.value, password.value)
    toast.success('注册成功！欢迎加入 🎉')
    router.push('/')
  } catch (err) {
    toast.error(err?.response?.data?.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, $bg-warm, $bg-light);
  overflow: hidden;
}

.register-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
}

.c1 {
  width: 350px;
  height: 350px;
  background: $primary;
  top: -80px;
  left: -80px;
  animation: float 8s ease-in-out infinite;
}

.c2 {
  width: 250px;
  height: 250px;
  background: $accent-mint;
  bottom: -50px;
  right: -50px;
  animation: float 7s ease-in-out infinite 1s;
}

.c3 {
  width: 180px;
  height: 180px;
  background: $accent-pink;
  top: 50%;
  right: 20%;
  animation: float 9s ease-in-out infinite 2s;
}

.register-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease-out;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;

  .register-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 8px;
  }

  h1 {
    font-family: $font-serif;
    font-size: 1.8rem;
    margin-bottom: 4px;
  }

  p {
    color: $text-muted;
    font-size: 0.95rem;
  }
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;

  .strength-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transition: $transition;

    &.weak { background: $error; }
    &.medium { background: $primary-light; }
    &.strong { background: $success; }
  }

  .strength-text {
    font-size: 0.8rem;
    color: $text-muted;
  }
}

.register-btn {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  margin-top: 8px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-toggle {
  position: absolute;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  color: $text-muted;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    color: $text-primary;
  }
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 0.9rem;
  color: $text-muted;

  a {
    color: $primary;
    font-weight: 500;
  }
}
</style>
