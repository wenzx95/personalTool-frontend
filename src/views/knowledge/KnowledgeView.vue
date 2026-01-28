<template>
  <div class="knowledge-view-page" v-loading="loading">
    <!-- 知识库头部 -->
    <header v-if="knowledgeBase" class="kb-header">
      <div class="kb-cover">
        <img v-if="knowledgeBase.coverImage" :src="knowledgeBase.coverImage" :alt="knowledgeBase.title" />
        <div v-else class="kb-cover-placeholder">
          <el-icon class="placeholder-icon"><Folder /></el-icon>
        </div>
        <div class="cover-overlay"></div>
      </div>

      <div class="kb-info">
        <div class="info-container">
          <div class="kb-meta">
            <h1 class="kb-title">{{ knowledgeBase.title }}</h1>
            <el-tag v-if="knowledgeBase.category" type="info" plain>{{ knowledgeBase.category }}</el-tag>
          </div>

          <p v-if="knowledgeBase.description" class="kb-description">{{ knowledgeBase.description }}</p>

          <div class="kb-stats">
            <div class="stat-item">
              <el-icon><Document /></el-icon>
              <span>{{ knowledgeBase.totalChapters || 0 }} 章节</span>
            </div>
            <div class="stat-item">
              <el-icon><Notebook /></el-icon>
              <span>{{ formatWordCount(knowledgeBase.totalWords) }}</span>
            </div>
            <div class="stat-item">
              <el-icon><View /></el-icon>
              <span>{{ knowledgeBase.viewCount || 0 }} 浏览</span>
            </div>
            <div class="stat-item">
              <el-icon><User /></el-icon>
              <span>{{ knowledgeBase.authorName || '匿名' }}</span>
            </div>
            <div class="stat-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatRelativeTime(knowledgeBase.updateTime) }}</span>
            </div>
          </div>

          <div v-if="knowledgeBase.tags && knowledgeBase.tags.length > 0" class="kb-tags">
            <el-tag
              v-for="tag in knowledgeBase.tags"
              :key="tag"
              size="small"
              class="tag-item"
            >
              #{{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </header>

    <!-- 内容区域 -->
    <div class="content-container">
      <!-- 左侧章节树 -->
      <aside class="chapter-sidebar">
        <div class="sidebar-header">
          <div class="header-title-row">
            <h3>目录</h3>
            <el-button
              v-if="canEdit"
              type="primary"
              size="small"
              @click="goToCreateChapter"
            >
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索章节..."
            prefix-icon="Search"
            size="small"
            clearable
            class="search-input"
          />
          <div v-if="canEdit" class="drag-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>拖拽章节可调整排序</span>
          </div>
        </div>

        <div class="chapter-tree" v-if="filteredChapterTree.length > 0">
          <el-tree
            :data="filteredChapterTree"
            :props="{ label: 'title', children: 'children' }"
            node-key="id"
            :default-expand-all="false"
            :highlight-current="true"
            :expand-on-click-node="false"
            :draggable="canEdit"
            :allow-drag="allowDrag"
            :allow-drop="allowDrop"
            @node-click="handleNodeClick"
            @node-drop="handleNodeDrop"
            class="tree-component"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="node-title">{{ node.label }}</span>
                <el-icon v-if="data.contentType === 'reference'" class="ref-icon" title="引用博客">
                  <Link />
                </el-icon>
                <span v-if="data.wordCount" class="word-count">{{ formatWordCount(data.wordCount) }}</span>
              </div>
            </template>
          </el-tree>
        </div>

        <el-empty v-else description="暂无章节" :image-size="80" />
      </aside>

      <!-- 右侧内容区 -->
      <main class="content-main">
        <!-- 面包屑导航 -->
        <div v-if="currentChapterPath.length > 0" class="breadcrumb-bar">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in currentChapterPath"
              :key="item.id"
              :class="{ active: item.id === currentChapter?.id }"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <el-button
            v-if="canEdit && currentChapter"
            type="primary"
            size="small"
            @click="goToEditChapter"
            class="edit-btn"
          >
            <el-icon><Edit /></el-icon>
            编辑章节
          </el-button>
        </div>

        <!-- 章节内容 -->
        <div v-if="currentChapter" class="chapter-content">
          <h1 class="content-title">{{ currentChapter.title }}</h1>

          <div v-if="currentChapter.contentType === 'reference'" class="reference-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>此章节引用了博客：{{ currentChapter.blogTitle }}</span>
          </div>

          <MdPreview
            v-if="currentChapter.content"
            :modelValue="processedContent"
            class="markdown-preview"
          />
          <el-empty v-else description="此章节暂无内容" />
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>请从左侧目录选择章节查看内容</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import {
  Folder,
  Document,
  Notebook,
  View,
  User,
  Clock,
  Link,
  InfoFilled,
  Plus,
  Edit
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  getKnowledgeBaseDetail,
  getChapterTree,
  getChapterDetail,
  getChapterPath,
  moveChapter,
  type KnowledgeBase,
  type ChapterTree,
  type Chapter
} from '@/api/knowledge'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const knowledgeBase = ref<KnowledgeBase>()
const chapterTree = ref<ChapterTree[]>([])
const currentChapter = ref<Chapter>()
const currentChapterPath = ref<Chapter[]>([])
const searchKeyword = ref('')

