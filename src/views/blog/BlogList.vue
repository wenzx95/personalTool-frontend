<template>
  <div class="blog-list-container">
    <!-- 顶部Header -->
    <div class="blog-header">
      <div class="header-content">
        <h1 class="blog-title">技术博客</h1>
        <p class="blog-subtitle">缠论技术分析与思考</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文章标题或内容..."
          :prefix-icon="Search"
          class="search-input"
          clearable
          @change="handleSearch"
        />
        <el-select
          v-model="selectedCategory"
          placeholder="全部分类"
          clearable
          @change="handleSearch"
          class="category-select"
        >
          <el-option label="全部分类" value="" />
          <el-option label="缠论基础" value="缠论基础" />
          <el-option label="走势分析" value="走势分析" />
          <el-option label="实战案例" value="实战案例" />
          <el-option label="技术总结" value="技术总结" />
        </el-select>
      </div>
      <div class="filter-right">
        <el-radio-group v-model="orderBy" @change="handleSearch" class="sort-group">
          <el-radio-button label="publishTime">最新发布</el-radio-button>
          <el-radio-button label="viewCount">最多浏览</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 文章列表 -->
    <div v-loading="loading" class="article-list">
      <el-empty v-if="!loading && blogList.length === 0" description="暂无文章" />

      <article
        v-for="blog in blogList"
        :key="blog.id"
        class="article-item"
        @click="goToDetail(blog.id!)"
      >
        <div class="article-main">
          <div class="article-tags">
            <el-tag v-if="blog.isTop === 1" type="danger" size="small" effect="plain">置顶</el-tag>
            <el-tag v-if="blog.isRecommended === 1" type="warning" size="small" effect="plain">推荐</el-tag>
            <el-tag v-if="blog.category" type="info" size="small" effect="plain">{{ blog.category }}</el-tag>
          </div>

          <h2 class="article-title">{{ blog.title }}</h2>

          <p class="article-summary">{{ blog.summary || '暂无摘要' }}</p>

          <div class="article-footer">
            <div class="author-info">
              <span class="author-name">{{ blog.authorName || '未知作者' }}</span>
            </div>
            <div class="meta-info">
              <span class="meta-item">
                <el-icon><View /></el-icon>
                {{ blog.viewCount || 0 }} 阅读
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(blog.publishTime || blog.createTime) }}
              </span>
            </div>
          </div>

          <div class="article-tags-bottom" v-if="blog.tags && blog.tags.length > 0">
            <el-tag
              v-for="tag in blog.tags.slice(0, 5)"
              :key="tag"
              size="small"
              type="info"
              plain
              class="tag-item"
            >
              #{{ tag }}
            </el-tag>
          </div>
        </div>
      </article>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, View, Calendar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getBlogList, type Blog, type BlogQueryParams } from '@/api/blog'

const router = useRouter()
const loading = ref(false)
const blogList = ref<Blog[]>([])
const total = ref(0)

const searchKeyword = ref('')
const selectedCategory = ref('')
const orderBy = ref<'publishTime' | 'viewCount'>('publishTime')
const pageNum = ref(1)
const pageSize = ref(20)

const fetchBlogs = async () => {
  loading.value = true
  try {
    const params: BlogQueryParams = {
      keyword: searchKeyword.value || undefined,
      category: selectedCategory.value || undefined,
      orderBy: orderBy.value,
      orderDirection: 'desc',
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }

    const result = await getBlogList(params)
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

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchBlogs()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchBlogs()
}

const goToDetail = (id: number) => {
  router.push(`/blog/${id}`)
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
      return `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
}

onMounted(() => {
  fetchBlogs()
})
</script>

<style scoped lang="scss">
.blog-list-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 顶部Header */
.blog-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e4e7ed;
}

.blog-title {
  font-size: 48px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.blog-subtitle {
  font-size: 18px;
  color: #909399;
  margin: 0;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.filter-left {
  display: flex;
  gap: 16px;
  flex: 1;
}

.search-input {
  width: 280px;
}

.category-select {
  width: 140px;
}

.sort-group {
  :deep(.el-radio-button__inner) {
    padding: 8px 16px;
  }
}

/* 文章列表 */
.article-list {
  min-height: 400px;
}

.article-item {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.article-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.article-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.4;

  &:hover {
    color: #409eff;
  }
}

.article-summary {
  font-size: 15px;
  line-height: 1.8;
  color: #606266;
  margin: 0;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.author-info {
  .author-name {
    font-size: 14px;
    color: #909399;
  }
}

.meta-info {
  display: flex;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #909399;

  .el-icon {
    font-size: 16px;
  }
}

.article-tags-bottom {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .tag-item {
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding: 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .blog-list-container {
    padding: 20px 12px;
  }

  .blog-title {
    font-size: 36px;
  }

  .filter-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .filter-left {
    flex-direction: column;
  }

  .search-input,
  .category-select {
    width: 100%;
  }

  .article-title {
    font-size: 18px;
  }

  .article-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
