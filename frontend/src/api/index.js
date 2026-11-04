import axios from 'axios'

const API_BASE = 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('auth')
  if (auth) {
    const { token } = JSON.parse(auth)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const url = error.config?.url || ''
    // 401 且不是登录/注册接口本身：清掉登录态并跳登录页
    // （覆盖 token 过期、以及本地残留脏 token 的情况）
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('token')
      localStorage.removeItem('auth')
      if (location.pathname !== '/login') {
        location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`
      }
    }
    const msg = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

export const mediaApi = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  findAll: (params) => api.get('/media', { params }),
  getOne: (id) => api.get(`/media/${id}`),
  toggleFavorite: (id) => api.patch(`/media/${id}/favorite`),
  getYears: () => api.get('/media/years'),
  getOnThisDay: () => api.get('/media/on-this-day'),
  getTimeline: () => api.get('/media/timeline'),
  getMonths: (year) => api.get(`/media/months?year=${year}`),
  getDays: (year, month) => api.get(`/media/days?year=${year}&month=${month}`),
  remove: (id) => api.delete(`/media/${id}`),
}

export const notesApi = {
  upsert: (data) => api.post('/notes', data),
  findByMedia: (mediaId) => api.get(`/notes/${mediaId}`),
  findMy: () => api.get('/notes/my'),
  getTags: () => api.get('/notes/tags'),
}

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.post('/users/me/change-password', data),
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  remove: (id) => api.delete(`/users/${id}`),
}
