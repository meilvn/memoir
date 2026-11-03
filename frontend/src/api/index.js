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
  getYears: () => api.get('/media/years'),
  getTimeline: () => api.get('/media/timeline'),
  getMonths: (year) => api.get(`/media/months?year=${year}`),
  getDays: (year, month) => api.get(`/media/days?year=${year}&month=${month}`),
  remove: (id) => api.delete(`/media/${id}`),
}

export const notesApi = {
  upsert: (data) => api.post('/notes', data),
  findByMedia: (mediaId) => api.get(`/notes/${mediaId}`),
  findMy: () => api.get('/notes/my'),
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
