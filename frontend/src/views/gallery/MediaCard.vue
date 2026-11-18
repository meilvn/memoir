<template>
  <figure
    v-reveal="Math.min(index, 12) * 40"
    v-focusable
    class="media-card"
    :class="[
      viewMode,
      { selectable: batchMode, selected },
    ]"
    @click="batchMode ? emit('toggle-select', media, $event) : emit('open', index)"
  >
    <div class="card-media">
      <img
        :src="mediaStore.getMediaUrl(media.thumbnailPath)"
        :alt="media.filename"
        loading="lazy"
        :data-media-id="media.id"
        class="card-img"
        :class="{ loaded, hidden: videoVisible }"
        @load="loaded = true"
      />
      <div v-if="!loaded" class="img-shimmer" />
      <video
        v-if="media.mediaType === 'VIDEO'"
        :src="mediaStore.getMediaUrl(media.originalPath)"
        :data-media-id="media.id"
        :class="{ visible: videoVisible }"
        muted
        loop
        playsinline
        preload="none"
        @mouseenter="videoVisible = true"
        @mouseleave="videoVisible = false"
        @loadeddata="$event.target.play().catch(() => {})"
      />
    </div>
    <div v-if="batchMode" class="card-check" @click.stop="emit('toggle-select', media, $event)">
      <AppIcon v-if="selected" name="check" :size="14" />
    </div>
    <FavoriteButton
      v-if="!batchMode"
      v-model="media.isFavorite"
      :media-id="media.id"
      variant="card"
      class="card-fav"
    />
    <button v-if="!batchMode" class="card-delete" title="删除" @click.stop="emit('delete', media)">
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
</template>

<script setup>
import { ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import AppIcon from '@/components/AppIcon.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'

defineProps({
  media: { type: Object, required: true },
  index: { type: Number, required: true },
  batchMode: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  viewMode: { type: String, default: 'masonry' },
})

const emit = defineEmits(['open', 'toggle-select', 'delete'])

const mediaStore = useMediaStore()
const loaded = ref(false)
const videoVisible = ref(false)

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
    background: var(--error);
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
    outline: 2px solid var(--primary);
    outline-offset: -2px;

    .card-check {
      background: var(--primary);
      border-color: var(--primary);
    }
  }
}

.media-card {
  break-inside: avoid;
  margin-bottom: $space-4;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: var(--bg-light);
  border: 1px solid var(--border);
  transform-style: preserve-3d;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  // 启用 GPU 加速
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
    border-color: var(--border-strong);

    .card-overlay {
      opacity: 1;
    }
  }

  img {
    width: 100%;
    display: block;
    transition: opacity 0.2s;
    will-change: opacity;
  }

  &.selected {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px $primary-soft, 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  // 平滑过渡：鼠标离开时
  &--resetting {
    transition: transform 0.3s ease-in !important;
  }
}

/* 网格视图（横版卡片） */
.media-card.grid {
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

.grid-info {
  flex: 1;
  min-width: 0;
  padding: $space-3 $space-4 $space-3 0;

  .grid-filename {
    font-size: $text-sm;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .grid-date {
    font-size: $text-xs;
    color: var(--text-muted);
    letter-spacing: 0.04em;
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
    background: linear-gradient(90deg, var(--bg-light) 25%, color-mix(in srgb, var(--bg-light) 93%, white) 50%, var(--bg-light) 75%);
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
</style>
