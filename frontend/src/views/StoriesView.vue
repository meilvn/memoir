<template>
  <div class="stories-root">
  <div class="stories-page">
    <header class="page-head">
      <p class="eyebrow">Family Stories</p>
      <h1 class="page-title">回忆故事墙</h1>
      <button class="btn btn-primary write-btn" @click="openPicker">
        <AppIcon name="plus" :size="16" />
        写故事
      </button>
    </header>

    <div v-if="loading" class="loading-state">
      <SkeletonCard v-for="n in 5" :key="n" variant="default" showText showSubtitle height="120px" />
    </div>

    <div v-else-if="stories.length" class="stories-timeline">
      <div v-for="(story, i) in stories" :key="story.id" class="story-item" v-reveal="i * 60">
        <div class="story-card card" v-focusable @click="goDetail(story.mediaId)"
          @mousemove="onCardMove" @mouseleave="onCardLeave">
          <div class="story-body">
            <div class="story-thumb">
              <img :src="mediaStore.getMediaUrl(story.media?.thumbnailPath)" :alt="story.media?.filename" />
              <span class="story-type">
                <AppIcon :name="story.media?.mediaType === 'VIDEO' ? 'film' : 'image'" :size="14" />
              </span>
              <span v-if="(story.extraMediaIds || []).length" class="story-count">
                {{ 1 + story.extraMediaIds.length }} 张
              </span>
            </div>
            <div class="story-content">
              <p class="story-text">{{ story.content }}</p>
              <div class="story-meta">
                <span v-if="story.mood" class="story-mood">{{ story.mood }}</span>
                <span class="story-date">{{ formatDate(story.media?.takenAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 🗑️ 悬浮时从右侧滑出的删除按钮 -->
          <button
            class="story-delete"
            type="button"
            title="删除故事"
            aria-label="删除故事"
            @click.stop="confirmDelete(story)"
          >
            <AppIcon name="trash" :size="18" />
            <span>删除</span>
          </button>

          <div class="card-friend" aria-hidden="true">
            <i class="fp" /><i class="fp" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <EmptyMascot pose="book"><AppIcon name="book" :size="18" /></EmptyMascot>
      <p>还没有故事，选一张照片写下回忆吧！</p>
      <button class="btn btn-primary" @click="openPicker">写第一个故事</button>
    </div>
  </div>

  <!-- 照片选择器：挑一张还没有故事的照片 -->
  <teleport to="body">
    <div v-if="pickerOpen" class="picker-overlay" @click.self="pickerOpen = false">
      <div class="picker card">
        <div class="picker-head">
          <h2>选择照片写故事（最多 9 张）</h2>
          <div class="picker-head-actions">
            <button class="btn btn-secondary picker-upload" :disabled="uploading" @click="triggerUpload">
              <AppIcon name="upload" :size="15" />
              {{ uploading ? '上传中…' : '上传照片' }}
            </button>
            <input ref="uploadInput" type="file" accept="image/*,video/*" hidden @change="onUploadPick" />
            <button class="picker-close" @click="pickerOpen = false" aria-label="关闭">
              <AppIcon name="close" :size="18" />
            </button>
          </div>
        </div>
        <div v-if="pickerLoading" class="picker-body picker-hint">正在加载照片…</div>
        <div v-else-if="candidates.length" class="picker-grid">
          <button
            v-for="m in candidates"
            :key="m.id"
            class="picker-item"
            :class="{ selected: selectedIndex(m.id) > -1 }"
            @click="togglePick(m)"
          >
            <img :src="mediaStore.getMediaUrl(m.thumbnailPath)" :alt="m.filename" />
            <span v-if="selectedIndex(m.id) > -1" class="picker-badge">{{ selectedIndex(m.id) + 1 }}</span>
          </button>
        </div>
        <div v-else class="picker-body picker-hint">最近的照片都已经有故事了，上传一张新照片吧</div>
        <div v-if="candidates.length && candidates.length < pickerTotal" class="picker-more">
          <button class="btn btn-ghost" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? '加载中…' : '加载更多照片' }}
          </button>
        </div>
        <div class="picker-footer">
          <span class="picker-count">已选 {{ selected.length }}/9 张</span>
          <button class="btn btn-primary" :disabled="!selected.length" @click="finishPick">
            {{ selected.length ? `开始写故事（${selected.length} 张）` : '开始写故事' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 故事编辑弹窗（新增 / 编辑共用） -->
  <StoryEditModal v-model="editOpen" :story="editingStory" @save="handleSave" @remove-extra="removeExtra" />

  <!-- 删除确认对话框 -->
  <ConfirmDialog
    v-model="deleteDialogOpen"
    title="删除故事"
    message="确定要删除这个故事吗？删除后故事内容将无法恢复。"
    @confirm="executeDelete"
  />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '@/stores/media'
import { notesApi, mediaApi } from '@/api'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import SkeletonCard from '@/components/SkeletonCard.vue'
import AppIcon from '@/components/AppIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StoryEditModal from '@/components/StoryEditModal.vue'
import EmptyMascot from '@/components/EmptyMascot.vue'

const mediaStore = useMediaStore()
const router = useRouter()
const toast = useToast()

const stories = ref([])
const loading = ref(false)
const deleteDialogOpen = ref(false)
const storyToDelete = ref(null)

// 写故事：照片选择器 + 编辑弹窗
const pickerOpen = ref(false)
const pickerLoading = ref(false)
const candidates = ref([])
const editOpen = ref(false)
const editingStory = ref(null)

// 选择器分页 + 上传 + 多选（最多 9 张）
const PICKER_PAGE_SIZE = 24
const MAX_PHOTOS = 9
const pickerPage = ref(1)
const pickerTotal = ref(0)
const loadingMore = ref(false)
const uploading = ref(false)
const uploadInput = ref(null)
const selected = ref([])

function selectedIndex(id) {
  return selected.value.findIndex((m) => m.id === id)
}

function togglePick(m) {
  const i = selectedIndex(m.id)
  if (i > -1) {
    selected.value.splice(i, 1)
  } else if (selected.value.length < MAX_PHOTOS) {
    selected.value.push(m)
  }
}

function finishPick() {
  if (!selected.value.length) return
  const [cover, ...extras] = selected.value
  editingStory.value = {
    media: cover,
    mediaId: cover.id,
    extraMedias: extras,
    content: '',
    mood: '',
    tags: [],
  }
  selected.value = []
  pickerOpen.value = false
  editOpen.value = true
}

async function loadCandidates(reset = false) {
  const data = await mediaApi.findAll({ page: pickerPage.value, limit: PICKER_PAGE_SIZE })
  const used = new Set(stories.value.map((s) => s.mediaId))
  const fresh = (data.items || []).filter((m) => !used.has(m.id))
  candidates.value = reset ? fresh : [...candidates.value, ...fresh]
  pickerTotal.value = data.total
}

async function openPicker() {
  pickerOpen.value = true
  pickerLoading.value = true
  pickerPage.value = 1
  selected.value = []
  try {
    await loadCandidates(true)
  } catch {
    toast.error('照片加载失败')
  } finally {
    pickerLoading.value = false
  }
}

async function loadMore() {
  loadingMore.value = true
  pickerPage.value += 1
  try {
    await loadCandidates()
  } catch {
    toast.error('加载失败')
  } finally {
    loadingMore.value = false
  }
}

function triggerUpload() {
  uploadInput.value?.click()
}

async function onUploadPick(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  uploading.value = true
  try {
    const media = await mediaApi.upload(file)
    pickerOpen.value = false
    selected.value = []
    editingStory.value = { media, mediaId: media.id, extraMedias: [], content: '', mood: '', tags: [] }
    editOpen.value = true
  } catch {
    toast.error('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

function pickMedia(m) {
  editingStory.value = { media: m, mediaId: m.id, content: '', mood: '', tags: [] }
  pickerOpen.value = false
  editOpen.value = true
}

async function handleSave(form) {
  if (!editingStory.value) return
  try {
    await notesApi.upsert({
      mediaId: editingStory.value.mediaId,
      content: form.content,
      mood: form.mood || undefined,
      tags: form.tags,
      extraMediaIds: (editingStory.value.extraMedias || []).map((m) => m.id),
    })
    toast.success('故事已保存')
    editOpen.value = false
    stories.value = await notesApi.findMy()
  } catch {
    toast.error('保存失败，请重试')
  }
}

function removeExtra(index) {
  editingStory.value?.extraMedias?.splice(index, 1)
}

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

// P0: 卡片 3D 微倾斜 + 小角色眼睛跟随鼠标
function onCardMove(e) {
  const card = e.currentTarget
  const r = card.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width - 0.5
  const py = (e.clientY - r.top) / r.height - 0.5
  const rx = (-py * 3.5).toFixed(2)
  const ry = (px * 3.5).toFixed(2)
  card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`
  const friend = card.querySelector('.card-friend')
  if (friend) {
    friend.style.setProperty('--fx', (px * 3).toFixed(2))
    friend.style.setProperty('--fy', (py * 3).toFixed(2))
  }
}
function onCardLeave(e) {
  const card = e.currentTarget
  card.style.transform = ''
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 删除故事
function confirmDelete(story) {
  storyToDelete.value = story
  deleteDialogOpen.value = true
}

async function executeDelete() {
  if (!storyToDelete.value) return

  try {
    await notesApi.remove(storyToDelete.value.id)
    toast.success('故事已删除')
    stories.value = stories.value.filter(s => s.id !== storyToDelete.value.id)
  } catch (err) {
    toast.error('删除失败')
  } finally {
    deleteDialogOpen.value = false
    storyToDelete.value = null
  }
}
</script>

<style scoped lang="scss">
.stories-page {
  padding: $space-6 $space-5 $space-8;
  max-width: 780px;
  margin: 0 auto;
}

.page-head {
  margin-bottom: $space-6;
  padding: $space-4 $space-5;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.04) 0%, rgba(var(--primary-rgb), 0.01) 100%);
  border-radius: $radius-lg;
  border: 1px solid var(--border);
  text-align: center;
}

.page-title {
  font-family: $font-serif;
  font-size: $text-3xl;
  font-weight: 600;
  margin-top: 4px;
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
    background: linear-gradient(180deg, var(--primary), $primary-light, transparent);
    border-radius: 2px;
  }
}

// 时间轴节点（卡片外，随悬浮态一起变化）
.story-item {
  position: relative;
  margin-bottom: $space-4;

  &::before {
    content: '';
    position: absolute;
    left: -42px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 2px solid var(--primary);
    z-index: 1;
    transition: all 0.3s ease;
  }

  &:hover::before {
    background: var(--primary);
    box-shadow: 0 0 0 5px rgba(var(--primary-rgb), 0.15);
    transform: translateY(-50%) scale(1.2);
  }
}

$delete-width: 84px;

// 卡片本体：裁切右侧滑出按钮
.story-card {
  position: relative;
  display: block;
  padding: 0;
  overflow: hidden;
  border-radius: $radius-md;
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease, transform 0.25s ease;
  transform-style: preserve-3d;

  &:hover,
  &:focus-within {
    border-color: var(--border-strong);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06);

    // 让出右侧空间，红色方块滑入后不遮挡正文
    .story-body {
      padding-right: $delete-width + $space-3;
    }

    .story-delete {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.story-body {
  display: flex;
  gap: $space-4;
  padding: $space-3 $space-4;
  transition: padding-right 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

// 🗑️ 删除按钮：红色方块，默认藏在卡片右侧外，悬浮时滑入
.story-delete {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: $delete-width;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: var(--error);
  color: #fff;
  font-size: $text-xs;
  font-weight: 500;
  letter-spacing: 0.08em;
  cursor: pointer;
  z-index: 3;
  opacity: 0;
  transform: translateX(100%);
  box-shadow: -6px 0 16px rgba(0, 0, 0, 0.14);
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, background 0.2s ease;

  // 与正文之间的一道细描边，让方块更"立"起来
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10%;
    bottom: 10%;
    width: 1px;
    background: rgba(255, 255, 255, 0.28);
  }

  span {
    line-height: 1;
  }

  &:hover {
    background: color-mix(in srgb, var(--error) 80%, black);
    box-shadow: -8px 0 22px rgba(0, 0, 0, 0.2);
  }

  &:active {
    background: color-mix(in srgb, var(--error) 72%, black);
  }

  &:focus-visible {
    opacity: 1;
    transform: translateX(0);
    outline: 2px solid rgba(var(--error-rgb), 0.45);
    outline-offset: -3px;
  }
}

// 触屏设备没有悬浮态，直接常驻显示
@media (hover: none) {
  .story-body {
    padding-right: $delete-width + $space-3;
  }

  .story-delete {
    opacity: 1;
    transform: translateX(0);
  }
}

.story-thumb {
  width: 100px;
  height: 100px;
  border-radius: $radius-md;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  border: 1px solid var(--border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
    color: #fff;
  }
}

.story-content {
  flex: 1;
  min-width: 0;

  .story-text {
    font-size: $text-base;
    line-height: 1.75;
    color: var(--text-primary);
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
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }
}

// 小屏收窄按钮，保证正文可读
@media (max-width: 640px) {
  $delete-width-sm: 68px;

  .story-body {
    gap: $space-3;
    padding: $space-3;
  }

  .story-card:hover,
  .story-card:focus-within {
    .story-body {
      padding-right: $delete-width-sm + $space-2;
    }
  }

  .story-delete {
    width: $delete-width-sm;
    font-size: 0.7rem;
  }

  @media (hover: none) {
    .story-body {
      padding-right: $delete-width-sm + $space-2;
    }
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 写故事按钮
.write-btn {
  margin-top: $space-4;
}

// 照片选择器
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $space-4;
}

.picker {
  width: 100%;
  max-width: 640px;
  max-height: 88vh;
  overflow-y: auto;
  border-radius: $radius-lg;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.picker-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4 $space-5;
  border-bottom: 1px solid var(--border);

  h2 {
    margin: 0;
    font-size: $text-lg;
    font-weight: 600;
  }
}

.picker-head-actions {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.picker-upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.picker-more {
  display: flex;
  justify-content: center;
  padding: 0 $space-5 $space-5;
}

.picker-close {
  width: 32px;
  height: 32px;
  border-radius: $radius-md;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.12s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    background: var(--bg-light);
    color: var(--text-primary);
  }
}

.picker-body {
  padding: $space-6 $space-5;
}

.picker-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: $text-sm;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: $space-3;
  padding: $space-4 $space-5 $space-5;
}

.picker-item {
  position: relative;
  padding: 0;
  border: 2px solid transparent;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;
  background: var(--bg-light);
  transition: border-color 0.12s cubic-bezier(0.22, 1, 0.36, 1), transform 0.12s cubic-bezier(0.22, 1, 0.36, 1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &:hover {
    border-color: var(--primary);
    transform: scale(1.03);
  }

  &.selected {
    border-color: var(--primary);
  }
}

.picker-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-5;
  border-top: 1px solid var(--border);
}

.picker-count {
  font-size: $text-sm;
  color: var(--text-muted);
}

// 故事卡片上的多图角标
.story-count {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 1px 7px;
  border-radius: $radius-full;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
}

// P1: 卡片右下角的奶油色小角色（登录页角色 IP 延续）
.card-friend {
  position: absolute;
  right: 100px;
  bottom: 12px;
  width: 30px;
  height: 30px;
  border-radius: 14px 14px 8px 8px;
  background: #e8c98a;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 5px;
  padding-top: 9px;
  opacity: 0;
  transform: translateY(6px) scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
  z-index: 2;

  .fp {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #2d1a12;
    transform: translate(var(--fx, 0), var(--fy, 0));
    transition: transform 0.15s ease-out;
  }
}

.story-card:hover .card-friend,
.story-card:focus-within .card-friend {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
