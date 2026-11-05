<template>
  <div class="login-page">
    <div class="water-c" />
    <div class="water-d" />
    <div id="login-particles" class="login-particles" />
    <div class="login-card-wrap">
    <!-- 左侧：动画角色 -->
    <div class="left-panel">
      <div class="logo">
        <AppIcon name="home" :size="22" />
        <span>家庭回忆录</span>
      </div>

      <div class="characters-wrapper">
        <div class="characters-scene">
          <!-- 深陶土长方块 -->
          <div class="character char-terra" :style="{ transform: terraBody, height: terraH }">
            <div class="eyes" :style="{ left: '45px', top: terraEyesTop + 'px', gap: '28px' }">
              <div class="eyeball" :style="{ width: '18px', height: terraBlink ? '2px' : '18px' }">
                <div class="pupil" :style="{ width: '7px', height: '7px', transform: `translate(${terraPupil.x}px, ${terraPupil.y}px)` }" />
              </div>
              <div class="eyeball" :style="{ width: '18px', height: terraBlink ? '2px' : '18px' }">
                <div class="pupil" :style="{ width: '7px', height: '7px', transform: `translate(${terraPupil.x}px, ${terraPupil.y}px)` }" />
              </div>
            </div>
          </div>

          <!-- 暖棕短方块 -->
          <div class="character char-brown" :style="{ transform: brownBody }">
            <div class="eyes" :style="{ left: '26px', top: brownEyesTop + 'px', gap: '20px' }">
              <div class="eyeball" :style="{ width: '16px', height: brownBlink ? '2px' : '16px' }">
                <div class="pupil" :style="{ width: '6px', height: '6px', transform: `translate(${brownPupil.x}px, ${brownPupil.y}px)` }" />
              </div>
              <div class="eyeball" :style="{ width: '16px', height: brownBlink ? '2px' : '16px' }">
                <div class="pupil" :style="{ width: '6px', height: '6px', transform: `translate(${brownPupil.x}px, ${brownPupil.y}px)` }" />
              </div>
            </div>
          </div>

          <!-- 蜜桃半圆 -->
          <div class="character char-peach" :style="{ transform: peachBody }">
            <div class="eyes" :style="{ left: '82px', top: '90px', gap: '28px' }">
              <div class="bare-pupil" :style="{ transform: `translate(${peachPupil.x}px, ${peachPupil.y}px)` }" />
              <div class="bare-pupil" :style="{ transform: `translate(${peachPupil.x}px, ${peachPupil.y}px)` }" />
            </div>
            <div class="orange-mouth" :class="{ visible: isError }" style="left: 90px; top: 120px" />
          </div>

          <!-- 奶油圆角 -->
          <div class="character char-cream" :style="{ transform: creamBody }">
            <div class="eyes" :style="{ left: '52px', top: '40px', gap: '20px' }">
              <div class="bare-pupil" :style="{ transform: `translate(${creamPupil.x}px, ${creamPupil.y}px)` }" />
              <div class="bare-pupil" :style="{ transform: `translate(${creamPupil.x}px, ${creamPupil.y}px)` }" />
            </div>
            <div class="yellow-mouth" :class="{ 'shake-head': isError }" style="left: 40px; top: 88px" />
          </div>
        </div>
      </div>

      <div class="footer-links">
        <span>记录温暖瞬间</span>
        <span>留住时光故事</span>
      </div>
    </div>

    <!-- 右侧：表单 -->
    <div class="right-panel">
      <div class="form-container">
        <div class="form-header">
          <h1>欢迎回家</h1>
          <p>登录你的家庭回忆录</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名或邮箱</label>
            <div class="input-wrapper">
              <input
                v-model="identifier"
                type="text"
                placeholder="请输入用户名或邮箱"
                autocomplete="off"
                required
                @focus="onUserFocus"
                @blur="onUserBlur"
              />
            </div>
          </div>

          <div class="form-group">
            <label>密码</label>
            <div class="input-wrapper">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                required
                @focus="isPwdFocused = true; update()"
                @blur="isPwdFocused = false; update()"
              />
              <button type="button" class="toggle-password" @click="togglePwd">
                <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="18" />
              </button>
            </div>
          </div>

          <button type="submit" class="btn-login" :disabled="loading">
            <span class="btn-text">{{ loading ? '登录中…' : '登录' }}</span>
            <div class="btn-hover-content">
              <span>{{ loading ? '登录中…' : '登录' }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        </form>

        <div class="signup-link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

const particlesOptions = {
  fullScreen: false,
  background: { color: 'transparent' },
  fpsLimit: 60,
  interactivity: { events: { onHover: { enable: true, mode: 'bubble' } } },
  particles: {
    number: { value: 40, density: { enable: true } },
    color: { value: ['#ffffff', '#f0d4b8', '#e89b6a'] },
    shape: { type: 'circle' },
    opacity: { value: { min: 0.15, max: 0.5 }, animation: { enable: true, speed: 0.6 } },
    size: { value: { min: 1, max: 4 } },
    move: {
      enable: true,
      speed: 0.8,
      direction: 'top',
      random: true,
      outModes: { default: 'out' },
    },
  },
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

// ===== 角色状态 =====
const mouse = reactive({ x: 0, y: 0 })
const isTyping = ref(false)
const isPwdFocused = ref(false)
const isError = ref(false)
const terraBlink = ref(false)
const brownBlink = ref(false)

const terraBody = ref('skewX(0deg)')
const terraH = ref('370px')
const terraEyesTop = ref(40)
const terraPupil = reactive({ x: 0, y: 0 })

const brownBody = ref('skewX(0deg)')
const brownEyesTop = ref(32)
const brownPupil = reactive({ x: 0, y: 0 })

const peachBody = ref('skewX(0deg)')
const peachPupil = reactive({ x: 0, y: 0 })

const creamBody = ref('skewX(0deg)')
const creamPupil = reactive({ x: 0, y: 0 })

let typingTimer = null
let blinkTimers = []

function elCenter(el) {
  const r = el.getBoundingClientRect()
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 3, w: r.width }
}

function pupilToward(cx, cy, max) {
  const dx = mouse.x - cx
  const dy = mouse.y - cy
  const dist = Math.min(Math.hypot(dx, dy), max)
  const ang = Math.atan2(dy, dx)
  return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist }
}

