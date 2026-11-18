<template>
  <header class="gallery-header">
    <div>
      <p class="eyebrow">Gallery</p>
      <h1 class="page-title serif">回忆画廊</h1>
    </div>
    <div class="gallery-controls">
      <div class="search-box">
        <AppIcon name="search" :size="15" class="search-icon" />
        <input
          v-model="keyword"
          type="search"
          class="search-input"
          placeholder="搜索照片、备注、标签…"
          @input="emit('search-input')"
        />
        <button v-if="keyword" class="search-clear" title="清空" @click="emit('clear-keyword')">
          <AppIcon name="close" :size="13" />
        </button>
      </div>
      <div class="filter-group">
        <AppIcon name="filter" :size="15" class="filter-icon" />
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="PHOTO">照片</option>
          <option value="VIDEO">视频</option>
        </select>
      </div>
      <select v-model="sortBy" class="filter-select sort-select">
        <option value="newest">最新优先</option>
        <option value="oldest">最早优先</option>
        <option value="name">按文件名</option>
      </select>
      <button
        class="fav-filter"
        :class="{ active: filterFav }"
        title="只看收藏"
        @click="filterFav = !filterFav"
      >
        <AppIcon name="heart" :size="15" />
        收藏
      </button>
      <button
        class="view-toggle"
        :class="{ active: viewMode === 'grid' }"
        :title="viewMode === 'masonry' ? '切换网格视图' : '切换瀑布流'"
        @click="viewMode = viewMode === 'masonry' ? 'grid' : 'masonry'"
      >
        <AppIcon name="grid" :size="15" />
      </button>
      <button
        class="view-toggle"
        :class="{ active: batchMode }"
        :title="batchMode ? '取消批量选择' : '批量操作'"
        @click="emit('toggle-batch')"
      >
        <AppIcon name="check" :size="15" />
      </button>
      <router-link to="/upload" class="upload-trigger" title="上传页">
        <AppIcon name="upload" :size="16" />
        <span>上传页</span>
      </router-link>
      <label class="upload-btn btn btn-primary">
        <AppIcon name="upload" :size="15" />
        上传
        <input type="file" accept="image/*,video/*" multiple @change="onUpload" hidden />
      </label>
      <button
        class="view-toggle"
        :class="{ active: showDateFilter }"
        title="日期筛选"
        @click="showDateFilter = !showDateFilter"
      >
        <AppIcon name="calendar" :size="15" />
      </button>
    </div>

    <!-- 日期筛选器 -->
    <transition name="fade">
      <div v-if="showDateFilter" class="date-filter-bar">
        <div class="date-inputs">
          <div class="date-field">
            <label>开始日期</label>
            <input v-model="dateRange.start" type="date" class="date-input" @change="onDateChange" />
          </div>
          <span class="date-sep">—</span>
          <div class="date-field">
            <label>结束日期</label>
            <input v-model="dateRange.end" type="date" class="date-input" @change="onDateChange" />
          </div>
        </div>
        <button class="date-clear" @click="emit('clear-date')">清除</button>
      </div>
    </transition>

    <!-- 激活的筛选标签 -->
    <transition name="fade">
      <div v-if="hasActiveFilters" class="filter-pills">
        <span class="pill" v-if="keyword">关键词: {{ keyword }}</span>
        <span class="pill" v-if="filterType">类型: {{ filterType === 'PHOTO' ? '照片' : '视频' }}</span>
        <span class="pill" v-if="filterFav">仅收藏</span>
        <span class="pill" v-if="activeTag">标签: {{ activeTag }}</span>
        <span class="pill" v-if="dateRange.start">日期: {{ dateRange.start }} ~ {{ dateRange.end || '今' }}</span>
        <button class="pill-clear" @click="emit('reset')">清除全部</button>
      </div>
    </transition>
  </header>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'

const keyword = defineModel('keyword')
const filterType = defineModel('filterType')
const sortBy = defineModel('sortBy')
const filterFav = defineModel('filterFav')
const viewMode = defineModel('viewMode')
const batchMode = defineModel('batchMode')
const showDateFilter = defineModel('showDateFilter')
const dateRange = defineModel('dateRange')

defineProps({
  activeTag: { type: String, default: '' },
  hasActiveFilters: { type: Boolean, default: false },
})

