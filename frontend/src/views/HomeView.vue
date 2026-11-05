<template>
  <div class="home">
    <!-- 编辑式 Hero -->
    <header class="hero" @mousemove="onHeroMouse">
      <div class="hero-orb orb-a animate__animated animate__fadeInRight" aria-hidden="true" />
      <div class="hero-orb orb-b animate__animated animate__fadeInLeft" aria-hidden="true" />
      <div class="hero-glow" aria-hidden="true" />
      <div class="hero-inner" :style="{ transform: `translateY(${heroParallax * -20}px)` }">
        <p class="eyebrow animate__animated animate__fadeInDown">Family Memoir · 家庭回忆</p>
        <h1 class="hero-title serif blur-up">每一张照片，<br />都是回家的路</h1>
        <p class="hero-sub animate__animated animate__fadeInUp animate__delay-1s">记录温暖瞬间，留住时光故事</p>
        <div class="hero-rule animate__animated animate__zoomIn animate__delay-2s" />
      </div>
    </header>

    <!-- 快捷入口 -->
    <nav class="quick-nav">
      <div v-for="(card, i) in quickCards" :key="card.title"
        class="quick-item animate__animated animate__fadeInUp"
        :style="{ animationDelay: `${0.5 + i * 0.12}s` }"
        v-focusable @click="handleQuickCard(card)">
        <span class="quick-icon"><AppIcon :name="card.icon" :size="19" /></span>
        <span class="quick-text">
          <strong>{{ card.title }}</strong>
          <em>{{ card.desc }}</em>
        </span>
        <AppIcon name="chevronRight" :size="15" class="quick-arrow" />
      </div>
    </nav>

    <!-- 历史上的今天 -->
    <section v-if="otdLoading" class="on-this-day">
      <div class="section-head">
        <h2>历史上的今天</h2>
        <span class="eyebrow">On This Day</span>
      </div>
      <div class="otd-grid">
        <SkeletonCard v-for="n in 4" :key="n" variant="media" />
      </div>
    </section>

    <section v-else-if="onThisDay.length" class="on-this-day">
      <div class="section-head">
        <h2>历史上的今天</h2>
        <span class="eyebrow">On This Day</span>
      </div>
      <div class="otd-grid">
        <figure
          v-for="(m, i) in onThisDay"
          :key="m.id"
          v-reveal="i * 60"
          class="otd-item"
          @click="openOtd(i)"
        >
          <img :src="mediaStore.getMediaUrl(m.thumbnailPath)" :alt="m.filename" loading="lazy" />
          <figcaption>
            <span class="otd-ago">{{ yearsAgo(m.takenAt) }} 年前</span>
            <span class="otd-date">{{ formatDate(m.takenAt) }}</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- 最近回忆 -->
    <section class="recent">
      <div class="section-head">
        <h2>最近回忆</h2>
        <router-link v-if="recentMedia.length" to="/gallery" class="more-link">
          查看全部<AppIcon name="arrowRight" :size="14" />
        </router-link>
      </div>

      <div v-if="recentLoading" class="recent-grid">
        <SkeletonCard v-for="n in 8" :key="n" variant="media" />
      </div>

      <div v-else-if="recentMedia.length" class="recent-grid">
        <figure
          v-for="(media, i) in recentMedia"
          :key="media.id"
          v-reveal="i * 45"
          class="recent-item"
          @click="openRecent(i)"
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

    <!-- 灯箱：OTD 与最近回忆共用，按打开来源切换列表 -->
    <Lightbox
      v-model="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="lightboxItems"
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'
import Lightbox from '@/components/Lightbox.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { mediaApi } from '@/api'

const router = useRouter()
const mediaStore = useMediaStore()
const authStore = useAuthStore()

const recentMedia = ref([])
const recentLoading = ref(false)
const onThisDay = ref([])
const otdLoading = ref(false)
const notLoggedIn = ref(!authStore.isLoggedIn)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxSource = ref('recent') // 'otd' | 'recent'

// 灯箱列表随来源切换：OTD 模块打开时只浏览 OTD 的回忆
const lightboxItems = computed(() => (lightboxSource.value === 'otd' ? onThisDay.value : recentMedia.value))

const heroParallax = ref(0)

// Hero 鼠标视差：光斑跟随指针
function onHeroMouse(e) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width - 0.5) * 2
  const y = ((e.clientY - r.top) / r.height - 0.5) * 2
  el.style.setProperty('--hmx', x.toFixed(3))
  el.style.setProperty('--hmy', y.toFixed(3))
}

const quickCards = [
  { icon: 'image', title: '回忆画廊', desc: '浏览所有照片与视频', to: '/gallery' },
  { icon: 'clock', title: '时光之旅', desc: '按年月日回溯往事', to: '/timeline' },
  { icon: 'book', title: '回忆故事', desc: '带文字备注的珍藏', to: '/stories' },
  { icon: 'shuffle', title: '随机回忆', desc: '来一段意外的惊喜', action: 'random' },
]

onMounted(async () => {
  if (!authStore.isLoggedIn) return
  otdLoading.value = true
  recentLoading.value = true
  try {
    onThisDay.value = await mediaApi.getOnThisDay()
  } catch {
    onThisDay.value = []
  } finally {
    otdLoading.value = false
  }
  try {
    await mediaStore.fetchMedia({ page: 1, limit: 20 })
    recentMedia.value = mediaStore.items
  } catch {
    recentMedia.value = []
  } finally {
    recentLoading.value = false
  }

  // 首页 hero 视差滚动
  window.addEventListener('scroll', () => {
    heroParallax.value = Math.min(window.scrollY / 300, 1)
  }, { passive: true })
})

