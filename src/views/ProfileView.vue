<template>
  <div class="profile-view">
    <!-- 未登录状态 -->
    <div v-if="!userStore.isLoggedIn" class="not-logged-in">
      <div class="login-prompt">
        <el-icon :size="80" color="#c9cdd4"><User /></el-icon>
        <h2>欢迎来到工具集</h2>
        <p>登录后可使用更多功能</p>
        <el-button type="primary" size="large" @click="goToLogin">
          立即登录
        </el-button>
      </div>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="logged-in">
      <!-- 用户信息卡片 -->
      <div class="user-info-card">
        <el-avatar :size="80" :icon="UserFilled" />
        <div class="user-details">
          <h2 class="user-name">{{ userStore.user?.nickname || '用户' }}</h2>
          <p class="user-account">@{{ userStore.user?.username || 'user' }}</p>
          <p class="user-email">{{ userStore.user?.email || '未设置邮箱' }}</p>
        </div>
      </div>

      <!-- 设置列表 -->
      <div class="settings-section">
        <div class="section-title">账号设置</div>
        <div class="setting-item" @click="handleSetting('profile')">
          <el-icon :size="20"><User /></el-icon>
          <span>个人资料</span>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
        <div class="setting-item" @click="handleSetting('security')">
          <el-icon :size="20"><Lock /></el-icon>
          <span>账号安全</span>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title">我的内容</div>
        <div class="setting-item" @click="handleSetting('blog')">
          <el-icon :size="20"><DocumentCopy /></el-icon>
          <span>我的博客</span>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
        <div class="setting-item" @click="handleSetting('knowledge')">
          <el-icon :size="20"><Notebook /></el-icon>
          <span>知识库</span>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title">其他</div>
        <div class="setting-item" @click="handleSetting('about')">
          <el-icon :size="20"><InfoFilled /></el-icon>
          <span>关于</span>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
        <div class="setting-item" @click="handleSetting('feedback')">
          <el-icon :size="20"><ChatLineSquare /></el-icon>
          <span>意见反馈</span>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 退出登录 -->
      <div class="logout-section">
        <el-button class="logout-btn" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>
    </div>

    <!-- 关于对话框 -->
    <el-dialog
      v-model="aboutDialogVisible"
      title="关于"
      width="90%"
      :close-on-click-modal="true"
    >
      <div class="about-content">
        <div class="about-header">
          <el-icon :size="48" color="#3370ff"><InfoFilled /></el-icon>
          <h2>工具集</h2>
          <p class="about-description">A股复盘、记账系统、博客等工具集</p>
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
          <p class="copyright-text">© {{ currentYear }} 工具集. All rights reserved.</p>
          <p class="icp-info">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">浙ICP备2026004908号</a>
          </p>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="aboutDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  UserFilled,
  ArrowRight,
  Lock,
  DocumentCopy,
  Notebook,
  InfoFilled,
  ChatLineSquare,
  SwitchButton
} from '@element-plus/icons-vue'
import { APP_VERSION } from '@/version'
import request from '@/api/request'

const router = useRouter()
const userStore = useUserStore()

// 版本信息
const frontendVersion = ref(`${APP_VERSION.buildDate} ${APP_VERSION.buildTimeShort}`)
const backendVersion = ref('')
const currentYear = new Date().getFullYear()

// 关于对话框
const aboutDialogVisible = ref(false)

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 处理设置项点击
const handleSetting = (type: string) => {
  switch (type) {
    case 'profile':
      ElMessage.info('个人资料功能开发中')
      break
    case 'security':
      ElMessage.info('账号安全功能开发中')
      break
    case 'blog':
      router.push('/blog/list')
      break
    case 'knowledge':
      router.push('/knowledge/list')
      break
    case 'about':
      aboutDialogVisible.value = true
      break
    case 'feedback':
      ElMessage.info('意见反馈功能开发中')
      break
  }
}

// 退出登录
const handleLogout = async () => {
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
    // 用户取消
  }
}

// 获取后端版本信息
const fetchBackendVersion = async () => {
  try {
    const versionData: any = await request.get('/version')
    backendVersion.value = versionData.buildTime || '未知'
  } catch (error) {
    console.error('获取后端版本失败:', error)
  }
}

onMounted(() => {
  fetchBackendVersion()
})
</script>

