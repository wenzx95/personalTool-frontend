<template>
  <div class="blog-detail-page" v-loading="loading">
    <div v-if="blog" class="detail-layout" :class="{ 'sidebar-hidden': !showToc }">
      <!-- 侧边栏 - 目录 -->
      <aside class="detail-sidebar" v-show="showToc">
        <div class="toc-container" v-if="blog.content">
          <div class="toc-header">
            <div class="toc-title">目录</div>
            <el-button
              link
              size="small"
              @click="showToc = false"
              class="toc-close-btn"
              title="隐藏目录"
            >
              <el-icon><Hide /></el-icon>
            </el-button>
          </div>
          <MdCatalog
            :modelValue="blog.content"
            :theme="tocTheme"
            :heading="false"
          />
        </div>
      </aside>

      <!-- 浮动显示目录按钮 -->
      <el-button
        v-show="!showToc"
        class="show-toc-btn"
        type="primary"
        circle
        size="large"
        @click="showToc = true"
        title="显示目录"
      >
        <el-icon><Menu /></el-icon>
      </el-button>

      <!-- 主内容区 -->
      <article class="main-content">
        <!-- 文章头部 -->
        <header class="article-header">
          <div class="header-tags">
            <el-tag v-if="blog.isTop === 1" type="danger" size="small" effect="plain">置顶</el-tag>
            <el-tag v-if="blog.isRecommended === 1" type="warning" size="small" effect="plain">推荐</el-tag>
            <el-tag v-if="blog.category" type="info" size="small" effect="plain">{{ blog.category }}</el-tag>
          </div>

          <h1 class="article-title">{{ blog.title }}</h1>

          <div class="article-meta">
            <div class="author-section">
              <div class="author-avatar">
                {{ blog.authorName?.charAt(0) || '?' }}
              </div>
              <div class="author-info">
                <div class="author-name">{{ blog.authorName || '未知作者' }}</div>
                <div class="publish-time">{{ formatDate(blog.publishTime || blog.createTime) }}</div>
              </div>
            </div>
            <div class="meta-stats">
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ blog.viewCount || 0 }} 阅读
              </span>
            </div>
          </div>

          <!-- 标签 -->
          <div class="article-tags" v-if="blog.tags && blog.tags.length > 0">
            <el-tag
              v-for="tag in blog.tags.slice(0, 10)"
              :key="tag"
              size="small"
              type="info"
              plain
              class="tag-item"
            >
              #{{ tag }}
            </el-tag>
          </div>
        </header>

        <!-- 封面图 -->
        <div class="article-cover" v-if="blog.coverImage">
          <img :src="blog.coverImage" :alt="blog.title" />
        </div>

        <!-- 摘要 -->
        <div class="article-summary" v-if="blog.summary">
          <div class="summary-content">
            <el-icon class="summary-icon"><InfoFilled /></el-icon>
            <span>{{ blog.summary }}</span>
          </div>
        </div>

        <!-- 文章内容 -->
        <div class="article-content">
          <MdPreview :modelValue="blog.content" />
        </div>
      </article>
    </div>

    <el-empty v-else-if="!loading" description="文章不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, InfoFilled, Hide, Menu } from '@element-plus/icons-vue'
import { MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { getBlogDetail, type Blog } from '@/api/blog'

const route = useRoute()
const loading = ref(false)
const blog = ref<Blog | null>(null)
const showToc = ref(true)

const tocTheme = computed(() => 'light')

const fetchBlogDetail = async () => {
  const id = Number(route.params.id)
  if (!id) {
    ElMessage.error('文章ID无效')
    return
  }

  loading.value = true
  try {
    blog.value = await getBlogDetail(id)
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章详情失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}分钟前发布`
    }
    return `${hours}小时前发布`
  } else if (days < 30) {
    return `${days}天前发布`
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
}

onMounted(() => {
  fetchBlogDetail()
})
</script>

<style scoped lang="scss">
.blog-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.detail-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  align-items: start;
  transition: all 0.3s ease;

  &.sidebar-hidden {
    grid-template-columns: 1fr;
  }
}

/* 主内容区 */
.main-content {
  background: #fff;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 文章头部 */
.article-header {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e4e7ed;
}

.header-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.article-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  line-height: 1.3;
  letter-spacing: -0.5px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.publish-time {
  font-size: 13px;
  color: #909399;
}

.meta-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #909399;

  .el-icon {
    font-size: 16px;
  }
}

.article-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .tag-item {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
}

/* 封面图 */
.article-cover {
  margin-bottom: 32px;
  border-radius: 8px;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

/* 摘要 */
.article-summary {
  margin-bottom: 32px;
  padding: 20px 24px;
  background: #f8f9fa;
  border-left: 4px solid #409eff;
  border-radius: 4px;

  .summary-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 15px;
    line-height: 1.8;
    color: #606266;
  }

  .summary-icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 18px;
    color: #409eff;
  }
}

/* 文章内容 - 优化阅读体验 */
.article-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';

  :deep(.md-preview) {
    font-size: 16px;
    line-height: 1.85;
    color: #2c3e50;

    /* 标题样式 */
    .md-preview-h1,
    .md-preview-h2,
    .md-preview-h3,
    .md-preview-h4,
    .md-preview-h5,
    .md-preview-h6 {
      font-weight: 700;
      margin-top: 32px;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .md-preview-h1 {
      font-size: 28px;
      margin-top: 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
    }

    .md-preview-h2 {
      font-size: 24px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f0f0f0;
    }

    .md-preview-h3 {
      font-size: 20px;
    }

    /* 段落 */
    p {
      margin: 0 0 16px 0;
    }

    /* 列表 */
    ul,
    ol {
      margin: 16px 0;
      padding-left: 24px;
    }

    li {
      margin: 8px 0;
    }

    /* 引用 */
    blockquote {
      margin: 16px 0;
      padding: 12px 20px;
      background: #f8f9fa;
      border-left: 4px solid #409eff;
      border-radius: 4px;
      color: #606266;
    }

    /* 代码块 */
    pre {
      margin: 16px 0;
      border-radius: 6px;
      overflow-x: auto;
    }

    code {
      font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: 14px;
    }

    /* 行内代码 */
    :not(pre) > code {
      padding: 2px 6px;
      background: #f5f7fa;
      border-radius: 3px;
      color: #e74c3c;
      font-size: 0.9em;
    }

    /* 表格 */
    table {
      margin: 16px 0;
      border-collapse: collapse;
      width: 100%;
    }

    th,
    td {
      padding: 12px;
      border: 1px solid #e4e7ed;
      text-align: left;
    }

    th {
      background: #f5f7fa;
      font-weight: 600;
    }

    /* 图片 */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 16px 0;
    }

    /* 链接 */
    a {
      color: #409eff;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: #66b1ff;
        text-decoration: underline;
      }
    }

    /* 分隔线 */
    hr {
      margin: 32px 0;
      border: none;
      border-top: 1px solid #e4e7ed;
    }
  }
}

/* 侧边栏 - 目录 */
.detail-sidebar {
  position: sticky;
  top: 80px;
  transition: all 0.3s ease;
}

/* 显示目录按钮 */
.show-toc-btn {
  position: fixed;
  left: 20px;
  bottom: 80px;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.5);
  }
}

.toc-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.toc-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.toc-close-btn {
  padding: 4px;
  color: #909399;
  transition: all 0.2s;

  &:hover {
    color: #409eff;
  }
}

:deep(.md-catalog) {
  .md-catalog-item {
    margin: 8px 0;

    a {
      color: #606266;
      font-size: 14px;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        color: #409eff;
      }

      &.active {
        color: #409eff;
        font-weight: 600;
      }
    }

    &.md-catalog-h2 {
      padding-left: 0;
    }

    &.md-catalog-h3 {
      padding-left: 16px;
    }

    &.md-catalog-h4 {
      padding-left: 32px;
    }
  }
}

/* 响应式 */
@media (max-width: 1024px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-sidebar {
    display: none;
  }

  .show-toc-btn {
    left: 16px;
    bottom: 60px;
  }
}

@media (max-width: 768px) {
  .blog-detail-page {
    padding: 0;
  }

  .detail-layout {
    padding: 20px 16px;
    padding-top: calc(20px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  }

  .main-content {
    padding: 24px 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  /* 文章头部优化 */
  .article-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
  }

  .header-tags {
    margin-bottom: 12px;

    :deep(.el-tag) {
      font-size: 12px;
      padding: 4px 10px;
      height: auto;
      border-radius: 6px;
    }
  }

  .article-title {
    font-size: 26px;
    line-height: 1.3;
    margin-bottom: 16px;
  }

  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
  }

  .author-section {
    gap: 10px;
  }

  .author-avatar {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .author-info {
    gap: 2px;
  }

  .author-name {
    font-size: 14px;
  }

  .publish-time {
    font-size: 12px;
  }

  .meta-stats {
    gap: 16px;
    width: 100%;

    .stat-item {
      font-size: 13px;

      .el-icon {
        font-size: 15px;
      }
    }
  }

  .article-tags {
    gap: 8px;

    .tag-item {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
    }
  }

  /* 封面图优化 */
  .article-cover {
    margin-bottom: 24px;
    border-radius: 12px;
  }

  /* 摘要优化 */
  .article-summary {
    margin-bottom: 24px;
    padding: 16px 20px;
    border-radius: 8px;
    border-left-width: 4px;

    .summary-content {
      font-size: 14px;
      line-height: 1.7;
      gap: 8px;
    }

    .summary-icon {
      font-size: 16px;
      margin-top: 1px;
    }
  }

  /* Markdown内容优化 */
  .article-content {
    :deep(.md-preview) {
      font-size: 16px;
      line-height: 1.8;

      /* 标题移动端优化 */
      .md-preview-h1 {
        font-size: 24px;
        margin-top: 28px;
        margin-bottom: 14px;
        padding-bottom: 8px;
      }

      .md-preview-h2 {
        font-size: 20px;
        margin-top: 24px;
        margin-bottom: 12px;
        padding-bottom: 6px;
      }

      .md-preview-h3 {
        font-size: 18px;
        margin-top: 20px;
        margin-bottom: 10px;
      }

      .md-preview-h4 {
        font-size: 16px;
        margin-top: 18px;
        margin-bottom: 10px;
      }

      /* 段落 */
      p {
        margin: 0 0 16px 0;
      }

      /* 列表 */
      ul,
      ol {
        margin: 14px 0;
        padding-left: 20px;
      }

      li {
        margin: 6px 0;
      }

      /* 引用块 */
      blockquote {
        margin: 14px 0;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 15px;
      }

      /* 代码块 */
      pre {
        margin: 14px 0;
        padding: 12px;
        font-size: 13px;
        border-radius: 6px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      code {
        font-size: 13px;
      }

      /* 行内代码 */
      :not(pre) > code {
        padding: 2px 6px;
        font-size: 0.9em;
      }

      /* 表格横向滚动 */
      table {
        margin: 14px 0;
        font-size: 14px;
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        white-space: nowrap;

        th,
        td {
          padding: 10px 8px;
          min-width: 80px;
        }
      }

      /* 图片优化 */
      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 14px 0;
      }

      /* 分隔线 */
      hr {
        margin: 28px 0;
      }
    }
  }

  /* 浮动按钮优化 */
  .show-toc-btn {
    left: 16px;
    bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    width: 48px;
    height: 48px;

    :deep(.el-icon) {
      font-size: 20px;
    }
  }

  /* 空状态优化 */
  :deep(.el-empty) {
    padding: 80px 20px;

    .el-empty__description {
      font-size: 15px !important;
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .detail-layout {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
  }

  .main-content {
    padding: 20px 16px;
    border-radius: 12px;
  }

  .article-header {
    margin-bottom: 24px;
    padding-bottom: 20px;
  }

  .header-tags {
    margin-bottom: 10px;
  }

  .article-title {
    font-size: 22px;
    line-height: 1.3;
    margin-bottom: 12px;
  }

  .article-meta {
    gap: 12px;
    margin-bottom: 12px;
  }

  .author-avatar {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .author-name {
    font-size: 13px;
  }

  .publish-time {
    font-size: 11px;
  }

  .meta-stats .stat-item {
    font-size: 12px;
  }

  .article-cover {
    margin-bottom: 20px;
    border-radius: 10px;
  }

  .article-summary {
    margin-bottom: 20px;
    padding: 14px 16px;

    .summary-content {
      font-size: 13px;
    }

    .summary-icon {
      font-size: 15px;
    }
  }

  .article-content {
    :deep(.md-preview) {
      font-size: 15px;
      line-height: 1.75;

      .md-preview-h1 {
        font-size: 22px;
        margin-top: 24px;
      }

      .md-preview-h2 {
        font-size: 18px;
        margin-top: 20px;
      }

      .md-preview-h3 {
        font-size: 16px;
        margin-top: 18px;
      }

      p {
        margin: 0 0 14px 0;
      }

      ul,
      ol {
        margin: 12px 0;
        padding-left: 18px;
      }

      blockquote {
        margin: 12px 0;
        padding: 10px 14px;
        font-size: 14px;
      }

      pre {
        margin: 12px 0;
        padding: 10px;
        font-size: 12px;
      }

      table {
        margin: 12px 0;
        font-size: 13px;

        th,
        td {
          padding: 8px 6px;
        }
      }

      img {
        margin: 12px 0;
      }

      hr {
        margin: 24px 0;
      }
    }
  }

  .show-toc-btn {
    left: 12px;
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    width: 44px;
    height: 44px;

    :deep(.el-icon) {
      font-size: 18px;
    }
  }

  :deep(.el-empty) {
    padding: 60px 16px;
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .detail-layout {
      padding-top: calc(24px + env(safe-area-inset-top, 0px));
    }

    .show-toc-btn {
      bottom: calc(84px + env(safe-area-inset-bottom, 0px));
    }
  }

  @media (max-width: 430px) {
    .show-toc-btn {
      bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }
  }
}
</style>
