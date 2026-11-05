<template>
  <teleport to="body">
    <div v-if="modelValue" class="story-modal-overlay" @click.self="close">
      <transition name="modal">
        <div v-if="modelValue" class="story-modal card">
          <div class="modal-header">
            <h2>{{ editing ? '编辑故事' : '写故事' }}</h2>
            <button class="modal-close" @click="close">
              <AppIcon name="close" :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <!-- 图片预览 -->
            <div v-if="story?.media" class="story-preview" @click="goToMedia">
              <img
                :src="mediaStore.getMediaUrl(story.media.thumbnailPath)"
                :alt="story.media.filename"
              />
              <div class="preview-meta">
                <span v-if="story.media.mediaType === 'VIDEO'" class="type-badge">
                  <AppIcon name="film" :size="12" /> 视频
                </span>
                <span v-else class="type-badge">
                  <AppIcon name="image" :size="12" /> 照片
                </span>
                <span class="date">{{ formatDate(story.media.takenAt) }}</span>
              </div>
            </div>

            <!-- 附加照片（最多 8 张，连同封面共 9 张） -->
            <div v-if="story?.extraMedias?.length" class="extra-strip">
              <div v-for="(m, i) in story.extraMedias" :key="m.id" class="extra-thumb">
                <img :src="mediaStore.getMediaUrl(m.thumbnailPath)" :alt="m.filename" />
                <button type="button" class="extra-remove" @click="emit('remove-extra', i)" aria-label="移除">×</button>
              </div>
            </div>

            <!-- 内容编辑器 -->
            <div class="form-group">
              <label>故事内容</label>
              <textarea
                v-model="formData.content"
                placeholder="写下你的故事..."
                rows="5"
                class="story-textarea"
                @keydown.esc="close"
              />
            </div>

            <!-- 心情选择 -->
            <div class="form-group">
              <label>心情</label>
              <div class="mood-selector">
                <button
                  v-for="mood in moods"
                  :key="mood"
                  type="button"
                  class="mood-btn"
                  :class="{ selected: formData.mood === mood }"
                  @click="formData.mood = mood"
                >
                  {{ mood }}
                </button>
                <button
                  v-if="formData.mood"
                  type="button"
                  class="mood-btn clear"
                  @click="formData.mood = ''"
                  title="清除"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- 标签编辑器 -->
            <div class="form-group">
              <label>标签</label>
              <div class="tag-editor">
                <span
                  v-for="(tag, index) in formData.tags"
                  :key="index"
                  class="tag-pill"
                >
                  #{{ tag }}
                  <button
                    type="button"
                    class="tag-remove"
                    @click="removeTag(index)"
                  >
                    ×
                  </button>
                </span>
                <input
                  v-model="tagInput"
                  type="text"
                  class="tag-input"
                  placeholder="添加标签后回车..."
                  @keydown.enter.prevent="addTag"
                  @keydown.comma.prevent="addTag"
                  @blur="addTag"
                />
              </div>
              <p class="form-hint">按回车或逗号添加标签，最多 10 个</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" @click="close">取消</button>
            <button
              class="btn btn-primary"
              @click="handleSave"
              :disabled="saving || !formData.content.trim()"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  story: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'remove-extra'])

const router = useRouter()
const mediaStore = useMediaStore()
const toast = useToast()

const moods = ['😊', '😂', '❤️', '🤔', '😮', '🎉']
const tagInput = ref('')
const saving = ref(false)

// 已有内容 = 编辑模式；空内容 = 新增模式
const editing = computed(() => !!props.story?.content)

const formData = ref({
  content: '',
  mood: '',
  tags: [],
})

// 监听 story 变化，初始化表单
watch(
  () => props.story,
  (newStory) => {
    if (newStory) {
      formData.value = {
        content: newStory.content || '',
        mood: newStory.mood || '',
        tags: newStory.tags ? [...newStory.tags] : [],
      }
    }
  },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

function goToMedia() {
  if (props.story?.mediaId) {
    router.push(`/media/${props.story.mediaId}`)
    close()
  }
}

function addTag() {
  const t = tagInput.value.trim().replace(/^#/, '')
  if (t && !formData.value.tags.includes(t) && formData.value.tags.length < 10) {
    formData.value.tags.push(t.slice(0, 20))
  }
  tagInput.value = ''
}

function removeTag(index) {
  formData.value.tags.splice(index, 1)
}

async function handleSave() {
  if (!formData.value.content.trim()) {
    toast.warning('请输入故事内容')
    return
  }

  saving.value = true
  try {
    emit('save', formData.value)
  } finally {
    saving.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.story-modal-overlay {
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

.story-modal {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: $radius-lg;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
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

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: $radius-md;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-light);
    color: var(--text-primary);
  }
}

.modal-body {
  padding: $space-5;
}

// 图片预览
.story-preview {
  margin-bottom: $space-5;
  cursor: pointer;
  border-radius: $radius-md;
  overflow: hidden;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }

  .preview-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-2 $space-3;
    background: var(--bg-light);
    border-top: 1px solid var(--border);
    font-size: $text-sm;
    color: var(--text-secondary);
  }

  .type-badge {
    display: flex;
    align-items: center;
    gap: $space-1;
  }
}

// 附加照片
.extra-strip {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
  margin-bottom: $space-5;
}

.extra-thumb {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid var(--border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.extra-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 表单组
.form-group {
  margin-bottom: $space-5;

  label {
    display: block;
    margin-bottom: $space-2;
    font-size: $text-sm;
    font-weight: 500;
    color: var(--text-secondary);
  }
}

.story-textarea {
  width: 100%;
  min-height: 120px;
  padding: $space-3;
  border: 1px solid var(--border);
  border-radius: $radius-md;
  font-size: $text-base;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--text-muted);
  }
}

// 心情选择器
.mood-selector {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.mood-btn {
  width: 44px;
  height: 44px;
  border-radius: $radius-md;
  background: var(--bg-light);
  border: 2px solid transparent;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
    border-color: var(--border);
  }

  &.selected {
    background: var(--bg-card);
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.2);
  }

  &.clear {
    font-size: 1rem;
    color: var(--text-muted);
  }
}

// 标签编辑器
.tag-editor {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3;
  border: 1px solid var(--border);
  border-radius: $radius-md;
  background: var(--bg-card);
  min-height: 48px;
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: var(--primary);
  }
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-2;
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary);
  border-radius: $radius-sm;
  font-size: $text-sm;
}

.tag-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(var(--primary-rgb), 0.2);
  }
}

.tag-input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  font-size: $text-base;
  padding: $space-1;

  &::placeholder {
    color: var(--text-muted);
  }
}

.form-hint {
  margin-top: $space-2;
  font-size: $text-xs;
  color: var(--text-muted);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-top: 1px solid var(--border);
  background: var(--bg-light);
}

// 模态框动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .story-modal,
.modal-leave-active .story-modal {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .story-modal,
.modal-leave-to .story-modal {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}
</style>
