<template>
  <div class="media-detail-page" v-if="media">
    <div class="media-preview">
      <img v-if="media.mediaType === 'PHOTO'" :src="mediaStore.getMediaUrl(media.originalPath)" :alt="media.filename" />
      <video v-else :src="mediaStore.getMediaUrl(media.originalPath)" controls autoplay></video>
    </div>

    <div class="media-info">
      <div class="info-header">
        <div>
          <p class="eyebrow">
            <AppIcon :name="media.mediaType === 'VIDEO' ? 'film' : 'image'" :size="13" />
            {{ media.mediaType === 'VIDEO' ? '视频' : '照片' }}
          </p>
          <h1 class="serif">{{ formatDate(media.takenAt) }}</h1>
        </div>
        <div class="info-side">
          <span class="media-date">{{ media.filename }}</span>
          <button class="btn btn-ghost download-btn" title="下载原图" @click="downloadMedia">
            <AppIcon name="download" :size="15" />
          </button>
          <button class="btn btn-ghost copy-btn" title="复制链接" @click="copyLink">
            <AppIcon name="copy" :size="15" />
          </button>
          <button class="btn btn-ghost danger" title="删除" @click="confirmDelete">
            <AppIcon name="trash" :size="15" />
          </button>
          <FavoriteButton v-model="media.isFavorite" :media-id="media.id" variant="bar" />
        </div>
      </div>

      <!-- EXIF 元数据 -->
      <div v-if="exifFields.length" class="exif-section">
        <h3 class="section-title">照片信息</h3>
        <div class="exif-grid">
          <div v-for="field in exifFields" :key="field.label" class="exif-item">
            <span class="exif-label">{{ field.label }}</span>
            <span class="exif-value">{{ field.value }}</span>
          </div>
        </div>
      </div>

      <div class="note-section">
        <div class="note-header">
          <h3>回忆备注</h3>
          <button v-if="!editingNote" class="btn btn-secondary" @click="editingNote = true">
            <AppIcon name="edit" :size="14" />
            添加备注
          </button>
          <button v-else class="btn btn-ghost" @click="editingNote = false">取消</button>
        </div>

        <div v-if="editingNote" class="note-editor">
          <textarea v-model="noteContent" placeholder="写下你的感想..." rows="4"></textarea>

          <!-- 标签输入：回车/逗号添加，点 × 移除 -->
          <div class="tag-editor">
            <span v-for="(t, i) in noteTags" :key="t" class="tag-pill">
              #{{ t }}
              <button class="tag-pill-x" @click="noteTags.splice(i, 1)">×</button>
            </span>
            <input
              v-model="tagInput"
              class="tag-input"
              placeholder="添加标签后回车（如：春节、旅行）"
              @keydown.enter.prevent="addTag"
              @keydown.189.prevent="addTag"
              @keydown.,.prevent="addTag"
              @blur="addTag"
            />
          </div>

          <div class="note-meta">
            <div class="mood-selector">
              <span v-for="mood in moods" :key="mood" class="mood-option" :class="{ selected: selectedMood === mood }" @click="selectedMood = mood">
                {{ mood }}
              </span>
            </div>
            <button class="btn btn-primary" @click="saveNote" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>

        <div v-else-if="note" class="note-display">
          <p class="note-content">{{ note.content }}</p>
          <div class="note-tags" v-if="note.mood || note.tags?.length">
            <span v-if="note.mood" class="mood-tag">{{ note.mood }}</span>
            <span v-for="tag in note.tags" :key="tag" class="custom-tag">
              <AppIcon name="tag" :size="11" />{{ tag }}
            </span>
          </div>
        </div>
        <div v-else class="no-note">
          <p>还没有备注，点击上方按钮添加吧~</p>
        </div>
      </div>
    </div>

    <ConfirmDialog v-model="deleteOpen" @confirm="executeDelete" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { notesApi, mediaApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const mediaStore = useMediaStore()
const toast = useToast()

const media = ref(null)
const note = ref(null)
const editingNote = ref(false)
const noteContent = ref('')
const selectedMood = ref('')
const noteTags = ref([])
const tagInput = ref('')
const saving = ref(false)
const deleteOpen = ref(false)

const moods = ['😊', '😂', '❤️', '🤔', '😮', '🎉']

const exifFields = computed(() => {
  if (!media.value?.exifData) return []
  const exif = media.value.exifData
  const fields = []
  if (exif.Make || exif.Model) fields.push({ label: '相机', value: `${exif.Make || ''} ${exif.Model || ''}`.trim() })
  if (exif.FocalLength) fields.push({ label: '焦距', value: `${exif.FocalLength} mm` })
  if (exif.FNumber) fields.push({ label: '光圈', value: `f/${exif.FNumber}` })
  if (exif.ExposureTime) fields.push({ label: '快门', value: exif.ExposureTime < 1 ? `1/${Math.round(1 / exif.ExposureTime)}s` : `${exif.ExposureTime}s` })
  if (exif.ISO) fields.push({ label: 'ISO', value: exif.ISO })
  if (exif.LensModel) fields.push({ label: '镜头', value: exif.LensModel })
  return fields
})

onMounted(async () => {
  media.value = await mediaApi.getOne(route.params.id)
  await loadNote()
})

async function loadNote() {
  try {
    note.value = await notesApi.findByMedia(route.params.id)
    noteContent.value = note.value.content
    selectedMood.value = note.value.mood || ''
    noteTags.value = [...(note.value.tags || [])]
  } catch {
    note.value = null
    noteTags.value = []
  }
}

// 添加标签：去空白、去重、限长
function addTag() {
  const t = tagInput.value.trim().replace(/^#/, '')
  if (t && !noteTags.value.includes(t) && noteTags.value.length < 10) {
    noteTags.value.push(t.slice(0, 20))
  }
  tagInput.value = ''
}

async function saveNote() {
  try {
    saving.value = true
    await notesApi.upsert({
      mediaId: route.params.id,
      content: noteContent.value,
      mood: selectedMood.value || null,
      tags: noteTags.value,
    })
    toast.success('备注已保存 💕')
    editingNote.value = false
    await loadNote()
  } catch (err) {
    toast.error('保存失败')
  } finally {
    saving.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function downloadMedia() {
  if (!media.value) return
  const url = mediaStore.getMediaUrl(media.value.originalPath)
  const a = document.createElement('a')
  a.href = url
  a.download = media.value.filename
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function copyLink() {
  if (!media.value) return
  const url = `${window.location.origin}/media/${media.value.id}`
  navigator.clipboard.writeText(url).then(() => {
    toast.success('链接已复制到剪贴板')
  }).catch(() => {
    toast.error('复制失败，请手动复制地址栏链接')
  })
}

function confirmDelete() {
  deleteOpen.value = true
}

async function executeDelete() {
  if (!media.value) return
  try {
    await mediaStore.removeMedia(media.value.id)
    toast.success('已删除')
    router.push('/gallery')
  } catch {
    toast.error('删除失败')
  }
}
</script>

<style scoped lang="scss">
.media-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: $space-6 $space-5 $space-8;
}

.media-preview {
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-lg;
  margin-bottom: $space-5;
  background: $bg-ink;

  img, video {
    width: 100%;
    max-height: 62vh;
    object-fit: contain;
    display: block;
  }
}

.media-info {
  background: $bg-card;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-4;
  margin-bottom: $space-5;
  padding-bottom: $space-4;
  border-bottom: 1px solid $border;

  h1 {
    font-size: $text-2xl;
    font-weight: 600;
  }

  .media-date {
    color: $text-muted;
    font-size: $text-xs;
    letter-spacing: 0.04em;
    word-break: break-all;
  }
}

.info-side {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-shrink: 0;

  .download-btn {
    color: $text-muted;

    &:hover {
      color: $primary;
      background: $primary-soft;
    }
  }

  .copy-btn {
    color: $text-muted;

    &:hover {
      color: $primary;
      background: $primary-soft;
    }
  }

  .danger {
    color: $text-muted;

    &:hover {
      color: $error;
      background: rgba($error, 0.08);
    }
  }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: $text-xs;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: $primary;
  margin-bottom: $space-2;
}

/* ===== EXIF 元数据 ===== */
.exif-section {
  padding: $space-4 $space-5;
  border-top: 1px solid $border;

  .section-title {
    font-size: $text-sm;
    font-weight: 600;
    color: $text-secondary;
    margin-bottom: $space-3;
    letter-spacing: 0.04em;
  }
}

.exif-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: $space-3;
}

.exif-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.exif-label {
  font-size: $text-xs;
  color: $text-muted;
  letter-spacing: 0.04em;
}

.exif-value {
  font-size: $text-sm;
  color: $text-primary;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;

  h3 {
    font-size: $text-lg;
    font-weight: 600;
  }
}

.note-editor {
  textarea {
    width: 100%;
    padding: $space-3;
    border: 1px solid $border;
    border-radius: $radius-sm;
    resize: vertical;
    margin-bottom: $space-3;
    font-family: inherit;
    font-size: $text-base;
    line-height: 1.7;
    color: $text-primary;
    background: $bg-warm;

    &:focus {
      outline: none;
      border-color: $primary;
    }
  }
}

/* ===== 标签编辑器 ===== */
.tag-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: $space-2 $space-3;
  border: 1px dashed $border-strong;
  border-radius: $radius-sm;
  margin-bottom: $space-3;
  background: $bg-warm;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 10px;
  background: $primary-soft;
  color: $primary;
  border-radius: $radius-full;
  font-size: $text-xs;
}

.tag-pill-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border: none;
  border-radius: $radius-full;
  background: rgba($primary, 0.16);
  color: $primary;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: $primary;
    color: #fff;
  }
}

.tag-input {
  flex: 1;
  min-width: 180px;
  border: none;
  background: none;
  outline: none;
  font-size: $text-sm;
  font-family: inherit;
  color: $text-primary;

  &::placeholder {
    color: $text-muted;
  }
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mood-selector {
  display: flex;
  gap: 8px;

  .mood-option {
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.5;
    transition: $transition;

    &:hover, &.selected {
      opacity: 1;
      transform: scale(1.2);
    }
  }
}

.note-display {
  .note-content {
    font-size: 1rem;
    line-height: 1.8;
    color: $text-primary;
    white-space: pre-wrap;
    margin-bottom: 12px;
  }
}

.note-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .mood-tag {
    font-size: 1.2rem;
  }

  .custom-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: $primary-soft;
    color: $primary;
    padding: 4px 12px;
    border-radius: $radius-full;
    font-size: $text-xs;
  }
}

.no-note {
  color: $text-muted;
  text-align: center;
  padding: 24px;
}
</style>
