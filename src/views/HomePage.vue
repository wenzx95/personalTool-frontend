<template>
  <div class="home-page">
    <!-- 功能模块卡片 -->
    <main class="features-section">
      <div class="features-container">
        <!-- JSON 格式化 -->
        <div class="feature-card" @click="navigateTo('/tools/json-formatter')">
          <div class="card-icon tools">
            <el-icon :size="32"><Tools /></el-icon>
          </div>
          <h3 class="card-title">JSON 格式化</h3>
          <p class="card-description">JSON 格式化、压缩、验证和语法高亮显示</p>
          <div class="card-links">
            <span class="link-item">格式化</span>
            <span class="link-item">压缩</span>
            <span class="link-item">验证</span>
          </div>
        </div>

        <!-- JSON 比对 -->
        <div class="feature-card" @click="navigateTo('/tools/json-comparator')">
          <div class="card-icon compare">
            <el-icon :size="32"><DataAnalysis /></el-icon>
          </div>
          <h3 class="card-title">JSON 比对</h3>
          <p class="card-description">比对两个 JSON 数据的差异，高亮显示不同之处</p>
          <div class="card-links">
            <span class="link-item">差异比对</span>
            <span class="link-item">高亮显示</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="home-footer">
      <div class="footer-content">
        <p class="footer-text">© 2026 工具集. All rights reserved.</p>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener"
          class="footer-link"
        >
          浙ICP备2026004908号
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Tools, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* ========== 功能模块卡片 ========== */
.features-section {
  flex: 1;
  padding: 60px 20px 40px;
}

.features-container {
  max-width: 600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(-4px);
  }
}

.card-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin-bottom: 20px;
  color: #ffffff;

  &.tools {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.compare {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px;
}

.card-description {
  font-size: 15px;
  color: #666666;
  line-height: 1.6;
  margin: 0 0 20px;
}

.card-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .link-item {
    display: inline-block;
    padding: 6px 12px;
    background: #f5f7fa;
    color: #409eff;
    font-size: 13px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      background: #409eff;
      color: #ffffff;
    }
  }
}

/* ========== 底部信息 ========== */
.home-footer {
  padding: 32px 20px;
  text-align: center;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.1);
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.footer-text {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.footer-link {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
    color: #ffffff;
  }
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .features-section {
    padding: 40px 16px 24px;
  }

  .features-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-card {
    padding: 24px;
  }

  .card-icon {
    width: 56px;
    height: 56px;

    :deep(.el-icon) {
      font-size: 28px;
    }
  }

  .card-title {
    font-size: 20px;
  }

  .card-description {
    font-size: 14px;
  }

  .card-links .link-item {
    font-size: 12px;
    padding: 5px 10px;
  }

  .home-footer {
    padding: 24px 16px;
  }

  .footer-content {
    font-size: 13px;
  }
}

@media (max-width: 430px) {
  .feature-card {
    padding: 20px;
  }
}

/* ========== PWA Standalone 模式 ========== */
html.standalone-mode {
  .home-page {
    min-height: 100dvh;
  }

  @media (max-width: 768px) {
    .features-section {
      padding-top: calc(40px + env(safe-area-inset-top));
    }

    .home-footer {
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
    }
  }
}
</style>
