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
        <span class="media-date">{{ media.filename }}</span>
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
            <span v-for="tag in note.tags" :key="tag" class="custom-tag">#{{ tag }}</span>
          </div>
        </div>
        <div v-else class="no-note">
          <p>还没有备注，点击上方按钮添加吧~</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { notesApi, mediaApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const mediaStore = useMediaStore()
const toast = useToast()

const media = ref(null)
const note = ref(null)
const editingNote = ref(false)
const noteContent = ref('')
const selectedMood = ref('')
const saving = ref(false)

const moods = ['😊', '😂', '❤️', '🤔', '😮', '🎉']

onMounted(async () => {
  media.value = await mediaApi.getOne(route.params.id)
  await loadNote()
})

async function loadNote() {
  try {
    note.value = await notesApi.findByMedia(route.params.id)
    noteContent.value = note.value.content
    selectedMood.value = note.value.mood || ''
  } catch {
    note.value = null
  }
}

async function saveNote() {
  try {
    saving.value = true
    await notesApi.upsert({
      mediaId: route.params.id,
      content: noteContent.value,
      mood: selectedMood.value || null,
      tags: [],
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
</script>

<style scoped>
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
    padding: 12px;
    border: 1.5px solid $border;
    border-radius: $radius-sm;
    resize: vertical;
    margin-bottom: 12px;
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
    background: rgba($primary, 0.08);
    color: $primary;
    padding: 4px 12px;
    border-radius: $radius-full;
    font-size: 0.8rem;
  }
}

.no-note {
  color: $text-muted;
  text-align: center;
  padding: 24px;
}
</style>
