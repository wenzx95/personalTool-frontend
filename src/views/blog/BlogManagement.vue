<template>
  <div class="blog-management">
    <div class="management-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">博客管理</h1>
          <p class="page-subtitle">管理你的博客文章</p>
        </div>
        <el-button type="primary" size="large" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          新建博客
        </el-button>
      </header>

      <!-- 筛选栏 -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-inputs">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索标题、内容..."
              clearable
              @clear="handleSearch"
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select v-model="selectedStatus" placeholder="全部状态" clearable class="status-select">
              <el-option label="全部状态" value="" />
              <el-option label="草稿" value="draft">
                <span class="status-option">
                  <span class="status-dot draft"></span>
                  草稿
                </span>
              </el-option>
              <el-option label="已发布" value="published">
                <span class="status-option">
                  <span class="status-dot published"></span>
                  已发布
                </span>
              </el-option>
            </el-select>

            <el-select v-model="selectedCategory" placeholder="全部分类" clearable class="category-select">
              <el-option label="全部分类" value="" />
              <el-option label="缠论基础" value="缠论基础" />
              <el-option label="走势分析" value="走势分析" />
              <el-option label="实战案例" value="实战案例" />
              <el-option label="技术总结" value="技术总结" />
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
          <div class="stat-label">全部文章</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.published }}</div>
          <div class="stat-label">已发布</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.draft }}</div>
          <div class="stat-label">草稿</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalViews }}</div>
          <div class="stat-label">总浏览量</div>
        </div>
      </div>

      <!-- 博客列表 -->
      <div class="blog-list-wrapper" v-loading="loading">
        <el-table
          :data="blogList"
          stripe
          class="blog-table"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="title-cell">
                <el-icon v-if="row.isTop === 1" class="top-icon" color="#f56c6c"><Top /></el-icon>
                <el-icon v-if="row.isRecommended === 1" class="rec-icon" color="#e6a23c"><Star /></el-icon>
                <span class="title-text">{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="category" label="分类" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.category" size="small" type="info" plain>{{ row.category }}</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'published' ? 'success' : 'info'"
                size="small"
                effect="plain"
              >
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="浏览" width="90" align="center">
            <template #default="{ row }">
              <span class="view-count">{{ row.viewCount || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="220" align="center" fixed="right">
            <template #default="{ row }">
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
                @click="handleToggleStatus(row)"
                class="action-btn"
              >
                <el-icon>
                  <component :is="row.status === 'draft' ? 'Promotion' : 'Download'" />
                </el-icon>
                {{ row.status === 'draft' ? '发布' : '下架' }}
              </el-button>
              <el-popconfirm title="确认删除这篇文章？" @confirm="handleDelete(row.id!)">
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

        <el-empty v-if="!loading && blogList.length === 0" description="暂无文章，点击「新建博客」开始创作" />
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
  Top,
  Star,
  Promotion,
  Download
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getMyBlogs, deleteBlog, publishBlog, unpublishBlog, type Blog } from '@/api/blog'

const router = useRouter()
const loading = ref(false)
const blogList = ref<Blog[]>([])
const total = ref(0)

const searchKeyword = ref('')
const selectedStatus = ref('')
const selectedCategory = ref('')
const pageNum = ref(1)
const pageSize = ref(20)

// 统计信息
const stats = computed(() => {
  const published = blogList.value.filter(b => b.status === 'published').length
  const draft = blogList.value.filter(b => b.status === 'draft').length
  const totalViews = blogList.value.reduce((sum, b) => sum + (b.viewCount || 0), 0)
  return {
    total: blogList.value.length,
    published,
    draft,
    totalViews
  }
})

const fetchBlogs = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value || undefined,
      status: selectedStatus.value || undefined,
      category: selectedCategory.value || undefined,
      orderBy: 'createTime' as const,
      orderDirection: 'desc' as const,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }

    const result = await getMyBlogs(params)
    blogList.value = result.items
    total.value = result.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取博客列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchBlogs()
}

const handleReset = () => {
  searchKeyword.value = ''
  selectedStatus.value = ''
  selectedCategory.value = ''
  pageNum.value = 1
  fetchBlogs()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchBlogs()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchBlogs()
}

const goToCreate = () => {
  router.push('/admin/blog/edit')
}

const goToEdit = (id: number) => {
  router.push(`/admin/blog/edit/${id}`)
}

const handleToggleStatus = async (blog: Blog) => {
  try {
    if (blog.status === 'draft') {
      await publishBlog(blog.id!)
      ElMessage.success('发布成功')
    } else {
      await unpublishBlog(blog.id!)
      ElMessage.success('已转为草稿')
    }
    fetchBlogs()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteBlog(id)
    ElMessage.success('删除成功')
    fetchBlogs()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
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
  fetchBlogs()
})
</script>

<style scoped lang="scss">
.blog-management {
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

.status-select,
.category-select {
  width: 140px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.draft {
    background: #909399;
  }

  &.published {
    background: #67c23a;
  }
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

/* 博客列表 */
.blog-list-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-height: 400px;
}

.blog-table {
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
  gap: 8px;
}

.top-icon,
.rec-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.title-text {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
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
  .status-select,
  .category-select {
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
