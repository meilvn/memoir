<template>
  <div id="app" class="app-wrapper">
    <AppNavbar v-if="showNavbar" />
    <div class="app-body">
      <AppSidebar v-if="showNavbar && showSidebar" />
      <main class="main-content" :class="{ 'with-sidebar': showNavbar && showSidebar }">
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
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppNavbar from '@/components/AppNavbar.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
const authStore = useAuthStore()

const showNavbar = computed(() => authStore.isLoggedIn)
const showSidebar = computed(() => {
  return authStore.isLoggedIn && !['Login', 'Register', 'MediaDetail'].includes(route.name)
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.app-body {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  min-height: calc(100vh - 64px - 48px);
}

.main-content.with-sidebar {
  margin-left: 0;
}

@media (min-width: 1024px) {
  .main-content.with-sidebar {
    margin-left: 260px;
  }
}
</style>
