<template>
  <el-container class="volc-layout">
    <!-- 顶部导航栏 - 48px高度 -->
    <el-header class="volc-navbar" :class="{ 'mobile-navbar': isMobile }">
      <div class="navbar-left">
        <!-- 移动端：汉堡菜单按钮 -->
        <div v-if="isMobile" class="hamburger-btn" @click="mobileDrawerOpen = true">
          <el-icon :size="24"><Menu /></el-icon>
        </div>

        <!-- 桌面端：Logo -->
        <div v-else class="navbar-logo" @click="router.push('/tools/json-formatter')">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
            <rect width="24" height="24" rx="6" fill="#3370ff"/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
          <span v-show="!isMobile" class="logo-text">个人工具集</span>
        </div>

        <!-- 桌面端：分隔线 -->
        <div v-show="!isMobile" class="navbar-divider"></div>

        <!-- 桌面端：面包屑 -->
        <el-breadcrumb v-show="!isMobile" separator="/" class="navbar-breadcrumb">
          <el-breadcrumb-item
            v-for="item in breadcrumbs"
            :key="item.path"
            :to="item.path"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="navbar-right">
        <!-- 桌面端：搜索框 -->
        <el-input
          v-show="!isMobile"
          v-model="searchQuery"
          placeholder="搜索..."
          :prefix-icon="Search"
          class="navbar-search"
          size="small"
          clearable
        />

        <!-- 桌面端：文档链接 -->
        <el-button v-show="!isMobile" link class="navbar-link">
          <el-icon><Document /></el-icon>
          文档
        </el-button>

        <!-- 桌面端：帮助 -->
        <el-button v-show="!isMobile" link class="navbar-link">
          <el-icon><QuestionFilled /></el-icon>
          帮助
        </el-button>

        <!-- 桌面端：分隔线 -->
        <div v-show="!isMobile" class="navbar-divider"></div>

        <!-- 未登录：显示登录按钮 -->
        <el-button
          v-if="!userStore.isLoggedIn"
          type="primary"
          @click="router.push('/login')"
        >
          登录
        </el-button>

        <!-- 已登录：用户下拉菜单 -->
        <el-dropdown v-else v-show="!isMobile" trigger="click" @command="handleUserAction">
          <div class="user-dropdown">
            <el-avatar :size="isMobile ? 32 : 28" :icon="UserFilled" />
            <span v-show="!isMobile" class="user-name">{{ userStore.user?.nickname || '用户' }}</span>
            <el-icon v-show="!isMobile" class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人设置
              </el-dropdown-item>
              <el-dropdown-item command="blog">
                <el-icon><DocumentCopy /></el-icon>
                博客
              </el-dropdown-item>
              <el-dropdown-item divided command="about">
                <el-icon><InfoFilled /></el-icon>
                关于
              </el-dropdown-item>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container" :class="{ 'has-bottom-nav': isMobile }">
      <!-- 移动端：底部Tab导航 -->
      <div v-if="isMobile" class="mobile-bottom-nav">
        <div
          v-for="tab in mobileTabs"
          :key="tab.key"
          :class="['bottom-nav-item', { active: isActive(tab.key), 'back-btn': tab.isBack }]"
          @click="handleNavClick(tab.key)"
        >
          <el-icon>
            <component :is="tab.icon" />
          </el-icon>
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>

      <!-- 桌面端：左侧菜单栏 -->
      <el-aside
        v-show="!isMobile"
        class="volc-sidebar"
        :class="{ collapsed: appStore.sidebarCollapsed }"
        :width="sidebarWidth"
      >
        <!-- 菜单内容 -->
        <nav class="sidebar-nav">
          <div
            v-for="section in filteredMenuSections"
            :key="section.items[0]?.key || section.title"
            class="menu-section"
          >
            <div
              v-for="item in section.items"
              :key="item.key"
            >
              <!-- 父级菜单项 -->
              <el-tooltip
                v-if="item.children && item.children.length > 0"
                :content="item.label"
                placement="right"
                :disabled="!appStore.sidebarCollapsed"
                :show-after="500"
              >
                <div
                  :class="['menu-item', 'menu-item-parent', {
                    active: isParentActive(item),
                    expanded: expandedMenus.includes(item.key)
                  }]"
                  @click="toggleSubmenu(item.key)"
                >
                  <component :is="item.icon" class="menu-icon" />
                  <span v-show="!appStore.sidebarCollapsed" class="menu-text">{{ item.label }}</span>
                  <el-icon v-show="!appStore.sidebarCollapsed" class="submenu-arrow">
                    <ArrowRight />
                  </el-icon>
                </div>
              </el-tooltip>

              <!-- 简单菜单项 -->
              <el-tooltip
                v-else
                :content="item.label"
                placement="right"
                :disabled="!appStore.sidebarCollapsed"
                :show-after="500"
              >
                <div
                  :class="['menu-item', { active: isActive(item.key) }]"
                  @click="handleNavClick(item.key)"
                >
                  <component :is="item.icon" class="menu-icon" />
                  <span v-show="!appStore.sidebarCollapsed" class="menu-text">{{ item.label }}</span>
                  <el-badge v-if="item.badge" :value="item.badge" class="menu-badge" />
                </div>
              </el-tooltip>

              <!-- 子菜单 -->
              <transition name="submenu">
                <div
                  v-if="item.children && item.children.length > 0"
                  v-show="expandedMenus.includes(item.key)"
                  class="submenu"
                >
                  <div
                    v-for="child in item.children"
                    :key="child.key"
                    :class="['menu-item', 'menu-item-child', { active: isActive(child.key) }]"
                    @click="handleNavClick(child.key)"
                  >
                    <component :is="child.icon" class="menu-icon" />
                    <span v-show="!appStore.sidebarCollapsed" class="menu-text">{{ child.label }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </nav>

        <!-- 折叠按钮 -->
        <div class="sidebar-footer">
          <div class="collapse-btn" @click="toggleSidebar">
            <el-icon :size="14">
              <component :is="appStore.sidebarCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
            <span v-show="!appStore.sidebarCollapsed" class="collapse-text">
              {{ appStore.sidebarCollapsed ? '' : '收起' }}
            </span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="volc-main">
        <router-view v-slot="{ Component }">
          <component
            :is="Component"
            :key="route.fullPath"
          />
        </router-view>
      </el-main>
    </el-container>

    <!-- 备案号底部显示 -->
    <footer class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">浙ICP备2026004908号</a>
    </footer>

    <!-- 关于对话框 -->
    <el-dialog
      v-model="aboutDialogVisible"
      title="关于"
      width="500px"
      :close-on-click-modal="true"
    >
      <div class="about-content">
        <div class="about-header">
          <el-icon :size="48" color="#3370ff"><InfoFilled /></el-icon>
          <h2>个人工具集</h2>
          <p class="about-description">A股复盘、记账系统、博客等个人工具集</p>
        </div>

        <el-divider />

        <div class="version-info-list">
          <div class="version-item">
            <span class="version-label">前端版本：</span>
            <span class="version-value">{{ frontendVersion }}</span>
          </div>
          <div class="version-item">
            <span class="version-label">后端版本：</span>
            <span class="version-value">{{ backendVersion || '构建信息文件缺失' }}</span>
          </div>
        </div>

        <el-divider />

        <div class="copyright-info">
          <p class="copyright-text">© {{ currentYear }} 个人工具集. All rights reserved.</p>
          <p class="icp-info">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">浙ICP备2026004908号</a>
          </p>
          <p class="footer-links">
            <el-link type="primary" @click="handleFooterLink('about')">关于</el-link>
            <span class="divider">|</span>
            <el-link type="primary" @click="handleFooterLink('privacy')">隐私</el-link>
            <span class="divider">|</span>
            <el-link type="primary" @click="handleFooterLink('contact')">联系</el-link>
          </p>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="aboutDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 移动端抽屉菜单 -->
    <teleport to="body">
      <transition name="drawer">
        <div v-if="mobileDrawerOpen" class="mobile-drawer-overlay" @click="mobileDrawerOpen = false">
          <div class="mobile-drawer" @click.stop>
            <!-- 抽屉头部：用户信息 -->
            <div class="drawer-header">
              <div class="user-info" v-if="userStore.isLoggedIn">
                <el-avatar :size="48" :icon="UserFilled" />
                <div class="user-details">
                  <div class="user-name">{{ userStore.user?.nickname || '用户' }}</div>
                  <div class="user-account">{{ userStore.user?.username || '' }}</div>
                </div>
              </div>
              <div class="user-info" v-else @click="goToLogin">
                <el-avatar :size="48" :icon="UserFilled" />
                <div class="user-details">
                  <div class="user-name">点击登录</div>
                  <div class="user-account">登录后使用更多功能</div>
                </div>
              </div>
              <el-icon class="close-btn" @click="mobileDrawerOpen = false">
                <Close />
              </el-icon>
            </div>

            <!-- 抽屉菜单项 -->
            <div class="drawer-menu">
              <div
                v-for="item in drawerMenuItems"
                :key="item.key"
                class="drawer-menu-item"
                @click="handleDrawerMenuClick(item)"
              >
                <el-icon :size="20">
                  <component :is="item.icon" />
                </el-icon>
                <span class="menu-label">{{ item.label }}</span>
              </div>
            </div>

            <!-- 抽屉底部 -->
            <div class="drawer-footer">
              <div class="footer-item" @click="router.push('/profile'); mobileDrawerOpen = false">
                <el-icon :size="20"><Setting /></el-icon>
                <span>设置</span>
              </div>
              <div v-if="userStore.isLoggedIn" class="footer-item danger" @click="handleLogout">
                <el-icon :size="20"><SwitchButton /></el-icon>
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  QuestionFilled,
  Document,
  DocumentCopy,
  UserFilled,
  User,
  ArrowDown,
  ArrowLeft,
  SwitchButton,
  Fold,
  Expand,
  TrendCharts,
  Money,
  Tools,
  Management,
  ArrowRight,
  Calendar,
  List,
  Download,
  DataAnalysis,
  Notebook,
  Reading,
  Menu,
  InfoFilled,
  Setting,
  Close
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { APP_VERSION } from '@/version'
import request from '@/api/request'
import { getUserMenus } from '@/api/menu'
import { detectDeviceType } from '@/utils/deviceType'
import { useSwipeBack } from '@/composables/useSwipeBack'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 移动端检测
const isMobile = ref(false)
const mobileMenuOpen = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    mobileMenuOpen.value = false
  }
}

