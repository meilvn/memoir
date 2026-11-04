<template>
  <div class="timeline-page">
    <header class="page-head" data-reveal>
      <p class="eyebrow">Timeline</p>
      <h1 class="page-title serif">时光之旅</h1>
    </header>
    <div v-if="loading" class="timeline-loading">
      <div v-for="n in 3" :key="n" class="loading-year">
        <div class="skeleton skeleton-year" />
        <div class="loading-months">
          <div v-for="m in 2" :key="m" class="skeleton skeleton-month" />
        </div>
      </div>
    </div>

    <div v-else-if="timeline.length" class="timeline-container">
      <div v-for="group in timelineGroups" :key="group.year" class="timeline-year">
        <div class="year-header" @click="toggleYear(group.year)">
          <span class="year-dot"></span>
          <h2 class="year-title serif">{{ group.year }} 年</h2>
          <span class="year-count">{{ group.count }} 张</span>
          <span class="year-arrow" :class="{ open: isYearExpanded(group.year) }">
            <AppIcon name="chevronRight" :size="14" />
          </span>
        </div>
        <!-- 年份下的月份分组（年份收起时隐藏） -->
        <template v-if="isYearExpanded(group.year)">
          <div v-for="mg in group.months" :key="mg.month" class="timeline-month">
            <div class="month-header">
              <span class="month-dot"></span>
              <h3 class="month-title">{{ mg.month }} 月</h3>
              <span class="month-count">{{ mg.items.length }} 张</span>
            </div>
            <div class="year-media">
              <div
                v-for="(media, i) in visibleItems(mg)"
                :key="media.id"
                class="timeline-media-item"
                @click="openLightbox(media.id)"
              >
                <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
                <span class="timeline-date">{{ formatShortDate(media.takenAt) }}</span>
              </div>
            </div>
            <!-- 当月照片较多时折叠，点击展开全部 -->
            <div v-if="mg.items.length > COLLAPSED_COUNT" class="month-more">
              <button class="more-btn" @click="toggleMonth(mg.year, mg.month)">
                {{ isMonthExpanded(mg.year, mg.month) ? '收起' : `查看全部 ${mg.items.length} 张` }}
                <AppIcon :name="isMonthExpanded(mg.year, mg.month) ? 'chevronUp' : 'chevronDown'" :size="13" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon"><AppIcon name="clock" :size="26" /></div>
      <p>还没有回忆，快去上传吧！</p>
    </div>

    <Lightbox
      v-model="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="allMedia"
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import AppIcon from '@/components/AppIcon.vue'
import Lightbox from '@/components/Lightbox.vue'

const mediaStore = useMediaStore()
const route = useRoute()

const timeline = ref([])
const allMedia = ref([])
const expandedMonths = ref([])
const expandedYears = ref([])
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const loading = ref(true)

// 每个月默认显示的张数，超出部分折叠，点击"查看全部"展开
const COLLAPSED_COUNT = 12

onMounted(async () => {
  loading.value = true
  try {
    timeline.value = await mediaStore.fetchTimeline()
    await loadAllMedia()
    const want = Number(route.query.year)
    if (want && timeline.value.some((t) => t.year === want)) {
      expandedYears.value = [want]
    } else if (timeline.value.length) {
      expandedYears.value = [timeline.value[0].year]
    }
  } finally {
    loading.value = false
  }
})

// 分页加载全部媒体（不受单页 limit 上限影响，数据多的时候也能完整显示）
async function loadAllMedia() {
  try {
    const all = []
    let page = 1
    while (true) {
      const data = await mediaStore.fetchMedia({ page, limit: 100 })
      all.push(...data.items)
      if (page >= data.totalPages) break
      page++
    }
    allMedia.value = all
  } catch {
    allMedia.value = []
  }
}

// 年份 → 月份 两级分组（月份倒序，最近的在前）
const timelineGroups = computed(() => {
  return timeline.value.map((item) => {
    const items = allMedia.value.filter((m) => m.year === item.year)
    const months = [...new Set(items.map((m) => m.month))].sort((a, b) => b - a)
    return {
      year: item.year,
      count: item.count,
      months: months.map((mo) => ({
        year: item.year,
        month: mo,
        items: items.filter((m) => m.month === mo),
      })),
    }
  })
})

function monthKey(year, month) {
  return `${year}-${month}`
}

function isYearExpanded(year) {
  return expandedYears.value.includes(year)
}

function toggleYear(year) {
  const idx = expandedYears.value.indexOf(year)
  if (idx > -1) expandedYears.value.splice(idx, 1)
  else expandedYears.value.push(year)
}

