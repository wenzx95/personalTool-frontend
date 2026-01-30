<template>
  <div class="home-page">
    <!-- 顶部欢迎区 -->
    <header class="hero-section">
      <div class="hero-content">
        <div class="hero-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#3370ff"/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
        </div>
        <h1 class="hero-title">工具集</h1>
        <p class="hero-subtitle">高效、便捷的工具集合</p>
        <p class="hero-description">
          包含 A股复盘、记账系统、博客等功能，助您更好地管理生活和投资
        </p>
      </div>
    </header>

    <!-- 功能模块卡片 -->
    <main class="features-section">
      <div class="features-container">
        <!-- 工具集 -->
        <div class="feature-card" @click="navigateTo('/tools/json-formatter')">
          <div class="card-icon tools">
            <el-icon :size="32"><Tools /></el-icon>
          </div>
          <h3 class="card-title">工具集</h3>
          <p class="card-description">JSON 格式化、JSON 比对、还贷计算器等实用工具</p>
          <div class="card-links">
            <span class="link-item">JSON 格式化</span>
            <span class="link-item">JSON 比对</span>
            <span class="link-item">还贷计算</span>
          </div>
        </div>

        <!-- A股复盘 -->
        <div class="feature-card" @click="navigateTo('/stock/overview')">
          <div class="card-icon stock">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <h3 class="card-title">A股复盘</h3>
          <p class="card-description">市场数据采集、复盘记录、统计分析，全面跟踪市场动态</p>
          <div class="card-links">
            <span class="link-item">市场概览</span>
            <span class="link-item">复盘记录</span>
            <span class="link-item">统计分析</span>
          </div>
        </div>

        <!-- 记账系统 -->
        <div class="feature-card" @click="navigateTo('/accounting')">
          <div class="card-icon accounting">
            <el-icon :size="32"><Money /></el-icon>
          </div>
          <h3 class="card-title">记账系统</h3>
          <p class="card-description">简单易用的个人记账工具，帮助您管理收支</p>
          <div class="card-links">
            <span class="link-item">收支记录</span>
            <span class="link-item">统计分析</span>
          </div>
        </div>

        <!-- 博客 -->
        <div class="feature-card" @click="navigateTo('/blog/list')">
          <div class="card-icon blog">
            <el-icon :size="32"><DocumentCopy /></el-icon>
          </div>
          <h3 class="card-title">博客</h3>
          <p class="card-description">记录学习笔记、生活感悟，分享知识与经验</p>
          <div class="card-links">
            <span class="link-item">博客列表</span>
            <span class="link-item">知识库</span>
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
import { Tools, TrendCharts, Money, DocumentCopy } from '@element-plus/icons-vue'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* ========== 顶部欢迎区 ========== */
.hero-section {
  padding: 80px 20px 60px;
  text-align: center;
  color: #ffffff;

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-logo {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 20px;

    svg {
      width: 48px;
      height: 48px;
    }
  }

  .hero-title {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 16px;
    letter-spacing: -1px;
  }

  .hero-subtitle {
    font-size: 24px;
    font-weight: 500;
    margin: 0 0 16px;
    opacity: 0.95;
  }

  .hero-description {
    font-size: 16px;
    margin: 0;
    opacity: 0.85;
    line-height: 1.6;
  }
}

/* ========== 功能模块卡片 ========== */
.features-section {
  padding: 40px 20px;
}

.features-container {
  max-width: 1200px;
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

  &.stock {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.accounting {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.blog {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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
  .hero-section {
    padding: 60px 20px 40px;

    .hero-logo {
      width: 64px;
      height: 64px;
      margin-bottom: 20px;

      svg {
        width: 40px;
        height: 40px;
      }
    }

    .hero-title {
      font-size: 36px;
    }

    .hero-subtitle {
      font-size: 20px;
    }

    .hero-description {
      font-size: 15px;
    }
  }

  .features-section {
    padding: 24px 16px;
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
  .hero-section {
    padding: 48px 16px 32px;

    .hero-title {
      font-size: 32px;
    }

    .hero-subtitle {
      font-size: 18px;
    }
  }

  .feature-card {
    padding: 20px;
  }
}

/* ========== PWA Standalone 模式 ========== */
html.standalone-mode {
  .home-page {
    min-height: 100dvh; /* 使用动态视口高度 */
  }

  @media (max-width: 768px) {
    .hero-section {
      padding-top: calc(60px + env(safe-area-inset-top));
    }

    .home-footer {
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
    }
  }
}
</style>
