<template>
  <div class="upload-page">
    <header class="upload-head">
      <p class="eyebrow">Upload</p>
      <h1 class="page-title serif">上传回忆</h1>
      <p class="page-sub">支持 JPG、PNG、MP4、MOV 等格式</p>
    </header>

    <!-- 拖拽区域 -->
    <div
      class="drop-zone"
      :class="{ active: dragging, hasFiles: files.length }"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="triggerInput"
    >
      <input ref="fileInput" type="file" multiple accept="image/*,video/*" class="sr-only" @change="onSelect" />
      <div class="drop-content">
        <span class="drop-icon"><AppIcon name="upload" :size="28" /></span>
        <p class="drop-text">拖拽文件到这里，或点击选择</p>
        <p class="drop-hint">最多 20 张，单文件不超过 50 MB</p>
      </div>
    </div>

    <!-- 已选文件预览 -->
    <div v-if="files.length" class="preview-section">
      <div class="preview-head">
        <span>已选 {{ files.length }} 个文件</span>
        <button class="link-btn" @click="clearAll">清空</button>
      </div>
      <div class="preview-grid">
        <div v-for="(f, i) in files" :key="i" class="preview-item">
          <img v-if="isImage(f)" :src="f.preview" :alt="f.name" />
          <video v-else :src="f.preview" muted playsinline />
          <button class="preview-remove" @click.stop="removeFile(i)" title="移除">
            <AppIcon name="close" :size="12" />
          </button>
          <span v-if="f.size > MAX_SIZE" class="preview-warn">超出 50 MB</span>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="upload-error">{{ error }}</div>

    <!-- 上传按钮 -->
    <div v-if="files.length" class="upload-actions">
      <button class="btn btn-primary" :disabled="uploading || !hasValid" @click="submit">
        {{ uploading ? `上传中 ${progress}%` : `开始上传 (${validCount})` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const mediaStore = useMediaStore()
const toast = useToast()

const files = ref([])
const dragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const fileInput = ref(null)

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_COUNT = 20

const hasValid = computed(() => files.value.some((f) => f.size <= MAX_SIZE))
const validCount = computed(() => files.value.filter((f) => f.size <= MAX_SIZE).length)

function triggerInput() {
  fileInput.value?.click()
}

function isImage(file) {
  return file.type.startsWith('image/')
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ ...file, preview: reader.result })
    reader.onerror = () => resolve({ ...file, preview: '' })
    reader.readAsDataURL(file)
  })
}

async function addFiles(list) {
  error.value = ''
  const remaining = MAX_COUNT - files.value.length
  if (remaining <= 0) {
    error.value = `最多上传 ${MAX_COUNT} 个文件`
    return
  }
  const toAdd = Array.from(list).slice(0, remaining)
  const items = await Promise.all(toAdd.map(readFile))
  files.value.push(...items)
}

function onDrop(e) {
  dragging.value = false
  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
}

function onSelect(e) {
  if (e.target.files.length) addFiles(e.target.files)
  e.target.value = ''
}

function removeFile(i) {
  files.value.splice(i, 1)
}

function clearAll() {
  files.value = []
  error.value = ''
}

async function submit() {
  if (!hasValid.value) return
  uploading.value = true
  progress.value = 0
  error.value = ''
  let ok = 0
  let fail = 0
  const valid = files.value.filter((f) => f.size <= MAX_SIZE)
  for (let i = 0; i < valid.length; i++) {
    try {
      await mediaStore.uploadMedia(valid[i])
      ok++
    } catch {
      fail++
    }
    progress.value = Math.round(((i + 1) / valid.length) * 100)
  }
  uploading.value = false
  if (ok) toast.success(`成功上传 ${ok} 个文件`)
  if (fail) toast.error(`${fail} 个文件上传失败`)
  files.value = []
  router.push('/gallery')
}
</script>

<style scoped lang="scss">
.upload-page {
  max-width: 900px;
  margin: 0 auto;
  padding: $space-6 $space-5 $space-8;
}

.upload-head {
  margin-bottom: $space-6;
  padding: $space-6 $space-5;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.04) 0%, rgba(var(--primary-rgb), 0.01) 100%);
  border-radius: $radius-lg;
  border: 1px solid var(--border);
  text-align: center;
}

.page-title {
  font-size: $text-3xl;
  font-weight: 600;
  margin: $space-2 0 $space-1;
}

.page-sub {
  color: var(--text-secondary);
  font-size: $text-sm;
  margin-top: $space-1;
}

/* ===== 拖拽区域 ===== */
.drop-zone {
  border: 2px dashed var(--border-strong);
  border-radius: $radius-lg;
  padding: $space-8 $space-5;
  text-align: center;
  cursor: pointer;
  background: var(--bg-card);
  transition: $transition;
  position: relative;
  overflow: hidden;

  &:hover, &.active {
    border-color: var(--primary);
    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08) 0%, rgba(var(--primary-rgb), 0.04) 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.15);
  }

  &.hasFiles {
    border-style: solid;
    border-color: var(--border);
    background: var(--bg-light);
    padding: $space-4 $space-5;
  }
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
}

.drop-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: $primary-soft;
  color: var(--primary);
  margin-bottom: $space-2;
}

.drop-text {
  font-size: $text-base;
  font-weight: 500;
  color: var(--text-primary);
}

.drop-hint {
  font-size: $text-sm;
  color: var(--text-muted);
  margin-top: 4px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ===== 预览网格 ===== */
.preview-section {
  margin-top: $space-5;
}

.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
  font-size: $text-sm;
  color: var(--text-secondary);
}

.link-btn {
  background: none;
  border: none;
  color: var(--error);
  cursor: pointer;
  font-size: $text-sm;
  padding: 4px 8px;
  border-radius: $radius-sm;

  &:hover {
    background: rgba(var(--error-rgb), 0.08);
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: $space-3;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: $radius-sm;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-light);

  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  video {
    object-fit: cover;
  }
}

.preview-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: $transition-fast;

  &:hover {
    background: var(--error);
  }
}

.preview-warn {
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  padding: 3px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.7rem;
  text-align: center;
  border-radius: 4px;
}

.upload-error {
  margin-top: $space-4;
  padding: $space-3 $space-4;
  background: rgba(var(--error-rgb), 0.08);
  color: var(--error);
  border-radius: $radius-sm;
  font-size: $text-sm;
  border: 1px solid rgba(var(--error-rgb), 0.2);
}

.upload-actions {
  margin-top: $space-5;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .upload-page {
    padding: $space-5 $space-4 $space-6;
  }

  .preview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