// 判断当前用户是否是知识库作者
const isOwner = computed(() => {
  if (!userStore.user || !knowledgeBase.value) return false
  return userStore.user.id === String(knowledgeBase.value.authorId)
})

// 是否可编辑（作者且已登录）
const canEdit = computed(() => isOwner.value && userStore.isLoggedIn)

// 过滤章节树（搜索功能）
const filteredChapterTree = computed(() => {
  if (!searchKeyword.value) {
    return chapterTree.value
  }

  const filterTree = (nodes: ChapterTree[]): ChapterTree[] => {
    return nodes.reduce((acc: ChapterTree[], node) => {
      const matchesSearch = node.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
      const filteredChildren = node.children ? filterTree(node.children) : []

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        })
      }

      return acc
    }, [])
  }

  return filterTree(chapterTree.value)
})

const fetchKnowledgeBaseDetail = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const [kb, tree] = await Promise.all([
      getKnowledgeBaseDetail(id),
      getChapterTree(id)
    ])

    knowledgeBase.value = kb
    chapterTree.value = tree

    // 如果有章节，默认展开第一个章节
    if (tree.length > 0) {
      await handleNodeClick(tree[0])
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取知识库详情失败')
  } finally {
    loading.value = false
  }
}

const handleNodeClick = async (node: ChapterTree) => {
  try {
    const kbId = Number(route.params.id)
    const [chapter, path] = await Promise.all([
      getChapterDetail(kbId, node.id),
      getChapterPath(kbId, node.id)
    ])
    currentChapter.value = chapter
    currentChapterPath.value = path
  } catch (error: any) {
    ElMessage.error(error.message || '获取章节内容失败')
  }
}

// 拖拽相关函数
const allowDrag = (node: ChapterTree) => {
  // 允许所有节点拖拽
  return true
}

const allowDrop = (draggingNode: ChapterTree, dropNode: ChapterTree, type: 'prev' | 'inner' | 'next') => {
  // 允许拖拽到任何位置（后端会验证）
  return true
}

const handleNodeDrop = async (draggingNode: ChapterTree, dropNode: ChapterTree, position: 'before' | 'after' | 'inner') => {
  if (!canEdit.value) {
    ElMessage.warning('只有知识库作者才能拖拽排序')
    return
  }

  try {
    const kbId = Number(route.params.id)
    const newParentId = position === 'inner' ? dropNode.id : dropNode.parentId || 0

    // 计算新排序位置
    let newOrder = 0
    if (position === 'inner') {
      // 拖拽到节点内部，作为第一个子节点
      newOrder = 0
    } else if (position === 'before') {
      // 拖拽到节点之前
      newOrder = (dropNode.sortOrder || 0) - 1
    } else {
      // 拖拽到节点之后
      newOrder = (dropNode.sortOrder || 0) + 1
    }

    await moveChapter(kbId, draggingNode.id, { newParentId, newOrder })
    ElMessage.success('章节移动成功')

    // 重新加载章节树
    const tree = await getChapterTree(kbId)
    chapterTree.value = tree
  } catch (error: any) {
    ElMessage.error(error.message || '章节移动失败')
    // 失败时重新加载树以恢复状态
    const kbId = Number(route.params.id)
    const tree = await getChapterTree(kbId)
    chapterTree.value = tree
  }
}

