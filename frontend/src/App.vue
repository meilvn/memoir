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

const authStore = useAuthStore()
const route = useRoute()

const showNavbar = computed(() => authStore.isLoggedIn)
const showScrollTop = ref(false)
const loading = ref(false)

let loadingTimer = null

function onEnter() {
  loading.value = true
  clearTimeout(loadingTimer)
  loadingTimer = setTimeout(() => { loading.value = false }, 600)
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

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.995);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.995);
}

.loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, $primary, $primary-light);
  z-index: 9999;
  transform: scaleX(0);
  transform-origin: left;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;

  &.visible {
    opacity: 1;
    animation: load-bar 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
</style>
