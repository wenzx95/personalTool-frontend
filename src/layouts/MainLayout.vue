<template>
  <el-container class="main-layout">
    <!-- Sidebar - Desktop -->
    <el-aside class="sidebar" :class="{ collapsed: sidebarCollapsed }" :width="sidebarWidth">
      <div class="sidebar-header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
            <rect width="24" height="24" rx="6" fill="#409EFF"/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="16" r="3" fill="white"/>
            <path d="M18 14.5v3M18 15.5l1.5-1.5M18 16.5l-1.5 1.5" stroke="#409EFF" stroke-width="1" stroke-linecap="round"/>
          </svg>
          <span class="logo-text">工具集</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="section in filteredMenuSections"
          :key="section.title"
          class="nav-section"
        >
          <div class="nav-section-title">{{ section.title }}</div>
          <div
            v-for="item in section.items"
            :key="item.key"
          >
            <!-- Parent Menu Item with Children -->
            <el-tooltip
              v-if="item.children && item.children.length > 0"
              :content="item.label"
              placement="right"
              :disabled="!sidebarCollapsed"
            >
              <div
                :class="['nav-item', 'nav-item-parent', { active: isParentActive(item) }]"
                @click="toggleSubmenu(item.key)"
              >
                <component :is="item.icon" class="nav-icon" />
                <span class="nav-text">{{ item.label }}</span>
                <el-icon
                  :class="['submenu-arrow', { expanded: expandedMenus.includes(item.key) }]"
                >
                  <ArrowRight />
                </el-icon>
              </div>
            </el-tooltip>

            <!-- Simple Menu Item without Children -->
            <el-tooltip
              v-else
              :content="item.label"
              placement="right"
              :disabled="!sidebarCollapsed"
            >
              <div
                :class="['nav-item', { active: isActive(item.key) }]"
                @click="handleNavClick(item.key)"
              >
                <component :is="item.icon" class="nav-icon" />
                <span class="nav-text">{{ item.label }}</span>
                <el-badge v-if="item.badge" :value="item.badge" class="nav-badge" />
              </div>
            </el-tooltip>

            <!-- Submenu Items -->
            <div
              v-if="item.children && item.children.length > 0"
              :class="['submenu', { expanded: expandedMenus.includes(item.key) }]"
            >
              <div
                v-for="child in item.children"
                :key="child.key"
                :class="['nav-item', 'nav-item-child', { active: isActive(child.key) }]"
                @click="handleNavClick(child.key)"
              >
                <component :is="child.icon" class="nav-icon" />
                <span class="nav-text">{{ child.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <!-- 已登录用户 -->
        <el-dropdown v-if="userStore.isLoggedIn" trigger="click" @command="handleLogout">
          <div class="user-profile logged-in">
            <el-avatar :size="28" icon="UserFilled" />
            <div class="user-info">
              <div class="user-name">{{ userStore.user?.nickname || '用户' }}</div>
              <div class="user-status">在线</div>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 未登录用户 -->
        <div v-else class="user-profile not-logged-in" @click="router.push('/login')">
          <div class="login-prompt">
            <el-icon :size="24"><User /></el-icon>
            <div class="login-text">
              <div class="login-title">点击登录</div>
              <div class="login-subtitle">访问更多功能</div>
            </div>
          </div>
        </div>
      </div>
    </el-aside>

    <!-- Main Content -->
    <el-container class="main-container">
      <el-header class="main-header">
        <div class="header-left">
          <el-button
            :icon="Fold"
            circle
            size="small"
            @click="toggleSidebar"
            class="sidebar-toggle"
          />

          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="breadcrumb in breadcrumbs"
              :key="breadcrumb.path"
              :to="breadcrumb.path"
            >
              {{ breadcrumb.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-input
            v-model="searchQuery"
            placeholder="搜索..."
            :prefix-icon="Search"
            class="search-input"
            clearable
          />

          <el-button :icon="Bell" circle class="header-btn" />
          <el-dropdown trigger="click">
            <el-button :icon="Setting" circle class="header-btn" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleSettingsClick('profile')">
                  个人设置
                </el-dropdown-item>
                <el-dropdown-item @click="handleSettingsClick('appearance')">
                  外观设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleSettingsClick('logout')">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>

        <!-- 版本信息 -->
        <div class="version-info">
          <span>前端版本: {{ frontendVersion }}</span>
          <span v-if="backendVersion" style="margin-left: 20px">后端版本: {{ backendVersion }}</span>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Fold,
  Search,
  Bell,
  Setting,
  TrendCharts,
  Money,
  Tools,
  Management,
  Document,
  DataLine,
  ArrowRight,
  Calendar,
  List,
  Download,
  DataAnalysis,
  DocumentCopy,
  Management as Calculator,
  User
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { APP_VERSION } from '@/version'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 版本信息
const frontendVersion = ref(`${APP_VERSION.buildDate} ${APP_VERSION.buildTimeShort}`)
const backendVersion = ref('')

// 获取后端版本信息
const fetchBackendVersion = async () => {
  try {
    const versionData: any = await request.get('/version')
    backendVersion.value = versionData.buildTime || '未知'
  } catch (error) {
    console.error('获取后端版本失败:', error)
    backendVersion.value = '获取失败'
  }
}

// 页面加载时获取后端版本
fetchBackendVersion()

const sidebarCollapsed = ref(true)  // 默认收缩
const searchQuery = ref('')
const expandedMenus = ref<string[]>([])  // 默认不展开任何菜单

const sidebarWidth = computed(() => sidebarCollapsed.value ? '64px' : '240px')

interface MenuItem {
  key: string
  label: string
  icon: any
  badge?: number
  children?: MenuItem[]
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections = ref<MenuSection[]>([
  {
    title: '主要功能',
    items: [
      {
        key: 'stock',
        label: 'A股复盘',
        icon: markRaw(TrendCharts),
        children: [
          { key: 'stock/overview', label: '市场概览', icon: markRaw(Calendar) },
          { key: 'stock/records', label: '复盘记录', icon: markRaw(List) },
          { key: 'stock/collection', label: '数据采集', icon: markRaw(Download) },
          { key: 'stock/analytics', label: '统计分析', icon: markRaw(DataAnalysis) }
        ]
      },
      { key: 'accounting', label: '记账', icon: markRaw(Money) },
      {
        key: 'tools',
        label: '工具集',
        icon: markRaw(Tools),
        children: [
          { key: 'tools/loan-calculator', label: '还贷计算器', icon: markRaw(Calculator) },
          { key: 'tools/json', label: 'JSON工具', icon: markRaw(DocumentCopy) },
          { key: 'tools/json-comparator', label: 'JSON比对', icon: markRaw(DocumentCopy) }
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
        children: [
          { key: 'admin/dashboard', label: '管理首页', icon: markRaw(DataLine) },
          { key: 'admin/users', label: '用户管理', icon: markRaw(User) },
          { key: 'admin/scheduled-tasks', label: '定时任务', icon: markRaw(Setting) },
          { key: 'admin/system-logs', label: '日志管理', icon: markRaw(Document) }
        ]
      },
      { key: 'config', label: '系统配置', icon: markRaw(Setting) }
    ]
  },
  {
    title: '其他',
    items: [
      { key: 'blog', label: '博客', icon: markRaw(Document) },
      { key: 'analytics', label: '数据分析', icon: markRaw(DataLine) }
    ]
  }
])

// Filter menu sections based on user login status
const filteredMenuSections = computed(() => {
  // If not logged in, only show the tools section
  if (!userStore.isLoggedIn) {
    return menuSections.value
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.key === 'tools' || item.key.startsWith('tools/'))
      }))
      .filter(section => section.items.length > 0)
  }

  // If logged in, show all menu sections
  return menuSections.value
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title as string
  }))
})

