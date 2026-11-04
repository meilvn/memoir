import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: '注册', guest: true },
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('@/views/GalleryView.vue'),
    meta: { title: '回忆画廊', requiresAuth: true },
  },
  {
    path: '/gallery/:year/:month/:day',
    name: 'DateMedia',
    component: () => import('@/views/DateMediaView.vue'),
    meta: { title: '日期媒体', requiresAuth: true },
  },
  {
    path: '/media/:id',
    name: 'MediaDetail',
    component: () => import('@/views/MediaDetailView.vue'),
    meta: { title: '媒体详情', requiresAuth: true },
  },
  {
    path: '/stories',
    name: 'Stories',
    component: () => import('@/views/StoriesView.vue'),
    meta: { title: '回忆故事', requiresAuth: true },
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('@/views/TimelineView.vue'),
    meta: { title: '时间线', requiresAuth: true },
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/StatsView.vue'),
    meta: { title: '回忆洞察', requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置', requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/AdminUsersView.vue'),
    meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  document.title = `${to.meta.title || '回忆录'} - 家庭回忆录`
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.token) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && authStore.user?.role !== 'ADMIN') {
    return { name: 'Home' }
  }
  if (to.meta.guest && authStore.token) {
    return { name: 'Home' }
  }
})

export default router
