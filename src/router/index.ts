import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/blog'
    },
    {
      path: '/blog',
      name: 'Blog',
      component: () => import('@/views/BlogView.vue')
    },
    {
      path: '/stock',
      name: 'Stock',
      component: () => import('@/views/StockView.vue')
    },
    {
      path: '/account',
      name: 'Account',
      component: () => import('@/views/AccountView.vue')
    },
    {
      path: '/json',
      name: 'Json',
      component: () => import('@/views/JsonView.vue')
    }
  ]
})

export default router