// 组件初始化时立即检测，确保首次渲染正确
checkMobile()

// 启用移动端左滑返回手势
useSwipeBack()

// 移动端抽屉菜单状态
const mobileDrawerOpen = ref(false)

// 抽屉菜单项配置
const drawerMenuItems = computed(() => {
  const items = [
    { key: 'tools/json-formatter', label: '工具', icon: markRaw(Tools) },
    { key: 'blog/list', label: '博客', icon: markRaw(DocumentCopy) },
    { key: 'knowledge/list', label: '知识库', icon: markRaw(Notebook) }
  ]

  // 所有抽屉菜单项都无需登录即可访问
  return items
})

// 处理抽屉菜单点击
const handleDrawerMenuClick = (item: any) => {
  // 跳转到对应页面（所有抽屉菜单项都无需登录）
  mobileDrawerOpen.value = false
  router.push(`/${item.key}`)
}

// 跳转到登录页
const goToLogin = () => {
  mobileDrawerOpen.value = false
  router.push('/login')
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    mobileDrawerOpen.value = false
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // User cancelled
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

// 移动端底部Tab配置（动态切换）
const mobileTabs = computed(() => {
  const currentPath = route.path

  // 检查是否需要显示主导航（通过 query 参数）
  const showMainNav = route.query['show-main-nav'] === 'true'

  // 如果标记为显示主导航，或者路径是根路径，显示主导航
  if (showMainNav || currentPath === '/') {
    const tabs = []

    if (userStore.isLoggedIn) {
      // 已登录用户显示：股票、记账、我的
      tabs.push(
        { key: 'stock/overview', label: '股票', icon: markRaw(TrendCharts) },
        { key: 'accounting', label: '记账', icon: markRaw(Money) },
        { key: 'profile', label: '我的', icon: markRaw(User) }
      )
    } else {
      // 未登录用户只显示：我的
      tabs.push(
        { key: 'profile', label: '我的', icon: markRaw(User) }
      )
    }

    return tabs
  }

  // 股票模块：显示子功能 + 返回
  if (currentPath.startsWith('/stock')) {
    return [
      { key: 'stock/overview', label: '概览', icon: markRaw(Calendar) },
      { key: 'stock/records', label: '记录', icon: markRaw(List) },
      { key: 'stock/collection', label: '采集', icon: markRaw(Download) },
      { key: 'stock/analytics', label: '统计', icon: markRaw(DataAnalysis) },
      { key: 'back', label: '返回', icon: markRaw(ArrowLeft), isBack: true }
    ]
  }

  // 博客模块：显示子功能 + 返回
  if (currentPath.startsWith('/blog')) {
    return [
      { key: 'blog/list', label: '列表', icon: markRaw(List) },
      { key: 'back', label: '返回', icon: markRaw(ArrowLeft), isBack: true }
    ]
  }

  // 知识库模块：显示子功能 + 返回
  if (currentPath.startsWith('/knowledge')) {
    return [
      { key: 'knowledge/list', label: '列表', icon: markRaw(List) },
      { key: 'back', label: '返回', icon: markRaw(ArrowLeft), isBack: true }
    ]
  }

  // 工具模块：显示子功能 + 返回
  if (currentPath.startsWith('/tools')) {
    const tabs = [
      { key: 'tools/json-formatter', label: '格式化', icon: markRaw(Document) },
      { key: 'tools/json-comparator', label: '比对', icon: markRaw(DataAnalysis) }
    ]

    // 还贷计算器只在网页端显示
    if (!isMobile.value) {
      tabs.push(
        { key: 'tools/loan-calculator', label: '还贷计算', icon: markRaw(Management) }
      )
    }

    tabs.push(
      { key: 'back', label: '返回', icon: markRaw(ArrowLeft), isBack: true }
    )

    return tabs
  }

  // 默认：主Tab
  const tabs = [
    { key: 'tools/json-formatter', label: '工具', icon: markRaw(Tools) }
  ]

  if (userStore.isLoggedIn) {
    tabs.push(
      { key: 'stock/overview', label: '股票', icon: markRaw(TrendCharts) },
      { key: 'accounting', label: '记账', icon: markRaw(Money) },
      { key: 'blog/list', label: '博客', icon: markRaw(DocumentCopy) }
    )
  } else {
    // 未登录用户也能看到"我的"，方便登录
    tabs.push(
      { key: 'profile', label: '我的', icon: markRaw(User) }
    )
  }

  return tabs
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 版本信息
const frontendVersion = ref(`${APP_VERSION.buildDate} ${APP_VERSION.buildTimeShort}`)
const backendVersion = ref('')

// 当前年份
const currentYear = new Date().getFullYear()

// 关于对话框状态
const aboutDialogVisible = ref(false)

// 处理页脚链接点击
const handleFooterLink = (type: string) => {
  switch (type) {
    case 'about':
      // 已经在关于对话框中，无需操作
      ElMessage.info('已经在关于页面了')
      break
    case 'privacy':
      ElMessage.info('隐私政策开发中')
      break
    case 'contact':
      ElMessage.info('联系方式开发中')
      break
  }
}

const fetchBackendVersion = async () => {
  try {
    const versionData: any = await request.get('/version')
    backendVersion.value = versionData.buildTime || '未知'
  } catch (error) {
    console.error('获取后端版本失败:', error)
  }
}

fetchBackendVersion()

// 状态管理
const appStore = useAppStore()

// 侧边栏状态（使用全局store）
const searchQuery = ref('')
const expandedMenus = ref<string[]>(['stock', 'tools'])

const sidebarWidth = computed(() => appStore.sidebarCollapsed ? '48px' : '200px')

interface MenuItem {
  key: string
  label: string
  icon: any
  badge?: number
  deviceType?: string
  children?: MenuItem[]
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections = ref<MenuSection[]>([
  {
    title: '内容管理',
    items: [
      {
        key: 'blog',
        label: '博客',
        icon: markRaw(DocumentCopy),
        deviceType: 'all',
        children: [
          { key: 'blog/list', label: '博客列表', icon: markRaw(List), deviceType: 'all' }
        ]
      },
      {
        key: 'knowledge',
        label: '知识库',
        icon: markRaw(Notebook),
        deviceType: 'all',
        children: [
          { key: 'knowledge/list', label: '知识库列表', icon: markRaw(Reading), deviceType: 'all' }
        ]
      }
    ]
  },
  {
    title: '主要功能',
    items: [
      {
        key: 'stock',
        label: 'A股复盘',
        icon: markRaw(TrendCharts),
        deviceType: 'all',
        children: [
          { key: 'stock/overview', label: '市场概览', icon: markRaw(Calendar), deviceType: 'all' },
          { key: 'stock/records', label: '复盘记录', icon: markRaw(List), deviceType: 'all' },
          { key: 'stock/collection', label: '数据采集', icon: markRaw(Download), deviceType: 'all' },
          { key: 'stock/analytics', label: '统计分析', icon: markRaw(DataAnalysis), deviceType: 'all' }
        ]
      },
      { key: 'accounting', label: '记账', icon: markRaw(Money), deviceType: 'all' },
      {
        key: 'tools',
        label: '工具集',
        icon: markRaw(Tools),
        deviceType: 'all',
        children: [
          { key: 'tools/json-formatter', label: 'JSON格式化', icon: markRaw(Document), deviceType: 'all' },
          { key: 'tools/json-comparator', label: 'JSON比对', icon: markRaw(DataAnalysis), deviceType: 'all' },
          { key: 'tools/loan-calculator', label: '还贷计算器', icon: markRaw(Management), deviceType: 'web' }
        ]
      }
    ]
  },
  {
    title: '管理',
    items: [
      {
        key: 'admin',
        label: '后台管理',
        icon: markRaw(Management),
        deviceType: 'all',
        children: [
          { key: 'admin/dashboard', label: '管理首页', icon: markRaw(DataAnalysis), deviceType: 'all' },
          { key: 'admin/users', label: '用户管理', icon: markRaw(User), deviceType: 'all' },
          { key: 'admin/blog', label: '博客管理', icon: markRaw(DocumentCopy), deviceType: 'all' },
          { key: 'admin/knowledge', label: '知识库管理', icon: markRaw(Notebook), deviceType: 'all' },
          { key: 'admin/scheduled-tasks', label: '定时任务', icon: markRaw(TrendCharts), deviceType: 'all' },
          { key: 'admin/system-logs', label: '日志管理', icon: markRaw(Document), deviceType: 'all' }
        ]
      },
      { key: 'config', label: '系统配置', icon: markRaw(TrendCharts), deviceType: 'all' }
    ]
  }
])

// 获取动态菜单（从后端根据设备类型获取）
const fetchDynamicMenus = async () => {
  if (!userStore.isLoggedIn) {
    return
  }

  try {
    // 自动识别设备类型并获取对应菜单
    const deviceType = detectDeviceType()
    const menus = await getUserMenus(deviceType)

    // 调试：查看后端返回的原始数据
    console.log('后端返回的菜单数据:', JSON.stringify(menus, null, 2))

    // 将后端返回的菜单转换为MenuItem格式
    const transformedMenus = transformToMenuItems(menus)

    // 调试：查看转换后的菜单数据
    console.log('转换后的菜单数据:', JSON.stringify(transformedMenus, null, 2))

    // 更新menuSections（如果后端返回了菜单，则使用动态菜单）
    if (transformedMenus.length > 0) {
      menuSections.value = transformedMenus
      console.log('已加载动态菜单，设备类型:', deviceType)
    }
  } catch (error) {
    console.warn('获取动态菜单失败，使用降级方案（硬编码菜单）', error)
    // 降级：使用硬编码菜单，不更新menuSections
  }
}

// 根据菜单key获取对应图标
const getMenuIcon = (key: string): any => {
  // 移除可能存在的前导斜杠
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key

  const iconMap: Record<string, any> = {
    // A股复盘相关
    'stock': TrendCharts,
    'stock/overview': Calendar,
    'stock/records': List,
    'stock/collection': Download,
    'stock/analytics': DataAnalysis,

    // 记账
    'accounting': Money,

    // 工具集
    'tools': Tools,
    'tools/loan-calculator': Management,
    'tools/json-formatter': Document,
    'tools/json-comparator': DataAnalysis,

    // 博客
    'blog': DocumentCopy,
    'blog/list': List,

    // 知识库
    'knowledge': Notebook,
    'knowledge/list': Reading,

    // 后台管理
    'admin': Management,
    'admin/dashboard': DataAnalysis,
    'admin/users': User,
    'admin/blog': DocumentCopy,
    'admin/knowledge': Notebook,
    'admin/scheduled-tasks': TrendCharts,
    'admin/system-logs': Document,

    // 系统配置
    'config': TrendCharts
  }

  return markRaw(iconMap[normalizedKey] || Document)
}

// 将后端菜单格式转换为前端MenuItem格式
const transformToMenuItems = (menus: any[]): MenuSection[] => {
  if (!menus || menus.length === 0) {
    return []
  }

  const sections: MenuSection[] = []
  const rootMenus = menus.filter(m => m.parentId === 0)

  rootMenus.forEach(rootMenu => {
    const rootKey = rootMenu.path ? rootMenu.path.slice(1) : `menu-${rootMenu.id}` // 移除前导斜杠

    // 如果有子菜单，创建父菜单项（带children）
    if (rootMenu.children && rootMenu.children.length > 0) {
      const childMenuItems: MenuItem[] = []
      rootMenu.children.forEach((child: any) => {
        const childKey = child.path ? child.path.slice(1) : `menu-${child.id}` // 移除前导斜杠
        childMenuItems.push({
          key: childKey,
          label: child.name,
          icon: getMenuIcon(childKey),
          deviceType: child.deviceType || 'all', // 保留设备类型
          children: transformChildren(child.children)
        })
      })

      // 创建父菜单项，包含children
      sections.push({
        title: rootMenu.name,
        items: [{
          key: rootKey,
          label: rootMenu.name,
          icon: getMenuIcon(rootKey),
          deviceType: rootMenu.deviceType || 'all', // 保留设备类型
          children: childMenuItems
        }]
      })
    } else {
      // 如果没有子菜单，直接作为菜单项
      sections.push({
        title: rootMenu.name,
        items: [{
          key: rootKey,
          label: rootMenu.name,
          icon: getMenuIcon(rootKey),
          deviceType: rootMenu.deviceType || 'all' // 保留设备类型
        }]
      })
    }
  })

  return sections
}

// 递归转换子菜单
const transformChildren = (children: any[]): MenuItem[] => {
  if (!children || children.length === 0) {
    return []
  }

  return children.map(child => {
    const key = child.path || `menu-${child.id}`
    return {
      key: key,
      label: child.name,
      icon: getMenuIcon(key),
      deviceType: child.deviceType || 'all', // 保留设备类型
      children: transformChildren(child.children)
    }
  })
}

// 在用户登录后加载动态菜单
// 暂时禁用：后端菜单数据未更新，使用前端静态菜单
// TODO: 后续更新后端数据库菜单后重新启用
// watch(() => userStore.isLoggedIn, (isLoggedIn) => {
//   if (isLoggedIn) {
//     fetchDynamicMenus()
//   }
// }, { immediate: true })

// 根据登录状态和设备类型过滤菜单
const filteredMenuSections = computed(() => {
  const currentDeviceType = detectDeviceType()

  return menuSections.value
    .map(section => {
      // 过滤并映射菜单项（创建新对象，不修改原始数据）
      const filteredItems = section.items
        .map(item => {
          // 创建 item 的副本
          const newItem = { ...item }

          // 未登录用户只能看到工具
          if (!userStore.isLoggedIn) {
            if (newItem.key !== 'tools' && !newItem.key.startsWith('tools/')) {
              return null
            }
          }

          // 已登录用户：根据设备类型过滤
          if (newItem.deviceType && newItem.deviceType !== 'all') {
            // 检查设备类型是否匹配
            if (newItem.deviceType === 'web' && currentDeviceType !== 'web') {
              return null // 只在网页端显示，但当前不是网页端
            }
            if (newItem.deviceType === 'mobile' && currentDeviceType === 'web') {
              return null // 只在移动端显示，但当前是网页端
            }
          }

          // 过滤子菜单（创建新数组，不修改原始数据）
          if (newItem.children && newItem.children.length > 0) {
            newItem.children = newItem.children.filter(child => {
              if (child.deviceType && child.deviceType !== 'all') {
                if (child.deviceType === 'web' && currentDeviceType !== 'web') {
                  return false
                }
                if (child.deviceType === 'mobile' && currentDeviceType === 'web') {
                  return false
                }
              }
              return true
            })
          }

          return newItem
        })
        .filter(item => item !== null) as MenuItem[]

      return {
        ...section,
        items: filteredItems
      }
    })
    .filter(section => section.items.length > 0)
})

interface BreadcrumbItem {
  path: string
  title: string
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title as string
  })).filter(item => !(route.path.startsWith('/tools/json') && item.title === 'JSON格式化'))
})

