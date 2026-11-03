<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <h1 class="page-title">🖼 回忆画廊</h1>
      <div class="gallery-controls">
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="PHOTO">📷 照片</option>
          <option value="VIDEO">🎬 视频</option>
        </select>
        <label class="upload-btn btn btn-primary">
          📤 上传
          <input type="file" accept="image/*,video/*" multiple @change="handleUpload" hidden />
        </label>
      </div>
    </div>

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 8" :key="n" class="skeleton-card skeleton"></div>
    </div>

    <div v-else-if="items.length" class="masonry-gallery">
      <div v-for="media in items" :key="media.id" class="media-card" @click="goDetail(media.id)">
        <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
        <div class="card-overlay">
          <span class="type-badge">{{ media.mediaType === 'VIDEO' ? '🎬' : '📷' }}</span>
          <span class="date-label">{{ formatDate(media.takenAt) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🖼</div>
      <p>画廊还没有照片呢</p>
      <label class="btn btn-primary">
        📤 上传第一张照片
        <input type="file" accept="image/*,video/*" multiple @change="handleUpload" hidden />
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import { mediaApi } from '@/api'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()
const toast = useToast()

const items = ref([])
const loading = ref(false)
const filterType = ref('')

onMounted(async () => {
  await loadMedia()
})

watch(filterType, async () => {
  await loadMedia()
})

async function loadMedia() {
  loading.value = true
  try {
    const data = await mediaApi.findAll({ mediaType: filterType.value || undefined })
    items.value = data.items
  } catch (err) {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function handleUpload(e) {
  const files = e.target.files
  if (!files?.length) return

  for (const file of files) {
    try {
      toast.info('上传中...')
      await mediaStore.uploadMedia(file)
      toast.success('上传成功！')
    } catch (err) {
      toast.error(err?.response?.data?.message || '上传失败')
    }
  }
  await loadMedia()
}

function goDetail(id) {
  router.push(`/media/${id}`)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.gallery-page {
  padding: 24px;
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-family: 'ZCOOL KuaiLe', cursive, sans-serif;
  font-size: 1.8rem;
}

.gallery-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 8px 16px;
  border: 1.5px solid $border;
  border-radius: $radius-full;
  background: $bg-card;
  color: $text-primary;
  font-size: 0.9rem;
  cursor: pointer;
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
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 14px;
  background: linear-gradient(transparent, rgba(0,0,0,0.55));
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 0.8rem;
}

.type-badge {
  font-size: 1rem;
}

.date-label {
  font-size: 0.75rem;
  opacity: 0.9;
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
