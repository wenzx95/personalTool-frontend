<template>
  <div class="knowledge-management">
    <div class="management-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">知识库管理</h1>
          <p class="page-subtitle">管理你的知识库体系</p>
        </div>
        <div class="header-actions">
          <el-button type="default" size="large" @click="goToImport">
            <el-icon><Upload /></el-icon>
            导入知识库
          </el-button>
          <el-button type="primary" size="large" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            新建知识库
          </el-button>
        </div>
      </header>

      <!-- 筛选栏 -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-inputs">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索标题、描述..."
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

            <el-select v-model="selectedPublic" placeholder="全部可见性" clearable class="public-select">
              <el-option label="全部可见性" value="" />
              <el-option label="公开" :value="1" />
              <el-option label="私有" :value="0" />
            </el-select>
          </div>

          <div class="filter-actions">
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">全部知识库</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.publicCount }}</div>
          <div class="stat-label">已公开</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.privateCount }}</div>
          <div class="stat-label">私有</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalChapters }}</div>
          <div class="stat-label">总章节数</div>
        </div>
      </div>

      <!-- 知识库列表 -->
      <div class="knowledge-list-wrapper" v-loading="loading">
        <el-table
          :data="knowledgeList"
          stripe
          class="knowledge-table"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="title" label="知识库名称" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="title-cell">
                <el-image
                  v-if="row.coverImage"
                  :src="row.coverImage"
                  fit="cover"
                  class="cover-thumb"
                />
                <div class="title-content">
                  <div class="title-text">{{ row.title }}</div>
                  <div v-if="row.description" class="description-text">{{ row.description }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="category" label="分类" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.category" size="small" type="info" plain>{{ row.category }}</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column label="可见性" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.isPublic === 1 ? 'success' : 'info'"
                size="small"
                effect="plain"
              >
                {{ row.isPublic === 1 ? '公开' : '私有' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="章节统计" width="120" align="center">
            <template #default="{ row }">
              <span class="chapter-stats">
                {{ row.totalChapters || 0 }} 章 / {{ formatWordCount(row.totalWords) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="浏览量" width="90" align="center">
            <template #default="{ row }">
              <span class="view-count">{{ row.viewCount || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="260" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                link
                type="primary"
                @click="goToView(row.id!)"
                class="action-btn"
              >
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button
                size="small"
                link
                type="primary"
                @click="goToEdit(row.id!)"
                class="action-btn"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                size="small"
                link
                @click="handleTogglePublic(row)"
                class="action-btn"
              >
                <el-icon><Lock v-if="row.isPublic === 1" /><Unlock v-else /></el-icon>
                {{ row.isPublic === 1 ? '设为私有' : '设为公开' }}
              </el-button>
              <el-popconfirm title="确认删除此知识库及其所有章节？" @confirm="handleDelete(row.id!)">
                <template #reference>
                  <el-button size="small" link type="danger" class="action-btn">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && knowledgeList.length === 0" description="暂无知识库，点击「新建知识库」开始创建" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
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
import {
  Plus,
  Search,
  RefreshLeft,
  Edit,
  Delete,
  View,
  Lock,
  Unlock,
  Upload
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getMyKnowledgeBases,
  deleteKnowledgeBase,
  toggleKnowledgeBasePublic,
  type KnowledgeBase
} from '@/api/knowledge'

const router = useRouter()
const loading = ref(false)
const knowledgeList = ref<KnowledgeBase[]>([])
const total = ref(0)

const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedPublic = ref<number | ''>('')
const pageNum = ref(1)
const pageSize = ref(20)

// 统计信息
const stats = computed(() => {
  const publicCount = knowledgeList.value.filter(k => k.isPublic === 1).length
  const privateCount = knowledgeList.value.filter(k => k.isPublic === 0).length
  const totalChapters = knowledgeList.value.reduce((sum, k) => sum + (k.totalChapters || 0), 0)
  return {
    total: knowledgeList.value.length,
    publicCount,
    privateCount,
    totalChapters
  }
})

const fetchKnowledgeBases = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value || undefined,
      category: selectedCategory.value || undefined,
      isPublic: selectedPublic.value !== '' ? selectedPublic.value as number : undefined,
      sortBy: 'createTime' as const,
      sortOrder: 'desc' as const,
      page: pageNum.value,
      pageSize: pageSize.value
    }

    const result = await getMyKnowledgeBases(params)
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

const handleReset = () => {
  searchKeyword.value = ''
  selectedCategory.value = ''
  selectedPublic.value = ''
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

const goToCreate = () => {
  router.push('/admin/knowledge/edit')
}

const goToImport = () => {
  router.push('/admin/knowledge/import')
}

const goToEdit = (id: number) => {
  router.push(`/admin/knowledge/edit/${id}`)
}

const goToView = (id: number) => {
  router.push(`/knowledge/${id}`)
}

const handleTogglePublic = async (kb: KnowledgeBase) => {
  try {
    await toggleKnowledgeBasePublic(kb.id!)
    ElMessage.success(kb.isPublic === 1 ? '已设为私有' : '已设为公开')
    fetchKnowledgeBases()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteKnowledgeBase(id)
    ElMessage.success('删除成功')
    fetchKnowledgeBases()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

const formatWordCount = (count?: number) => {
  if (!count) return '0 字'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万字'
  }
  return count + '字'
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchKnowledgeBases()
})
</script>

<style scoped lang="scss">
.knowledge-management {
  min-height: 100vh;
  background: #f5f7fa;
}

.management-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 筛选栏 */
.filter-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.filter-row {
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
  width: 300px;
}

.category-select,
.public-select {
  width: 140px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

/* 知识库列表 */
.knowledge-list-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-height: 400px;
}

.knowledge-table {
  width: 100%;

  :deep(.el-table__row) {
    cursor: pointer;

    &:hover {
      background: #f5f7fa;
    }
  }

  :deep(.el-table__cell) {
    padding: 14px 0;
  }
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  flex-shrink: 0;
  object-fit: cover;
}

.title-content {
  flex: 1;
  min-width: 0;
}

.title-text {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.description-text {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
}

.chapter-stats {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.view-count {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .management-container {
    padding: 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-inputs {
    flex-direction: column;
  }

  .search-input,
  .category-select,
  .public-select {
    width: 100%;
  }

  .filter-actions {
    justify-content: flex-end;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