function update() {
  const terra = document.querySelector('.char-terra')
  const brown = document.querySelector('.char-brown')
  const peach = document.querySelector('.char-peach')
  const cream = document.querySelector('.char-cream')
  if (!terra) return

  const isLookingAway = isPwdFocused.value && !showPassword.value
  const showingPwd = password.value.length > 0 && showPassword.value

  // 陶土角色
  if (isError.value) {
    terraBody.value = 'skewX(0deg)'
    terraEyesTop.value = 55
    terraPupil.x = -3; terraPupil.y = 4
  } else if (isLookingAway) {
    terraBody.value = 'skewX(-14deg) translateX(-20px)'
    terraH.value = '410px'
    terraEyesTop.value = 25
    terraPupil.x = -5; terraPupil.y = -5
  } else if (isTyping.value) {
    terraBody.value = 'skewX(-12deg) translateX(40px)'
    terraH.value = '410px'
    terraEyesTop.value = 65
    terraPupil.x = 3; terraPupil.y = 4
  } else {
    terraH.value = '370px'
    const { cx, cy } = elCenter(terra)
    const dx = mouse.x - cx
    terraBody.value = `skewX(${Math.max(-6, Math.min(6, -dx / 120))}deg)`
    terraEyesTop.value = 40 + Math.max(-10, Math.min(10, (mouse.y - cy) / 30))
    const p = pupilToward(cx, cy, 5)
    terraPupil.x = p.x; terraPupil.y = p.y
  }

  // 棕色角色
  if (isError.value) {
    brownBody.value = 'skewX(0deg)'
    brownEyesTop.value = 45
    brownPupil.x = -3; brownPupil.y = 4
  } else if (isLookingAway) {
    brownBody.value = 'skewX(12deg) translateX(-10px)'
    brownEyesTop.value = 20
    brownPupil.x = 5; brownPupil.y = -5
  } else if (isTyping.value) {
    brownBody.value = 'skewX(10deg) translateX(20px)'
    brownEyesTop.value = 55
    brownPupil.x = -3; brownPupil.y = 4
  } else {
    const { cx, cy } = elCenter(brown)
    const dx = mouse.x - cx
    brownBody.value = `skewX(${Math.max(-6, Math.min(6, -dx / 120))}deg)`
    brownEyesTop.value = 32 + Math.max(-10, Math.min(10, (mouse.y - cy) / 30))
    const p = pupilToward(cx, cy, 4)
    brownPupil.x = p.x; brownPupil.y = p.y
  }

  // 蜜桃半圆
  if (isError.value) {
    peachBody.value = 'skewX(0deg)'
    peachPupil.x = -3; peachPupil.y = 4
  } else if (isLookingAway) {
    peachBody.value = 'skewX(-10deg) translateX(-16px)'
    peachPupil.x = -6; peachPupil.y = -4
  } else if (showingPwd) {
    peachBody.value = 'skewX(8deg) translateX(10px)'
    peachPupil.x = 4; peachPupil.y = -5
  } else {
    const { cx, cy } = elCenter(peach)
    peachBody.value = 'skewX(0deg)'
    const p = pupilToward(cx, cy, 6)
    peachPupil.x = p.x; peachPupil.y = p.y
  }

  // 奶油圆角
  if (isError.value) {
    creamBody.value = 'skewX(0deg)'
    creamPupil.x = -3; creamPupil.y = 4
  } else if (isLookingAway) {
    creamBody.value = 'skewX(10deg) translateX(-8px)'
    creamPupil.x = 5; creamPupil.y = -5
  } else if (showingPwd) {
    creamBody.value = 'skewX(-8deg) translateX(-6px)'
    creamPupil.x = -4; creamPupil.y = -5
  } else {
    const { cx, cy } = elCenter(cream)
    creamBody.value = 'skewX(0deg)'
    const p = pupilToward(cx, cy, 6)
    creamPupil.x = p.x; creamPupil.y = p.y
  }
}

