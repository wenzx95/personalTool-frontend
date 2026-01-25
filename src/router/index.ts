import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false, hideFromMenu: true }
    },
    {
      path: '/',
      redirect: '/tools/json'
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
          meta: { title: '工具集', requiresAuth: false }
        },
        {
          path: 'tools/index',
          name: 'ToolsIndex',
          component: () => import('@/views/ToolsIndex.vue'),
          meta: { title: '工具集', requiresAuth: false }
        },
        {
          path: 'tools/loan-calculator',
          name: 'LoanCalculator',
          component: () => import('@/views/tools/LoanCalculator.vue'),
          meta: { title: '提前还贷计算器', requiresAuth: false }
        },
        {
          path: 'tools/json',
          name: 'JsonTools',
          component: () => import('@/views/tools/JsonTools.vue'),
          meta: { title: 'JSON工具', requiresAuth: false }
        },
        // 旧路由重定向（向后兼容）
        {
          path: 'tools/json-formatter',
          name: 'JsonFormatter',
          redirect: '/tools/json'
        },
        {
          path: 'tools/json-comparator',
          name: 'JsonComparator',
          redirect: '/tools/json'
        },
        {
          path: 'admin',
          name: 'Admin',
          redirect: '/admin/dashboard',
          meta: { title: '后台管理' },
          children: [
            {
              path: 'dashboard',
              name: 'AdminDashboard',
              component: () => import('@/views/admin/AdminDashboard.vue'),
              meta: { title: '管理首页' }
            },
            {
              path: 'users',
              name: 'UserManagement',
              component: () => import('@/views/admin/UserManagement.vue'),
              meta: { title: '用户管理' }
            },
            {
              path: 'scheduled-tasks',
              name: 'ScheduledTasks',
              component: () => import('@/views/admin/ScheduledTasks.vue'),
              meta: { title: '定时任务管理' }
            },
            {
              path: 'system-logs',
              name: 'SystemLogs',
              component: () => import('@/views/admin/SystemLogs.vue'),
              meta: { title: '日志管理' }
            }
          ]
        },
        {
          path: 'config',
          name: 'Config',
          component: () => import('@/views/ConfigView.vue'),
          meta: { title: '系统配置' }
          // 注意：此页面需要后端 SystemConfigController 支持
          // 如果遇到404错误，请确保后端已部署最新的代码
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
    },
    // 博客系统 - 独立布局
    {
      path: '/blog',
      component: () => import('@/layouts/BlogLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/blog/list'
        },
        {
          path: 'list',
          name: 'BlogList',
          component: () => import('@/views/blog/BlogList.vue'),
          meta: { title: '博客列表', requiresAuth: false }
        },
        {
          path: ':id',
          name: 'BlogDetail',
          component: () => import('@/views/blog/BlogDetail.vue'),
          meta: { title: '博客详情', requiresAuth: false }
        }
      ]
    },
    // 博客管理 - 仍在主布局中
    {
      path: '/admin/blog',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/admin/blog/list'
        },
        {
          path: 'list',
          name: 'BlogManagementList',
          component: () => import('@/views/blog/BlogManagement.vue'),
          meta: { title: '博客管理' }
        },
        {
          path: 'edit',
          name: 'BlogCreate',
          component: () => import('@/views/admin/BlogEdit.vue'),
          meta: { title: '新建博客' }
        },
        {
          path: 'edit/:id',
          name: 'BlogEdit',
          component: () => import('@/views/admin/BlogEdit.vue'),
          meta: { title: '编辑博客' }
        }
      ]
    },
    // 知识库系统 - 独立布局
    {
      path: '/knowledge',
      component: () => import('@/layouts/BlogLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/knowledge/list'
        },
        {
          path: 'list',
          name: 'KnowledgeList',
          component: () => import('@/views/knowledge/KnowledgeList.vue'),
          meta: { title: '知识库', requiresAuth: false }
        },
        {
          path: ':id',
          name: 'KnowledgeView',
          component: () => import('@/views/knowledge/KnowledgeView.vue'),
          meta: { title: '知识库详情', requiresAuth: false }
        }
      ]
    },
    // 知识库管理 - 仍在主布局中
    {
      path: '/admin/knowledge',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/admin/knowledge/list'
        },
        {
          path: 'list',
          name: 'KnowledgeManagement',
          component: () => import('@/views/admin/knowledge/KnowledgeManagement.vue'),
          meta: { title: '知识库管理' }
        },
        {
          path: 'edit',
          name: 'KnowledgeCreate',
          component: () => import('@/views/admin/knowledge/KnowledgeEdit.vue'),
          meta: { title: '创建知识库' }
        },
        {
          path: 'edit/:id',
          name: 'KnowledgeEdit',
          component: () => import('@/views/admin/knowledge/KnowledgeEdit.vue'),
          meta: { title: '编辑知识库' }
        },
        {
          path: ':kbId/chapter/edit',
          name: 'ChapterCreate',
          component: () => import('@/views/admin/knowledge/ChapterEdit.vue'),
          meta: { title: '添加章节' }
        },
        {
          path: ':kbId/chapter/edit/:chapterId',
          name: 'ChapterEdit',
          component: () => import('@/views/admin/knowledge/ChapterEdit.vue'),
          meta: { title: '编辑章节' }
        },
        {
          path: 'import',
          name: 'KnowledgeImport',
          component: () => import('@/views/admin/knowledge/KnowledgeImport.vue'),
          meta: { title: '导入知识库' }
        }
      ]
    }
  ]
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  // Restore session from localStorage before checking auth
  userStore.restoreSession()

  const isLoggedIn = userStore.isLoggedIn

  console.log('[Router Guard] Path:', to.path, 'Logged in:', isLoggedIn)

  // Tools pages are always accessible (no login required)
  if (to.path.startsWith('/tools')) {
    console.log('[Router Guard] Tools page - allowing access')
    next()
    return
  }

  // Blog pages are always accessible (no login required)
  if (to.path.startsWith('/blog')) {
    console.log('[Router Guard] Blog page - allowing access')
    next()
    return
  }

  // Knowledge pages are always accessible (no login required)
  if (to.path.startsWith('/knowledge')) {
    console.log('[Router Guard] Knowledge page - allowing access')
    next()
    return
  }

  // Login page handling
  if (to.path === '/login') {
    if (isLoggedIn) {
      console.log('[Router Guard] Already logged in, redirecting to tools')
      next('/tools/json')
      return
    }
    console.log('[Router Guard] Login page - allowing access')
    next()
    return
  }

  // Other pages require authentication
  if (!isLoggedIn) {
    console.log('[Router Guard] Not logged in, redirecting to login')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  console.log('[Router Guard] Logged in, allowing access to', to.path)
  next()
})

export default router
