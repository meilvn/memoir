<template>
  <div class="stories-page">
    <h1 class="page-title">📖 回忆故事墙</h1>

    <div v-if="loading" class="loading-state">
      <div v-for="n in 4" :key="n" class="skeleton-card skeleton" style="height: 160px;"></div>
    </div>

    <div v-else-if="stories.length" class="stories-timeline">
      <div v-for="story in stories" :key="story.id" class="story-card card" @click="goDetail(story.mediaId)">
        <div class="story-thumb">
          <img :src="mediaStore.getMediaUrl(story.media?.thumbnailPath)" :alt="story.media?.filename" />
          <span class="story-type">{{ story.media?.mediaType === 'VIDEO' ? '🎬' : '📷' }}</span>
        </div>
        <div class="story-content">
          <p class="story-text">{{ story.content }}</p>
          <div class="story-meta">
            <span v-if="story.mood" class="story-mood">{{ story.mood }}</span>
            <span class="story-date">{{ formatDate(story.media?.takenAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <p>还没有故事，为照片添加备注吧！</p>
      <router-link to="/gallery" class="btn btn-primary">去画廊</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '@/stores/media'
import { notesApi } from '@/api'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()

const stories = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    stories.value = await notesApi.findMy()
  } catch {
    // handle error
  } finally {
    loading.value = false
  }
})

function goDetail(mediaId) {
  router.push(`/media/${mediaId}`)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.stories-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-family: 'ZCOOL KuaiLe', cursive, sans-serif;
  font-size: 2rem;
  margin-bottom: 24px;
}

.stories-timeline {
  position: relative;
  padding-left: 40px;

  &::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, $primary, $primary-light);
  }
}

.story-card {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  cursor: pointer;
  animation: fadeInUp 0.4s ease-out;

  &:hover {
    transform: translateX(4px);
  }
}

.story-thumb {
  width: 100px;
  height: 100px;
  border-radius: $radius-md;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .story-type {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0,0,0,0.5);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
  }
}

.story-content {
  flex: 1;

  .story-text {
    font-size: 0.95rem;
    line-height: 1.7;
    color: $text-primary;
    margin-bottom: 8px;
  }
}

.story-meta {
  display: flex;
  gap: 8px;
  align-items: center;

  .story-mood {
    font-size: 1.2rem;
  }

  .story-date {
    font-size: 0.8rem;
    color: $text-muted;
  }
}
</style>
