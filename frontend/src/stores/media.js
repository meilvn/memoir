import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mediaApi, notesApi } from '@/api'

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
