<template>
  <div class="stats-page">
    <header class="page-head" data-reveal>
      <p class="eyebrow">Insights</p>
      <h1 class="page-title serif">回忆洞察</h1>
      <p class="page-sub">用数字回望这些年的点点滴滴</p>
    </header>

    <div v-if="loading" class="stats-loading">
      <SkeletonCard v-for="n in 4" :key="n" variant="default" height="108px" />
    </div>

    <template v-else-if="stats.total">
      <!-- 核心数字 -->
      <section class="tile-row">
        <div v-for="(t, i) in tiles" :key="t.label" v-reveal="i * 70" class="tile">
          <span class="tile-icon" :style="{ background: t.tint }"><AppIcon :name="t.icon" :size="17" /></span>
          <strong class="tile-value serif" :ref="(el) => setValueRef(el, i)">0</strong>
          <span class="tile-label">{{ t.label }}</span>
        </div>
      </section>

      <!-- 年度分布 -->
      <section class="panel" data-reveal>
        <div class="panel-head">
          <h2>年度分布</h2>
          <span class="panel-hint">点击年份可前往时间线</span>
        </div>
        <div class="bars">
          <button
            v-for="(y, i) in stats.years"
            :key="y.year"
            v-reveal="i * 45"
            class="bar-col"
            :title="`${y.year} 年 · ${y.count} 条`"
            @click="goYear(y.year)"
          >
            <span class="bar-count">{{ y.count }}</span>
            <span class="bar-track">
              <span
                class="bar-fill"
                :style="{ height: stats.yearMax ? `${Math.max(6, (y.count / stats.yearMax) * 100)}%` : '0%' }"
              />
            </span>
            <span class="bar-year">{{ String(y.year).slice(2) }}</span>
          </button>
        </div>
      </section>

      <!-- 洞察卡片 -->
      <section class="insight-grid">
        <div v-reveal="0" class="insight-card">
          <span class="insight-icon"><AppIcon name="calendar" :size="16" /></span>
          <p class="insight-label">记录跨度</p>
          <p class="insight-value serif">{{ stats.span.from }} – {{ stats.span.to }}</p>
          <p class="insight-note">连续 {{ stats.span.to - stats.span.from + 1 }} 年的家庭记忆</p>
        </div>

        <div v-reveal="70" class="insight-card">
          <span class="insight-icon"><AppIcon name="clock" :size="16" /></span>
          <p class="insight-label">最常记录的月份</p>
          <p class="insight-value serif">{{ stats.busiestMonth.month }} 月</p>
          <p class="insight-note">共有 {{ stats.busiestMonth.count }} 条回忆落在这个月</p>
        </div>

        <div v-reveal="140" class="insight-card">
          <span class="insight-icon"><AppIcon name="download" :size="16" /></span>
          <p class="insight-label">存储占用</p>
          <p class="insight-value serif">{{ storageText }}</p>
          <p class="insight-note">平均每条 {{ avgSizeText }}</p>
        </div>

        <div v-reveal="210" class="insight-card">
          <span class="insight-icon"><AppIcon name="edit" :size="16" /></span>
          <p class="insight-label">文字与标签</p>
          <p class="insight-value serif">{{ stats.noteCount }} 条备注</p>
          <p class="insight-note">打了 {{ stats.tagCount }} 个不同的标签</p>
        </div>
      </section>

      <!-- 珍藏进度 -->
      <section class="panel fav-panel" data-reveal>
        <div class="panel-head">
          <h2>珍藏进度</h2>
          <span class="panel-hint">{{ stats.favorites }} / {{ stats.total }} 条已加入珍藏</span>
        </div>
        <div class="fav-track">
          <div
            class="fav-fill"
            :style="{ width: favPercent + '%' }"
          />
        </div>
        <p class="fav-note">
          {{ favPercent >= 50 ? '珍藏颇丰，这些都是最珍贵的瞬间' : '点心形把喜欢的瞬间标记为珍藏吧' }}
        </p>
      </section>
    </template>

    <div v-else class="empty-state">
      <div class="empty-icon"><AppIcon name="chart" :size="26" /></div>
      <p>还没有足够的回忆来生成洞察</p>
      <router-link to="/gallery" class="btn btn-primary">去上传第一张照片</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { mediaApi } from '@/api'
import AppIcon from '@/components/AppIcon.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import { countUp } from '@/directives/reveal'

const router = useRouter()
const stats = ref({
  total: 0, photos: 0, videos: 0, favorites: 0,
  storageBytes: 0, years: [], yearMax: 0,
  busiestMonth: null, span: null, tagCount: 0, noteCount: 0,
})
const loading = ref(true)
const valueRefs = ref([])

function setValueRef(el, i) {
  if (el) valueRefs.value[i] = el
}