const isActive = (key: string) => {
  return route.path.startsWith(`/${key}`)
}

const isParentActive = (item: MenuItem) => {
  if (!item.children) return false
  return item.children.some(child => route.path.startsWith(`/${child.key}`))
}

const toggleSubmenu = (key: string) => {
  if (appStore.sidebarCollapsed) {
    appStore.setSidebarCollapsed(false)
    if (!expandedMenus.value.includes(key)) {
      expandedMenus.value.push(key)
    }
    return
  }

  const index = expandedMenus.value.indexOf(key)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(key)
  }
}

const handleNavClick = (key: string) => {
  // 规范化路径：确保只有一个前导斜杠，移除多余斜杠
  const normalizedKey = key.replace(/^\/+/, '') // 移除所有前导斜杠
  const targetPath = `/${normalizedKey}`

  // 如果已经在目标路径，不重复导航
  if (route.path === targetPath) {
    return
  }

  // 处理"我的"选项 - 跳转到个人中心页面
  if (key === 'profile') {
    router.push('/profile')
    return
  }

  // 处理返回按钮
  if (key === 'back') {
    const currentPath = route.path

    // 判断当前是否在某个模块的入口页面
    // 如果是模块入口，则显示主导航
    const mainPaths = ['/tools/json-formatter', '/stock/overview', '/accounting', '/blog/list', '/knowledge/list']

    if (mainPaths.includes(currentPath)) {
      // 已经在模块入口页面，需要显示主导航
      // 直接跳转到根路径并带上 query 参数
      router.push('/?show-main-nav=true')
      return
    }

    // 不在模块入口，返回到该模块的入口（不带主导航标记）
    // 这样用户可以看到模块的子导航，如果需要可以再次点击返回
    // 股票模块
    if (currentPath.startsWith('/stock') && currentPath !== '/stock/overview') {
      router.push('/stock/overview')
    }
    // 博客模块
    else if (currentPath.startsWith('/blog') && currentPath !== '/blog/list') {
      router.push('/blog/list')
    }
    // 知识库模块
    else if (currentPath.startsWith('/knowledge') && currentPath !== '/knowledge/list') {
      router.push('/knowledge/list')
    }
    // 工具模块
    else if (currentPath.startsWith('/tools') && currentPath !== '/tools/json-formatter') {
      router.push('/tools/json-formatter')
    }
    // 记账模块
    else if (currentPath === '/accounting') {
      router.push('/?show-main-nav=true')
    }
    // 其他情况，使用历史后退
    else {
      router.back()
    }
    return
  }

  // 使用已经计算好的路径进行导航
  router.push(targetPath)
}

