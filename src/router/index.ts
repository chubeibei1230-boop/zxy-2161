import { createRouter, createWebHistory } from 'vue-router'
import MainMenu from '@/pages/MainMenu.vue'
import GameBoard from '@/pages/GameBoard.vue'
import Settlement from '@/pages/Settlement.vue'
import Records from '@/pages/Records.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: MainMenu,
  },
  {
    path: '/game/:levelId',
    name: 'game',
    component: GameBoard,
  },
  {
    path: '/settlement/:recordId',
    name: 'settlement',
    component: Settlement,
  },
  {
    path: '/records',
    name: 'records',
    component: Records,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
