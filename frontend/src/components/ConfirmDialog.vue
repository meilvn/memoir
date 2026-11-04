<template>
  <teleport to="body">
    <transition name="lb">
      <div v-if="modelValue" class="confirm-overlay" @click.self="cancel">
        <div class="confirm-card card">
          <p class="confirm-msg">{{ message }}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="cancel">取消</button>
            <button class="btn btn-primary danger" @click="confirm">删除</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  message: { type: String, default: '确定要删除吗？此操作不可撤销。' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function cancel() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(22, 20, 18, 0.6);
  backdrop-filter: blur(4px);
  padding: $space-5;
}

.confirm-card {
  max-width: 400px;
  width: 100%;
  padding: $space-6;
  text-align: center;
}

.confirm-msg {
  font-size: $text-base;
  color: $text-primary;
  margin-bottom: $space-5;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: $space-3;
  justify-content: center;

  .btn.danger {
    background: $error;
    color: #fff;

    &:hover {
      background: darken($error, 8%);
    }
  }
}
</style>