const tiles = computed(() => [
  { label: '全部回忆', value: stats.value.total, icon: 'image', tint: 'rgba(201,111,74,0.10)' },
  { label: '照片', value: stats.value.photos, icon: 'image', tint: 'rgba(91,154,110,0.12)' },
  { label: '视频', value: stats.value.videos, icon: 'film', tint: 'rgba(120,140,180,0.14)' },
  { label: '珍藏', value: stats.value.favorites, icon: 'heart', tint: 'rgba(192,91,77,0.12)' },
])

const storageText = computed(() => {
  const b = stats.value.storageBytes
  if (!b) return '0 MB'
  return b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`
})

const avgSizeText = computed(() => {
  if (!stats.value.total) return '0 KB'
  const kb = stats.value.storageBytes / stats.value.total / 1024
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
})

const favPercent = computed(() =>
  stats.value.total ? Math.round((stats.value.favorites / stats.value.total) * 100) : 0,
)

onMounted(async () => {
  try {
    stats.value = await mediaApi.getStats()
  } catch {
    // 保持空态
  } finally {
    loading.value = false
  }
  // 等渲染完成后播放数字滚动
  await nextTick()
  tiles.value.forEach((t, i) => {
    if (valueRefs.value[i]) countUp(valueRefs.value[i], t.value, 900 + i * 120)
  })
})

function goYear(year) {
  router.push(`/timeline?year=${year}`)
}
</script>

<style scoped lang="scss">
.stats-page {
  max-width: 1080px;
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

.page-sub {
  margin-top: $space-2;
  color: $text-secondary;
  font-size: $text-sm;
}

/* ===== 加载骨架 ===== */
.stats-loading {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ===== 核心数字 ===== */
.tile-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;
  margin-bottom: $space-5;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: $space-5 $space-4;
  background: $bg-card;
  border: 1px solid $border;
  border-radius: $radius-md;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transform: translateY(0);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    border-color: $border-strong;
  }
}

.tile-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: $radius-sm;
  color: $primary;
  margin-bottom: $space-2;
}

.tile-value {
  font-size: $text-4xl;
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.tile-label {
  font-size: $text-sm;
  color: $text-secondary;
  letter-spacing: 0.04em;
}

/* ===== 面板 ===== */
.panel {
  background: $bg-card;
  border: 1px solid $border;
  border-radius: $radius-md;
  padding: $space-5;
  margin-bottom: $space-5;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: $space-5;

  h2 {
    font-size: $text-lg;
    font-weight: 600;
  }
}

.panel-hint {
  font-size: $text-xs;
  color: $text-muted;
}

/* ===== 年度柱状图 ===== */
.bars {
  display: flex;
  align-items: flex-end;
  gap: $space-2;
  height: 190px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.bar-count {
  font-size: $text-xs;
  color: $text-secondary;
  font-variant-numeric: tabular-nums;
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 42px;
  display: flex;
  align-items: flex-end;
  background: $bg-light;
  border-radius: $radius-sm;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, $primary-light, $primary);
  border-radius: $radius-sm;
  transition: height 0.6s $ease-out;

  .bar-col:hover & {
    background: linear-gradient(180deg, $primary, $primary-dark);
  }
}

.bar-year {
  font-size: $text-xs;
  color: $text-muted;
  font-variant-numeric: tabular-nums;

  .bar-col:hover & {
    color: $primary;
  }
}

/* ===== 洞察卡片 ===== */
.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
  margin-bottom: $space-5;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.insight-card {
  padding: $space-5;
  background: $bg-card;
  border: 1px solid $border;
  border-radius: $radius-md;
}

.insight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: $radius-sm;
  background: $primary-soft;
  color: $primary;
  margin-bottom: $space-3;
}

.insight-label {
  font-size: $text-xs;
  letter-spacing: 0.1em;
  color: $text-muted;
  margin-bottom: 4px;
}

.insight-value {
  font-size: $text-xl;
  font-weight: 600;
  margin-bottom: 6px;
}

.insight-note {
  font-size: $text-sm;
  color: $text-secondary;
  line-height: 1.6;
}

/* ===== 珍藏进度 ===== */
.fav-track {
  height: 8px;
  background: $bg-light;
  border-radius: $radius-full;
  overflow: hidden;
  margin-bottom: $space-3;
}

.fav-fill {
  height: 100%;
  background: linear-gradient(90deg, $primary-light, $primary);
  border-radius: $radius-full;
  transition: width 0.8s $ease-out;
}

.fav-note {
  font-size: $text-sm;
  color: $text-secondary;
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: $space-8 $space-5;
  color: $text-secondary;

  p {
    margin: $space-4 0 $space-5;
  }
}

.empty-icon {
  color: $text-muted;
}
</style>