const toggleSidebar = () => {
  if (isMobile.value) {
    // 移动端：切换菜单显示状态
    mobileMenuOpen.value = !mobileMenuOpen.value
  } else {
    // 桌面端：折叠/展开侧边栏
    appStore.setSidebarCollapsed(!appStore.sidebarCollapsed)
    if (appStore.sidebarCollapsed) {
      expandedMenus.value = []
    }
  }
}

const handleUserAction = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'blog':
      router.push('/blog/list')
      break
    case 'about':
      aboutDialogVisible.value = true
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // User cancelled
      }
      break
  }
}
</script>

<style scoped lang="scss">
.volc-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 - 48px */
.volc-navbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  z-index: 999;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f7f8fa;
  }
}

.logo-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
}

.navbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  flex-shrink: 0;
}

.navbar-breadcrumb {
  font-size: 14px;

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: #4e5969;
      font-weight: 400;
    }

    &:last-child .el-breadcrumb__inner {
      color: #1d2129;
    }
  }
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-search {
  width: 200px;

  :deep(.el-input__wrapper) {
    border-radius: 4px;
  }
}

.navbar-link {
  color: #4e5969;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #1d2129;
    background: #f7f8fa;
  }

  .el-icon {
    margin-right: 4px;
  }
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f7f8fa;
  }
}

