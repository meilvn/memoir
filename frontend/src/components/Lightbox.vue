<template>
  <teleport to="body">
    <transition name="lb">
      <div v-if="visible" class="lightbox" @click.self="close">
        <!-- 顶栏 -->
        <header class="lb-top">
          <div class="lb-counter">
            <span class="lb-index serif">{{ index + 1 }}</span>
            <span class="lb-total">/ {{ items.length }}</span>
          </div>
          <div class="lb-actions">
            <FavoriteButton
              v-if="current"
              v-model="current.isFavorite"
              :media-id="current.id"
              variant="bar"
              class="lb-fav"
              @change="onFavChange"
            />
            <button class="lb-btn" title="复制链接" @click="copyCurrentLink">
              <AppIcon name="copy" :size="16" />
            </button>
            <button class="lb-btn" title="下载原图" @click="downloadCurrent">
              <AppIcon name="download" :size="16" />
            </button>
            <button class="lb-btn" :class="{ active: slideshow }" title="幻灯片播放" @click="toggleSlideshow">
              <AppIcon :name="slideshow ? 'pause' : 'play'" :size="17" />
            </button>
            <button class="lb-btn" title="查看详情" @click="goDetail">
              <AppIcon name="eye" :size="17" />
            </button>
            <button class="lb-btn" title="关闭 (Esc)" @click="close">
              <AppIcon name="close" :size="18" />
            </button>
          </div>
        </header>

        <!-- 主视觉区 -->
        <div class="lb-stage">
          <button class="lb-nav lb-prev" :disabled="index === 0" title="上一张 (←)" @click="prev">
            <AppIcon name="chevronLeft" :size="26" />
          </button>

          <figure class="lb-frame" :key="current?.id">
            <img
              v-if="current && current.mediaType === 'PHOTO'"
              :src="mediaStore.getMediaUrl(current.originalPath)"
              :alt="current.filename"
              class="lb-image"
              draggable="false"
            />
            <video
              v-else-if="current"
              :src="mediaStore.getMediaUrl(current.originalPath)"
              class="lb-image"
              controls
              autoplay
              :key="current.id"
            />
            <div v-if="slideshow" class="lb-progress" :style="{ '--lb-dur': SLIDESHOW_MS + 'ms' }" :key="`p-${index}-${slideshow}`" />
          </figure>

          <button class="lb-nav lb-next" :disabled="index >= items.length - 1" title="下一张 (→)" @click="next">
            <AppIcon name="chevronRight" :size="26" />
          </button>
        </div>

        <!-- 信息条 -->
        <footer class="lb-bottom">
          <div class="lb-info">
            <span class="lb-date serif">{{ formatDate(current?.takenAt) }}</span>
            <span v-if="current?.mediaType === 'VIDEO'" class="lb-badge"><AppIcon name="film" :size="12" />视频</span>
            <span v-else class="lb-badge"><AppIcon name="image" :size="12" />照片</span>
            <span v-if="current?.width" class="lb-meta">{{ current.width }} × {{ current.height }}</span>
          </div>
          <div class="lb-strip">
            <button
              v-for="(m, i) in stripItems"
              :key="m.id"
              class="lb-thumb"
              :class="{ active: m.id === current?.id }"
              :title="formatDate(m.takenAt)"
              @click="jumpTo(m.id)"
            >
              <img :src="mediaStore.getMediaUrl(m.thumbnailPath)" :alt="m.filename" loading="lazy" />
              <span v-if="m.mediaType === 'VIDEO' && m.duration" class="strip-dur">
                {{ formatDuration(m.duration) }}
              </span>
            </button>
          </div>
        </footer>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import AppIcon from '@/components/AppIcon.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'update:index', 'close', 'favorite-change'])

const router = useRouter()
const mediaStore = useMediaStore()

const visible = ref(props.modelValue)
const slideshow = ref(false)
const SLIDESHOW_MS = 4000
let timer = null

const current = computed(() => props.items[props.index])

// 底部缩略图条：以当前项为中心取 24 条，避免一次渲染上千张
const stripItems = computed(() => {
  const list = props.items
  if (list.length <= 24) return list
  const half = 12
  let start = props.index - half
  start = Math.max(0, Math.min(start, list.length - 24))
  return list.slice(start, start + 24)
})

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
  } else {
    teardown()
  }
})

