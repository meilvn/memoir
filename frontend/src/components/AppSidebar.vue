<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <h3 class="sidebar-title">📅 时间线</h3>
      <div class="timeline-tree">
        <div v-for="year in years" :key="year.year" class="timeline-year">
          <div class="year-node" @click="toggleYear(year.year)">
            <span class="year-dot"></span>
            <span class="year-label">{{ year.year }} 年</span>
            <span class="year-count">{{ year.count }}</span>
            <span class="arrow" :class="{ open: expandedYears.includes(year.year) }">▶</span>
          </div>
          <div v-if="expandedYears.includes(year.year)" class="month-list">
            <div v-for="month in getMonths(year.year)" :key="month.month" class="month-item">
              <span class="month-dot"></span>
              <span class="month-label">{{ month.month }}月</span>
              <span class="month-count">{{ month.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMediaStore } from '@/stores/media'
import { mediaApi } from '@/api'
import { useRouter } from 'vue-router'

const mediaStore = useMediaStore()
const router = useRouter()
const years = ref([])
const monthsCache = {}
const expandedYears = ref([])

onMounted(async () => {
  years.value = await mediaApi.getTimeline()
})

function toggleYear(year) {
  const idx = expandedYears.value.indexOf(year)
  if (idx > -1) {
    expandedYears.value.splice(idx, 1)
  } else {
    expandedYears.value.push(year)
  }
}

async function getMonths(year) {
  if (!monthsCache[year]) {
    monthsCache[year] = await mediaApi.getMonths(year)
  }
  return monthsCache[year]
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: calc(100vh - 64px);
  position: fixed;
  left: 0;
  top: 64px;
  background: $bg-card;
  border-right: 1px solid $border;
  overflow-y: auto;
  padding: 20px 16px;
  z-index: 50;
}

.sidebar-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.timeline-year {
  margin-bottom: 4px;
}

.year-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background: $bg-light;
  }
}

.year-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary, $primary-light);
  flex-shrink: 0;
}

.year-label {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
}

.year-count {
  font-size: 0.75rem;
  color: $text-muted;
  background: $bg-light;
  padding: 2px 8px;
  border-radius: $radius-full;
}

.arrow {
  font-size: 0.6rem;
  color: $text-muted;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(90deg);
  }
}

.month-list {
  padding-left: 28px;
  margin-top: 4px;
}

.month-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background: $bg-light;
  }
}

.month-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $primary-light;
  flex-shrink: 0;
}

.month-label {
  font-size: 0.85rem;
  color: $text-secondary;
}

.month-count {
  font-size: 0.7rem;
  color: $text-muted;
}
</style>
