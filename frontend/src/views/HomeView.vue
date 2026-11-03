<template>
  <div class="home">
    <!-- 编辑式 Hero -->
    <header class="hero" data-reveal>
      <p class="eyebrow">Family Memoir · 家庭回忆</p>
      <h1 class="hero-title serif">每一张照片，<br />都是回家的路</h1>
      <p class="hero-sub">记录温暖瞬间，留住时光故事</p>
      <div class="hero-rule" />
    </header>

    <!-- 快捷入口 -->
    <nav class="quick-nav" data-reveal>
      <router-link v-for="card in quickCards" :key="card.title" :to="card.to" class="quick-item">
        <span class="quick-icon"><AppIcon :name="card.icon" :size="19" /></span>
        <span class="quick-text">
          <strong>{{ card.title }}</strong>
          <em>{{ card.desc }}</em>
        </span>
        <AppIcon name="chevronRight" :size="15" class="quick-arrow" />
      </router-link>
    </nav>

    <!-- 最近回忆 -->
    <section class="recent">
      <div class="section-head">
        <h2>最近回忆</h2>
        <router-link v-if="recentMedia.length" to="/gallery" class="more-link">
          查看全部<AppIcon name="arrowRight" :size="14" />
        </router-link>
      </div>

      <div v-if="recentMedia.length" class="recent-grid">
        <figure
          v-for="(media, i) in recentMedia"
          :key="media.id"
          v-reveal="i * 45"
          class="recent-item"
          @click="goToDetail(media.id)"
        >
          <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
          <figcaption>
            <span class="recent-date">{{ formatDate(media.takenAt) }}</span>
            <span v-if="media.mediaType === 'VIDEO'" class="recent-badge"><AppIcon name="film" :size="12" />视频</span>
          </figcaption>
        </figure>
      </div>

      <div v-else-if="notLoggedIn" class="empty-state">
        <div class="empty-icon"><AppIcon name="heart" :size="24" /></div>
        <p>登录后即可查看家庭回忆</p>
        <router-link to="/login" class="btn btn-primary">去登录</router-link>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon"><AppIcon name="image" :size="24" /></div>
        <p>还没有回忆呢，快去上传第一张照片吧</p>
        <router-link to="/gallery" class="btn btn-primary">浏览画廊</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'

const mediaStore = useMediaStore()
const authStore = useAuthStore()
const router = useRouter()

const recentMedia = ref([])
const notLoggedIn = ref(!authStore.isLoggedIn)

const quickCards = [
  { icon: 'image', title: '回忆画廊', desc: '浏览所有照片与视频', to: '/gallery' },
  { icon: 'clock', title: '时光之旅', desc: '按年月日回溯往事', to: '/timeline' },
  { icon: 'book', title: '回忆故事', desc: '带文字备注的珍藏', to: '/stories' },
  { icon: 'shuffle', title: '随机回忆', desc: '来一段意外的惊喜', to: '/gallery' },
]

onMounted(async () => {
  if (!authStore.isLoggedIn) return
  try {
    await mediaStore.fetchMedia({ page: 1, limit: 20 })
    recentMedia.value = mediaStore.items
  } catch {
    recentMedia.value = []
  }
})

function goToDetail(id) {
  router.push(`/media/${id}`)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.home {
  max-width: 1080px;
  margin: 0 auto;
}

/* ===== Hero ===== */
.hero {
  padding: $space-7 0 $space-6;
}

.hero-title {
  font-size: $text-4xl;
  font-weight: 600;
  line-height: 1.28;
  letter-spacing: 0.01em;
  margin: $space-3 0 $space-4;
  color: $text-primary;
}

.hero-sub {
  font-size: $text-lg;
  color: $text-secondary;
}

.hero-rule {
  width: 56px;
  height: 2px;
  background: $primary;
  margin-top: $space-5;
}

/* ===== 快捷入口 ===== */
.quick-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $space-3;
  padding: $space-5 0 $space-7;
  border-top: 1px solid $border;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border: 1px solid $border;
  border-radius: $radius-md;
  background: $bg-card;
  text-decoration: none;
  color: inherit;
  transition: $transition;

  &:hover {
    border-color: $primary;
    box-shadow: $shadow-md;
    transform: translateY(-2px);

    .quick-icon {
      background: $primary;
      color: #fff;
    }

    .quick-arrow {
      opacity: 1;
      transform: translateX(2px);
    }
  }
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: $primary-soft;
  color: $primary;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: $transition;
}

.quick-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.4;

  strong {
    font-size: $text-base;
    font-weight: 600;
  }

  em {
    font-style: normal;
    font-size: $text-xs;
    color: $text-muted;
    margin-top: 2px;
  }
}

.quick-arrow {
  color: $text-muted;
  opacity: 0;
  transition: $transition;
}

/* ===== 最近回忆 ===== */
.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $space-4;
}

.recent-item {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 4 / 3;
  background: $bg-light;
  border: 1px solid $border;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s $ease-out;
  }

  &:hover img {
    transform: scale(1.04);
  }

  figcaption {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-5 $space-3 $space-2;
    background: linear-gradient(transparent, rgba(20, 18, 16, 0.62));
    color: #fff;
    opacity: 0;
    transform: translateY(6px);
    transition: $transition;
  }

  &:hover figcaption {
    opacity: 1;
    transform: translateY(0);
  }
}

.recent-date {
  font-size: $text-xs;
  letter-spacing: 0.04em;
}

.recent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: $text-xs;
  background: rgba(255, 255, 255, 0.18);
  padding: 2px 8px;
  border-radius: $radius-full;
}

@media (max-width: 640px) {
  .hero {
    padding: $space-5 0 $space-4;
  }

  .hero-title {
    font-size: $text-3xl;
  }
}
</style>
