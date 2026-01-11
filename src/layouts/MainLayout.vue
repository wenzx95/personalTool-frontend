<template>
  <el-container class="main-layout">
    <!-- Sidebar - Desktop -->
    <el-aside class="sidebar" :class="{ collapsed: sidebarCollapsed }" :width="sidebarWidth">
      <div class="sidebar-header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
            <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.3"/>
          </svg>
          <span class="logo-text">PersonalTool</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="section in menuSections"
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
        <el-tooltip content="用户名" placement="right" :disabled="!sidebarCollapsed">
          <div class="user-profile">
            <el-avatar :size="32" icon="UserFilled" />
            <div class="user-info">
              <div class="user-name">用户名</div>
              <div class="user-status">在线</div>
            </div>
          </div>
        </el-tooltip>
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
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Fold,
  Search,
  Bell,
  Setting,
  UserFilled,
  TrendCharts,
  Money,
  Tools,
  Management,
  Document,
  DataLine,
  Grid as Blog,
  ArrowRight,
  Calendar,
  List,
  Download,
  DataAnalysis,
  DocumentCopy,
  Management as Calculator
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

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
          { key: 'tools/json', label: 'JSON工具', icon: markRaw(DocumentCopy) }
        ]
      }
    ]
  },
  {
    title: '管理',
    items: [
      { key: 'admin', label: '后台管理', icon: markRaw(Management) },
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
  router.push(`/${key}`)
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleSettingsClick = (action: string) => {
  console.log('Settings action:', action)
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
.sidebar.collapsed .nav-section-title,
.sidebar.collapsed .user-info {
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