<style scoped lang="scss">
.profile-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px; // 为底部Tab导航留空间
}

// 未登录状态
.not-logged-in {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 20px;

  .login-prompt {
    text-align: center;
    padding: 60px 20px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .el-icon {
      margin-bottom: 20px;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 600;
      color: #1d2129;
    }

    p {
      margin: 0 0 24px;
      font-size: 15px;
      color: #86909c;
    }

    .el-button {
      width: 200px;
      height: 48px;
      font-size: 16px;
    }
  }
}

// 已登录状态
.logged-in {
  padding: 12px;

  .user-info-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    margin-bottom: 16px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .user-details {
      flex: 1;

      .user-name {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 600;
        color: #1d2129;
      }

      .user-account {
        margin: 0 0 4px;
        font-size: 14px;
        color: #86909c;
      }

      .user-email {
        margin: 0;
        font-size: 13px;
        color: #c9cdd4;
      }
    }
  }

  .settings-section {
    margin-bottom: 16px;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;

    .section-title {
      padding: 16px 20px 8px;
      font-size: 13px;
      font-weight: 500;
      color: #86909c;
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
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

      .el-icon {
        flex-shrink: 0;
      }

      span {
        flex: 1;
      }

      .arrow-icon {
        flex-shrink: 0;
        color: #c9cdd4;
      }
    }
  }

  .logout-section {
    margin-top: 24px;
    padding: 0 12px;

    .logout-btn {
      width: 100%;
      height: 48px;
      font-size: 15px;
      color: #f56565;
      background: #fff;
      border: 1px solid #f56565;
      border-radius: 12px;

      &:hover {
        background: #fff5f5;
        border-color: #e53e3e;
      }

      &:active {
        background: #fed7d7;
      }

      .el-icon {
        margin-right: 6px;
      }
    }
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
      font-size: 22px;
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
      margin: 0;
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
  }
}

/* ============================================================
   移动端优化（平板和手机）
   ============================================================ */
