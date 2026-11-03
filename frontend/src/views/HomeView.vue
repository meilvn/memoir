<template>
  <div class="home-page">
    <!-- Floating decorations -->
    <div class="floating-decorations">
      <span v-for="n in 8" :key="n" class="floating-item" :style="{ animationDelay: `${n * 0.5}s`, left: `${10 + n * 11}%` }">
        {{ ['⭐', '💖', '✨', '🌸', '💫', '🏠', '📸', '💝'][n - 1] }}
      </span>
    </div>

    <div class="hero-section">
      <h1 class="hero-title">今天想翻翻哪段回忆？✨</h1>
      <p class="hero-subtitle">每一张照片，都是一个故事 💕</p>
    </div>

    <!-- Quick access cards -->
    <div class="quick-cards">
      <div v-for="card in quickCards" :key="card.title" class="quick-card card" @click="card.action">
        <span class="card-icon">{{ card.icon }}</span>
        <h3>{{ card.title }}</h3>
        <p>{{ card.desc }}</p>
      </div>
    </div>

    <!-- Recent media -->
    <div class="recent-section">
      <h2 class="section-title">🕐 最近回忆</h2>
      <div v-if="recentMedia.length" class="masonry-grid">
        <div v-for="media in recentMedia" :key="media.id" class="masonry-item media-card-item" @click="goToDetail(media.id)">
          <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
          <div class="media-overlay">
            <span class="media-type-badge">{{ media.mediaType === 'VIDEO' ? '🎬' : '📷' }}</span>
            <span class="media-date">{{ formatDate(media.takenAt) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📸</div>
        <p>还没有回忆呢，快去上传第一张照片吧！</p>
        <router-link to="/gallery" class="btn btn-primary">浏览画廊</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()

const recentMedia = ref([])

const quickCards = [
  { icon: '🕐', title: '最近回忆', desc: '最近30天的精彩瞬间', action: () => router.push('/gallery') },
  { icon: '📅', title: '今年足迹', desc: '今年所有的美好回忆', action: () => router.push('/timeline') },
  { icon: '⭐', title: '珍藏瞬间', desc: '带备注的特别回忆', action: () => router.push('/stories') },
  { icon: '🎲', title: '随机回忆', desc: '来一段意外的惊喜', action: () => {
    if (recentMedia.value.length > 0) {
      const random = recentMedia.value[Math.floor(Math.random() * recentMedia.value.length)]
      router.push(`/media/${random.id}`)
    }
  }},
]

onMounted(async () => {
  await mediaStore.fetchMedia({ page: 1, limit: 20 })
  recentMedia.value = mediaStore.items
})

function goToDetail(id) {
  router.push(`/media/${id}`)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.home-page {
  position: relative;
  overflow: hidden;
}

.floating-decorations {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.floating-item {
  position: absolute;
  top: 15%;
  font-size: 1.5rem;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(15deg); }
}

.hero-section {
  text-align: center;
  padding: 48px 20px 32px;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-family: 'ZCOOL KuaiLe', 'Ma Shan Zheng', cursive, sans-serif;
  font-size: 2.5rem;
  color: $text-primary;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: $text-secondary;
}

.quick-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 0 24px 32px;
  position: relative;
  z-index: 1;
}

.quick-card {
  text-align: center;
  padding: 24px 16px;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
  }

  .card-icon {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 8px;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 4px;
  }

  p {
    font-size: 0.85rem;
    color: $text-muted;
  }
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 16px;
  padding: 0 24px;
}

.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 0 24px;
}

.media-card-item {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: $transition;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.media-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 0.8rem;
}

.media-type-badge {
  font-size: 1rem;
}

.media-date {
  font-size: 0.75rem;
  opacity: 0.9;
}

.empty-state {
  padding: 80px 20px;
}
</style>
