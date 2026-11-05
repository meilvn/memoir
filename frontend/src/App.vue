<template>
  <div id="app" class="app-wrapper">
    <div class="loading-bar" :class="{ visible: loading }" />
    <AppNavbar v-if="showNavbar" />
    <div class="app-body">
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in" @enter="onEnter" @leave="onLeave">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <AppFooter v-if="showNavbar" />
    <PetMascot />
    <button class="scroll-top" :class="{ visible: showScrollTop }" title="回到顶部" @click="scrollToTop">
      <AppIcon name="chevronUp" :size="20" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppIcon from '@/components/AppIcon.vue'
import PetMascot from '@/components/PetMascot.vue'

const authStore = useAuthStore()
const route = useRoute()

const showNavbar = computed(() => authStore.isLoggedIn)
const showScrollTop = ref(false)
const loading = ref(false)

let loadingTimer = null

function onEnter() {
  loading.value = true
  clearTimeout(loadingTimer)
  loadingTimer = setTimeout(() => { loading.value = false }, 320)
}

function onLeave() {
  clearTimeout(loadingTimer)
  loading.value = false
}

function onScroll() {
  showScrollTop.value = window.scrollY > 400
  const navbar = document.querySelector('.navbar')
  if (navbar) {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 20px rgba(0, 0, 0, 0.08)'
      : '0 1px 0 rgba(0, 0, 0, 0.04)'
    navbar.style.borderColor = window.scrollY > 10 ? 'var(--border)' : 'transparent'
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  clearTimeout(loadingTimer)
})
</script>

<style lang="scss">
.page-enter-active,
.page-leave-active {
  transition: opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1), transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, var(--primary), $primary-light);
  z-index: 9999;
  transform: scaleX(0);
  transform-origin: left;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;

  &.visible {
    opacity: 1;
    animation: load-bar 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
}

@keyframes load-bar {
  0% {
    transform: scaleX(0);
  }
  50% {
    transform: scaleX(0.7);
  }
  100% {
    transform: scaleX(1);
  }
}

html {
  scroll-behavior: smooth;
}

.app-body {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  min-height: calc(100vh - 64px - 48px);
}

/* Toast 旁的小陶表情 */
.Vue-Toastification__toast {
  position: relative;
  padding-left: 44px !important;
}
.Vue-Toastification__toast::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 22px;
  border-radius: 10px 10px 6px 6px;
  background: #e8c98a;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.05);
}
.Vue-Toastification__toast::after {
  content: '• •';
  position: absolute;
  left: 17px;
  top: 50%;
  transform: translateY(-60%);
  font-size: 10px;
  letter-spacing: 4px;
  color: #2d1a12;
}
.Vue-Toastification__toast--success::after {
  content: '⌣';
  font-size: 14px;
  letter-spacing: 0;
  left: 50%;
  margin-left: -13px;
  top: 58%;
}
.Vue-Toastification__toast--error::after {
  content: '⌢';
  font-size: 14px;
  letter-spacing: 0;
  left: 50%;
  margin-left: -13px;
  top: 48%;
}
</style>
