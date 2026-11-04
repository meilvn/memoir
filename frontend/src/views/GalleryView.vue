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
        <select v-model="sortBy" class="filter-select sort-select">
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
          <option value="name">按文件名</option>
        </select>
        <button
          class="fav-filter"
          :class="{ active: filterFav }"
          title="只看收藏"
          @click="filterFav = !filterFav"
        >
          <AppIcon name="heart" :size="15" />
          收藏
        </button>
        <button
          class="view-toggle"
          :class="{ active: viewMode === 'grid' }"
          :title="viewMode === 'masonry' ? '切换网格视图' : '切换瀑布流'"
          @click="viewMode = viewMode === 'masonry' ? 'grid' : 'masonry'"
        >
          <AppIcon name="grid" :size="15" />
        </button>
        <button
          class="batch-toggle"
          :class="{ active: batchMode }"
          :title="batchMode ? '取消批量选择' : '批量操作'"
          @click="toggleBatchMode"
        >
          <AppIcon name="check" :size="15" />
        </button>
        <router-link to="/upload" class="upload-trigger" title="上传回忆">
          <AppIcon name="upload" :size="16" />
          <span>上传</span>
        </router-link>
        <label class="upload-btn btn btn-primary">
          <AppIcon name="upload" :size="15" />
          上传
          <input type="file" accept="image/*,video/*" multiple @change="handleUpload" hidden />
        </label>
        <button
          class="date-filter-btn"
          :class="{ active: dateRange.start }"
          title="日期筛选"
          @click="showDateFilter = !showDateFilter"
        >
          <AppIcon name="calendar" :size="15" />
        </button>
      </div>

      <!-- 日期筛选器 -->
      <transition name="fade">
        <div v-if="showDateFilter" class="date-filter-bar">
          <div class="date-inputs">
            <div class="date-field">
              <label>开始日期</label>
              <input v-model="dateRange.start" type="date" class="date-input" @change="onDateChange" />
            </div>
            <span class="date-sep">—</span>
            <div class="date-field">
              <label>结束日期</label>
              <input v-model="dateRange.end" type="date" class="date-input" @change="onDateChange" />
            </div>
          </div>
          <button class="date-clear" @click="clearDateFilter">清除</button>
        </div>
      </transition>

      <!-- 激活的筛选标签 -->
      <transition name="fade">
        <div v-if="hasActiveFilters" class="filter-pills">
          <span class="pill" v-if="keyword">关键词: {{ keyword }}</span>
          <span class="pill" v-if="filterType">类型: {{ filterType === 'PHOTO' ? '照片' : '视频' }}</span>
          <span class="pill" v-if="filterFav">仅收藏</span>
          <span class="pill" v-if="activeTag">标签: {{ activeTag }}</span>
          <span class="pill" v-if="dateRange.start">日期: {{ dateRange.start }} ~ {{ dateRange.end || '今' }}</span>
          <button class="pill-clear" @click="resetFilters">清除全部</button>
        </div>
      </transition>
    </header>

    <!-- 标签云 -->
    <section v-if="tags.length" class="tag-cloud" data-reveal>
      <div class="tag-cloud-head">
        <span class="tag-cloud-title"><AppIcon name="tag" :size="14" />标签</span>
        <button class="tag-cloud-toggle" @click="tagsExpanded = !tagsExpanded">
          {{ tagsExpanded ? '收起' : `展开全部 ${tags.length} 个` }}
          <AppIcon :name="tagsExpanded ? 'chevronUp' : 'chevronDown'" :size="13" />
        </button>
      </div>
      <div class="tag-list" :class="{ collapsed: !tagsExpanded && tags.length > 12 }">
        <button
          v-for="t in visibleTags"
          :key="t.tag"
          class="tag-chip"
          :class="{ active: activeTag === t.tag }"
          @click="toggleTag(t.tag)"
        >
          {{ t.tag }}
          <span class="tag-count">{{ t.count }}</span>
        </button>
      </div>
    </section>

    <!-- 批量操作栏 -->
    <transition name="fade">
      <div v-if="batchMode && selectedIds.size > 0" class="batch-bar">
        <span class="batch-count">已选 {{ selectedIds.size }} 项</span>
        <button class="batch-btn" @click="batchFavorite">
          <AppIcon name="heart" :size="14" />批量收藏
        </button>
        <button class="batch-btn" @click="batchDownload">
          <AppIcon name="download" :size="14" />批量下载
        </button>
        <button class="batch-btn danger" @click="batchDelete">
          <AppIcon name="trash" :size="14" />批量删除
        </button>
        <button class="batch-btn ghost" @click="clearSelection">取消选择</button>
      </div>
    </transition>

    <!-- 生效的标签筛选提示 -->
    <div v-if="activeTag && !loading" class="result-bar">
      标签「<strong>{{ activeTag }}</strong>」下的回忆
      <button class="result-clear" @click="activeTag = ''">清除</button>
    </div>

    <!-- 搜索结果提示条 -->
    <div v-else-if="keyword && !loading" class="result-bar">
      找到 <strong>{{ total }}</strong> 条与「{{ keyword }}」相关的回忆
    </div>

    <div v-if="loading" class="loading-grid">
      <SkeletonCard v-for="n in 12" :key="n" variant="media" showText />
    </div>

    <div v-else-if="sortedItems.length" class="masonry-gallery" :class="viewMode">
      <figure
        v-for="(media, i) in sortedItems"
        :key="media.id"
        v-reveal="Math.min(i, 12) * 40"
        class="media-card"
        :class="{ selectable: batchMode, selected: selectedIds.has(media.id) }"
        @mousemove="onCardMouseMove($event, $el)"
        @mouseleave="onCardMouseLeave($el)"
        @click="batchMode ? toggleSelect(media, $event) : openLightbox(i)"
      >
        <div class="card-media">
          <img
            :src="mediaStore.getMediaUrl(media.thumbnailPath)"
            :alt="media.filename"
            loading="lazy"
            :data-media-id="media.id"
            :class="[
              'card-img',
              { hidden: media.mediaType === 'VIDEO' && videoHovering.has(media.id) },
              { loaded: imageLoaded.has(media.id) }
            ]"
            @load="onImageLoad(media.id)"
          />
          <div v-if="!imageLoaded.has(media.id)" class="img-shimmer" />
          <video
            v-if="media.mediaType === 'VIDEO'"
            :src="mediaStore.getMediaUrl(media.originalPath)"
            :data-media-id="media.id"
            :class="{ visible: videoHovering.has(media.id) }"
            muted
            loop
            playsinline
            preload="none"
            @mouseenter="onVideoHover(media.id, true)"
            @mouseleave="onVideoHover(media.id, false)"
            @loadeddata="$event.target.play().catch(() => {})"
          />
        </div>
        <div v-if="batchMode" class="card-check" @click.stop="toggleSelect(media, $event)">
          <AppIcon v-if="selectedIds.has(media.id)" name="check" :size="14" />
        </div>
        <FavoriteButton
          v-if="!batchMode"
          v-model="media.isFavorite"
          :media-id="media.id"
          variant="card"
          class="card-fav"
        />
        <button v-if="!batchMode" class="card-delete" title="删除" @click.stop="confirmDelete(media)">
          <AppIcon name="trash" :size="14" />
        </button>
        <figcaption class="card-overlay">
          <span class="type-badge">
            <AppIcon :name="media.mediaType === 'VIDEO' ? 'film' : 'image'" :size="13" />
            {{ media.mediaType === 'VIDEO' ? '视频' : '照片' }}
          </span>
          <span v-if="media.mediaType === 'VIDEO' && media.duration" class="video-duration">
            {{ formatDuration(media.duration) }}
          </span>
          <span class="date-label">{{ formatDate(media.takenAt) }}</span>
        </figcaption>
        <div v-if="viewMode === 'grid'" class="grid-info">
          <p class="grid-filename">{{ media.filename }}</p>
          <p class="grid-date">{{ formatDate(media.takenAt) }}</p>
        </div>
      </figure>
    </div>

    <!-- 无限滚动哨兵 -->
    <div v-if="hasMore && !loading" ref="scrollSentinel" class="scroll-sentinel">
      <span class="sentinel-text">加载更多…</span>
    </div>
    <div v-else-if="!hasMore && sortedItems.length" class="scroll-sentinel">
      <span class="sentinel-text">— 已显示全部 —</span>
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
      :items="sortedItems"
      @close="lightboxOpen = false"
      @favorite-change="onLightboxFavChange"
    />

    <ConfirmDialog v-model="deleteDialogOpen" @confirm="executeDelete" />
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useMediaStore } from '@/stores/media'
import { mediaApi, notesApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'
import Lightbox from '@/components/Lightbox.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const mediaStore = useMediaStore()
const toast = useToast()

const items = ref([])
const loading = ref(false)
const total = ref(0)
const filterType = ref('')
const filterFav = ref(false)
const keyword = ref('')
const activeTag = ref('')
const tags = ref([])
const tagsExpanded = ref(false)
const showDateFilter = ref(false)
const dateRange = ref({ start: '', end: '' })
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const viewMode = ref('masonry')
const deleteDialogOpen = ref(false)
const deleteTarget = ref(null)
const batchMode = ref(false)
const selectedIds = ref(new Set())
// 使用 shallowRef 避免 Set 内部变化触发不必要的重新渲染
const videoHovering = shallowRef(new Set())
const imageLoaded = shallowRef(new Set())
const hasMore = ref(true)
const scrollSentinel = ref(null)
let observer = null
const sortBy = ref('newest')
let debounceTimer = null
// 节流 3D 效果更新
let rafId = null

const hasActiveFilters = computed(() => {
  return !!(keyword.value || filterType.value || filterFav.value || activeTag.value || dateRange.value.start)
})

function onCardMouseMove(e, el) {
  if (batchMode.value) return

  // 使用 requestAnimationFrame 节流，避免频繁更新 transform
  if (rafId) return

  rafId = requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    // 从 CSS 变量读取参数，便于统一调整
    const tiltAngle = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt-angle')) || 1.5
    const tiltLift = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt-lift')) || -4
    const perspective = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--perspective')) || 800

    const rotateX = ((y - centerY) / centerY) * -tiltAngle
    const rotateY = ((x - centerX) / centerX) * tiltAngle
    el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${tiltLift}px)`
    rafId = null
  })
}

function onCardMouseLeave(el) {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  el.style.transform = ''
}
try {
  const saved = JSON.parse(localStorage.getItem('gallery-prefs') || '{}')
  if (saved.viewMode) viewMode.value = saved.viewMode
  if (saved.sortBy) sortBy.value = saved.sortBy
} catch {
  // ignore
}

// 监听偏好变化并持久化
watch([viewMode, sortBy], () => {
  localStorage.setItem('gallery-prefs', JSON.stringify({
    viewMode: viewMode.value,
    sortBy: sortBy.value,
  }))
})

// 标签云默认展示前 12 个，展开后全部
const visibleTags = computed(() => (tagsExpanded.value ? tags.value : tags.value.slice(0, 12)))

// 排序后的媒体列表
const sortedItems = computed(() => {
  const list = [...items.value]
  switch (sortBy.value) {
    case 'oldest':
      return list.sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt))
    case 'name':
      return list.sort((a, b) => a.filename.localeCompare(b.filename))
    case 'newest':
    default:
      return list.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt))
  }
})

onMounted(async () => {
  await loadMedia()
  loadTags()
  await nextTick()
  setupInfiniteScroll()
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (observer) observer.disconnect()
})

watch([filterType, filterFav, activeTag], async () => {
  await loadMedia(true)
})

// 无限滚动：底部哨兵进入视口时加载更多
function setupInfiniteScroll() {
  if (!scrollSentinel.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value) {
        loadMedia(false)
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(scrollSentinel.value)
}

async function loadTags() {
  try {
    tags.value = await notesApi.getTags()
  } catch {
    tags.value = []
  }
}

// 点击标签：再点一次取消；与关键词互斥（避免两个"搜索"概念混淆）
function toggleTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
  if (activeTag.value) keyword.value = ''
}

// 搜索输入防抖：停止输入 300ms 后再请求，避免每敲一个字都打接口
function onKeywordInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadMedia(), 300)
}

function clearKeyword() {
  keyword.value = ''
  loadMedia()
}

function onDateChange() {
  showDateFilter.value = false
  loadMedia()
}

function clearDateFilter() {
  dateRange.value = { start: '', end: '' }
  loadMedia()
}

function resetFilters() {
  keyword.value = ''
  filterType.value = ''
  filterFav.value = false
  activeTag.value = ''
  dateRange.value = { start: '', end: '' }
  loadMedia()
}

async function loadMedia(reset = true) {
  loading.value = true
  try {
    const page = reset ? 1 : (items.value.length / 100) + 1
    const params = {
      mediaType: filterType.value || undefined,
      favorite: filterFav.value || undefined,
      keyword: keyword.value.trim() || undefined,
      tag: activeTag.value || undefined,
      page: reset ? 1 : page,
      limit: 100,
    }
    if (dateRange.value.start) {
      params.startDate = dateRange.value.start
      params.endDate = dateRange.value.end || undefined
    }
    const data = await mediaApi.findAll(params)
    if (reset) {
      items.value = data.items
    } else {
      items.value = [...items.value, ...data.items]
    }
    total.value = data.total
    hasMore.value = items.value.length < total.value
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

function toggleBatchMode() {
  batchMode.value = !batchMode.value
  if (!batchMode.value) clearSelection()
}

function toggleSelect(media, e) {
  e.stopPropagation()
  const set = selectedIds.value
  if (set.has(media.id)) set.delete(media.id)
  else set.add(media.id)
  // trigger reactivity
  selectedIds.value = new Set(set)
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function batchFavorite() {
  const ids = Array.from(selectedIds.value)
  try {
    await Promise.all(ids.map((id) => mediaApi.toggleFavorite(id).then((r) => ({ id, fav: r.isFavorite }))))
    toast.success(`已更新 ${ids.length} 项`)
    await loadMedia()
    clearSelection()
  } catch {
    toast.error('批量操作失败')
  }
}

function batchDownload() {
  const ids = Array.from(selectedIds.value)
  const mediaItems = items.value.filter((m) => ids.includes(m.id))
  mediaItems.forEach((m) => {
    const url = mediaStore.getMediaUrl(m.originalPath)
    const a = document.createElement('a')
    a.href = url
    a.download = m.filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  })
  toast.success(`开始下载 ${mediaItems.length} 个文件`)
}

async function batchDelete() {
  if (!confirm(`确定删除选中的 ${selectedIds.value.size} 项吗？`)) return
  const ids = Array.from(selectedIds.value)
  try {
    await Promise.all(ids.map((id) => mediaStore.removeMedia(id)))
    toast.success(`已删除 ${ids.length} 项`)
    await loadMedia()
    clearSelection()
  } catch {
    toast.error('批量删除失败')
  }
}

function confirmDelete(media) {
  deleteTarget.value = media
  deleteDialogOpen.value = true
}

function onVideoHover(mediaId, entering) {
  // 更新响应式数据
  if (entering) videoHovering.value.add(mediaId)
  else videoHovering.value.delete(mediaId)

  // 手动更新 DOM 类名，避免组件重新渲染导致 3D transform 丢失
  const video = document.querySelector(`video[data-media-id="${mediaId}"]`)
  if (video) {
    if (entering) {
      video.classList.add('visible')
      // 隐藏对应图片
      const img = video.parentElement?.querySelector('img')
      if (img) img.classList.add('hidden')
    } else {
      video.classList.remove('visible')
      // 显示对应图片
      const img = video.parentElement?.querySelector('img')
      if (img) img.classList.remove('hidden')
    }
  }
}

function onImageLoad(mediaId) {
  // 更新响应式数据（使用 shallowRef，不会触发重新渲染）
  imageLoaded.value.add(mediaId)

  // 手动更新 DOM 类名，避免组件重新渲染导致 3D transform 丢失
  const img = document.querySelector(`img[data-media-id="${mediaId}"]`)
  if (img) {
    img.classList.add('loaded')
    // 移除 shimmer
    const shimmer = img.parentElement?.querySelector('.img-shimmer')
    if (shimmer) {
      shimmer.style.display = 'none'
    }
  }
}

async function executeDelete() {
  if (!deleteTarget.value) return
  try {
    await mediaStore.removeMedia(deleteTarget.value.id)
    toast.success('已删除')
    await loadMedia()
  } catch {
    toast.error('删除失败')
  } finally {
    deleteTarget.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
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
  padding: $space-5;
  background: linear-gradient(135deg, rgba($primary, 0.03) 0%, rgba($primary, 0.01) 100%);
  border-radius: $radius-lg;
  border: 1px solid $border;
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

.upload-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: $radius-full;
  background: $primary;
  color: #fff;
  font-size: $text-sm;
  font-weight: 500;
  text-decoration: none;
  transition: $transition;
  box-shadow: 0 2px 8px rgba($primary, 0.25);

  &:hover {
    background: $primary-dark;
    box-shadow: 0 4px 12px rgba($primary, 0.35);
    transform: translateY(-1px);
  }
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

.result-clear {
  margin-left: $space-3;
  border: none;
  background: none;
  color: $primary;
  font-size: $text-xs;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: $primary-dark;
  }
}

/* ===== 标签云 ===== */
.tag-cloud {
  margin-bottom: $space-5;
  padding: $space-4 $space-5;
  background: linear-gradient(135deg, $bg-card 0%, rgba($primary-soft, 0.3) 100%);
  border: 1px solid $border;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
}

.tag-cloud-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;
}

.tag-cloud-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: $text-sm;
  font-weight: 600;
  color: $text-secondary;
}

.tag-cloud-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: $text-muted;
  font-size: $text-xs;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    color: $primary;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  /* 未展开时限制高度，超出渐隐 */
  &.collapsed {
    max-height: 68px;
    overflow: hidden;
    mask-image: linear-gradient(180deg, #000 60%, transparent);
  }
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px $space-3;
  border: 1px solid $border;
  border-radius: $radius-full;
  background: $bg-warm;
  color: $text-secondary;
  font-size: $text-sm;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: $primary;
    color: $primary;
    background: $primary-soft;
  }

  &.active {
    background: $primary;
    border-color: $primary;
    color: #fff;
  }
}

.tag-count {
  font-size: $text-xs;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
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

.sort-select {
  padding-left: $space-3;
  appearance: auto;
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

/* 视图切换 */
.view-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid $border;
  border-radius: $radius-full;
  background: $bg-card;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: $primary;
    color: $primary;
    background: $primary-soft;
  }

  &.active {
    background: $primary-soft;
    border-color: $primary;
    color: $primary;
  }
}

/* 卡片删除按钮 */
.card-delete {
  position: absolute;
  top: $space-2;
  right: $space-2;
  z-index: 3;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(45, 42, 38, 0.7);
  backdrop-filter: blur(4px);
  color: #fff;
  display: grid;
  place-items: center;
  opacity: 0;
  transition: $transition-fast;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    background: $error;
  }

  .media-card:hover & {
    opacity: 1;
  }
}

/* 收藏 + 删除按钮并排 */
.card-fav {
  position: absolute;
  top: $space-2;
  right: $space-2;
  z-index: 2;
  opacity: 0;
  transition: $transition-fast;

  .media-card:hover &,
  &.filled {
    opacity: 1;
  }

  /* 删除按钮出现时，收藏按钮左移 */
  .media-card:hover .card-delete ~ &,
  &.filled {
    right: 38px;
  }
}

/* ===== 批量选择模式 ===== */
.card-check {
  position: absolute;
  top: $space-2;
  left: $space-2;
  z-index: 4;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: $transition-fast;
  padding: 0;

  &:hover {
    border-color: #fff;
    background: rgba(0, 0, 0, 0.5);
  }
}

.media-card.selectable {
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);

    img {
      transform: none;
    }
  }

  &.selected {
    outline: 2px solid $primary;
    outline-offset: -2px;

    .card-check {
      background: $primary;
      border-color: $primary;
    }
  }
}

/* 批量操作栏 */
.batch-bar {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: linear-gradient(135deg, rgba($primary, 0.08) 0%, rgba($primary, 0.04) 100%);
  border: 1px solid rgba($primary, 0.2);
  border-radius: $radius-md;
  margin-bottom: $space-4;
  box-shadow: $shadow-sm;

  .batch-count {
    font-weight: 600;
    color: $primary;
    margin-right: $space-2;
  }

  .batch-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px $space-3;
    border: 1px solid $border;
    border-radius: $radius-sm;
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

    &.danger {
      color: $error;
      border-color: rgba($error, 0.3);

      &:hover {
        background: rgba($error, 0.08);
        border-color: $error;
      }
    }

    &.ghost {
      background: none;
      border-color: transparent;
      color: $text-muted;

      &:hover {
        color: $text-primary;
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 无限滚动哨兵 */
.scroll-sentinel {
  text-align: center;
  padding: $space-6 $space-5;
  color: $text-muted;
  font-size: $text-sm;
}

.sentinel-text {
  display: inline-flex;
  align-items: center;
  gap: $space-2;

  &::before,
  &::after {
    content: '';
    width: 24px;
    height: 1px;
    background: $border;
  }
}

.masonry-gallery {
  columns: 4;
  column-gap: $space-4;

  @media (max-width: 1200px) { columns: 3; }
  @media (max-width: 768px) { columns: 2; }
  @media (max-width: 480px) { columns: 1; }

  &.grid {
    columns: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $space-4;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }

    .media-card {
      break-inside: auto;
      display: flex;
      align-items: center;
      gap: $space-4;
      overflow: hidden;

      img {
        width: 140px;
        height: 140px;
        flex-shrink: 0;
        object-fit: cover;
        border-radius: $radius-sm 0 0 $radius-sm;
      }

      .card-fav {
        opacity: 1;
      }

      .card-overlay {
        display: none;
      }
    }
  }
}

.grid-info {
  flex: 1;
  min-width: 0;
  padding: $space-3 $space-4 $space-3 0;

  .grid-filename {
    font-size: $text-sm;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .grid-date {
    font-size: $text-xs;
    color: $text-muted;
    letter-spacing: 0.04em;
  }
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
  transform-style: preserve-3d;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.35s ease;
  // 启用 GPU 加速
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
    border-color: $border-strong;

    img {
      transform: scale(1.04);
    }

    .card-overlay {
      opacity: 1;
    }
  }

  img {
    width: 100%;
    display: block;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
    will-change: transform, opacity;
  }

  &.selected {
    border-color: $primary;
    box-shadow: 0 0 0 2px $primary-soft, 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

/* 尊重用户的减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .media-card {
    transform: none !important;
    transition: box-shadow 0.2s ease, border-color 0.2s ease !important;

    img {
      transition: opacity 0.2s !important;
    }

    &:hover img {
      transform: none !important;
    }
  }
}

/* ===== 视频悬浮预览 ===== */
.card-media {
  position: relative;
  overflow: hidden;

  .card-img {
    filter: blur(8px);
    transition: filter 0.4s ease, opacity 0.25s;
    will-change: filter, opacity;

    &.loaded {
      filter: blur(0);
    }

    &.hidden {
      opacity: 0;
    }
  }

  .img-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, $bg-light 25%, lighten($bg-light, 2%) 50%, $bg-light 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    pointer-events: none;
    z-index: 1;
  }

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s;
    z-index: 2;

    &.visible {
      opacity: 1;
    }
  }

  img.hidden {
    opacity: 0;
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

.video-duration {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 4px;
  font-size: $text-xs;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
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

/* ===== 日期筛选器 ===== */
.date-filter-bar {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: $bg-card;
  border: 1px solid $border;
  border-radius: $radius-md;
  margin-bottom: $space-4;
  animation: fade-up 0.3s ease;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: $text-xs;
    color: $text-muted;
  }
}

.date-input {
  padding: 6px 10px;
  border: 1px solid $border;
  border-radius: $radius-sm;
  background: $bg-warm;
  color: $text-primary;
  font-family: inherit;
  font-size: $text-sm;

  &:focus {
    outline: none;
    border-color: $primary;
  }
}

.date-sep {
  color: $text-muted;
  margin-top: 16px;
}

.date-clear {
  background: none;
  border: none;
  color: $text-muted;
  cursor: pointer;
  font-size: $text-sm;
  padding: 4px 8px;

  &:hover {
    color: $error;
  }
}

/* ===== 筛选标签 ===== */
.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  padding: $space-3 0;
  animation: fade-up 0.3s ease;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px $space-3;
  background: $primary-soft;
  color: $primary;
  border-radius: $radius-full;
  font-size: $text-xs;
  font-weight: 500;
}

.pill-clear {
  background: none;
  border: none;
  color: $text-muted;
  cursor: pointer;
  font-size: $text-xs;
  padding: 4px 8px;

  &:hover {
    color: $error;
  }
}

/* ===== 响应式优化 ===== */
@media (max-width: 768px) {
  .gallery-controls {
    gap: $space-2;
  }

  .search-input {
    width: 100%;
    max-width: none;

    &:focus {
      width: 100%;
    }
  }

  .filter-select,
  .sort-select {
    flex: 1;
    min-width: 0;
  }

  .upload-trigger span {
    display: none;
  }
}

@media (max-width: 640px) {
  .gallery-header {
    flex-direction: column;
    gap: $space-3;
  }

  .gallery-controls {
    width: 100%;
  }

  .date-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .date-inputs {
    flex-direction: column;
  }

  .date-sep {
    display: none;
  }
}

/* ===== 性能优化：减少动画偏好 ===== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ===== 图片加载优化 ===== */
img {
  content-visibility: auto;
  contain-intrinsic-size: 300px;
}
</style>
