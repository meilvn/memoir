<template>
  <div class="album-detail-page">
    <header class="album-header card" v-if="album">
      <div class="album-header-main">
        <div>
          <p class="eyebrow">Album</p>
          <h1 class="album-title serif">{{ album.name }}</h1>
          <p v-if="album.description" class="album-desc">{{ album.description }}</p>
        </div>
      </div>
      <div class="album-header-actions">
        <span class="album-meta">{{ album._count }} 张</span>
        <button class="btn btn-secondary" @click="editAlbum(album)">
          <AppIcon name="edit" :size="14" />编辑
        </button>
        <button class="btn btn-primary" @click="showAdd = true">
          <AppIcon name="plus" :size="14" />添加照片
        </button>
      </div>
    </header>

    <!-- 添加照片弹窗 -->
    <transition name="lb">
      <div v-if="showAdd" class="modal-overlay" @click.self="showAdd = false">
        <div class="modal-card card">
          <h3 class="modal-title">添加到「{{ album?.name }}」</h3>
          <div v-if="adding" class="loading-grid">
            <div v-for="n in 6" :key="n" class="skeleton skeleton-media" />
          </div>
          <div v-else-if="candidates.length" class="add-grid">
            <div
              v-for="m in candidates"
              :key="m.id"
              class="add-item"
              :class="{ selected: selected.has(m.id) }"
              @click="toggleSelect(m.id)"
            >
              <img :src="mediaStore.getMediaUrl(m.thumbnailPath)" :alt="m.filename" loading="lazy" />
              <div v-if="selected.has(m.id)" class="add-check">
                <AppIcon name="check" :size="16" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>所有照片都已添加到此相册</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showAdd = false">关闭</button>
            <button class="btn btn-primary" :disabled="!selected.size" @click="addSelected">
              添加 {{ selected.size }} 张
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 相册媒体 -->
    <div v-if="loading" class="masonry-gallery">
      <div v-for="n in 8" :key="n" class="skeleton skeleton-media" />
    </div>

    <div v-else-if="albumMedia.length" class="masonry-gallery">
      <div v-for="media in albumMedia" :key="media.id" class="media-card" @click="goDetail(media.id)">
        <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
        <div class="card-overlay">
          <span class="type-badge">
            <AppIcon :name="media.mediaType === 'VIDEO' ? 'film' : 'image'" :size="13" />
            {{ media.mediaType === 'VIDEO' ? '视频' : '照片' }}
          </span>
          <button class="btn btn-ghost" title="移除" @click.stop="removeMedia(media)">
            <AppIcon name="close" :size="13" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon"><AppIcon name="image" :size="28" /></div>
      <p>相册还是空的，添加一些回忆吧！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { albumsApi, mediaApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()
const toast = useToast()

const album = ref(null)
const albumMedia = ref([])
const loading = ref(false)
const showAdd = ref(false)
const adding = ref(false)
const candidates = ref([])
const selected = ref(new Set())

onMounted(async () => {
  loading.value = true
  try {
    album.value = await albumsApi.findOne(route.params.id)
    await loadAlbumMedia()
  } catch {
    toast.error('加载相册失败')
  } finally {
    loading.value = false
  }
})

async function loadAlbumMedia() {
  try {
    const data = await mediaApi.findAll({ albumId: route.params.id })
    albumMedia.value = data.items || []
  } catch {
    toast.error('加载照片失败')
  }
}

async function editAlbum(a) {
  const name = prompt('相册名称', a.name)
  if (name === null) return
  const desc = prompt('描述', a.description || '')
  try {
    const updated = await albumsApi.update(a.id, { name: name.trim(), description: desc?.trim() })
    Object.assign(album.value, updated)
    toast.success('已更新')
  } catch {
    toast.error('更新失败')
  }
}

async function removeMedia(m) {
  if (!confirm('从相册中移除此照片？')) return
  try {
    await albumsApi.removeMedia(album.value.id, m.id)
    albumMedia.value = albumMedia.value.filter((x) => x.id !== m.id)
    toast.success('已移除')
  } catch {
    toast.error('移除失败')
  }
}

function goDetail(id) {
  router.push(`/media/${id}`)
}

async function openAdd() {
  showAdd.value = true
  adding.value = true
  selected.value = new Set()
  try {
    const data = await mediaApi.findAll({ page: 1, limit: 100 })
    candidates.value = (data.items || []).filter((m) => !albumMedia.value.some((am) => am.id === m.id))
  } catch {
    toast.error('加载候选照片失败')
  } finally {
    adding.value = false
  }
}

function toggleSelect(id) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

async function addSelected() {
  if (!selected.value.size) return
  try {
    const ids = Array.from(selected.value)
    for (const id of ids) {
      const m = await albumsApi.addMedia(album.value.id, id)
      albumMedia.value.push(m)
    }
    toast.success(`已添加 ${ids.length} 张`)
    showAdd.value = false
  } catch {
    toast.error('添加失败')
  }
}
</script>

<style scoped lang="scss">
.album-detail-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: $space-6 $space-5 $space-8;
}

.album-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-4;
  margin-bottom: $space-6;
  padding: $space-5;
}

.album-title {
  font-size: $text-2xl;
  font-weight: 600;
}

.album-desc {
  color: $text-secondary;
  margin-top: 4px;
  font-size: $text-sm;
}

.album-header-actions {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-shrink: 0;
}

.album-meta {
  font-size: $text-sm;
  color: $text-muted;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(22, 20, 18, 0.6);
  backdrop-filter: blur(4px);
  padding: $space-5;
}

.modal-card {
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: $space-6;
}

.modal-title {
  font-size: $text-lg;
  font-weight: 600;
  margin-bottom: $space-4;
}

.add-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: $space-2;
  max-height: 50vh;
  overflow-y: auto;
  padding: 4px;
}

.add-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: $radius-sm;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: $transition;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &.selected {
    border-color: $primary;
  }

  &:hover {
    border-color: $border-strong;
  }
}

.add-check {
  position: absolute;
  inset: 0;
  background: rgba($primary, 0.6);
  display: grid;
  place-items: center;
  color: #fff;
}

.modal-actions {
  display: flex;
  gap: $space-3;
  justify-content: flex-end;
  margin-top: $space-5;
}

.masonry-gallery {
  columns: 3;
  column-gap: $space-4;

  @media (max-width: 768px) {
    columns: 2;
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
  opacity: 0;
  transition: opacity 0.3s ease;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  border-radius: $radius-full;
  font-size: $text-xs;
}
</style>
