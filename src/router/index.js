import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import SetupView from '../views/SetupView.vue'
import BoardView from '../views/BoardView.vue'
import ResultsView from '../views/ResultsView.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingView,
    meta: { title: 'Woven Monopoly | Start' },
  },
  {
    path: '/setup',
    name: 'setup',
    component: SetupView,
    meta: { title: 'Woven Monopoly | Setup' },
  },
  {
    path: '/game',
    name: 'board',
    component: BoardView,
    meta: { title: 'Woven Monopoly | Game Board', requiresSession: true },
  },
  {
    path: '/results',
    name: 'results',
    component: ResultsView,
    meta: { title: 'Woven Monopoly | Results', requiresSession: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'landing' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const hasSession = Boolean(localStorage.getItem('woven-monopoly-session'))

  if (to.meta.requiresSession && !hasSession) {
    return { name: 'setup' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title || 'Woven Monopoly'
})

export default router
