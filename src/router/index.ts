import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/stock'
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: 'stock',
          name: 'Stock',
          redirect: '/stock/overview',
          meta: { title: 'A股复盘' }
        },
        {
          path: 'stock/overview',
          name: 'StockOverview',
          component: () => import('@/views/stock/MarketOverview.vue'),
          meta: { title: '市场概览' }
        },
        {
          path: 'stock/records',
          name: 'StockRecords',
          component: () => import('@/views/stock/ReviewRecords.vue'),
          meta: { title: '复盘记录' }
        },
        {
          path: 'stock/collection',
          name: 'StockCollection',
          component: () => import('@/views/stock/DataCollection.vue'),
          meta: { title: '数据采集' }
        },
        {
          path: 'stock/analytics',
          name: 'StockAnalytics',
          component: () => import('@/views/stock/Analytics.vue'),
          meta: { title: '统计分析' }
        },
        {
          path: 'stock-old',
          name: 'StockOld',
          component: () => import('@/views/StockView.vue'),
          meta: { title: 'A股复盘（旧版）' }
        },
        {
          path: 'accounting',
          name: 'Accounting',
          component: () => import('@/views/AccountingDashboard.vue'),
          meta: { title: '记账' }
        },
        {
          path: 'tools',
          name: 'Tools',
          redirect: '/tools/index',
          meta: { title: '工具集' }
        },
        {
          path: 'tools/index',
          name: 'ToolsIndex',
          component: () => import('@/views/ToolsIndex.vue'),
          meta: { title: '工具集' }
        },
        {
          path: 'tools/loan-calculator',
          name: 'LoanCalculator',
          component: () => import('@/views/tools/LoanCalculator.vue'),
          meta: { title: '提前还贷计算器' }
        },
        {
          path: 'tools/json',
          name: 'JsonFormatter',
          component: () => import('@/views/tools/JsonFormatter.vue'),
          meta: { title: 'JSON工具' }
        },
        {
          path: 'config',
          name: 'Config',
          component: () => import('@/views/ConfigView.vue'),
          meta: { title: '系统配置' }
        },
        {
          path: 'blog',
          name: 'Blog',
          component: () => import('@/views/BlogView.vue'),
          meta: { title: '博客' }
        },
        {
          path: 'json',
          name: 'Json',
          component: () => import('@/views/JsonView.vue'),
          meta: { title: 'JSON工具' }
        },
        {
          path: 'account',
          name: 'Account',
          component: () => import('@/views/AccountView.vue'),
          meta: { title: '记账（旧版）' }
        }
      ]
    }
  ]
})

export default router