const goToCreateChapter = () => {
  const kbId = Number(route.params.id)
  router.push(`/admin/knowledge/${kbId}/chapter/edit`)
}

const goToEditChapter = () => {
  if (!currentChapter.value) return
  const kbId = Number(route.params.id)
  router.push(`/admin/knowledge/${kbId}/chapter/edit/${currentChapter.value.id}`)
}

const formatWordCount = (count?: number) => {
  if (!count) return '0 字'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万字'
  }
  return count + '字'
}

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}月前`
  return `${Math.floor(days / 365)}年前`
}

// 处理内容，将语雀图片链接替换为代理链接
const processedContent = computed(() => {
  if (!currentChapter.value?.content) return ''

  let content = currentChapter.value.content

  // 匹配语雀CDN图片链接: ![alt](https://cdn.nlark.com/...)
  content = content.replace(
    /!\[(.*?)\]\((https:\/\/cdn\.nlark\.com\/yuque\/[^)]+)\)/g,
    (match, alt, url) => {
      const encodedUrl = encodeURIComponent(url)
      return `![${alt}](/api/images/proxy?url=${encodedUrl})`
    }
  )

  return content
})

onMounted(() => {
  fetchKnowledgeBaseDetail()
})
</script>

<style scoped lang="scss">
.knowledge-view-page {
  min-height: 100vh;
  background: #f5f7fa;
  overflow: visible;
}

/* 知识库头部 */
.kb-header {
  background: #fff;
  padding: 0;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.kb-cover {
  position: relative;
  height: 240px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%);
  }
}

.kb-cover-placeholder {
  height: 240px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  .placeholder-icon {
    font-size: 80px;
    color: rgba(255, 255, 255, 0.3);
  }
}

.kb-info {
  position: relative;
  padding: 32px;
  margin-top: -60px;
}

.info-container {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.kb-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.kb-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.kb-description {
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.kb-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #909399;

  .el-icon {
    font-size: 16px;
  }
}

.kb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tag-item {
    background: #f0f2f5;
    border: none;
    color: #606266;
  }
}

/* 内容区域 */
.content-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 32px;
  display: flex;
  gap: 24px;
}

/* 左侧章节树 */
.chapter-sidebar {
  width: 320px;
  flex-shrink: 0;
  align-self: flex-start;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 20px;
  height: 350px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.sidebar-header {
  margin-bottom: 16px;

  .header-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .search-input {
    width: 100%;
    margin-bottom: 8px;
  }

  .drag-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 6px;
    color: #1890ff;
    font-size: 12px;

    .el-icon {
      font-size: 14px;
      flex-shrink: 0;
    }

    span {
      flex: 1;
    }
  }
}

.chapter-tree {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;

  :deep(.el-tree) {
    background: transparent;
  }

  :deep(.el-tree-node__content) {
    height: 36px;
    border-radius: 6px;

    &:hover {
      background: #f5f7fa;
    }
  }

  :deep(.is-current > .el-tree-node__content) {
    background: #e6f7ff;
    color: #1890ff;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  width: 100%;

  .node-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ref-icon {
    flex-shrink: 0;
    font-size: 14px;
    color: #409eff;
  }

  .word-count {
    flex-shrink: 0;
    font-size: 12px;
    color: #909399;
  }
}

/* 右侧内容区 */
.content-main {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-height: calc(100vh - 300px);
}

.breadcrumb-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;

  :deep(.el-breadcrumb) {
    flex: 1;
  }

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }

    &.active .el-breadcrumb__inner {
      color: #303133;
      font-weight: 500;
    }
  }

  .edit-btn {
    flex-shrink: 0;
  }
}

.chapter-content {
  .content-title {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin: 0 0 24px 0;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;
  }
}

.markdown-preview {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;

  :deep(.md-preview) {
    padding: 0;
  }

  :deep(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 1em 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #e4e7ed;
  }

  :deep(h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin: 1em 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #f0f2f5;
  }

  :deep(h3) {
    font-size: 1.25em;
    font-weight: 600;
    margin: 1em 0;
  }

  :deep(p) {
    margin: 1em 0;
  }

  :deep(code) {
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #e96900;
  }

  :deep(pre) {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1em 0;

    code {
      background: transparent;
      padding: 0;
      color: #303133;
    }
  }

  :deep(blockquote) {
    border-left: 4px solid #409eff;
    padding-left: 16px;
    margin: 1em 0;
    color: #606266;
    background: #ecf5ff;
    padding: 12px 16px;
    border-radius: 4px;
  }

  :deep(ul), :deep(ol) {
    padding-left: 2em;
    margin: 1em 0;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 1em 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;

    th, td {
      border: 1px solid #e4e7ed;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: #f5f7fa;
      font-weight: 600;
    }
  }

  :deep(a) {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.reference-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  color: #1890ff;
  font-size: 14px;
  margin-bottom: 24px;
}

.markdown-body {
  color: #303133;
  line-height: 1.8;

  :deep(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 1em 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #e4e7ed;
  }

  :deep(h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin: 1em 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #f0f2f5;
  }

  :deep(h3) {
    font-size: 1.25em;
    font-weight: 600;
    margin: 1em 0;
  }

  :deep(p) {
    margin: 1em 0;
  }

  :deep(code) {
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  :deep(pre) {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1em 0;
  }

  :deep(blockquote) {
    border-left: 4px solid #409eff;
    padding-left: 16px;
    margin: 1em 0;
    color: #606266;
  }

  :deep(ul), :deep(ol) {
    padding-left: 2em;
    margin: 1em 0;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 1em 0;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #909399;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}

/* ============================================================
   移动端优化 - 平板和手机
   ============================================================ */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
    padding: 0 16px 24px;
  }

  .chapter-sidebar {
    width: 100%;
    position: static;
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  /* 页面容器优化 */
  .knowledge-view-page {
    background: #f7f8fa;
  }

  /* 知识库头部优化 */
  .kb-header {
    margin-bottom: 16px;
  }

  .kb-cover,
  .kb-cover-placeholder {
    height: 180px;
  }

  .kb-cover-placeholder {
    .placeholder-icon {
      font-size: 64px;
    }
  }

  .kb-info {
    padding: 12px;
    margin-top: -40px;
  }

  .info-container {
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  /* 知识库元信息优化 */
  .kb-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
  }

  .kb-title {
    font-size: 22px;
    line-height: 1.3;
  }

  /* 知识库描述优化 */
  .kb-description {
    font-size: 14px;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  /* 知识库统计优化 */
  .kb-stats {
    gap: 12px 16px;
    margin-bottom: 12px;
  }

  .stat-item {
    font-size: 13px;

    .el-icon {
      font-size: 16px;
    }
  }

  /* 知识库标签优化 */
  .kb-tags {
    gap: 6px;

    .tag-item {
      font-size: 12px;
      padding: 4px 10px;
      min-height: 28px;
      line-height: 20px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s;

      &:active {
        transform: scale(0.95);
      }
    }
  }

  /* 内容区域优化 */
  .content-container {
    padding: 0 12px 20px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  }

  /* 章节侧边栏优化 */
  .chapter-sidebar {
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    height: auto;
    max-height: 350px;
  }

  .sidebar-header {
    margin-bottom: 12px;

    .header-title-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;

      h3 {
        font-size: 16px;
      }

      .el-button {
        width: 100%;
        height: 44px;
        font-size: 15px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;

        .el-icon {
          font-size: 16px;
        }
      }
    }

    /* 搜索输入框优化 */
    .search-input {
      margin-bottom: 12px;

      :deep(.el-input__wrapper) {
        height: 44px !important;
        font-size: 16px !important;
        border-radius: 10px;
      }
    }

    .drag-tip {
      padding: 8px 12px;
      font-size: 12px;
      border-radius: 8px;

      .el-icon {
        font-size: 14px;
      }
    }
  }

  /* 章节树优化 */
  .chapter-tree {
    :deep(.el-tree-node__content) {
      height: 44px !important;
      border-radius: 8px;
      font-size: 15px;
      padding: 0 12px;

      &:active {
        background: #e6f7ff;
      }
    }

    :deep(.is-current > .el-tree-node__content) {
      background: #e6f7ff;
      color: #1890ff;
      font-weight: 500;
    }
  }

  .tree-node {
    .node-title {
      font-size: 15px;
    }

    .ref-icon {
      font-size: 16px;
    }

    .word-count {
      font-size: 12px;
    }
  }

  /* 空状态优化 */
  :deep(.el-empty) {
    padding: 40px 16px;

    .el-empty__description {
      font-size: 14px !important;
    }

    .el-empty__image {
      width: 80px !important;
      height: 80px !important;
    }
  }

  /* 右侧内容区优化 */
  .content-main {
    border-radius: 12px;
    padding: 20px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    min-height: auto;
  }

  /* 面包屑导航优化 */
  .breadcrumb-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 16px;

    :deep(.el-breadcrumb) {
      width: 100%;
      font-size: 14px;

      .el-breadcrumb__item {
        .el-breadcrumb__inner {
          font-size: 14px;
        }
      }
    }

    .edit-btn {
      width: 100%;
      height: 44px;
      font-size: 15px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      .el-icon {
        font-size: 16px;
      }
    }
  }

  /* 章节内容优化 */
  .chapter-content {
    .content-title {
      font-size: 22px;
      margin: 0 0 20px 0;
      padding-bottom: 12px;
    }
  }

  /* 引用提示优化 */
  .reference-tip {
    padding: 12px;
    font-size: 13px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  /* Markdown预览优化 */
  .markdown-preview {
    font-size: 16px;
    line-height: 1.8;

    :deep(h1) {
      font-size: 24px;
      margin-top: 28px;
      padding-bottom: 12px;
    }

    :deep(h2) {
      font-size: 20px;
      margin-top: 24px;
      padding-bottom: 10px;
    }

    :deep(h3) {
      font-size: 18px;
      margin-top: 20px;
    }

    :deep(p) {
      font-size: 16px;
      margin: 0.8em 0;
      line-height: 1.8;
    }

    :deep(code) {
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 4px;
    }

    :deep(pre) {
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      font-size: 13px;
      line-height: 1.6;

      code {
        font-size: 13px;
      }
    }

    :deep(blockquote) {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 15px;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 1.5em;
      margin: 0.8em 0;
    }

    :deep(img) {
      border-radius: 8px;
      margin: 1em 0;
    }

    /* 表格横向滚动优化 */
    :deep(table) {
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      white-space: nowrap;

      th, td {
        padding: 10px 8px;
        font-size: 14px;
        min-width: 80px;
      }
    }

    /* 链接优化 */
    :deep(a) {
      color: #3370ff;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-bottom-color 0.2s;

      &:active {
        border-bottom-color: #3370ff;
      }
    }
  }

  /* 空状态优化 */
  .empty-state {
    padding: 60px 20px;

    .empty-icon {
      font-size: 56px;
      margin-bottom: 12px;
    }

    p {
      font-size: 15px;
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .content-container {
    padding: 0 10px 16px;
    padding-top: calc(10px + env(safe-area-inset-top, 0px));
  }

  /* 知识库头部 */
  .kb-cover,
  .kb-cover-placeholder {
    height: 150px;
  }

  .kb-cover-placeholder {
    .placeholder-icon {
      font-size: 56px;
    }
  }

  .kb-info {
    padding: 10px;
    margin-top: -30px;
  }

  .info-container {
    padding: 14px;
    border-radius: 10px;
  }

  .kb-title {
    font-size: 20px;
  }

  .kb-description {
    font-size: 14px;
  }

  /* 知识库统计 */
  .kb-stats {
    gap: 10px 12px;
  }

  .stat-item {
    font-size: 12px;

    .el-icon {
      font-size: 14px;
    }
  }

  /* 知识库标签 */
  .kb-tags {
    .tag-item {
      font-size: 11px;
      padding: 4px 8px;
      min-height: 26px;
      border-radius: 4px;
    }
  }

  /* 章节侧边栏 */
  .chapter-sidebar {
    border-radius: 10px;
    padding: 14px;
    max-height: 320px;
  }

  .sidebar-header {
    margin-bottom: 10px;

    .header-title-row {
      gap: 10px;
      margin-bottom: 10px;

      h3 {
        font-size: 15px;
      }

      .el-button {
        height: 44px;
        font-size: 14px;
      }
    }

    .search-input {
      margin-bottom: 10px;

      :deep(.el-input__wrapper) {
        height: 44px !important;
        font-size: 16px !important;
        border-radius: 8px;
      }
    }

    .drag-tip {
      padding: 6px 10px;
      font-size: 11px;
      border-radius: 6px;
    }
  }

  /* 章节树 */
  .chapter-tree {
    :deep(.el-tree-node__content) {
      height: 44px !important;
      font-size: 14px;
      padding: 0 10px;
    }
  }

  .tree-node {
    .node-title {
      font-size: 14px;
    }

    .ref-icon {
      font-size: 14px;
    }

    .word-count {
      font-size: 11px;
    }
  }

  /* 内容区域 */
  .content-main {
    border-radius: 10px;
    padding: 16px 12px;
  }

  /* 面包屑导航 */
  .breadcrumb-bar {
    padding-bottom: 12px;
    margin-bottom: 12px;
    gap: 10px;

    :deep(.el-breadcrumb) {
      font-size: 13px;

      .el-breadcrumb__item {
        .el-breadcrumb__inner {
          font-size: 13px;
        }
      }
    }

    .edit-btn {
      height: 44px;
      font-size: 14px;
    }
  }

  /* 章节内容 */
  .chapter-content {
    .content-title {
      font-size: 20px;
      margin: 0 0 16px 0;
      padding-bottom: 10px;
    }
  }

  .reference-tip {
    padding: 10px 12px;
    font-size: 13px;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  /* Markdown预览 */
  .markdown-preview {
    font-size: 16px;

    :deep(h1) {
      font-size: 22px;
      margin-top: 24px;
    }

    :deep(h2) {
      font-size: 18px;
      margin-top: 20px;
    }

    :deep(h3) {
      font-size: 16px;
      margin-top: 18px;
    }

    :deep(p) {
      font-size: 16px;
    }

    :deep(code) {
      font-size: 13px;
    }

    :deep(pre) {
      padding: 10px;
      border-radius: 6px;
      font-size: 12px;

      code {
        font-size: 12px;
      }
    }

    :deep(blockquote) {
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 1.2em;
    }

    :deep(table) {
      th, td {
        padding: 8px 6px;
        font-size: 13px;
      }
    }
  }

  /* 空状态 */
  .empty-state {
    padding: 48px 16px;

    .empty-icon {
      font-size: 48px;
    }

    p {
      font-size: 14px;
    }
  }

  /* 章节树空状态 */
  :deep(.el-empty) {
    padding: 32px 12px;

    .el-empty__description {
      font-size: 13px !important;
    }

    .el-empty__image {
      width: 70px !important;
      height: 70px !important;
    }
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .knowledge-view-page {
      padding-top: env(safe-area-inset-top, 0px);
    }

    .content-container {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    }
  }
}
</style>
