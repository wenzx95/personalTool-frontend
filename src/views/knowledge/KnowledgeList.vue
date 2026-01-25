<template>
  <div class="knowledge-list-page">
    <div class="list-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">知识库</h1>
          <p class="page-subtitle">系统化的知识体系，助你深入理解缠论</p>
        </div>
        <el-button v-if="isLoggedIn" type="primary" size="large" @click="goToManage">
          <el-icon><Setting /></el-icon>
          管理知识库
        </el-button>
      </header>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-inputs">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索知识库名称、描述..."
            clearable
            @clear="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="selectedCategory" placeholder="全部分类" clearable class="category-select">
            <el-option label="全部分类" value="" />
            <el-option label="缠论基础" value="缠论基础" />
            <el-option label="走势分析" value="走势分析" />
            <el-option label="实战案例" value="实战案例" />
            <el-option label="技术总结" value="技术总结" />
          </el-select>
        </div>

        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <!-- 知识库卡片列表 -->
      <div class="knowledge-grid" v-loading="loading">
        <div
          v-for="kb in knowledgeList"
          :key="kb.id"
          class="knowledge-card"
          @click="goToView(kb.id!)"
        >
          <div v-if="kb.coverImage" class="card-cover">
            <img :src="kb.coverImage" :alt="kb.title" />
            <div class="cover-overlay"></div>
          </div>
          <div v-else class="card-cover-placeholder">
            <el-icon class="placeholder-icon"><Folder /></el-icon>
          </div>

          <div class="card-content">
            <div class="card-header">
              <h3 class="card-title">{{ kb.title }}</h3>
              <el-tag v-if="kb.category" size="small" type="info" plain>{{ kb.category }}</el-tag>
            </div>

            <p v-if="kb.description" class="card-description">{{ kb.description }}</p>

            <div v-if="kb.tags && kb.tags.length > 0" class="card-tags">
              <el-tag
                v-for="tag in kb.tags.slice(0, 3)"
                :key="tag"
                size="small"
                class="tag-item"
              >
                #{{ tag }}
              </el-tag>
              <span v-if="kb.tags.length > 3" class="more-tags">+{{ kb.tags.length - 3 }}</span>
            </div>

            <div class="card-stats">
              <div class="stat-item">
                <el-icon><Document /></el-icon>
                <span>{{ kb.totalChapters || 0 }} 章节</span>
              </div>
              <div class="stat-item">
                <el-icon><View /></el-icon>
                <span>{{ kb.viewCount || 0 }} 浏览</span>
              </div>
            </div>

            <div class="card-footer">
              <span class="author-name">{{ kb.authorName || '匿名' }}</span>
              <span class="update-time">{{ formatRelativeTime(kb.updateTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && knowledgeList.length === 0"
        description="暂无知识库"
        :image-size="120"
      />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Setting, Folder, Document, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getKnowledgeBaseList, type KnowledgeBase } from '@/api/knowledge'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const knowledgeList = ref<KnowledgeBase[]>([])
const total = ref(0)

const searchKeyword = ref('')
const selectedCategory = ref('')
const pageNum = ref(1)
const pageSize = ref(12)

const isLoggedIn = computed(() => userStore.isLoggedIn)

const fetchKnowledgeBases = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value || undefined,
      category: selectedCategory.value || undefined,
      isPublic: 1, // 只显示公开的知识库
      sortBy: 'updateTime' as const,
      sortOrder: 'desc' as const,
      page: pageNum.value,
      pageSize: pageSize.value
    }

    const result = await getKnowledgeBaseList(params)
    knowledgeList.value = result.items
    total.value = result.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取知识库列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchKnowledgeBases()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchKnowledgeBases()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchKnowledgeBases()
}

const goToView = (id: number) => {
  router.push(`/knowledge/${id}`)
}

const goToManage = () => {
  router.push('/admin/knowledge/list')
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

onMounted(() => {
  fetchKnowledgeBases()
})
</script>

<style scoped lang="scss">
.knowledge-list-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.filter-inputs {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 320px;
}

.category-select {
  width: 160px;
}

/* 知识库卡片网格 */
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.knowledge-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.card-cover {
  position: relative;
  height: 180px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  }
}

.card-cover-placeholder {
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  .placeholder-icon {
    font-size: 64px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.card-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;

  .tag-item {
    background: #f0f2f5;
    border: none;
    color: #606266;
  }

  .more-tags {
    font-size: 12px;
    color: #909399;
  }
}

.card-stats {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;

  .el-icon {
    font-size: 14px;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  margin-top: auto;
}

.author-name {
  font-size: 13px;
  color: #606266;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .list-container {
    padding: 20px 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 28px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-inputs {
    flex-direction: column;
  }

  .search-input,
  .category-select {
    width: 100%;
  }

  .knowledge-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
