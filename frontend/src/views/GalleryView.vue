<template>
  <div class="gallery-page">
    <GalleryToolbar
      v-model:keyword="keyword"
      v-model:filter-type="filterType"
      v-model:sort-by="sortBy"
      v-model:filter-fav="filterFav"
      v-model:view-mode="viewMode"
      v-model:batch-mode="batchMode"
      v-model:show-date-filter="showDateFilter"
      v-model:date-range="dateRange"
      :active-tag="activeTag"
      :has-active-filters="hasActiveFilters"
      @search-input="onKeywordInput"
      @clear-keyword="clearKeyword"
      @toggle-batch="toggleBatchMode"
      @upload="handleUpload"
      @date-change="loadMedia"
      @clear-date="clearDateFilter"
      @reset="resetFilters"
    />

    <!-- 标签云 -->
    <TagCloud
      v-model:expanded="tagsExpanded"
      :tags="tags"
      :active-tag="activeTag"
      @toggle-tag="toggleTag"
    />

    <!-- 批量操作栏 -->
    <GalleryBatchBar
      :count="selectedIds.size"
      @favorite="batchFavorite"
      @download="batchDownload"
      @delete="batchDelete"
      @cancel="clearSelection"
    />

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
      <MediaCard
        v-for="(media, i) in sortedItems"
        :key="media.id"
        :media="media"
        :index="i"
        :batch-mode="batchMode"
        :selected="selectedIds.has(media.id)"
        :view-mode="viewMode"
        @open="openLightbox"
        @toggle-select="toggleSelect"
        @delete="confirmDelete"
      />
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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useMediaStore } from '@/stores/media'
import { mediaApi, notesApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'
import Lightbox from '@/components/Lightbox.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import GalleryToolbar from './gallery/GalleryToolbar.vue'
import TagCloud from './gallery/TagCloud.vue'
import GalleryBatchBar from './gallery/GalleryBatchBar.vue'
import MediaCard from './gallery/MediaCard.vue'

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
const hasMore = ref(true)
const scrollSentinel = ref(null)
let observer = null
let debounceTimer = null
let rafId = null

const hasActiveFilters = computed(() => {
  return !!(keyword.value || filterType.value || filterFav.value || activeTag.value || dateRange.value.start)
})

// ===== 卡片 3D 倾斜（全局事件委托，作用于 .media-card）=====
let lastHoveredCard = null
let isTrackingInitialized = false

const tiltConfig = {
  angle: 1.5,
  lift: -4,
  perspective: 800,
}

function updateTiltConfig() {
  try {
    const style = getComputedStyle(document.documentElement)
    tiltConfig.angle = parseFloat(style.getPropertyValue('--tilt-angle')) || 1.5
    tiltConfig.lift = parseFloat(style.getPropertyValue('--tilt-lift')) || -4
    tiltConfig.perspective = parseFloat(style.getPropertyValue('--perspective')) || 800
  } catch {
    // 使用默认值
  }
}

function applyTiltEffect(card, e) {
  const rect = card.getBoundingClientRect()

  // 边界检查：防止除以零
  if (rect.width === 0 || rect.height === 0) return

  // 限制坐标在元素范围内
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  // 限制最大旋转角度，防止过度倾斜
  const maxAngle = tiltConfig.angle * 1.5
  const rotateX = Math.max(-maxAngle, Math.min(((y - centerY) / centerY) * -tiltConfig.angle, maxAngle))
  const rotateY = Math.max(-maxAngle, Math.min(((x - centerX) / centerX) * tiltConfig.angle, maxAngle))

  // 使用 transform3d 强制 GPU 加速
  card.style.transform = `perspective(${tiltConfig.perspective}px) translate3d(0, ${tiltConfig.lift}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
}

function handleGlobalMouseMove(e) {
  if (batchMode.value) return

  const gallery = document.querySelector('.masonry-gallery')
  if (!gallery || !gallery.contains(e.target)) return

  const card = e.target.closest('.media-card')
  if (card) {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      applyTiltEffect(card, e)
      lastHoveredCard = card
      rafId = null
    })
  }
}

function handleGlobalMouseLeave() {
  if (lastHoveredCard) {
    lastHoveredCard.classList.add('media-card--resetting')
    lastHoveredCard.style.transform = ''

    setTimeout(() => {
      lastHoveredCard?.classList.remove('media-card--resetting')
    }, 300)

    lastHoveredCard = null
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

let mouseTracker = null
let initRetries = 0
const MAX_INIT_RETRIES = 5

function setupGlobalMouseTracking() {
  if (isTrackingInitialized) return

  const gallery = document.querySelector('.masonry-gallery')
  if (!gallery) {
    // 重试机制：DOM 可能还未完全渲染
    if (initRetries < MAX_INIT_RETRIES) {
      initRetries++
      setTimeout(() => {
        setupGlobalMouseTracking()
      }, 200)
    }
    return
  }

  initRetries = 0
  mouseTracker = (e) => handleGlobalMouseMove(e)
  updateTiltConfig()
  gallery.addEventListener('mousemove', mouseTracker)
  gallery.addEventListener('mouseleave', handleGlobalMouseLeave)
  isTrackingInitialized = true
}

function cleanupGlobalMouseTracking() {
  if (mouseTracker) {
    const gallery = document.querySelector('.masonry-gallery')
    if (gallery) {
      gallery.removeEventListener('mousemove', mouseTracker)
      gallery.removeEventListener('mouseleave', handleGlobalMouseLeave)
    }
    mouseTracker = null
    isTrackingInitialized = false
    initRetries = 0
  }
}

// 视图偏好持久化
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

// 画廊从无到有时重新初始化鼠标跟踪
watch(sortedItems, (newItems, oldItems) => {
  if (newItems.length > 0 && (!oldItems || oldItems.length === 0)) {
    setTimeout(() => {
      setupGlobalMouseTracking()
    }, 100)
  }
})

onMounted(async () => {
  await loadMedia()
  loadTags()
  await nextTick()
  setupInfiniteScroll()
  setTimeout(() => {
    setupGlobalMouseTracking()
  }, 100)
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (observer) observer.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
  cleanupGlobalMouseTracking()
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
</script>

<style scoped lang="scss">
.gallery-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: $space-6 $space-5 $space-8;
}

/* ===== 搜索结果提示 ===== */
.result-bar {
  margin-bottom: $space-4;
  padding: $space-2 $space-4;
  border-left: 2px solid var(--primary);
  background: $primary-soft;
  border-radius: 0 $radius-sm $radius-sm 0;
  font-size: $text-sm;
  color: var(--text-secondary);

  strong {
    color: var(--primary);
    font-weight: 600;
  }
}

.result-clear {
  margin-left: $space-3;
  border: none;
  background: none;
  color: var(--primary);
  font-size: $text-xs;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: $primary-dark;
  }
}

/* 无限滚动哨兵 */
.scroll-sentinel {
  text-align: center;
  padding: $space-6 $space-5;
  color: var(--text-muted);
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
    background: var(--border);
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
  }
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
  color: var(--text-secondary);

  p {
    margin: $space-4 0 $space-5;
    font-size: $text-base;
  }
}

.empty-icon {
  color: var(--text-muted);
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
</style>
