<template>
  <div class="not-found-page">
    <div class="nf-content">
      <span class="nf-icon"><AppIcon name="image" :size="48" /></span>
      <h1 class="nf-title serif">404</h1>
      <p class="nf-desc">这张照片好像走丢了…</p>
      <router-link to="/" class="btn btn-primary">
        <AppIcon name="home" :size="16" />
        回到首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-8 $space-5;
}

.nf-content {
  text-align: center;
}

.nf-icon {
  display: inline-grid;
  place-items: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: $primary-soft;
  color: var(--primary);
  margin-bottom: $space-5;
}

.nf-title {
  font-size: $text-5xl;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: $space-3;
}

.nf-desc {
  font-size: $text-lg;
  color: var(--text-secondary);
  margin-bottom: $space-6;
}
</style>
