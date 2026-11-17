/**
 * router/index.js
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { prepareGuestAccess, requiresRegistration, routeAccess } from '@/lib/routeAccess'
import { requestRegistration } from '@/lib/registrationPrompt'
import CreatePost from '@/pages/CreatePost.vue'
import Feed from '@/pages/Feed.vue'
import Login from '@/pages/Login.vue'
import Profile from '@/pages/Profile.vue'
import Register from '@/pages/Register.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/login',
      component: Login,
    },
    {
      path: '/register',
      component: Register,
    },
    { path: '/buscar', name: 'public-search', props: { publicSearch: true }, component: () => import('@/pages/Assistant.vue') },
    { path: '/asistente', name: 'assistant', component: () => import('@/pages/Assistant.vue') },
    {
      path: '/publicar',
      component: CreatePost,
    },
    {
      path: '/perfil',
      component: Profile,
    },
    {
      path: '/necesidades',
      name: 'needs',
      component: () => import('@/pages/Needs.vue'),
    },
    {
      path: '/necesidades/nueva',
      name: 'need-new',
      component: () => import('@/pages/NeedEditor.vue'),
    },
    {
      path: '/necesidades/:id/editar',
      name: 'need-edit',
      component: () => import('@/pages/NeedEditor.vue'),
    },
    {
      path: '/necesidades/:id',
      name: 'need-detail',
      component: () => import('@/pages/NeedDetail.vue'),
    },
    {
      path: '/perfiles',
      name: 'profile-search',
      component: () => import('@/pages/ProfileSearch.vue'),
    },
    {
      path: '/feed',
      component: Feed,
    },
    {
      path: '/usuario/:id', 
      name: 'user-profile', 
      component: () => import('@/pages/UserProfile.vue'),
    },
    {
      path: '/completar-perfil',
      name: 'complete-profile',
      component: () => import('@/pages/CompleteProfile.vue'),
    },
  ],
})
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (authStore.loading) {
    try { await authStore.init() }
    catch { return to.path === '/' ? true : '/' }
  }

  if (requiresRegistration(authStore, to)) {
    requestRegistration()
    return router.currentRoute.value.matched.length ? false : '/'
  }

  try {
    await prepareGuestAccess(authStore, to)
  } catch {
    return { path: '/login', query: { guest: 'unavailable', next: to.fullPath } }
  }
  return routeAccess(authStore, to)
})

export default router
