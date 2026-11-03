<template>
  <div class="timeline-page">
    <h1 class="page-title">⏳ 时光之旅</h1>
    <div v-if="timeline.length" class="timeline-container">
      <div v-for="item in timeline" :key="item.year" class="timeline-year">
        <div class="year-header">
          <span class="year-dot"></span>
          <h2 class="year-title">{{ item.year }} 年</h2>
          <span class="year-count">{{ item.count }} 张</span>
        </div>
        <div class="year-media">
          <div v-for="media in getYearMedia(item.year)" :key="media.id" class="timeline-media-item" @click="goDetail(media.id)">
            <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
            <span class="timeline-date">{{ formatShortDate(media.takenAt) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon">⏳</div>
      <p>还没有回忆，快去上传吧！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()

const timeline = ref([])
const allMedia = ref([])

onMounted(async () => {
  timeline.value = await mediaStore.fetchTimeline()
  await loadAllMedia()
})

async function loadAllMedia() {
  const data = await mediaStore.fetchMedia({ page: 1, limit: 200 })
  allMedia.value = data.items
}

function getYearMedia(year) {
  return allMedia.value.filter(m => m.year === year)
}

function goDetail(id) {
  router.push(`/media/${id}`)
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped lang="scss">
.timeline-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-family: 'ZCOOL KuaiLe', cursive, sans-serif;
  font-size: 2rem;
  margin-bottom: 32px;
}

.timeline-container {
  position: relative;
  padding-left: 40px;

  &::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #FF8C69, #FFB347);
    border-radius: 2px;
  }
}

.timeline-year {
  margin-bottom: 32px;
  position: relative;
}

.year-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.year-dot {
  position: absolute;
  left: -33px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF8C69, #FFB347);
  box-shadow: 0 0 0 4px rgba(255, 140, 105, 0.2);
  z-index: 1;
}

.year-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.year-count {
  font-size: 0.85rem;
  color: $text-muted;
  background: $bg-light;
  padding: 2px 12px;
  border-radius: $radius-full;
}

.year-media {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding-left: 12px;
}

.timeline-media-item {
  border-radius: $radius-sm;
  overflow: hidden;
  cursor: pointer;
  position: relative;
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

.timeline-date {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0,0,0,0.5);
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: $radius-sm;
}
</style>