const emit = defineEmits([
  'search-input', 'clear-keyword', 'toggle-batch', 'upload',
  'date-change', 'clear-date', 'reset',
])

function onUpload(e) {
  emit('upload', e)
  e.target.value = ''
}

function onDateChange() {
  showDateFilter.value = false
  emit('date-change')
}
</script>

<style scoped lang="scss">
.gallery-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: $space-6;
  flex-wrap: wrap;
  gap: $space-4;
  padding: $space-5;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.03) 0%, rgba(var(--primary-rgb), 0.01) 100%);
  border-radius: $radius-lg;
  border: 1px solid var(--border);
}

.eyebrow {
  font-size: $text-xs;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: $space-1;
}

.page-title {
  font-size: $text-3xl;
  font-weight: 600;
}

.gallery-controls {
  display: flex;
  gap: $space-3;
  align-items: center;
  flex-wrap: wrap;
}

.upload-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: $radius-full;
  background: var(--primary);
  color: #fff;
  font-size: $text-sm;
  font-weight: 500;
  text-decoration: none;
  transition: $transition;
  box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.25);

  &:hover {
    background: $primary-dark;
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.35);
    transform: translateY(-1px);
  }
}

/* ===== 搜索框 ===== */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 220px;
  padding: 9px 34px 9px 36px;
  border: 1px solid var(--border);
  border-radius: $radius-full;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: $text-sm;
  font-family: inherit;
  transition: $transition-fast;
  appearance: none;

  &::placeholder {
    color: var(--text-muted);
  }

  &:hover {
    border-color: var(--border-strong);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
    width: 260px;
  }

  /* 去掉浏览器原生 search 的清除按钮（用我们自己的） */
  &::-webkit-search-cancel-button {
    display: none;
  }
}

.search-clear {
  position: absolute;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: $radius-full;
  background: var(--bg-light);
  color: var(--text-secondary);
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    background: var(--border-strong);
    color: var(--text-primary);
  }
}

.filter-group {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.filter-select {
  appearance: none;
  padding: 9px $space-4 9px 36px;
  border: 1px solid var(--border);
  border-radius: $radius-full;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: $text-sm;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: var(--border-strong);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}

.sort-select {
  padding-left: $space-3;
  appearance: auto;
}

/* 只看收藏筛选 */
.fav-filter {
  display:inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px $space-4;
  border: 1px solid var(--border);
  border-radius: $radius-full;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: $text-sm;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;

    :deep(.app-icon path) {
      fill: currentColor;
    }
  }
}

/* 圆形小按钮（视图切换/批量/日期） */
.view-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: $radius-full;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: $primary-soft;
  }

  &.active {
    background: $primary-soft;
    border-color: var(--primary);
    color: var(--primary);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== 日期筛选器 ===== */
.date-filter-bar {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: $radius-md;
  margin-bottom: $space-4;
  animation: fade-up 0.3s ease;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: $text-xs;
    color: var(--text-muted);
  }
}

.date-input {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: $radius-sm;
  background: var(--bg-warm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: $text-sm;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}

.date-sep {
  color: var(--text-muted);
  margin-top: 16px;
}

.date-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: $text-sm;
  padding: 4px 8px;

  &:hover {
    color: var(--error);
  }
}

/* ===== 筛选标签 ===== */
.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  padding: $space-3 0;
  animation: fade-up 0.3s ease;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px $space-3;
  background: $primary-soft;
  color: var(--primary);
  border-radius: $radius-full;
  font-size: $text-xs;
  font-weight: 500;
}

.pill-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: $text-xs;
  padding: 4px 8px;

  &:hover {
    color: var(--error);
  }
}

/* ===== 响应式优化 ===== */
@media (max-width: 768px) {
  .gallery-controls {
    gap: $space-2;
  }

  .search-input {
    width: 100%;
    max-width: none;

    &:focus {
      width: 100%;
    }
  }

  .filter-select,
  .sort-select {
    flex: 1;
    min-width: 0;
  }

  .upload-trigger span {
    display: none;
  }
}

@media (max-width: 640px) {
  .gallery-header {
    flex-direction: column;
    gap: $space-3;
  }

  .gallery-controls {
    width: 100%;
  }

  .date-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .date-inputs {
    flex-direction: column;
  }

  .date-sep {
    display: none;
  }
}
</style>
