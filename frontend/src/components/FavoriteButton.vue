<template>
  <button
    class="fav-btn"
    :class="{ filled: modelValue, [variant]: true }"
    :title="modelValue ? '取消收藏' : '收藏这一刻'"
    @click.stop="toggle"
  >
    <AppIcon name="heart" :size="size" />
  </button>
</template>

<script setup>
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'
import { mediaApi } from '@/api'

const props = defineProps({
  // 当前收藏状态（由父组件传入，保持单一数据源）
  modelValue: { type: Boolean, default: false },
  mediaId: { type: String, required: true },
  // 'card' 用于画廊卡片（小、半透明底），'bar' 用于灯箱/详情页（常规按钮）
  variant: { type: String, default: 'card' },
  size: { type: [Number, String], default: 15 },
})
const emit = defineEmits(['update:modelValue', 'change'])

const toast = useToast()

async function toggle() {
  const next = !props.modelValue
  // 乐观更新：先反馈 UI，失败再回滚
  emit('update:modelValue', next)
  try {
    const res = await mediaApi.toggleFavorite(props.mediaId)
    const actual = res.isFavorite ?? next
    if (actual !== next) emit('update:modelValue', actual)
    emit('change', actual)
    if (actual) toast.success('已加入珍藏')
  } catch {
    emit('update:modelValue', !next)
    toast.error('操作失败，请重试')
  }
}
</script>

<style scoped>
.fav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: $transition-fast;
  background: transparent;
  color: inherit;
  padding: 0;

  &:hover {
    transform: scale(1.15);
  }

  /* 实心爱心：同一路径填充色 */
  &.filled {
    color: $primary;

    :deep(.app-icon path) {
      fill: currentColor;
    }
  }

  /* 画廊卡片上的小按钮 */
  &.card {
    width: 28px;
    height: 28px;
    border-radius: $radius-full;
    background: rgba(28, 25, 22, 0.45);
    color: #fff;
    backdrop-filter: blur(4px);

    &:hover {
      background: rgba(28, 25, 22, 0.62);
    }

    &.filled {
      color: #fff;
      background: $primary;
    }
  }

  /* 灯箱/详情页里的常规按钮 */
  &.bar {
    width: 38px;
    height: 38px;
    border: 1px solid $border;
    border-radius: $radius-full;
    background: $bg-card;
    color: $text-secondary;

    &:hover {
      border-color: $primary;
      color: $primary;
      background: $primary-soft;
    }
  }
}
</style>