onMounted(() => {
  if (visible.value) {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => {
  teardown()
  window.removeEventListener('keydown', onKey)
})

function teardown() {
  stopSlideshow()
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
}

function onKey(e) {
  if (!visible.value) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === ' ') { e.preventDefault(); toggleSlideshow() }
}

function prev() {
  if (props.index > 0) emit('update:index', props.index - 1)
}

function next() {
  if (props.index < props.items.length - 1) emit('update:index', props.index + 1)
}

function jumpTo(id) {
  const i = props.items.findIndex((m) => m.id === id)
  if (i >= 0) emit('update:index', i)
}

function close() {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

function goDetail() {
  if (current.value) router.push(`/media/${current.value.id}`)
}

function downloadCurrent() {
  if (!current.value) return
  const url = mediaStore.getMediaUrl(current.value.originalPath)
  const a = document.createElement('a')
  a.href = url
  a.download = current.value.filename
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function copyCurrentLink() {
  if (!current.value) return
  const url = `${window.location.origin}/media/${current.value.id}`
  navigator.clipboard.writeText(url).then(() => {
    // 成功复制，静默处理
  }).catch(() => {
    // 静默失败
  })
}

function toggleSlideshow() {
  slideshow.value = !slideshow.value
  if (slideshow.value) startSlideshow()
  else stopSlideshow()
}

// 收藏状态变更：向上抛，便于父页面在"只看收藏"等筛选下刷新列表
function onFavChange(val) {
  emit('favorite-change', { id: current.value?.id, isFavorite: val })
}

function startSlideshow() {
  stopSlideshow()
  timer = setInterval(() => {
    if (props.index >= props.items.length - 1) {
      // 播完最后一张：停下
      slideshow.value = false
      stopSlideshow()
      return
    }
    next()
  }, SLIDESHOW_MS)
}

function stopSlideshow() {
  if (timer) { clearInterval(timer); timer = null }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: rgba(22, 20, 18, 0.96);
  backdrop-filter: blur(6px);
  color: #f5f1ea;
}

/* ===== 顶栏 ===== */
.lb-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4 $space-6;
  flex-shrink: 0;
}

.lb-counter {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.lb-index {
  font-size: $text-2xl;
  font-weight: 600;
}

.lb-total {
  font-size: $text-sm;
  opacity: 0.55;
}

.lb-actions {
  display: flex;
  gap: $space-2;
}

.lb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: $radius-full;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.active {
    background: $primary;
    border-color: $primary;
    color: #fff;
  }
}

/* 灯箱里的收藏按钮：深色底上的描边按钮 */
.lb-fav {
  border-color: rgba(255, 255, 255, 0.16);
  background: transparent;
  color: #f5f1ea;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.filled {
    background: $primary;
    border-color: $primary;
    color: #fff;
  }
}

/* ===== 主视觉区 ===== */
.lb-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-4;
  min-height: 0;
  padding: 0 $space-4;
  position: relative;
}

.lb-frame {
  margin: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: lb-in 0.35s $ease-out;
}

@keyframes lb-in {
  from { opacity: 0; transform: scale(0.985); }
  to { opacity: 1; transform: scale(1); }
}

.lb-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: $radius-sm;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.lb-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: $radius-full;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  cursor: pointer;
  transition: $transition;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }
}

/* 幻灯片进度条 */
.lb-progress {
  position: absolute;
  left: 0;
  bottom: -14px;
  height: 2px;
  width: 100%;
  background: $primary;
  transform-origin: left;
  animation: lb-progress var(--lb-dur, 4s) linear forwards;
}

@keyframes lb-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* ===== 底部信息 + 缩略图条 ===== */
.lb-bottom {
  flex-shrink: 0;
  padding: $space-4 $space-6 $space-5;
}

.lb-info {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;
  font-size: $text-sm;
}

.lb-date {
  font-size: $text-base;
}

.lb-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: $radius-full;
  font-size: $text-xs;
  opacity: 0.8;
}

.lb-meta {
  opacity: 0.45;
  font-size: $text-xs;
  letter-spacing: 0.04em;
}

.lb-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 2px; }
}

.lb-thumb {
  width: 64px;
  height: 44px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.42;
  transition: $transition;
  background: none;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .strip-dur {
    position: absolute;
    bottom: 3px;
    right: 3px;
    padding: 1px 5px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 0.65rem;
    border-radius: 3px;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  &:hover {
    opacity: 0.8;
  }

  &.active {
    opacity: 1;
    border-color: $primary;
  }
}

/* ===== 过渡 ===== */
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.25s $ease-out;
}

.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .lb-top { padding: $space-3 $space-4; }
  .lb-bottom { padding: $space-3 $space-4 $space-4; }
  .lb-nav { width: 38px; height: 38px; }
  .lb-info { flex-wrap: wrap; gap: $space-2; }
}
</style>