.user-name {
  font-size: 14px;
  font-weight: 400;
  color: #1d2129;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #4e5969;
}

/* 主容器 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧菜单栏 */
.volc-sidebar {
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c9cdd4;
    border-radius: 2px;

    &:hover {
      background: #b0b6c0;
    }
  }
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  padding: 8px 0;
}

.menu-section {
  margin-bottom: 8px;
}

.menu-section-title {
  font-size: 12px;
  font-weight: 500;
  color: #86909c;
  padding: 8px 16px 4px;
  text-transform: none;
  letter-spacing: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  margin: 0 8px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4e5969;
  position: relative;
  user-select: none;

  &:hover {
    background: #f7f8fa;
    color: #1d2129;
  }

  &.active {
    background: #e8f3ff;
    color: #3370ff;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 16px;
      background: #3370ff;
      border-radius: 0 2px 2px 0;
    }
  }
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  font-size: 18px;
  color: #4e5969;
}

.menu-text {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
}

.menu-badge {
  margin-left: auto;
}

/* 父级菜单项 */
.menu-item-parent {
  .menu-text {
    font-weight: 600;
    color: #1d2129;
  }

  .submenu-arrow {
    margin-left: auto;
    transition: transform 0.2s;
    font-size: 12px;
    color: #4e5969;
  }

  &.expanded .submenu-arrow {
    transform: rotate(90deg);
  }
}

