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
  overflow-y: auto;
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
  height: 500px;
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

/* 响应式 */
@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
    padding: 0 16px 24px;
  }

  .chapter-sidebar {
    position: static;
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .kb-info {
    padding: 16px;
    margin-top: -40px;
  }

  .info-container {
    padding: 16px;
  }

  .kb-title {
    font-size: 22px;
  }

  .kb-stats {
    gap: 16px;
  }

  .content-main {
    padding: 20px;
  }

  .content-title {
    font-size: 22px;
  }
}
</style>
