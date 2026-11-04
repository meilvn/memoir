<template>
  <div class="gallery-page">
    <header class="gallery-header" data-reveal>
      <div>
        <p class="eyebrow">Gallery</p>
        <h1 class="page-title serif">回忆画廊</h1>
      </div>
      <div class="gallery-controls">
        <div class="filter-group">
          <AppIcon name="filter" :size="15" class="filter-icon" />
          <select v-model="filterType" class="filter-select">
            <option value="">全部类型</option>
            <option value="PHOTO">照片</option>
            <option value="VIDEO">视频</option>
          </select>
        </div>
        <label class="upload-btn btn btn-primary">
          <AppIcon name="upload" :size="15" />
          上传
          <input type="file" accept="image/*,video/*" multiple @change="handleUpload" hidden />
        </label>
      </div>
    </header>

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 8" :key="n" class="skeleton-card skeleton" />
    </div>

    <div v-else-if="items.length" class="masonry-gallery">
      <figure
        v-for="(media, i) in items"
        :key="media.id"
        v-reveal="Math.min(i, 12) * 40"
        class="media-card"
        @click="openLightbox(i)"
      >
        <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
        <figcaption class="card-overlay">
          <span class="type-badge">
            <AppIcon :name="media.mediaType === 'VIDEO' ? 'film' : 'image'" :size="13" />
            {{ media.mediaType === 'VIDEO' ? '视频' : '照片' }}
          </span>
          <span class="date-label">{{ formatDate(media.takenAt) }}</span>
        </figcaption>
      </figure>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon"><AppIcon name="image" :size="26" /></div>
      <p>画廊还没有照片呢</p>
      <label class="btn btn-primary">
        <AppIcon name="upload" :size="15" />
        上传第一张照片
        <input type="file" accept="image/*,video/*" multiple @change="handleUpload" hidden />
      </label>
    </div>

    <Lightbox
      v-model="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="items"
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import { mediaApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'
import Lightbox from '@/components/Lightbox.vue'

const mediaStore = useMediaStore()
const toast = useToast()

const items = ref([])
const loading = ref(false)
const filterType = ref('')
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

onMounted(async () => {
  await loadMedia()
})

watch(filterType, async () => {
  await loadMedia()
})

async function loadMedia() {
  loading.value = true
  try {
    const data = await mediaApi.findAll({ mediaType: filterType.value || undefined, limit: 100 })
    items.value = data.items
  } catch {
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

function openLightbox(i) {
  lightboxIndex.value = i
  lightboxOpen.value = true
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.gallery-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: $space-6 $space-5 $space-8;
}

.gallery-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: $space-6;
  flex-wrap: wrap;
  gap: $space-4;
}

.eyebrow {
  font-size: $text-xs;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: $text-muted;
  margin-bottom: $space-1;
}

.page-title {
  font-size: $text-3xl;
  font-weight: 600;
}

.gallery-controls {
  display: flex;
  gap: $space-3;
  align-items: center;
}

.filter-group {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-icon {
  position: absolute;
  left: 14px;
  color: $text-muted;
  pointer-events: none;
}

.filter-select {
  appearance: none;
  padding: 9px $space-4 9px 36px;
  border: 1px solid $border;
  border-radius: $radius-full;
  background: $bg-card;
  color: $text-primary;
  font-size: $text-sm;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: $border-strong;
  }

  &:focus {
    outline: none;
    border-color: $primary;
  }
}

.masonry-gallery {
  columns: 4;
  column-gap: $space-4;

  @media (max-width: 1200px) { columns: 3; }
  @media (max-width: 768px) { columns: 2; }
  @media (max-width: 480px) { columns: 1; }
}

.media-card {
  break-inside: avoid;
  margin-bottom: $space-4;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: $bg-light;
  border: 1px solid $border;
  transition: $transition;

  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-lg;

    img {
      transform: scale(1.03);
    }

    .card-overlay {
      opacity: 1;
    }
  }

  img {
    width: 100%;
    display: block;
    transition: transform 0.6s $ease-out;
  }
}

.card-overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: $space-5 $space-3 $space-2;
  background: linear-gradient(transparent, rgba(28, 25, 22, 0.62));
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: $text-xs;
  opacity: 0;
  transition: $transition;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.date-label {
  letter-spacing: 0.04em;
  opacity: 0.9;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skeleton-card {
  aspect-ratio: 1;
  border-radius: $radius-md;
}

.empty-state {
  text-align: center;
  padding: $space-8 $space-5;
  color: $text-secondary;

  p {
    margin: $space-4 0 $space-5;
    font-size: $text-base;
  }
}

.empty-icon {
  color: $text-muted;
}
</style>
