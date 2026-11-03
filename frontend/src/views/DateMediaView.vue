<template>
  <div class="date-media-page">
    <h1 class="page-title">
      📅 {{ route.params.year }}年{{ route.params.month }}月{{ route.params.day }}日
    </h1>

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card skeleton"></div>
    </div>

    <div v-else-if="items.length" class="masonry-gallery">
      <div v-for="media in items" :key="media.id" class="media-card" @click="goDetail(media.id)">
        <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
        <div class="card-overlay">
          <span class="type-badge">{{ media.mediaType === 'VIDEO' ? '🎬' : '📷' }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <p>这一天还没有回忆呢</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { mediaApi } from '@/api'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const items = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const data = await mediaApi.findAll({
      year: Number(route.params.year),
      month: Number(route.params.month),
      day: Number(route.params.day),
    })
    items.value = data.items
  } finally {
    loading.value = false
  }
})

function goDetail(id) {
  router.push(`/media/${id}`)
}
</script>

<style scoped lang="scss">
.date-media-page {
  padding: 24px;
}

.page-title {
  font-family: 'ZCOOL KuaiLe', cursive, sans-serif;
  font-size: 1.8rem;
  margin-bottom: 24px;
}

.masonry-gallery {
  columns: 4;
  column-gap: 16px;

  @media (max-width: 1200px) { columns: 3; }
  @media (max-width: 768px) { columns: 2; }
  @media (max-width: 480px) { columns: 1; }
}

.media-card {
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: $transition;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;

    img {
      transform: scale(1.04);
    }
  }

  img {
    width: 100%;
    transition: $transition;
  }
}

.card-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skeleton-card {
  aspect-ratio: 1;
  border-radius: $radius-md;
}
</style>
