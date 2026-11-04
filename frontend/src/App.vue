<template>
  <div id="app" class="app-wrapper">
    <AppNavbar v-if="showNavbar" />
    <div class="app-body">
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <AppFooter v-if="showNavbar" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'

const authStore = useAuthStore()

const showNavbar = computed(() => authStore.isLoggedIn)
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
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