/* 子菜单 */
.submenu {
  margin-left: 28px;
  overflow: hidden;
  transition: all 0.2s ease;
  padding-top: 4px;
  padding-bottom: 4px;
}

.menu-item-child {
  padding: 0 16px 0 0;
  font-size: 14px;
  color: #4e5969;

  &::before {
    display: none;
  }

  &:hover {
    background: #f7f8fa;
    color: #1d2129;
  }

  &.active {
    background: #e8f3ff;
    color: #3370ff;

    &::before {
      display: block;
      left: 24px;
    }
  }
}

/* 底部折叠按钮 */
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 6px;
  color: #4e5969;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 13px;

  &:hover {
    background: #f7f8fa;
    color: #1d2129;
  }
}

.collapse-text {
  font-size: 13px;
}

/* 收起状态样式 */
.volc-sidebar.collapsed {
  width: 48px !important;

  .menu-section-title {
    display: none;
  }

  .menu-text,
  .menu-badge,
  .submenu-arrow,
  .collapse-text {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding: 0;
  }

  .menu-item-child {
    padding: 0;
    justify-content: center;
  }

  // 悬浮菜单 - 仅在hover父菜单时显示
  .menu-item-parent {
    .submenu {
      position: fixed;
      left: 48px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 4px 0;
      min-width: 140px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s;

      .menu-item {
        padding: 0 16px;
        justify-content: flex-start;
      }
    }

    &:hover .submenu {
      opacity: 1;
      visibility: visible;
    }
  }
}

