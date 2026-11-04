<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-for="(d, i) in paths" :key="i">
      <path v-if="typeof d === 'string'" :d="d" />
      <component v-else :is="d" />
    </template>
    <template v-for="(c, i) in circles" :key="`c${i}`">
      <circle v-bind="c" />
    </template>
    <template v-for="(r, i) in rects" :key="`r${i}`">
      <rect v-bind="r" />
    </template>
    <template v-for="(p, i) in polys" :key="`p${i}`">
      <polyline v-bind="p" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
})

// 线性图标库（24x24，stroke 风格，参考 Feather/Lucide 设计语言）
const ICONS = {
  home: { paths: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5', 'M9.5 21v-6h5v6'] },
  image: { rects: [{ x: 3, y: 3, width: 18, height: 18, rx: 2 }], circles: [{ cx: 8.5, cy: 8.5, r: 1.5 }], paths: ['M21 15.5 16 10.5 5 21'] },
  book: { paths: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'] },
  clock: { circles: [{ cx: 12, cy: 12, r: 9 }], paths: ['M12 7v5l3.5 2'] },
  heart: { paths: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'] },
  search: { circles: [{ cx: 11, cy: 11, r: 7 }], paths: ['M21 21l-4.35-4.35'] },
  close: { paths: ['M18 6 6 18', 'M6 6l12 12'] },
  chevronLeft: { paths: ['M15 18l-6-6 6-6'] },
  chevronRight: { paths: ['M9 18l6-6-6-6'] },
  chevronDown: { paths: ['M6 9l6 6 6-6'] },
  chevronUp: { paths: ['M6 15l6-6 6 6'] },
  play: { paths: ['M6 4l14 8-14 8V4z'] },
  pause: { paths: ['M8 5v14', 'M16 5v14'] },
  user: { paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'], circles: [{ cx: 12, cy: 7, r: 4 }] },
  sliders: { paths: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'] },
  upload: { paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'] },
  calendar: { rects: [{ x: 3, y: 4, width: 18, height: 18, rx: 2 }], paths: ['M16 2v4', 'M8 2v4', 'M3 10h18'] },
  star: { paths: ['M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.58l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z'] },
  film: { rects: [{ x: 2.5, y: 3, width: 19, height: 18, rx: 2 }], paths: ['M7 3v18', 'M17 3v18', 'M2.5 9h19', 'M2.5 15h19'] },
  tag: { paths: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z'], circles: [{ cx: 7, cy: 7, r: 1.2 }] },
  chart: { paths: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
  shuffle: { paths: ['M16 3h5v5', 'M4 20 21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'] },
  logout: { paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'] },
  filter: { paths: ['M3 5h18l-7 8v6l-4-2v-4L3 5z'] },
  grid: { rects: [{ x: 3, y: 3, width: 7, height: 7, rx: 1 }, { x: 14, y: 3, width: 7, height: 7, rx: 1 }, { x: 3, y: 14, width: 7, height: 7, rx: 1 }, { x: 14, y: 14, width: 7, height: 7, rx: 1 }] },
  folder: { paths: ['M2 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z', 'M2 10h20'] },
  pin: { paths: ['M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z'], circles: [{ cx: 12, cy: 10, r: 2.5 }] },
  arrowRight: { paths: ['M5 12h14', 'M13 6l6 6-6 6'] },
  arrowLeft: { paths: ['M19 12H5', 'M11 18l-6-6 6-6'] },
  check: { paths: ['M20 6 9 17l-5-5'] },
  plus: { paths: ['M12 5v14', 'M5 12h14'] },
  sparkle: { paths: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z', 'M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z'] },
  download: { paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'] },
  edit: { paths: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'] },
  eye: { paths: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'], circles: [{ cx: 12, cy: 12, r: 3 }] },
  eyeOff: { paths: ['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.88 9.88 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24', 'M1 1l22 22'] },
  copy: { paths: ['M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'] },
  trash: { paths: ['M3 6h18', 'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6'] },
}

const icon = computed(() => ICONS[props.name] || ICONS.image)

const paths = computed(() => icon.value.paths || [])
const circles = computed(() => icon.value.circles || [])
const rects = computed(() => icon.value.rects || [])
const polys = computed(() => icon.value.polys || [])
</script>

<style scoped lang="scss">
.app-icon {
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
