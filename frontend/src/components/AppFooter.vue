<template>
  <footer class="footer">
    <div class="footer-inner">
      <AppIcon name="heart" :size="14" class="footer-mark" />
      <p>家庭回忆录 — 记录每一个温暖瞬间</p>
    </div>
  </footer>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
</script>

<style scoped lang="scss">
.footer {
  text-align: center;
  padding: 20px 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.footer-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

// 常驻动画已移除：装饰性心跳/闪光属于持续空转，收敛为静态标记
.footer-mark {
  color: var(--primary);
  flex: none;
}
</style>