function onMouseMove(e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
  if (!isTyping.value && !isError.value) update()
}

function onUserFocus() {
  isTyping.value = true
  clearTimeout(typingTimer)
  update()
}
function onUserBlur() {
  isTyping.value = false
  update()
}

function togglePwd() {
  showPassword.value = !showPassword.value
  update()
}

function scheduleBlink(target) {
  const t = setTimeout(() => {
    target.value = true
    update()
    const t2 = setTimeout(() => {
      target.value = false
      update()
      scheduleBlink(target)
    }, 150)
    blinkTimers.push(t2)
  }, Math.random() * 4000 + 3000)
  blinkTimers.push(t)
}

onMounted(async () => {
  window.addEventListener('mousemove', onMouseMove)
  scheduleBlink(terraBlink)
  scheduleBlink(brownBlink)
  try {
    await loadSlim(tsParticles)
    await tsParticles.load({ id: 'login-particles', options: particlesOptions })
  } catch (e) { console.warn('particles failed', e) }
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  blinkTimers.forEach(clearTimeout)
  clearTimeout(typingTimer)
})

async function handleLogin() {
  try {
    loading.value = true
    await authStore.login(identifier.value, password.value)
    isError.value = false
    toast.success('登录成功！欢迎回来')
    router.push(route.query.redirect || '/')
  } catch (err) {
    toast.error(err?.response?.data?.message || '登录失败，请检查用户名和密码')
    isError.value = true
    update()
    setTimeout(() => { isError.value = false; update() }, 1600)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #e8cdb5;
  overflow: hidden;
  z-index: 100;
}

/* 水流般的多层色块 */
.login-page::before,
.login-page::after,
.water-c,
.water-d {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  mix-blend-mode: soft-light;
}
.login-page::before {
  width: 60vmax;
  height: 60vmax;
  top: -20vmax;
  left: -10vmax;
  background: radial-gradient(circle at 30% 30%, #d97a4e, transparent 60%);
  animation: water-a 16s ease-in-out infinite;
}
.login-page::after {
  width: 60vmax;
  height: 60vmax;
  bottom: -25vmax;
  right: -15vmax;
  background: radial-gradient(circle at 60% 60%, #b85c3a, transparent 60%);
  animation: water-b 20s ease-in-out infinite;
}

.water-c {
  width: 45vmax;
  height: 45vmax;
  top: 30%;
  left: 40%;
  opacity: 1;
  background: radial-gradient(circle, #f0b98a, transparent 65%);
  animation: water-c 13s ease-in-out infinite;
}

.water-d {
  width: 35vmax;
  height: 35vmax;
  top: 10%;
  right: 20%;
  background: radial-gradient(circle, #e89b6a, transparent 60%);
  animation: water-d 18s ease-in-out infinite;
}

@keyframes water-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(8vmax, 6vmax) scale(1.15); }
  66% { transform: translate(-4vmax, 10vmax) scale(0.95); }
}
@keyframes water-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-10vmax, -8vmax) scale(1.2); }
}
@keyframes water-c {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-30%, -60%) scale(1.3); }
}
@keyframes water-d {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-12vmax, 10vmax) scale(1.25); }
}

.login-card-wrap {
  position: relative;
  z-index: 2;
  width: min(1040px, 100%);
  height: min(620px, 86vh);
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(90, 45, 20, 0.35);
}

.login-particles {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* ===== 左侧 ===== */
.left-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #f5e9dc;
  padding: 40px 48px;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 10%;
    right: -10%;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(255, 220, 180, 0.6), transparent 70%);
    border-radius: 50%;
    filter: blur(40px);
    animation: orb-move 10s ease-in-out infinite;
  }
  &::before {
    content: '';
    position: absolute;
    bottom: -10%;
    left: -5%;
    width: 480px;
    height: 480px;
    background: radial-gradient(circle, rgba(140, 70, 40, 0.35), transparent 70%);
    border-radius: 50%;
    filter: blur(50px);
    animation: orb-move 13s ease-in-out infinite reverse;
  }
}

