<template>
  <div class="blog-layout">
    <!-- 顶部导航栏 -->
    <header class="blog-header">
      <div class="header-container">
        <div class="header-left">
          <router-link to="/" class="home-link">
            <el-icon class="home-icon"><HomeFilled /></el-icon>
            <span>返回工具集</span>
          </router-link>
        </div>
        <div class="header-right">
          <nav class="blog-nav">
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
                  <span class="username">{{ userStore.user?.nickname || '用户' }}</span>
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
    </header>

    <!-- 主内容区 -->
    <main class="blog-main">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="blog-footer">
      <div class="footer-content">
        <p>&copy; {{ currentYear }} 个人工具集. All rights reserved.</p>
        <p class="footer-links">
          <a href="#" @click.prevent>关于</a>
          <span class="divider">|</span>
          <a href="#" @click.prevent>隐私</a>
          <span class="divider">|</span>
          <a href="#" @click.prevent>联系</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  HomeFilled,
  List,
  Management,
  UserFilled,
  Plus
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const currentYear = computed(() => new Date().getFullYear())

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

/* 页脚 */
.blog-footer {
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  padding: 32px 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
  color: #909399;

  p {
    margin: 8px 0;
    font-size: 14px;
  }
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  a {
    color: #909399;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #409eff;
    }
  }

  .divider {
    color: #dcdfe6;
  }
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
}
</style>