function isMonthExpanded(year, month) {
  return expandedMonths.value.includes(monthKey(year, month))
}

function toggleMonth(year, month) {
  const key = monthKey(year, month)
  const idx = expandedMonths.value.indexOf(key)
  if (idx > -1) expandedMonths.value.splice(idx, 1)
  else expandedMonths.value.push(key)
}

// 当前该显示的图片：折叠时取前 COLLAPSED_COUNT 张
function visibleItems(mg) {
  return isMonthExpanded(mg.year, mg.month) ? mg.items : mg.items.slice(0, COLLAPSED_COUNT)
}

// 点击照片：打开灯箱（在全部媒体列表里定位当前项）
function openLightbox(id) {
  const i = allMedia.value.findIndex((m) => m.id === id)
  if (i > -1) {
    lightboxIndex.value = i
    lightboxOpen.value = true
  }
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped lang="scss">
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.timeline-page {
  max-width: 900px;
  margin: 0 auto;
  padding: $space-6 $space-5 $space-8;
}

.page-head {
  margin-bottom: $space-6;
}

.eyebrow {
  font-size: $text-xs;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: $text-muted;
  margin-bottom: $space-1;
}

.page-title {
  font-size: $text-3xl;
  font-weight: 600;
}

.timeline-container {
  position: relative;
  padding-left: $space-6;

  &::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 6px;
    bottom: 6px;
    width: 1px;
    background: linear-gradient(180deg, $primary, $border);
  }
}

.timeline-year {
  margin-bottom: $space-6;
  position: relative;
}

.year-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-4;
  cursor: pointer;
  user-select: none;

  &:hover .year-title {
    color: $primary;
  }
}

.year-arrow {
  margin-left: auto;
  display: inline-flex;
  color: $text-muted;
  transition: transform 0.25s $ease-out;

  &.open {
    transform: rotate(90deg);
  }
}

.year-dot {
  position: absolute;
  left: -33px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: $primary;
  box-shadow: 0 0 0 4px $primary-soft;
  z-index: 1;
}

.year-title {
  font-size: $text-2xl;
  font-weight: 600;
  transition: $transition-fast;
}

.year-count {
  font-size: $text-xs;
  color: $text-secondary;
  background: $bg-light;
  padding: 2px 12px;
  border-radius: $radius-full;
  letter-spacing: 0.04em;
}

/* ===== 月份分组 ===== */
.timeline-month {
  position: relative;
  margin-bottom: $space-5;

  &:last-child {
    margin-bottom: 0;
  }
}

.month-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
  padding-left: $space-3;
}

.month-dot {
  position: absolute;
  left: -28px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: $bg-card;
  border: 2px solid $primary;
  z-index: 1;
}

.month-title {
  font-size: $text-base;
  font-weight: 600;
  color: $text-secondary;
}

.month-count {
  font-size: $text-xs;
  color: $text-muted;
  background: $bg-light;
  padding: 1px 10px;
  border-radius: $radius-full;
}

/* 月份照片较多时的展开/收起 */
.month-more {
  padding-left: $space-5;
  margin-top: $space-3;
}

.more-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid $border;
  background: $bg-card;
  color: $text-secondary;
  font-size: $text-sm;
  font-family: inherit;
  padding: 6px $space-4;
  border-radius: $radius-full;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: $primary;
    color: $primary;
    background: $primary-soft;
  }
}

.year-media {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: $space-3;
  padding-left: $space-5;
}

.timeline-media-item {
  border-radius: $radius-sm;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  aspect-ratio: 1;
  border: 1px solid $border;
  background: $bg-light;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s $ease-out;
  }

  &:hover img {
    transform: scale(1.06);
  }
}

.timeline-date {
  position: absolute;
  bottom: $space-1;
  left: $space-1;
  background: rgba(28, 25, 22, 0.62);
  color: #fff;
  font-size: 0.65rem;
  padding: 2px 7px;
  border-radius: $radius-sm;
  letter-spacing: 0.04em;
}

.empty-state {
  text-align: center;
  padding: $space-8 $space-5;
  color: $text-secondary;

  p {
    margin-top: $space-4;
  }
}

.empty-icon {
  color: $text-muted;
}

/* ===== 加载骨架 ===== */
.timeline-loading {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  padding-left: $space-6;
}

.loading-year {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.loading-months {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: $space-3;
  padding-left: $space-5;
}

.skeleton-year,
.skeleton-month {
  background: linear-gradient(90deg, $bg-light 25%, lighten($bg-light, 3%) 50%, $bg-light 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: $radius-sm;
}

.skeleton-year {
  height: 36px;
  width: 160px;
}

.skeleton-month {
  height: 140px;
}
</style>
