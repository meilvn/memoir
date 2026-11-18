<template>
  <transition name="fade">
    <div v-if="count > 0" class="batch-bar">
      <span class="batch-count">已选 {{ count }} 项</span>
      <button class="batch-btn" @click="emit('favorite')">
        <AppIcon name="heart" :size="14" />批量收藏
      </button>
      <button class="batch-btn" @click="emit('download')">
        <AppIcon name="download" :size="14" />批量下载
      </button>
      <button class="batch-btn danger" @click="emit('delete')">
        <AppIcon name="trash" :size="14" />批量删除
      </button>
      <button class="batch-btn ghost" @click="emit('cancel')">取消选择</button>
    </div>
  </transition>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'

defineProps({
  count: { type: Number, default: 0 },
})

const emit = defineEmits(['favorite', 'download', 'delete', 'cancel'])
</script>

<style scoped lang="scss">
/* 批量操作栏 */
.batch-bar {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08) 0%, rgba(var(--primary-rgb), 0.04) 100%);
  border: 1px solid rgba(var(--primary-rgb), 0.2);
  border-radius: $radius-md;
  margin-bottom: $space-4;
  box-shadow: $shadow-sm;

  .batch-count {
    font-weight: 600;
    color: var(--primary);
    margin-right: $space-2;
  }

  .batch-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px $space-3;
    border: 1px solid var(--border);
    border-radius: $radius-sm;
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: $text-sm;
    font-family: inherit;
    cursor: pointer;
    transition: $transition-fast;

    &:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    &.danger {
      color: var(--error);
      border-color: rgba(var(--error-rgb), 0.3);

      &:hover {
        background: rgba(var(--error-rgb), 0.08);
        border-color: var(--error);
      }
    }

    &.ghost {
      background: none;
      border-color: transparent;
      color: var(--text-muted);

      &:hover {
        color: var(--text-primary);
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
