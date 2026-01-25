<template>
  <el-container class="volc-layout">
    <!-- 顶部导航栏 - 48px高度 -->
    <el-header class="volc-navbar">
      <div class="navbar-left">
        <!-- Logo -->
        <div class="navbar-logo" @click="router.push('/tools/json')">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
            <rect width="24" height="24" rx="6" fill="#3370ff"/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
          <span class="logo-text">个人工具集</span>
        </div>

        <!-- 分隔线 -->
        <div class="navbar-divider"></div>

        <!-- 面包屑 -->
        <el-breadcrumb separator="/" class="navbar-breadcrumb">
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
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索..."
          :prefix-icon="Search"
          class="navbar-search"
          size="small"
          clearable
        />

        <!-- 文档链接 -->
        <el-button link class="navbar-link">
          <el-icon><Document /></el-icon>
          文档
        </el-button>

        <!-- 帮助 -->
        <el-button link class="navbar-link">
          <el-icon><QuestionFilled /></el-icon>
          帮助
        </el-button>

        <!-- 分隔线 -->
        <div class="navbar-divider"></div>

        <!-- 用户下拉菜单 -->
        <el-dropdown trigger="click" @command="handleUserAction">
          <div class="user-dropdown">
            <el-avatar :size="28" :icon="UserFilled" />
            <span class="user-name">{{ userStore.user?.nickname || '用户' }}</span>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
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
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container">
      <!-- 左侧菜单栏 -->
      <el-aside class="volc-sidebar" :class="{ collapsed: sidebarCollapsed }" :width="sidebarWidth">
        <!-- 菜单内容 -->
        <nav class="sidebar-nav">
          <div
            v-for="section in filteredMenuSections"
            :key="section.title"
            class="menu-section"
          >
            <div v-show="!sidebarCollapsed" class="menu-section-title">{{ section.title }}</div>

            <div
              v-for="item in section.items"
              :key="item.key"
            >
              <!-- 父级菜单项 -->
              <el-tooltip
                v-if="item.children && item.children.length > 0"
                :content="item.label"
                placement="right"
                :disabled="!sidebarCollapsed"
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
                  <span v-show="!sidebarCollapsed" class="menu-text">{{ item.label }}</span>
                  <el-icon v-show="!sidebarCollapsed" class="submenu-arrow">
                    <ArrowRight />
                  </el-icon>
                </div>
              </el-tooltip>

              <!-- 简单菜单项 -->
              <el-tooltip
                v-else
                :content="item.label"
                placement="right"
                :disabled="!sidebarCollapsed"
                :show-after="500"
              >
                <div
                  :class="['menu-item', { active: isActive(item.key) }]"
                  @click="handleNavClick(item.key)"
                >
                  <component :is="item.icon" class="menu-icon" />
                  <span v-show="!sidebarCollapsed" class="menu-text">{{ item.label }}</span>
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
                    <span v-show="!sidebarCollapsed" class="menu-text">{{ child.label }}</span>
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
              <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
            <span v-show="!sidebarCollapsed" class="collapse-text">
              {{ sidebarCollapsed ? '' : '收起' }}
            </span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="volc-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component
              :is="Component"
              :ref="setJsonToolsRef"
              :active-tab="jsonToolActiveTab"
              @show-examples="handleShowExamples"
              @clear-all="handleClearAll"
            />
          </transition>
        </router-view>

        <!-- 版本信息 -->
        <div class="version-info">
          <span>前端: {{ frontendVersion }}</span>
          <span v-if="backendVersion" class="divider">|</span>
          <span v-if="backendVersion">后端: {{ backendVersion }}</span>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch } from 'vue'
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
  Reading
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { APP_VERSION } from '@/version'
import request from '@/api/request'
import { getUserMenus } from '@/api/menu'
import { detectDeviceType } from '@/utils/deviceType'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// JSON工具导航栏状态
const jsonToolActiveTab = ref('formatter')

// 事件emit函数
const emit = defineEmits<{
  showExamples: []
  clearAll: []
}>()

// JSON工具组件ref
let jsonToolsRef: any = null

const setJsonToolsRef = (el: any) => {
  if (el) {
    if (el.showExamples && el.clearAll) {
      jsonToolsRef = el
    }
  }
}

const handleShowExamples = () => {
  if (jsonToolsRef && typeof jsonToolsRef.showExamples === 'function') {
    jsonToolsRef.showExamples()
  }
}

const handleClearAll = () => {
  if (jsonToolsRef && typeof jsonToolsRef.clearAll === 'function') {
    jsonToolsRef.clearAll()
  }
}

// 版本信息
const frontendVersion = ref(`${APP_VERSION.buildDate} ${APP_VERSION.buildTimeShort}`)
const backendVersion = ref('')

const fetchBackendVersion = async () => {
  try {
    const versionData: any = await request.get('/version')
    backendVersion.value = versionData.buildTime || '未知'
  } catch (error) {
    console.error('获取后端版本失败:', error)
  }
}

fetchBackendVersion()

// 侧边栏状态
const sidebarCollapsed = ref(false)
const searchQuery = ref('')
const expandedMenus = ref<string[]>(['stock', 'tools'])