@media (max-width: 768px) {
  .profile-view {
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)); // 底部Tab导航 + 安全区域
  }

  // 未登录状态优化
  .not-logged-in {
    min-height: calc(100vh - 76px - env(safe-area-inset-bottom, 0px));
    padding: 16px;

    .login-prompt {
      padding: 48px 24px;
      border-radius: 16px;

      .el-icon {
        margin-bottom: 16px;
      }

      h2 {
        font-size: 22px;
        margin-bottom: 8px;
      }

      p {
        font-size: 15px;
        margin-bottom: 28px;
      }

      .el-button {
        width: 100%;
        max-width: 280px;
        height: 50px;
        font-size: 17px;
        border-radius: 12px;
      }
    }
  }

  // 已登录状态优化
  .logged-in {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));

    // 用户信息卡片
    .user-info-card {
      padding: 24px 20px;
      margin-bottom: 20px;
      border-radius: 16px;
      gap: 20px;

      .el-avatar {
        flex-shrink: 0;
      }

      .user-details {
        .user-name {
          font-size: 22px;
          margin-bottom: 6px;
        }

        .user-account {
          font-size: 15px;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 14px;
        }
      }
    }

    // 设置分组
    .settings-section {
      margin-bottom: 16px;
      border-radius: 12px;
      overflow: hidden;

      .section-title {
        padding: 12px 20px 8px;
        font-size: 13px;
        font-weight: 600;
      }

      // 设置列表项 - ≥56px高度（iOS标准）
      .setting-item {
        padding: 18px 20px;
        min-height: 56px;
        font-size: 16px;
        gap: 14px;
        transition: background 0.2s;

        &:active {
          background: #f7f8fa;
        }

        .el-icon {
          font-size: 22px;
          color: #3370ff;
        }

        span {
          font-weight: 500;
        }

        .arrow-icon {
          color: #c9cdd4;
          font-size: 18px;
        }
      }
    }

    // 退出登录按钮
    .logout-section {
      margin-top: 28px;
      padding: 0 12px;

      .logout-btn {
        width: 100%;
        height: 52px;
        font-size: 17px;
        font-weight: 600;
        border-radius: 12px;
        background: #fff;
        border: 1px solid #f56565;
        color: #f56565;
        transition: all 0.2s;

        &:active {
          transform: scale(0.98);
          background: #fff5f5;
        }

        .el-icon {
          margin-right: 8px;
          font-size: 20px;
        }
      }
    }
  }

  // 关于对话框优化
  :deep(.el-dialog) {
    width: 85% !important;
    max-width: 400px !important;
    border-radius: 16px;
    margin: 16px auto !important;
  }

  :deep(.el-dialog__header) {
    padding: 20px 20px 12px !important;

    .el-dialog__title {
      font-size: 18px !important;
      font-weight: 600 !important;
    }
  }

  :deep(.el-dialog__body) {
    padding: 0 20px 20px !important;
    max-height: 70vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px 20px !important;
    border-top: none;

    .el-button {
      width: 100%;
      height: 50px;
      font-size: 17px;
      font-weight: 600;
      border-radius: 12px;
    }
  }

  .about-content {
    padding: 12px 0;

    .about-header {
      gap: 12px;

      h2 {
        font-size: 22px;
      }

      .about-description {
        font-size: 15px;
      }
    }

    .version-info-list {
      padding: 0 12px;
      gap: 10px;

      .version-item {
        padding: 14px 16px;

        .version-label {
          font-size: 15px;
        }

        .version-value {
          font-size: 13px;
        }
      }
    }

    .copyright-info {
      padding: 16px 12px 0;

      .copyright-text {
        font-size: 13px;
        line-height: 1.6;
      }

      .icp-info {
        font-size: 12px;

        a {
          font-size: 12px;
        }
      }
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .profile-view {
    padding: 12px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
  }

  .not-logged-in {
    padding: 12px;

    .login-prompt {
      padding: 40px 20px;
      border-radius: 12px;

      .el-icon {
        margin-bottom: 12px;
      }

      h2 {
        font-size: 20px;
      }

      p {
        font-size: 14px;
        margin-bottom: 24px;
      }

      .el-button {
        height: 48px;
        font-size: 16px;
      }
    }
  }

  .logged-in {
    padding: 12px 8px;

    .user-info-card {
      padding: 20px 16px;
      margin-bottom: 16px;
      gap: 16px;
      border-radius: 12px;

      .el-avatar {
        :deep(.el-avatar) {
          width: 64px !important;
          height: 64px !important;
        }
      }

      .user-details {
        .user-name {
          font-size: 20px;
        }

        .user-account {
          font-size: 14px;
        }

        .user-email {
          font-size: 13px;
        }
      }
    }

    .settings-section {
      margin-bottom: 12px;
      border-radius: 12px;

      .section-title {
        padding: 10px 16px 6px;
        font-size: 12px;
      }

      .setting-item {
        padding: 16px 16px;
        min-height: 52px;
        font-size: 15px;
        gap: 12px;

        .el-icon {
          font-size: 20px;
        }

        .arrow-icon {
          font-size: 16px;
        }
      }
    }

    .logout-section {
      margin-top: 24px;
      padding: 0 8px;

      .logout-btn {
        height: 50px;
        font-size: 16px;
        border-radius: 12px;

        .el-icon {
          font-size: 18px;
        }
      }
    }
  }

  :deep(.el-dialog) {
    width: 92% !important;
    margin: 12px auto !important;
  }

  :deep(.el-dialog__header) {
    padding: 16px 16px 12px !important;
  }

  :deep(.el-dialog__body) {
    padding: 0 16px 16px !important;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 16px 16px !important;

    .el-button {
      height: 48px;
      font-size: 16px;
    }
  }

  .about-content {
    .about-header {
      h2 {
        font-size: 20px;
      }

      .about-description {
        font-size: 14px;
      }
    }

    .version-info-list {
      .version-item {
        padding: 12px 12px;

        .version-label {
          font-size: 14px;
        }

        .version-value {
          font-size: 12px;
        }
      }
    }

    .copyright-info {
      padding: 12px 12px 0;

      .copyright-text {
        font-size: 12px;
      }

      .icp-info {
        font-size: 11px;

        a {
          font-size: 11px;
        }
      }
    }
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .profile-view {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
    }

    .logged-in {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
    }

    :deep(.el-dialog) {
      max-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 32px);
      margin-top: calc(16px + env(safe-area-inset-top)) !important;
    }
  }
}
</style>
