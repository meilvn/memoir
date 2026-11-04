<template>
  <div class="skeleton-card" :class="[variant, { rounded: rounded }]" :style="{ height }">
    <div v-if="variant === 'media'" class="skeleton-media" />
    <div v-if="showText" class="skeleton-body">
      <div class="skeleton-line skeleton" :style="{ width: titleWidth }" />
      <div v-if="showSubtitle" class="skeleton-line skeleton subtitle" :style="{ width: subtitleWidth }" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'default' },
  height: { type: String, default: '' },
  rounded: { type: Boolean, default: true },
  showText: { type: Boolean, default: false },
  showSubtitle: { type: Boolean, default: false },
  titleWidth: { type: String, default: '70%' },
  subtitleWidth: { type: String, default: '45%' },
})
</script>

<style scoped lang="scss">
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.skeleton-media {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, $bg-light 25%, lighten($bg-light, 3%) 50%, $bg-light 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: $radius-sm;
}

.skeleton-body {
  padding: $space-3 $space-3 $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;

  &.subtitle {
    height: 10px;
  }
}
</style>
