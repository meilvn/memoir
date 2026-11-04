import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mediaApi, notesApi } from '@/api'

// Placeholder SVG for broken images
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#F2EDE4"/><text x="200" y="160" text-anchor="middle" fill="#A79E93" font-family="sans-serif" font-size="14">图片加载失败</text></svg>`
export const PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`

export const useMediaStore = defineStore('media', () => {
  const items = ref([])
  const years = ref([])
  const timeline = ref([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchMedia(params = {}) {
    loading.value = true
    try {
      const data = await mediaApi.findAll({ page: 1, limit: 50, ...params })
      items.value = data.items
      total.value = data.total
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchYears() {
    years.value = await mediaApi.getYears()
    return years.value
  }

  async function fetchTimeline() {
    timeline.value = await mediaApi.getTimeline()
    return timeline.value
  }

  async function uploadMedia(file) {
    return mediaApi.upload(file)
  }

  async function removeMedia(id) {
    await mediaApi.remove(id)
    items.value = items.value.filter((m) => m.id !== id)
  }

  function getMediaUrl(path) {
    if (!path) return ''
    return `http://localhost:3000${path}`
  }

  return { items, years, timeline, total, loading, fetchMedia, fetchYears, fetchTimeline, uploadMedia, removeMedia, getMediaUrl }
})