const isActive = (key: string) => {
  return route.path.startsWith(`/${key}`)
}

const isParentActive = (item: MenuItem) => {
  if (!item.children) return false
  return item.children.some(child => route.path.startsWith(`/${child.key}`))
}

const toggleSubmenu = (key: string) => {
  // 如果侧边栏收缩，先展开侧边栏
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
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
  console.log('[Navigation] Clicked menu item:', key)
  const path = `/${key}`
  console.log('[Navigation] Navigating to:', path)
  router.push(path)
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleSettingsClick = (action: string) => {
  console.log('Settings action:', action)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出登录',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // User cancelled
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Sidebar Styles */
.sidebar {
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-md);
}

/* Collapsed state styles */
.sidebar.collapsed .logo-text,
.sidebar.collapsed .nav-text,
.sidebar.collapsed .nav-badge,
.sidebar.collapsed .submenu-arrow,
.sidebar.collapsed .submenu,
.sidebar.collapsed .nav-section-title {
  display: none;
}

/* 侧边栏折叠时，登录提示只显示图标 */
.sidebar.collapsed .not-logged-in {
  padding: var(--spacing-sm);
}

.sidebar.collapsed .login-text {
  display: none;
}

.sidebar.collapsed .logged-in .user-info {
  display: none;
}

.sidebar.collapsed .logo {
  justify-content: center;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: var(--spacing-sm);
}

.sidebar.collapsed .nav-icon {
  margin: 0;
}

.sidebar.collapsed .user-profile {
  justify-content: center;
  padding: var(--spacing-sm);
}

.sidebar.collapsed .user-profile .el-avatar {
  margin: 0;
}

.nav-section {
  margin-bottom: var(--spacing-lg);
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-secondary);
  position: relative;
}

.nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: var(--color-primary-lighter);
  color: var(--color-primary);
  font-weight: 500;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
}

.nav-badge {
  margin-left: auto;
}

/* Submenu Styles */
.nav-item-parent {
  position: relative;
}

.submenu-arrow {
  margin-left: auto;
  transition: transform var(--transition-base);
}

.submenu-arrow.expanded {
  transform: rotate(90deg);
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--transition-base);
  padding-left: var(--spacing-lg);
}

.submenu.expanded {
  max-height: 500px;
}

.nav-item-child {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
}

.nav-item-child:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.nav-item-child.active {
  background: var(--color-primary-lightest);
  color: var(--color-primary);
}


.sidebar-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.user-profile.logged-in {
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.user-profile.logged-in:hover {
  background: var(--color-bg-secondary);
}

.user-profile.not-logged-in {
  cursor: pointer;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  transition: all var(--transition-base);
}

.user-profile.not-logged-in:hover {
  background: linear-gradient(135deg, #337ecc 0%, #409EFF 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: 0.75rem;
  color: var(--color-success);
}

/* 未登录时的登录提示 */
.login-prompt {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.login-prompt .el-icon {
  color: white;
  flex-shrink: 0;
}

.login-text {
  flex: 1;
  min-width: 0;
}

.login-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Main Container */
.main-container {
  flex: 1;
  overflow: hidden;
}

.main-header {
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  height: 64px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.sidebar-toggle {
  flex-shrink: 0;
}

.search-input {
  width: 240px;
}

.header-btn {
  flex-shrink: 0;
}

.main-content {
  background: var(--color-bg-secondary);
  overflow-y: auto;
  padding: var(--spacing-xl);
  position: relative;
}

.version-info {
  margin-top: auto;
  padding-top: var(--spacing-lg);
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  border-top: 1px solid var(--color-border-light);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: var(--z-fixed);
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .search-input {
    width: 160px;
  }

  .main-content {
    padding: var(--spacing-md);
  }
}
</style>