/* 主内容区 */
.volc-main {
  background: #f7f8fa;
  overflow-y: auto;
  padding: 16px;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c9cdd4;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #9daec2;
  }
}

// 关于对话框样式
.about-content {
  text-align: center;
  padding: 20px 0;

  .about-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    h2 {
      margin: 8px 0 4px;
      font-size: 24px;
      font-weight: 600;
      color: #1d2129;
    }

    .about-description {
      margin: 0;
      font-size: 14px;
      color: #86909c;
    }
  }

  .version-info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 20px;

    .version-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f7f8fa;
      border-radius: 8px;

      .version-label {
        font-size: 14px;
        color: #4e5969;
        font-weight: 500;
      }

      .version-value {
        font-size: 14px;
        color: #1d2129;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      }
    }
  }

  .copyright-info {
    padding: 16px 20px 0;

    .copyright-text {
      margin: 0 0 8px;
      font-size: 14px;
      color: #86909c;
    }

    .icp-info {
      margin: 0 0 12px;
      font-size: 13px;
      color: #86909c;

      a {
        color: #86909c;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
          color: #3370ff;
        }
      }
    }

    .footer-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .divider {
        color: #c9cdd4;
      }

      :deep(.el-link) {
        font-size: 14px;
      }
    }
  }
}

// 个人中心对话框样式
.profile-content {
  .user-info-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #f7f8fa;
    border-radius: 12px;

    .user-details {
      flex: 1;

      .user-name {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 600;
        color: #1d2129;
      }

      .user-account {
        margin: 0;
        font-size: 14px;
        color: #86909c;
      }
    }
  }

  .profile-menu-list {
    padding: 8px 0;

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 15px;
      color: #1d2129;

      &:hover {
        background: #f7f8fa;
      }

      &:active {
        background: #e5e7eb;
      }

      &.danger {
        color: #f56565;

        &:hover {
          background: #fff5f5;
        }

        &:active {
          background: #fed7d7;
        }
      }

      .arrow-icon {
        margin-left: auto;
        color: #c9cdd4;
      }
    }
  }
}

/* 备案号底部 */
.icp-footer {
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  padding: 16px 0;
  text-align: center;
  font-size: 13px;
  color: #86909c;
  flex-shrink: 0;

  a {
    color: #86909c;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #3370ff;
    }
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .icp-footer {
    padding: 12px 0;
    font-size: 12px;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* 移动端底部Tab导航 */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  padding-bottom: calc(0px + var(--safe-area-inset-bottom, 0px));
  z-index: 999;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  min-height: 50px;
  cursor: pointer;
  transition: all 0.2s;
  color: #909399;

  .el-icon {
    font-size: 22px;
    margin-bottom: 2px;
  }

  .tab-label {
    font-size: 11px;
    font-weight: 500;
  }

  &.active {
    color: #3370ff;

    .tab-label {
      font-weight: 600;
    }
  }

  &:hover {
    background: #f7f8fa;
  }

  /* 返回按钮特殊样式 */
  &.back-btn {
    color: #909399;
    background: #f5f7fa;

    .tab-label {
      color: #606266;
    }

    &:active {
      background: #e4e7ed;
    }
  }
}

/* 主内容区添加底部内边距（为底部导航留空间） */
.main-container.has-bottom-nav {
  .volc-main {
    padding-bottom: calc(66px + var(--safe-area-inset-bottom, 0px));
  }
}

/* 移动端顶部导航栏优化 - 原生App风格 */
.mobile-navbar {
  padding: 0 16px;

  .navbar-left {
    gap: 12px;
  }

  .navbar-right {
    gap: 8px;
  }

  .navbar-logo {
    padding: 4px;
  }
}

/* 移动端导航栏优化 */
@media (max-width: 768px) {
  .volc-sidebar {
    display: none;
  }

  .navbar-search {
    display: none;
  }

  .navbar-link {
    display: none;
  }

  .user-name {
    display: none;
  }

  .volc-main {
    padding: 16px;
  }

  .logo-text {
    display: none;
  }

  /* 顶部导航栏移动端优化 */
  .volc-navbar {
    height: 56px;
    padding: 0 16px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);

    .navbar-logo {
      font-size: 18px;
      font-weight: 600;
    }
  }

  /* 用户头像移动端优化 */
  .user-dropdown {
    padding: 6px 12px;
    border-radius: 20px;

    .el-avatar {
      width: 32px !important;
      height: 32px !important;
    }
  }

  /* 登录按钮移动端优化 */
  .el-button {
    height: 36px;
    padding: 0 16px;
    font-size: 15px;
  }
}

