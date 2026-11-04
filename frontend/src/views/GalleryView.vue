<template>
  <div class="gallery-page">
    <header class="gallery-header" data-reveal>
      <div>
        <p class="eyebrow">Gallery</p>
        <h1 class="page-title serif">回忆画廊</h1>
      </div>
      <div class="gallery-controls">
        <div class="search-box">
          <AppIcon name="search" :size="15" class="search-icon" />
          <input
            v-model="keyword"
            type="search"
            class="search-input"
            placeholder="搜索照片、备注、标签…"
            @input="onKeywordInput"
          />
          <button v-if="keyword" class="search-clear" title="清空" @click="clearKeyword">
            <AppIcon name="close" :size="13" />
          </button>
        </div>
        <div class="filter-group">
          <AppIcon name="filter" :size="15" class="filter-icon" />
          <select v-model="filterType" class="filter-select">
            <option value="">全部类型</option>
            <option value="PHOTO">照片</option>
            <option value="VIDEO">视频</option>
          </select>
        </div>
        <button
          class="fav-filter"
          :class="{ active: filterFav }"
          title="只看收藏"
          @click="filterFav = !filterFav"
        >
          <AppIcon name="heart" :size="15" />
          收藏
        </button>
        <label class="upload-btn btn btn-primary">
          <AppIcon name="upload" :size="15" />
          上传
          <input type="file" accept="image/*,video/*" multiple @change="handleUpload" hidden />
        </label>
      </div>
    </header>

    <!-- 搜索结果提示条 -->
    <div v-if="keyword && !loading" class="result-bar">
      找到 <strong>{{ total }}</strong> 条与「{{ keyword }}」相关的回忆
    </div>

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
        <FavoriteButton
          v-model="media.isFavorite"
          :media-id="media.id"
          variant="card"
          class="card-fav"
        />
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
      <div class="empty-icon">
        <AppIcon :name="keyword ? 'search' : filterFav ? 'heart' : 'image'" :size="26" />
      </div>
      <p v-if="keyword">没有找到与「{{ keyword }}」相关的回忆，换个词试试</p>
      <p v-else-if="filterFav">还没有收藏任何回忆，点心形标记珍藏喜欢的瞬间</p>
      <p v-else>画廊还没有照片呢</p>
      <button v-if="keyword || filterFav" class="btn btn-secondary" @click="resetFilters">查看全部回忆</button>
      <label v-else class="btn btn-primary">
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
      @favorite-change="onLightboxFavChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import { mediaApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'
import Lightbox from '@/components/Lightbox.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'

const mediaStore = useMediaStore()
const toast = useToast()

const items = ref([])
const loading = ref(false)
const total = ref(0)
const filterType = ref('')
const filterFav = ref(false)
const keyword = ref('')
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
let debounceTimer = null

onMounted(async () => {
  await loadMedia()
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

watch([filterType, filterFav], async () => {
  await loadMedia()
})

// 搜索输入防抖：停止输入 300ms 后再请求，避免每敲一个字都打接口
function onKeywordInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadMedia(), 300)
}

function clearKeyword() {
  keyword.value = ''
  loadMedia()
}

function resetFilters() {
  keyword.value = ''
  filterType.value = ''
  filterFav.value = false
  loadMedia()
}

async function loadMedia() {
  loading.value = true
  try {
    const data = await mediaApi.findAll({
      mediaType: filterType.value || undefined,
      favorite: filterFav.value || undefined,
      keyword: keyword.value.trim() || undefined,
      limit: 100,
    })
    items.value = data.items
    total.value = data.total
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

// 灯箱里改了收藏状态：若正处于"只看收藏"，取消收藏的项要消失——
// 先关灯箱（否则列表刷新后当前项失效），再重新拉取
async function onLightboxFavChange({ isFavorite }) {
  if (filterFav.value && !isFavorite) lightboxOpen.value = false
  if (filterFav.value) await loadMedia()
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
  flex-wrap: wrap;
}

/* ===== 搜索框 ===== */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: $text-muted;
  pointer-events: none;
}

.search-input {
  width: 220px;
  padding: 9px 34px 9px 36px;
  border: 1px solid $border;
  border-radius: $radius-full;
  background: $bg-card;
  color: $text-primary;
  font-size: $text-sm;
  font-family: inherit;
  transition: $transition-fast;
  appearance: none;

  &::placeholder {
    color: $text-muted;
  }

  &:hover {
    border-color: $border-strong;
  }

  &:focus {
    outline: none;
    border-color: $primary;
    width: 260px;
  }

  /* 去掉浏览器原生 search 的清除按钮（用我们自己的） */
  &::-webkit-search-cancel-button {
    display: none;
  }
}

.search-clear {
  position: absolute;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: $radius-full;
  background: $bg-light;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    background: $border-strong;
    color: $text-primary;
  }
}

/* ===== 搜索结果提示 ===== */
.result-bar {
  margin-bottom: $space-4;
  padding: $space-2 $space-4;
  border-left: 2px solid $primary;
  background: $primary-soft;
  border-radius: 0 $radius-sm $radius-sm 0;
  font-size: $text-sm;
  color: $text-secondary;

  strong {
    color: $primary;
    font-weight: 600;
  }
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

/* 只看收藏筛选 */
.fav-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px $space-4;
  border: 1px solid $border;
  border-radius: $radius-full;
  background: $bg-card;
  color: $text-secondary;
  font-size: $text-sm;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: $primary;
    color: $primary;
  }

  &.active {
    background: $primary;
    border-color: $primary;
    color: #fff;

    :deep(.app-icon path) {
      fill: currentColor;
    }
  }
}

/* 卡片上的收藏按钮 */
.card-fav {
  position: absolute;
  top: $space-2;
  right: $space-2;
  z-index: 2;
  opacity: 0;

  .media-card:hover &,
  &.filled {
    opacity: 1;
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
