<template>
  <div class="empty-mascot" :class="[`c-${color}`, `pose-${pose}`]" aria-hidden="true">
    <div class="body">
      <i class="eye"><b /></i>
      <i class="eye"><b /></i>
      <i class="cheek l" /><i class="cheek r" />
      <i class="mouth" />
    </div>
    <div class="prop">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  pose: { type: String, default: 'book' },
  color: { type: String, default: 'cream' }
})
</script>

<style scoped>
.empty-mascot {
  position: relative;
  width: 110px;
  height: 110px;
  margin: 0 auto $space-3;
}

.body {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  width: 72px;
  height: 62px;
  border-radius: 32px 32px 18px 18px;
  box-shadow: 0 10px 26px rgba(90, 50, 20, 0.22);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  padding-top: 18px;
  animation: float-body 3s ease-in-out infinite;
}

.c-cream .body { background: #e8c98a; }
.c-peach .body { background: #f0b896; }
.c-mint .body { background: #b8d8c0; }
.c-cocoa .body { background: #d4a88a; }

.eye {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  position: relative;
  display: inline-block;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);

  b {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #2d1a12;
    top: 3px;
    left: 3px;
  }
}

.cheek {
  position: absolute;
  bottom: 12px;
  width: 8px;
  height: 4px;
  border-radius: 50%;
  background: rgba(232, 120, 100, 0.45);
}
.cheek.l { left: 10px; }
.cheek.r { right: 10px; }

.mouth {
  position: absolute;
  bottom: 8px;
  left: 50%;
  width: 10px;
  height: 5px;
  border: 1.5px solid #2d1a12;
  border-top: none;
  border-radius: 0 0 10px 10px;
  transform: translateX(-50%);
}

.prop {
  position: absolute;
  right: 8px;
  bottom: 32px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--bg-light, #f5efe6);
  border: 1px solid var(--border, #e5ddd0);
  display: grid;
  place-items: center;
  color: var(--primary, #c08060);
  font-size: 18px;
  animation: float-prop 3s ease-in-out infinite;
  animation-delay: 0.4s;
}

@keyframes float-body {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-5px); }
}

@keyframes float-prop {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-5px) rotate(2deg); }
}
</style>
