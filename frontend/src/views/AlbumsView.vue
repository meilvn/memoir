<template>
  <div class="albums-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Albums</p>
        <h1 class="page-title serif">我的相册</h1>
      </div>
      <button class="btn btn-primary" @click="showCreate = true">
        <AppIcon name="plus" :size="15" />新建相册
      </button>
    </header>

    <!-- 创建相册弹窗 -->
    <transition name="lb">
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal-card card">
          <h3 class="modal-title">新建相册</h3>
          <div class="form-group">
            <label>名称</label>
            <input v-model="newName" class="input" placeholder="给相册起个名字" />
          </div>
          <div class="form-group">
            <label>描述（可选）</label>
            <input v-model="newDesc" class="input" placeholder="简短描述" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showCreate = false">取消</button>
            <button class="btn btn-primary" :disabled="!newName.trim() || creating" @click="createAlbum">
              {{ creating ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 相册网格 -->
    <div v-if="loading" class="albums-grid">
      <div v-for="n in 6" :key="n" class="skeleton skeleton-album" />
    </div>

    <div v-else-if="albums.length" class="albums-grid">
      <div v-for="album in albums" :key="album.id" class="album-card card" @click="goDetail(album.id)">
        <div class="album-cover">
          <img v-if="album.coverPath" :src="mediaStore.getMediaUrl(album.coverPath)" :alt="album.name" />
          <div v-else class="album-placeholder">
            <AppIcon name="image" :size="32" />
          </div>
          <div class="album-overlay">
            <span class="album-count">{{ album._count }} 张</span>
          </div>
        </div>
        <div class="album-info">
          <h3 class="album-name">{{ album.name }}</h3>
          <p v-if="album.description" class="album-desc">{{ album.description }}</p>
          <div class="album-actions" @click.stop>
            <button class="btn btn-ghost" title="编辑" @click="editAlbum(album)">
              <AppIcon name="edit" :size="13" />
            </button>
            <button class="btn btn-ghost danger" title="删除" @click="deleteAlbum(album)">
              <AppIcon name="trash" :size="13" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon"><AppIcon name="image" :size="28" /></div>
      <p>还没有相册，创建第一个吧！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { albumsApi } from '@/api'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const mediaStore = useMediaStore()
const toast = useToast()

const albums = ref([])
const loading = ref(false)
const showCreate = ref(false)
const newName = ref('')
const newDesc = ref('')
const creating = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    albums.value = await albumsApi.findAll()
  } catch {
    toast.error('加载相册失败')
  } finally {
    loading.value = false
  }
})

async function createAlbum() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const album = await albumsApi.create({ name: newName.value.trim(), description: newDesc.value.trim() })
    albums.value.unshift(album)
    toast.success('相册创建成功')
    showCreate.value = false
    newName.value = ''
    newDesc.value = ''
  } catch {
    toast.error('创建失败')
  } finally {
    creating.value = false
  }
}

function editAlbum(album) {
  const name = prompt('相册名称', album.name)
  if (name === null) return
  const desc = prompt('描述', album.description || '')
  albumsApi.update(album.id, { name: name.trim(), description: desc?.trim() }).then((updated) => {
    Object.assign(album, updated)
    toast.success('已更新')
  }).catch(() => toast.error('更新失败'))
}

async function deleteAlbum(album) {
  if (!confirm(`确定删除相册「${album.name}」吗？`)) return
  try {
    await albumsApi.remove(album.id)
    albums.value = albums.value.filter((a) => a.id !== album.id)
    toast.success('已删除')
  } catch {
    toast.error('删除失败')
  }
}

function goDetail(id) {
  router.push(`/albums/${id}`)
}
</script>

<style scoped lang="scss">
.albums-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: $space-6 $space-5 $space-8;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-6;
  padding: $space-5;
  background: linear-gradient(135deg, rgba($primary, 0.04) 0%, rgba($primary, 0.01) 100%);
  border-radius: $radius-lg;
  border: 1px solid $border;
}

.page-title {
  font-size: $text-3xl;
  font-weight: 600;
  margin: $space-2 0 $space-1;
}

/* ===== 模态框 ===== */
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
  max-width: 420px;
  width: 100%;
  padding: $space-6;
}

.modal-title {
  font-size: $text-lg;
  font-weight: 600;
  margin-bottom: $space-4;
}

.form-group {
  margin-bottom: $space-4;

  label {
    display: block;
    font-size: $text-sm;
    color: $text-secondary;
    margin-bottom: 6px;
  }
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid $border;
  border-radius: $radius-sm;
  background: $bg-warm;
  color: $text-primary;
  font-family: inherit;
  font-size: $text-base;
  transition: $transition-fast;

  &:focus {
    outline: none;
    border-color: $primary;
  }

  &::placeholder {
    color: $text-muted;
  }
}

.modal-actions {
  display: flex;
  gap: $space-3;
  justify-content: flex-end;
  margin-top: $space-5;
}

/* ===== 相册网格 ===== */
.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: $space-5;
}

.album-card {
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
}

.album-cover {
  position: relative;
  aspect-ratio: 16 / 10;
  background: $bg-light;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .album-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: $text-muted;
    background: $bg-light;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.album-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $space-2 $space-3;
  background: linear-gradient(transparent, rgba(28, 25, 22, 0.7));
  display: flex;
  justify-content: flex-end;
}

.album-count {
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: $text-xs;
  border-radius: $radius-full;
  backdrop-filter: blur(4px);
}

.album-info {
  padding: $space-4;
}

.album-name {
  font-size: $text-base;
  font-weight: 600;
  margin-bottom: 4px;
}

.album-desc {
  font-size: $text-sm;
  color: $text-muted;
  margin-bottom: $space-2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-actions {
  display: flex;
  gap: $space-1;
  justify-content: flex-end;
}

/* ===== 骨架 ===== */
.skeleton-album {
  aspect-ratio: 16 / 10;
  border-radius: $radius-md;
  background: linear-gradient(90deg, $bg-light 25%, lighten($bg-light, 2%) 50%, $bg-light 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@media (max-width: 640px) {
  .albums-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