function yearsAgo(dateStr) {
  if (!dateStr) return ''
  return new Date().getFullYear() - new Date(dateStr).getFullYear()
}

function openOtd(i) {
  lightboxSource.value = 'otd'
  lightboxIndex.value = i
  lightboxOpen.value = true
}

function openRecent(i) {
  lightboxSource.value = 'recent'
  lightboxIndex.value = i
  lightboxOpen.value = true
}

function handleQuickCard(card) {
  if (card.action === 'random') {
    openRandomMemory()
  } else if (card.to) {
    router.push(card.to)
  }
}

async function openRandomMemory() {
  try {
    // 利用已加载的最近回忆，若不足则补拉一页
    const pool = recentMedia.value.length ? recentMedia.value : await mediaStore.fetchMedia({ page: 1, limit: 50 }).then(() => mediaStore.items)
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      router.push(`/media/${pick.id}`)
    } else {
      router.push('/gallery')
    }
  } catch {
    router.push('/gallery')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.home {
  max-width: 1080px;
  margin: 0 auto;
}

/* ===== Hero ===== */
.hero {
  padding: $space-7 0 $space-6;
  position: relative;
  z-index: 1;
  background: $gradient-hero;
  border-radius: $radius-lg;
  margin-bottom: $space-6;
  overflow: hidden;
  --hmx: 0;
  --hmy: 0;

  header {
    transition: transform 0.1s linear;
  }
}

.hero-inner {
  position: relative;
  z-index: 1;
}

/* 漂浮暖光斑 */
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}

.orb-a {
  width: 220px;
  height: 220px;
  top: -70px;
  right: 8%;
  background: var(--primary-soft, #e8c9b8);
  animation: orb-drift 14s ease-in-out infinite;
  translate: calc(var(--hmx) * 24px) calc(var(--hmy) * 24px);
}

.orb-b {
  width: 160px;
  height: 160px;
  bottom: -60px;
  left: 12%;
  background: #f0d9c8;
  animation: orb-drift 18s ease-in-out infinite reverse;
  translate: calc(var(--hmx) * -36px) calc(var(--hmy) * -36px);
}

.orb-c {
  width: 90px;
  height: 90px;
  top: 40%;
  right: 30%;
  background: #e3b89f;
  opacity: 0.35;
  animation: orb-drift 11s ease-in-out infinite;
}

/* 鼠标跟随的暖色涟漪光晕 */
.hero-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 220, 180, 0.55), transparent 65%);
  filter: blur(20px);
  pointer-events: none;
  mix-blend-mode: soft-light;
  translate: calc(var(--hmx) * 300px - 180px) calc(var(--hmy) * 200px - 180px);
  z-index: 0;
}

@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(14px, -18px) scale(1.08); }
  66% { transform: translate(-10px, 12px) scale(0.96); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-orb,
  .hero-title {
    animation: none !important;
  }
}

.hero-title {
  font-size: $text-4xl;
  font-weight: 600;
  line-height: 1.28;
  letter-spacing: 0.01em;
  margin: $space-3 0 $space-4;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: hero-gradient 6s ease infinite;
  background-size: 200% 200%;
}

@keyframes hero-gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 标题模糊聚焦入场 */
.blur-up {
  animation: blur-up 1.2s $ease-out 0.15s both;
}

@keyframes blur-up {
  from {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

.hero-sub {
  font-size: $text-lg;
  color: var(--text-secondary);
}

.hero-rule {
  width: 56px;
  height: 2px;
  background: var(--primary);
  margin-top: $space-5;
  animation: hero-rule-in 1s $ease-out 0.3s both;
}

@keyframes hero-rule-in {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 56px;
    opacity: 1;
  }
}

/* ===== 快捷入口 ===== */
.quick-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $space-3;
  padding: $space-5 0 $space-7;
  border-top: 1px solid var(--border);
}

.quick-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border: 1px solid var(--border);
  border-radius: $radius-md;
  background: var(--bg-card);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06);
    transform: translateY(-4px);

    .quick-icon {
      background: var(--primary);
      color: #fff;
      transform: scale(1.05);
    }

    .quick-arrow {
      opacity: 1;
      transform: translateX(3px);
    }
  }
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: $primary-soft;
  color: var(--primary);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, color 0.3s ease;
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
    color: var(--text-muted);
    margin-top: 2px;
  }
}

.quick-arrow {
  color: var(--text-muted);
  opacity: 0;
  transition: $transition;
}

/* 入场动画结束后解除 transform 锁定，保留 hover 抬升 */
.quick-item.animate__animated {
  animation-fill-mode: backwards;
}

/* ===== 历史上的今天 ===== */
.on-this-day {
  margin-bottom: $space-7;
}

.otd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $space-4;
}

.otd-item {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 4 / 3;
  background: var(--bg-light);
  border: 1px solid var(--border);

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
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: $space-4 $space-3 $space-3;
    background: linear-gradient(transparent 40%, rgba(20, 18, 16, 0.66));
    color: #fff;
  }
}

.otd-ago {
  font-family: $font-serif;
  font-size: $text-xl;
  font-weight: 600;
  line-height: 1.2;
}

.otd-date {
  font-size: $text-xs;
  opacity: 0.85;
  letter-spacing: 0.04em;
  margin-top: 2px;
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
  background: var(--bg-light);
  border: 1px solid var(--border);

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
