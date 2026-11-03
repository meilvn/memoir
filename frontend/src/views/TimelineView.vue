<template>
  <div class="timeline-page">
    <h1 class="page-title">⏳ 时光之旅</h1>
    <div v-if="timeline.length" class="timeline-container">
      <div v-for="group in timelineGroups" :key="group.year" class="timeline-year">
        <div class="year-header" @click="toggleYear(group.year)">
          <span class="year-dot"></span>
          <h2 class="year-title">{{ group.year }} 年</h2>
          <span class="year-count">{{ group.count }} 张</span>
          <span class="year-arrow" :class="{ open: isYearExpanded(group.year) }">▶</span>
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
              <div v-for="media in visibleItems(mg)" :key="media.id" class="timeline-media-item" @click="goDetail(media.id)">
                <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
                <span class="timeline-date">{{ formatShortDate(media.takenAt) }}</span>
              </div>
            </div>
            <!-- 当月照片较多时折叠，点击展开全部 -->
            <div v-if="mg.items.length > COLLAPSED_COUNT" class="month-more">
              <button class="more-btn" @click="toggleMonth(mg.year, mg.month)">
                {{ isMonthExpanded(mg.year, mg.month) ? '收起 ▲' : `查看全部 ${mg.items.length} 张 ▼` }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon">⏳</div>
      <p>还没有回忆，快去上传吧！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()

const timeline = ref([])
const allMedia = ref([])
const expandedMonths = ref([]) // 已展开的月份，格式 "年-月"
const expandedYears = ref([]) // 已展开的年份

// 每个月默认显示的张数，超出部分折叠，点击"查看全部"展开
const COLLAPSED_COUNT = 12

onMounted(async () => {
  timeline.value = await mediaStore.fetchTimeline()
  await loadAllMedia()
  // 默认只展开最近一年（timeline 按年份倒序，第一个即最近）
  if (timeline.value.length) {
    expandedYears.value = [timeline.value[0].year]
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

function goDetail(id) {
  router.push(`/media/${id}`)
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped lang="scss">
.timeline-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-family: $font-serif;
  font-size: 2rem;
  margin-bottom: 32px;
}

.timeline-container {
  position: relative;
  padding-left: 40px;

  &::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #FF8C69, #FFB347);
    border-radius: 2px;
  }
}

.timeline-year {
  margin-bottom: 32px;
  position: relative;
}

.year-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;

  &:hover .year-title {
    color: $primary;
  }
}

.year-arrow {
  margin-left: auto;
  font-size: 0.7rem;
  color: $text-muted;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(90deg);
  }
}

.year-dot {
  position: absolute;
  left: -33px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF8C69, #FFB347);
  box-shadow: 0 0 0 4px rgba(255, 140, 105, 0.2);
  z-index: 1;
}

.year-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.year-count {
  font-size: 0.85rem;
  color: $text-muted;
  background: $bg-light;
  padding: 2px 12px;
  border-radius: $radius-full;
}

/* ===== 月份分组 ===== */
.timeline-month {
  position: relative;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.month-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-left: 12px;
}

.month-dot {
  position: absolute;
  left: -31px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: $bg-card;
  border: 3px solid $primary;
  z-index: 1;
}

.month-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: $text-secondary;
}

.month-count {
  font-size: 0.75rem;
  color: $text-muted;
  background: $bg-light;
  padding: 1px 10px;
  border-radius: $radius-full;
}

/* 月份照片较多时的展开/收起 */
.month-more {
  padding-left: 24px;
  margin-top: 10px;
}

.more-btn {
  border: 1px solid $border;
  background: $bg-card;
  color: $text-secondary;
  font-size: 0.8rem;
  padding: 6px 16px;
  border-radius: $radius-full;
  cursor: pointer;
  transition: $transition;

  &:hover {
    border-color: $primary;
    color: $primary;
    background: $bg-light;
  }
}

.year-media {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding-left: 24px;
}

.timeline-media-item {
  border-radius: $radius-sm;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  aspect-ratio: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: $transition;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.timeline-date {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0,0,0,0.5);
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: $radius-sm;
}
</style>
