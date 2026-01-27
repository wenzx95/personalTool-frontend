<template>
  <div class="blog-layout">
    <!-- 顶部导航栏 -->
    <header class="blog-header">
      <div class="header-container">
        <div class="header-left">
          <!-- 移动端菜单按钮 -->
          <el-button
            v-if="isMobile"
            class="mobile-menu-btn"
            :icon="Menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
            circle
            size="small"
          />

          <router-link to="/" class="home-link">
            <el-icon class="home-icon"><HomeFilled /></el-icon>
            <span v-show="!isMobile">返回工具集</span>
          </router-link>
        </div>
        <div class="header-right">
          <!-- 桌面端导航 -->
          <nav v-show="!isMobile" class="blog-nav">
            <router-link to="/blog/list" class="nav-link">
              <el-icon><List /></el-icon>
              <span>博客列表</span>
            </router-link>
            <router-link v-if="userStore.isLoggedIn" to="/admin/blog" class="nav-link">
              <el-icon><Management /></el-icon>
              <span>博客管理</span>
            </router-link>
          </nav>
          <div class="user-section">
            <template v-if="userStore.isLoggedIn">
              <el-dropdown trigger="click" @command="handleUserAction">
                <div class="user-info">
                  <el-avatar :size="32" icon="UserFilled" />
                  <span v-show="!isMobile" class="username">{{ userStore.user?.nickname || '用户' }}</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                    <el-dropdown-item command="new-post">
                      <el-icon><Plus /></el-icon>
                      写文章
                    </el-dropdown-item>
                    <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <el-button type="primary" size="small" @click="router.push('/login')">
                登录
              </el-button>
            </template>
          </div>
        </div>
      </div>

      <!-- 移动端导航菜单 -->
      <div v-if="isMobile && mobileMenuOpen" class="mobile-nav-overlay" @click="mobileMenuOpen = false">
        <div class="mobile-nav-menu" @click.stop>
          <router-link to="/blog/list" class="mobile-nav-link" @click="mobileMenuOpen = false">
            <el-icon><List /></el-icon>
            <span>博客列表</span>
          </router-link>
          <router-link
            v-if="userStore.isLoggedIn"
            to="/admin/blog"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
          >
            <el-icon><Management /></el-icon>
            <span>博客管理</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="blog-main" :class="{ 'has-bottom-nav': isMobile }">
      <router-view />
    </main>

    <!-- 移动端底部Tab导航 -->
    <div v-if="isMobile" class="mobile-bottom-nav">
      <div
        v-for="tab in mobileTabs"
        :key="tab.key"
        :class="['bottom-nav-item', { active: isActive(tab.key) }]"
        @click="handleNavClick(tab.key)"
      >
        <el-icon>
          <component :is="tab.icon" />
        </el-icon>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </div>

    <!-- 备案号底部显示 -->
    <footer class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">浙ICP备2026004908号</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  HomeFilled,
  List,
  Management,
  UserFilled,
  Plus,
  Menu,
  Tools,
  TrendCharts,
  Money,
  DocumentCopy
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 移动端检测
const isMobile = ref(false)
const mobileMenuOpen = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 移动端底部Tab配置
const mobileTabs = computed(() => {
  const tabs = [
    { key: '/tools/json', label: '工具', icon: markRaw(Tools) }
  ]

  // 如果已登录，添加更多Tab
  if (userStore.isLoggedIn) {
    tabs.push(
      { key: '/stock/overview', label: '股票', icon: markRaw(TrendCharts) },
      { key: '/accounting', label: '记账', icon: markRaw(Money) }
    )
  }

  // 根据当前路由决定显示哪个Tab
  if (route.path.startsWith('/blog')) {
    return [
      { key: '/blog/list', label: '博客', icon: markRaw(DocumentCopy) },
      ...tabs.slice(1) // 添加其他Tab
    ]
  }

  if (route.path.startsWith('/knowledge')) {
    return [
      { key: '/knowledge/list', label: '知识库', icon: markRaw(DocumentCopy) },
      ...tabs.slice(1)
    ]
  }

  return tabs
})

const isActive = (key: string) => {
  if (key.startsWith('/')) {
    return route.path.startsWith(key)
  }
  return route.path === key
}

const handleNavClick = (key: string) => {
  router.push(key)
}

const handleUserAction = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人设置功能开发中')
      break
    case 'new-post':
      router.push('/admin/blog/edit')
      break
    case 'logout':
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
      break
  }
}
</script>

<style scoped lang="scss">
.blog-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

/* 顶部导航栏 */
.blog-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  flex-shrink: 0;
  margin-right: 8px;
}

/* 移动端导航菜单 */
.mobile-nav-overlay {
  position: fixed;
  top: calc(64px + var(--safe-area-inset-top, 0px));
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  animation: fadeIn 0.3s ease;
}

.mobile-nav-menu {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: #606266;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fa;
    color: #409eff;
  }

  &.router-link-active {
    color: #409eff;
    background: #ecf5ff;
  }

  .el-icon {
    font-size: 18px;
  }

  span {
    font-size: 15px;
    font-weight: 500;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.header-left {
  display: flex;
  align-items: center;
}

.home-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  color: #606266;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: 500;

  &:hover {
    background: #f5f7fa;
    color: #409eff;
  }
}

.home-icon {
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 导航 */
.blog-nav {
  display: flex;
  align-items: center;
  gap: 8px;

  .nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    color: #606266;
    text-decoration: none;
    transition: all 0.2s;
    font-size: 14px;
    font-weight: 500;

    &:hover {
      background: #f5f7fa;
      color: #409eff;
    }

    &.router-link-active {
      color: #409eff;
      background: #ecf5ff;
    }

    .el-icon {
      font-size: 16px;
    }
  }
}

/* 用户信息 */
.user-section {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fa;
  }
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

/* 主内容区 */
.blog-main {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  min-height: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-container {
    padding: 0 16px;
    height: 56px;
  }

  .header-right {
    gap: 12px;
  }

  .blog-nav {
    display: none;
  }

  .home-link span {
    display: none;
  }

  .username {
    display: none;
  }

  .footer-content {
    padding: 0 16px;
  }

  /* 主内容区添加底部内边距（为底部导航留空间） */
  .blog-main.has-bottom-nav {
    padding-bottom: calc(66px + var(--safe-area-inset-bottom, 0px));
  }
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
}

/* Standalone模式特有样式 */
html.standalone-mode {
  @media (max-width: 430px) {
    .blog-header {
      padding-top: var(--safe-area-inset-top, 0px);

      .header-container {
        height: calc(56px + var(--safe-area-inset-top, 0px));
      }
    }

    .mobile-nav-overlay {
      top: calc(56px + var(--safe-area-inset-top, 0px));
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
</style>
