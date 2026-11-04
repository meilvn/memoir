<template>
  <div class="stories-page">
    <h1 class="page-title">📖 回忆故事墙</h1>

    <div v-if="loading" class="loading-state">
      <SkeletonCard v-for="n in 5" :key="n" variant="default" showText showSubtitle height="120px" />
    </div>

    <div v-else-if="stories.length" class="stories-timeline">
      <div v-for="(story, i) in stories" :key="story.id" class="story-card card" v-reveal="i * 60" @click="goDetail(story.mediaId)">
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
import SkeletonCard from '@/components/SkeletonCard.vue'

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

<style scoped lang="scss">
.stories-page {
  padding: $space-6 $space-5 $space-8;
  max-width: 780px;
  margin: 0 auto;
}

.page-title {
  font-family: $font-serif;
  font-size: $text-3xl;
  font-weight: 600;
  margin-bottom: $space-6;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.stories-timeline {
  position: relative;
  padding-left: 48px;

  &::before {
    content: '';
    position: absolute;
    left: 18px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(180deg, $primary, $primary-light, transparent);
    border-radius: 2px;
  }
}

.story-card {
  display: flex;
  gap: $space-4;
  margin-bottom: $space-4;
  cursor: pointer;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: -36px;
    top: 20px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $bg-card;
    border: 2px solid $primary;
    z-index: 1;
    transition: $transition-fast;
  }

  &:hover {
    transform: translateX(4px);

    &::before {
      background: $primary;
      box-shadow: 0 0 0 4px rgba($primary, 0.15);
    }
  }
}

.story-thumb {
  width: 100px;
  height: 100px;
  border-radius: $radius-md;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  border: 1px solid $border;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .story-type {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(45, 42, 38, 0.6);
    backdrop-filter: blur(4px);
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
  min-width: 0;

  .story-text {
    font-size: $text-base;
    line-height: 1.75;
    color: $text-primary;
    margin-bottom: $space-2;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.story-meta {
  display: flex;
  gap: $space-2;
  align-items: center;

  .story-mood {
    font-size: 1.2rem;
  }

  .story-date {
    font-size: $text-xs;
    color: $text-muted;
    letter-spacing: 0.04em;
  }
}
</style>
