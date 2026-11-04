<template>
  <div id="app" class="app-wrapper">
    <AppNavbar v-if="showNavbar" />
    <div class="app-body">
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
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
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppIcon from '@/components/AppIcon.vue'

const authStore = useAuthStore()

const showNavbar = computed(() => authStore.isLoggedIn)
const showScrollTop = ref(false)

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

.app-body {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  min-height: calc(100vh - 64px - 48px);
}
</style>