const sidebarWidth = computed(() => sidebarCollapsed.value ? '48px' : '200px')

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
    title: '内容管理',
    items: [
      {
        key: 'blog',
        label: '博客',
        icon: markRaw(DocumentCopy),
        children: [
          { key: 'blog/list', label: '博客列表', icon: markRaw(List) }
        ]
      },
      {
        key: 'knowledge',
        label: '知识库',
        icon: markRaw(Notebook),
        children: [
          { key: 'knowledge/list', label: '知识库列表', icon: markRaw(Reading) }
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
          { key: 'tools/loan-calculator', label: '还贷计算器', icon: markRaw(Management) },
          { key: 'tools/json', label: 'JSON工具', icon: markRaw(Document) }
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
          { key: 'admin/dashboard', label: '管理首页', icon: markRaw(DataAnalysis) },
          { key: 'admin/users', label: '用户管理', icon: markRaw(User) },
          { key: 'admin/blog', label: '博客管理', icon: markRaw(DocumentCopy) },
          { key: 'admin/knowledge', label: '知识库管理', icon: markRaw(Notebook) },
          { key: 'admin/scheduled-tasks', label: '定时任务', icon: markRaw(TrendCharts) },
          { key: 'admin/system-logs', label: '日志管理', icon: markRaw(Document) }
        ]
      },
      { key: 'config', label: '系统配置', icon: markRaw(TrendCharts) }
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

    // 将后端返回的菜单转换为MenuItem格式
    const transformedMenus = transformToMenuItems(menus)

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

// 将后端菜单格式转换为前端MenuItem格式
const transformToMenuItems = (menus: any[]): MenuSection[] => {
  if (!menus || menus.length === 0) {
    return []
  }

  const sections: MenuSection[] = []
  const rootMenus = menus.filter(m => m.parentId === 0)

  rootMenus.forEach(rootMenu => {
    const children: MenuItem[] = []

    if (rootMenu.children && rootMenu.children.length > 0) {
      rootMenu.children.forEach((child: any) => {
        children.push({
          key: child.path || `menu-${child.id}`,
          label: child.name,
          icon: markRaw(Management), // 可以根据child.icon动态设置
          children: transformChildren(child.children)
        })
      })
    }

    sections.push({
      title: rootMenu.name,
      items: children.length > 0 ? children : [{
        key: rootMenu.path || `menu-${rootMenu.id}`,
        label: rootMenu.name,
        icon: markRaw(Management)
      }]
    })
  })

  return sections
}

// 递归转换子菜单
const transformChildren = (children: any[]): MenuItem[] => {
  if (!children || children.length === 0) {
    return []
  }

  return children.map(child => ({
    key: child.path || `menu-${child.id}`,
    label: child.name,
    icon: markRaw(Management),
    children: transformChildren(child.children)
  }))
}

// 在用户登录后加载动态菜单
watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchDynamicMenus()
  }
}, { immediate: true })

// 根据登录状态过滤菜单
const filteredMenuSections = computed(() => {
  if (!userStore.isLoggedIn) {
    return menuSections.value
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.key === 'tools' || item.key.startsWith('tools/'))
      }))
      .filter(section => section.items.length > 0)
  }
  return menuSections.value
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
  })).filter(item => !(route.path.startsWith('/tools/json') && item.title === 'JSON工具'))
})

const isActive = (key: string) => {
  return route.path.startsWith(`/${key}`)
}

const isParentActive = (item: MenuItem) => {
  if (!item.children) return false
  return item.children.some(child => route.path.startsWith(`/${child.key}`))
}

const toggleSubmenu = (key: string) => {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
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
  const path = `/${key}`
  router.push(path)
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // 收起时关闭所有子菜单
  if (sidebarCollapsed.value) {
    expandedMenus.value = []
  }
}

const handleUserAction = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人设置功能开发中')
      break
    case 'blog':
      router.push('/blog/list')
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
  overflow: hidden;
  flex-shrink: 0;
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c9cdd4;
    border-radius: 2px;
  }
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
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  font-size: 16px;
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
  .submenu-arrow {
    margin-left: auto;
    transition: transform 0.2s;
    font-size: 12px;
  }

  &.expanded .submenu-arrow {
    transform: rotate(90deg);
  }
}

/* 子菜单 */
.submenu {
  margin-left: 24px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.menu-item-child {
  padding: 0 16px 0 24px;
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

.version-info {
  margin-top: auto;
  padding-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #86909c;
  border-top: 1px solid #e5e7eb;

  span {
    margin: 0 4px;
  }

  .divider {
    color: #c9cdd4;
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

/* 响应式 */
@media (max-width: 768px) {
  .volc-sidebar {
    position: fixed;
    left: 0;
    top: 48px;
    bottom: 0;
    z-index: 998;
    transform: translateX(-100%);

    &:not(.collapsed) {
      transform: translateX(0);
    }
  }

  .navbar-search {
    width: 140px;
  }

  .user-name {
    display: none;
  }

  .volc-main {
    padding: 12px;
  }
}
</style>
