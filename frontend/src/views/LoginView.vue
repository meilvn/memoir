<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-circle c1"></div>
      <div class="bg-circle c2"></div>
      <div class="bg-circle c3"></div>
    </div>

    <div class="login-card card">
      <div class="login-header">
        <span class="login-icon">🏠</span>
        <h1>欢迎回家</h1>
        <p>登录你的家庭回忆录</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名或邮箱</label>
          <input v-model="identifier" type="text" placeholder="请输入用户名或邮箱" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <div class="input-wrap">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" required />
            <button type="button" class="input-toggle" @click="showPassword = !showPassword">
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
            </button>
          </div>
        </div>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="login-footer">
        <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  try {
    loading.value = true
    await authStore.login(identifier.value, password.value)
    toast.success('登录成功！欢迎回来 🎉')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    toast.error(err?.response?.data?.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, $bg-warm, $bg-light);
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.c1 {
  width: 300px;
  height: 300px;
  background: $primary;
  top: -50px;
  right: -50px;
  animation: float 8s ease-in-out infinite;
}

.c2 {
  width: 200px;
  height: 200px;
  background: $accent-mint;
  bottom: -30px;
  left: -30px;
  animation: float 6s ease-in-out infinite 1s;
}

.c3 {
  width: 150px;
  height: 150px;
  background: $accent-pink;
  top: 40%;
  left: 60%;
  animation: float 7s ease-in-out infinite 2s;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease-out;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .login-icon {
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

.login-btn {
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

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 0.9rem;
  color: $text-muted;

  a {
    color: $primary;
    font-weight: 500;
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
</style>
