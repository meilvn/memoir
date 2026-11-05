<template>
  <teleport to="body">
    <transition name="confirm">
      <div v-if="modelValue" class="confirm-overlay" @click.self="cancel">
        <div class="confirm-card card" role="dialog" aria-modal="true" :aria-label="title">
          <div class="confirm-icon">
            <AppIcon name="trash" :size="22" />
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-msg">{{ message }}</p>
          <div class="confirm-actions">
            <button ref="cancelBtnRef" class="btn btn-secondary" @click="cancel">{{ cancelText }}</button>
            <button class="btn confirm-danger" @click="confirm">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '确认删除' },
  message: { type: String, default: '确定要删除吗？此操作不可撤销。' },
  confirmText: { type: String, default: '删除' },
  cancelText: { type: String, default: '取消' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const cancelBtnRef = ref(null)

function cancel() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

// Esc 关闭（破坏性操作默认聚焦"取消"，回车不会误删）
function onKeydown(e) {
  if (!props.modelValue) return
  if (e.key === 'Escape') {
    e.preventDefault()
    cancel()
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await nextTick()
    cancelBtnRef.value?.focus()
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped lang="scss">
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(22, 20, 18, 0.55);
  backdrop-filter: blur(6px);
  padding: $space-5;
}

.confirm-card {
  max-width: 384px;
  width: 100%;
  padding: $space-6 $space-6 $space-5;
  text-align: center;
  cursor: default;
  border-radius: $radius-lg;
  border: 1px solid var(--border);
  box-shadow: $shadow-lg;
  background: var(--bg-card);
  transition: transform 0.28s $ease-out, opacity 0.28s $ease-out;
}

.confirm-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto $space-4;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--error);
  background: rgba(var(--error-rgb), 0.08);
  border: 1px solid rgba(var(--error-rgb), 0.16);
}

.confirm-title {
  font-family: $font-serif;
  font-size: $text-lg;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.confirm-msg {
  font-size: $text-sm;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: $space-5;
}

.confirm-actions {
  display: flex;
  gap: $space-3;
  justify-content: center;

  .btn {
    min-width: 104px;
  }
}

.confirm-danger {
  background: linear-gradient(135deg, var(--error) 0%, color-mix(in srgb, var(--error) 78%, black) 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--error-rgb), 0.28);

  &:hover {
    background: linear-gradient(135deg, color-mix(in srgb, var(--error) 84%, black) 0%, color-mix(in srgb, var(--error) 68%, black) 100%);
    box-shadow: 0 4px 12px rgba(var(--error-rgb), 0.36);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

// 动效：遮罩淡入 + 卡片轻微上浮
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.22s ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;

  .confirm-card {
    opacity: 0;
    transform: translateY(10px) scale(0.96);
  }
}
</style>