@keyframes orb-move {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.15); }
}

.logo {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #5a3826;
}

.characters-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 420px;
}

.characters-scene {
  position: relative;
  width: 480px;
  height: 360px;
}

.character {
  position: absolute;
  bottom: 0;
  transition: transform 0.7s ease-in-out, height 0.7s ease-in-out;
  transform-origin: bottom center;
}

.char-terra {
  left: 60px;
  width: 170px;
  height: 370px;
  background: #b85c3a;
  border-radius: 10px 10px 0 0;
  z-index: 1;
}
.char-brown {
  left: 220px;
  width: 115px;
  height: 290px;
  background: #3a2a22;
  border-radius: 8px 8px 0 0;
  z-index: 2;
}
.char-peach {
  left: 0;
  width: 230px;
  height: 190px;
  background: #e89b6a;
  border-radius: 115px 115px 0 0;
  z-index: 3;
}
.char-cream {
  left: 290px;
  width: 135px;
  height: 215px;
  background: #e8c98a;
  border-radius: 68px 68px 0 0;
  z-index: 4;
}

.eyes {
  position: absolute;
  display: flex;
  transition: all 0.7s ease-in-out;
}
.eyeball {
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.15s ease;
}
.pupil {
  border-radius: 50%;
  background: #2d1a12;
  transition: transform 0.1s ease-out;
}
.bare-pupil {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2d1a12;
  transition: transform 0.7s ease-in-out;
}

.orange-mouth {
  position: absolute;
  width: 28px;
  height: 14px;
  border: 3px solid #2d1a12;
  border-top: none;
  border-radius: 0 0 14px 14px;
  opacity: 0;
  transition: all 0.7s ease-in-out;
  &.visible { opacity: 1; }
}
.yellow-mouth {
  position: absolute;
  width: 50px;
  height: 4px;
  background: #2d1a12;
  border-radius: 2px;
}

@keyframes shakeHead {
  0%, 100% { translate: 0 0; }
  10% { translate: -9px 0; }
  20% { translate: 7px 0; }
  30% { translate: -6px 0; }
  40% { translate: 5px 0; }
  50% { translate: -4px 0; }
  60% { translate: 3px 0; }
  70% { translate: -2px 0; }
  80% { translate: 1px 0; }
}
.yellow-mouth.shake-head {
  animation: shakeHead 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.footer-links {
  position: relative;
  z-index: 10;
  display: flex;
  gap: 28px;
  font-size: 13px;
  color: rgba(90, 56, 38, 0.7);
}

@keyframes gradient-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ===== 右侧 ===== */
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card, #fff);
  padding: 40px;
}

.form-container {
  width: 100%;
  max-width: 380px;
}

.form-header {
  text-align: center;
  margin-bottom: 36px;
  h1 {
    font-family: $font-serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
  }
  p { font-size: 14px; color: var(--text-muted); }
}

.form-group {
  margin-bottom: 22px;
  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
}
.input-wrapper { position: relative; }
.form-group input {
  width: 100%;
  height: 48px;
  border: none !important;
  border-bottom: 1.5px solid var(--border) !important;
  border-radius: 0 !important;
  padding: 0 36px 0 6px;
  font-size: 15px;
  background: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  color: var(--text-primary);
  transition: border-color 0.3s;
  &:focus {
    border-bottom: 1.5px solid var(--primary) !important;
  }
  &::placeholder { color: var(--text-muted); }
}

.toggle-password {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 6px;
}

/* 按钮：hover 时文字滑出、陶土色背景+箭头滑入 */
.btn-login {
  position: relative;
  width: 100%;
  height: 50px;
  border-radius: 25px;
  border: 1.5px solid var(--text-primary);
  background: var(--text-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  margin-top: 8px;
  transition: border-color 0.3s;
}
.btn-text {
  display: inline-block;
  transition: all 0.3s;
}
.btn-hover-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--primary);
  color: #fff;
  opacity: 0;
  transition: all 0.3s;
  border-radius: 25px;
}
.btn-login:hover:not(:disabled) .btn-text {
  transform: translateX(40px);
  opacity: 0;
}
.btn-login:hover:not(:disabled) .btn-hover-content {
  opacity: 1;
}

.signup-link {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 28px;
  a { color: var(--text-primary); font-weight: 600; }
}

@media (max-width: 900px) {
  .login-card-wrap { grid-template-columns: 1fr; height: auto; }
  .left-panel { display: none; }
}
</style>
