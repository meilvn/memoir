<template>
  <section v-if="tags.length" class="tag-cloud">
    <div class="tag-cloud-head">
      <span class="tag-cloud-title"><AppIcon name="tag" :size="14" />标签</span>
      <button class="tag-cloud-toggle" @click="expanded = !expanded">
        {{ expanded ? '收起' : `展开全部 ${tags.length} 个` }}
        <AppIcon :name="expanded ? 'chevronUp' : 'chevronDown'" :size="13" />
      </button>
    </div>
    <div class="tag-list" :class="{ collapsed: !expanded && tags.length > 12 }">
      <button
        v-for="t in visibleTags"
        :key="t.tag"
        class="tag-chip"
        :class="{ active: activeTag === t.tag }"
        @click="emit('toggle-tag', t.tag)"
      >
        {{ t.tag }}
        <span class="tag-count">{{ t.count }}</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const expanded = defineModel('expanded', { type: Boolean, default: false })

defineProps({
  tags: { type: Array, default: () => [] },
  activeTag: { type: String, default: '' },
})

const emit = defineEmits(['toggle-tag'])

const visibleTags = computed(() => (expanded.value ? tags.value : tags.value.slice(0, 12)))
</script>

<style scoped lang="scss">
.tag-cloud {
  margin-bottom: $space-5;
  padding: $space-4 $space-5;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(var(--primary-rgb), 0.024) 100%);
  border: 1px solid var(--border);
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
}

.tag-cloud-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;
}

.tag-cloud-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: $text-sm;
  font-weight: 600;
  color: var(--text-secondary);
}

.tag-cloud-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: $text-xs;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    color: var(--primary);
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  /* 未展开时限制高度，超出渐隐 */
  &.collapsed {
    max-height: 68px;
    overflow: hidden;
    mask-image: linear-gradient(180deg, #000 60%, transparent);
  }
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px $space-3;
  border: 1px solid var(--border);
  border-radius: $radius-full;
  background: var(--bg-warm);
  color: var(--text-secondary);
  font-size: $text-sm;
  font-family: inherit;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: $primary-soft;
  }

  &.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }
}

.tag-count {
  font-size: $text-xs;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
</style>