/* 原生App风格移动端优化（430px及以下） */
@media (max-width: 430px) {
  /* 顶部导航栏优化 - 原生导航栏高度56px */
  .volc-navbar {
    height: 56px;
    padding: 0 16px;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  }

  /* 底部导航栏优化 - iOS Tab Bar风格 */
  .mobile-bottom-nav {
    height: calc(56px + var(--safe-area-inset-bottom, 0px));
    padding-top: 8px;
    padding-bottom: calc(8px + var(--safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 0.5px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.04);
  }

  .bottom-nav-item {
    padding: 6px 0;
    min-height: 40px;

    .el-icon {
      font-size: 24px;
      margin-bottom: 3px;
      transition: transform 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
    }

    .tab-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: -0.2px;
    }

    &.active {
      .el-icon {
        transform: scale(1.1);
      }
    }

    &:active {
      .el-icon {
        transform: scale(0.95);
      }
    }

    /* 返回按钮特殊优化 */
    &.back-btn {
      background: none;

      .el-icon {
        transform: none;
      }

      &:active {
        .el-icon {
          transform: scale(0.9);
        }
      }
    }
  }

  /* 主内容区域底部内边距优化 */
  .main-container.has-bottom-nav {
    .volc-main {
      padding-bottom: calc(72px + var(--safe-area-inset-bottom, 0px));
    }
  }

  /* 移动端遮罩层优化 */
  .mobile-overlay {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
  }
}

/* Standalone模式特有样式 - PWA优化 */
html.standalone-mode {
  @media (max-width: 430px) {
    /* 顶部导航栏适配安全区域 - 刘海屏适配 */
    .volc-navbar {
      padding-top: calc(12px + var(--safe-area-inset-top, 0px));
      height: calc(56px + var(--safe-area-inset-top, 0px));
    }

    /* 侧边栏适配安全区域 */
    .volc-sidebar {
      top: calc(56px + var(--safe-area-inset-top, 0px));
      bottom: calc(0px + var(--safe-area-inset-bottom, 0px));
    }

    /* 移动端遮罩层适配安全区域 */
    .mobile-overlay {
      top: calc(56px + var(--safe-area-inset-top, 0px));
    }

    /* 底部导航栏适配安全区域 - Home Indicator适配 */
    .mobile-bottom-nav {
      padding-top: 8px;
      padding-bottom: calc(8px + var(--safe-area-inset-bottom, 0px));
      height: calc(56px + var(--safe-area-inset-bottom, 0px));
    }

    /* 主内容区域适配安全区域 */
    .main-container.has-bottom-nav {
      .volc-main {
        padding-bottom: calc(72px + var(--safe-area-inset-bottom, 0px));
        padding-top: 16px;
      }
    }
  }
}

/* 移动端汉堡菜单按钮 */
.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
  color: #1d2129;

  &:active {
    background: #f7f8fa;
  }
}

/* 移动端抽屉菜单遮罩层 */
.mobile-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  align-items: stretch;
}

/* 移动端抽屉菜单主体 */
.mobile-drawer {
  width: 280px;
  max-width: 80vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.12);
  position: relative;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
}

/* 抽屉头部 */
.drawer-header {
  padding: 20px 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.drawer-header .user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  transition: background 0.2s;

  &:active {
    background: rgba(0, 0, 0, 0.04);
  }
}

.drawer-header .user-details {
  flex: 1;
}

.drawer-header .user-name {
  font-size: 17px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.3;
  margin-bottom: 2px;
}

.drawer-header .user-account {
  font-size: 14px;
  color: #86909c;
  line-height: 1.3;
}

.drawer-header .close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  color: #86909c;
  transition: all 0.2s;

  &:active {
    background: rgba(0, 0, 0, 0.04);
    color: #1d2129;
  }
}

/* 抽屉菜单项 */
.drawer-menu {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
}

.drawer-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  min-height: 56px;
  cursor: pointer;
  transition: background 0.2s;
  color: #1d2129;
  position: relative;

  &:active {
    background: rgba(0, 0, 0, 0.04);
  }

  .menu-label {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
  }
}

/* 抽屉底部 */
.drawer-footer {
  padding: 8px 0;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
}

.drawer-footer .footer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  min-height: 56px;
  cursor: pointer;
  transition: background 0.2s;
  color: #1d2129;
  font-size: 16px;
  font-weight: 500;

  &:active {
    background: rgba(0, 0, 0, 0.04);
  }

  &.danger {
    color: #f56565;

    &:active {
      background: rgba(245, 101, 101, 0.08);
    }
  }
}

/* 抽屉菜单动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  .mobile-drawer {
    transform: translateX(-100%);
  }

  .mobile-drawer-overlay {
    opacity: 0;
  }
}

.drawer-enter-to,
.drawer-leave-from {
  .mobile-drawer {
    transform: translateX(0);
  }

  .mobile-drawer-overlay {
    opacity: 1;
  }
}

/* 移动端响应式优化 */
@media (max-width: 430px) {
  .mobile-drawer {
    width: 100%;
    max-width: 320px;
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
  }
}

/* PWA Standalone模式适配 */
html.standalone-mode {
  .mobile-drawer-overlay {
    top: var(--safe-area-inset-top, 0px);
    bottom: var(--safe-area-inset-bottom, 0px);
  }
}
</style>
