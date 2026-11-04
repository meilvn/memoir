<template>
  <footer class="footer">
    <div class="footer-inner">
      <span class="footer-heart">❤️</span>
      <p>家庭回忆录 — 记录每一个温暖瞬间</p>
      <span class="footer-sparkle">✨</span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  text-align: center;
  padding: 20px 16px;
  color: $text-muted;
  font-size: 0.85rem;
  background: $bg-card;
  border-top: 1px solid $border;
}

.footer-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.footer-heart {
  animation: heartbeat 1.8s ease-in-out infinite;
  display: inline-block;
}

.footer-sparkle {
  animation: sparkle 2.5s ease-in-out infinite;
  display: inline-block;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.15);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.1);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(15deg);
  }
}
</style>
