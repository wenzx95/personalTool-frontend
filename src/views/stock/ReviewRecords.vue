<template>
  <div class="review-records">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">复盘记录</h1>
        <p class="page-subtitle">全部市场复盘数据管理</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="goToCollection">
          <el-icon><Plus /></el-icon>
          新增复盘
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索日期、板块、笔记..."
            :prefix-icon="Search"
            clearable
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="marketStrengthFilter" placeholder="市场强弱" clearable>
            <el-option label="全部" value="" />
            <el-option label="极强" value="极强" />
            <el-option label="强" value="强" />
            <el-option label="偏强" value="偏强" />
            <el-option label="中性" value="中性" />
            <el-option label="偏弱" value="偏弱" />
            <el-option label="弱" value="弱" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- Table / Cards -->
    <div class="table-section">
      <!-- 移动端卡片布局 -->
      <div v-if="isMobile" class="mobile-cards" v-loading="loading">
        <div
          v-for="record in displayedReviewList"
          :key="record.id"
          class="record-card"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="date-info">
              <span class="date">{{ record.date }}</span>
              <el-tag
                v-if="record.market_strength"
                :type="getMarketStrengthTagType(record.market_strength)"
                size="small"
              >
                {{ record.market_strength }}
              </el-tag>
            </div>
            <span class="volume">{{ formatVolume(record.volume) }}</span>
          </div>

          <!-- 卡片主体 - 关键指标 -->
          <div class="card-metrics">
            <div class="metric-item">
              <span class="metric-label">红盘</span>
              <span class="metric-value text-red">{{ record.red_count }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">绿盘</span>
              <span class="metric-value text-green">{{ record.green_count }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">涨停</span>
              <span class="metric-value">{{ record.limit_up_count }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">连板率</span>
              <span class="metric-value">{{ record.continuous_limit_rate }}%</span>
            </div>
          </div>

          <!-- 高级数据（折叠） -->
          <el-collapse v-model="activeCollapse" class="card-collapse">
            <el-collapse-item title="查看更多数据" name="more">
              <div class="advanced-metrics">
                <div class="advanced-row">
                  <span class="adv-label">跌停</span>
                  <span class="adv-value">{{ record.limit_down_count }}</span>
                </div>
                <div class="advanced-row">
                  <span class="adv-label">2板</span>
                  <span class="adv-value text-orange">{{ record.second_board_count || 0 }}</span>
                </div>
                <div class="advanced-row">
                  <span class="adv-label">3板</span>
                  <span class="adv-value text-orange">{{ record.third_board_count || 0 }}</span>
                </div>
                <div class="advanced-row">
                  <span class="adv-label">4板+</span>
                  <span class="adv-value text-orange">{{ record.four_plus_count || 0 }}</span>
                </div>
                <div class="advanced-row">
                  <span class="adv-label">炸板</span>
                  <span class="adv-value">{{ record.zt_count }} ({{ record.zt_rate }}%)</span>
                </div>

                <!-- 4板+个股 -->
                <div v-if="record.four_plus_stocks_with_sector && record.four_plus_stocks_with_sector.length > 0" class="stocks-section">
                  <div class="adv-label-full">4板+个股</div>
                  <div class="stocks-list">
                    <div
                      v-for="stock in record.four_plus_stocks_with_sector"
                      :key="stock.name"
                      class="stock-item"
                    >
                      <span class="stock-name">{{ stock.name }}</span>
                      <el-tag size="small" type="warning">{{ stock.sector }}</el-tag>
                    </div>
                  </div>
                </div>

                <!-- 流入板块 -->
                <div v-if="record.hot_sectors && record.hot_sectors.length > 0" class="sectors-section">
                  <div class="adv-label-full">流入板块</div>
                  <div class="sectors-list">
                    <el-tag
                      v-for="(sector, index) in record.hot_sectors"
                      :key="index"
                      size="small"
                      type="primary"
                      plain
                    >
                      {{ sector }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>

          <!-- 卡片底部操作 -->
          <div class="card-actions">
            <el-button size="small" type="primary" @click="viewDetail(record)">
              查看详情
            </el-button>
            <el-button size="small" @click="editReview(record)">
              编辑
            </el-button>
            <el-popconfirm title="确认删除？" @confirm="handleDelete(record.id!)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <!-- 桌面端表格布局 -->
      <el-table
        v-else
        :data="displayedReviewList"
        stripe
        v-loading="loading"
        border
        class="reviews-table"
      >
        <el-table-column prop="date" label="日期" width="120" sortable align="center" fixed="left" />
        <el-table-column label="成交额" width="130" align="center">
          <template #default="{ row }">
            <span class="font-medium text-blue">{{ formatVolume(row.volume) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="red_count" label="红盘" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="text-red font-medium">{{ row.red_count }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="green_count" label="绿盘" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="text-green font-medium">{{ row.green_count }}</span>
          </template>
        </el-table-column>
        <el-table-column label="市场强弱" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMarketStrengthTagType(row.market_strength)" size="small">
              {{ row.market_strength || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="limit_up_count" label="涨停" width="100" sortable align="center" />
        <el-table-column label="连板率" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.continuous_limit_rate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="limit_down_count" label="跌停" width="100" sortable align="center" />
        <el-table-column label="2板" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="text-orange">{{ row.second_board_count || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="3板" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="text-orange">{{ row.third_board_count || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="4板+" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="text-orange font-medium">{{ row.four_plus_count || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="4板+个股" min-width="240">
          <template #default="{ row }">
            <div class="stocks-wrap">
              <div
                v-for="stock in (row.four_plus_stocks_with_sector || []).slice(0, 3)"
                :key="stock.name"
                class="stock-item-inline"
              >
                <span class="stock-name">{{ stock.name }}</span>
                <el-tag size="small" type="warning">{{ stock.sector }}</el-tag>
              </div>
              <span v-if="(row.four_plus_stocks_with_sector || []).length > 3" class="more-hint">
                +{{ (row.four_plus_stocks_with_sector || []).length - 3 }}
              </span>
              <span v-if="!row.four_plus_stocks_with_sector || row.four_plus_stocks_with_sector.length === 0" class="empty-hint">暂无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="zt_count" label="炸板" width="100" sortable align="center" />
        <el-table-column label="炸板率" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.zt_rate }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="流入板块" min-width="240">
          <template #default="{ row }">
            <div class="sectors-wrap">
              <el-tag
                v-for="(sector, index) in (row.hot_sectors || []).slice(0, 3)"
                :key="index"
                size="small"
                type="primary"
                plain
              >
                {{ sector }}
              </el-tag>
              <span v-if="(row.hot_sectors || []).length > 3" class="more-hint">
                +{{ (row.hot_sectors || []).length - 3 }}
              </span>
              <span v-if="!row.hot_sectors || row.hot_sectors.length === 0" class="empty-hint">暂无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="200">
          <template #default="{ row }">
            <div class="notes-cell" @click="viewDetail(row)">
              {{ row.notes || '点击查看详情' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
            <el-button link @click="editReview(row)">编辑</el-button>
            <el-popconfirm title="确认删除？" @confirm="handleDelete(row.id!)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && filteredReviewList.length === 0"
        description="暂无复盘记录"
      >
        <el-button type="primary" @click="goToCollection">创建第一条复盘</el-button>
      </el-empty>

      <!-- 加载更多 -->
      <div v-if="!loading && filteredReviewList.length > 0" class="load-more-container">
        <el-button
          v-if="hasMore"
          @click="loadMore"
          :loading="loadingMore"
          class="load-more-btn"
        >
          加载更多 ({{ displayedCount }}/{{ totalCount }})
        </el-button>
        <el-tag v-else type="success" class="no-more-tag">
          已显示全部 {{ totalCount }} 条记录
        </el-tag>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑复盘记录"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="100px" label-position="right">
        <el-form-item label="复盘日期">
          <el-input v-model="editForm.date" disabled />
        </el-form-item>
        <el-form-item label="热门板块">
          <el-select
            v-model="editForm.hot_sectors"
            multiple
            filterable
            allow-create
            placeholder="选择或输入板块"
            style="width: 100%"
          >
            <el-option
              v-for="sector in commonSectors"
              :key="sector"
              :label="sector"
              :value="sector"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="复盘笔记">
          <el-input
            v-model="editForm.notes"
            type="textarea"
            :rows="12"
            placeholder="编辑复盘笔记..."
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpdate" :loading="submitLoading">
            保存修改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="复盘详情"
      width="900px"
    >
      <div v-if="currentReview" class="detail-wrapper">
        <div class="detail-section">
          <h3 class="section-header">基础数据</h3>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="日期">{{ currentReview.date }}</el-descriptions-item>
            <el-descriptions-item label="成交额">
              <span class="text-blue font-medium">{{ formatVolume(currentReview.volume) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="红盘/绿盘">
              <span class="text-red">{{ currentReview.red_count }}</span> /
              <span class="text-green">{{ currentReview.green_count }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="市场强弱">
              <el-tag :type="getMarketStrengthTagType(currentReview.market_strength)" size="small">
                {{ currentReview.market_strength }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h3 class="section-header">热门板块</h3>
          <div class="sectors-box">
            <el-tag
              v-for="(sector, index) in currentReview.hot_sectors"
              :key="index"
              type="primary"
              plain
              size="large"
            >
              {{ sector }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-header">复盘笔记</h3>
          <div class="notes-box">
            {{ currentReview.notes || '暂无复盘笔记' }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getReviewList,
  updateReview,
  deleteReview,
  type MarketReviewData
} from '@/api/market'

const router = useRouter()

// 移动端检测
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const loading = ref(false)
const submitLoading = ref(false)
const loadingMore = ref(false)
const reviewList = ref<MarketReviewData[]>([])
const searchQuery = ref('')
const marketStrengthFilter = ref('')
const dateRange = ref<[string, string] | null>(null)
const activeCollapse = ref<string[]>([])

// 分页状态
const pageSize = 30
const displayedCount = ref(pageSize)

const showEditDialog = ref(false)
const showDetailDialog = ref(false)
const editForm = ref<{ id: number; date: string; hot_sectors: string[]; notes: string }>({
  id: 0,
  date: '',
  hot_sectors: [],
  notes: ''
})
const currentReview = ref<MarketReviewData | null>(null)

const commonSectors = [
  '人工智能', '软件开发', '新能源', '芯片半导体', '医药医疗',
  '军工', '白酒', '机器人', '数据中心', '汽车零部件',
  '传媒', '通信', '金属', '电池', '电力'
]

const filteredReviewList = computed(() => {
  let result = reviewList.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(review =>
      review.date.includes(query) ||
      review.hot_sectors.some(s => s.toLowerCase().includes(query)) ||
      (review.notes && review.notes.toLowerCase().includes(query))
    )
  }

  if (marketStrengthFilter.value) {
    result = result.filter(review => review.market_strength === marketStrengthFilter.value)
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(review => review.date >= start && review.date <= end)
  }

  return result
})

// 显示的列表（分页后）
const displayedReviewList = computed(() => {
  return filteredReviewList.value.slice(0, displayedCount.value)
})

// 总数量
const totalCount = computed(() => filteredReviewList.value.length)

// 是否还有更多数据
const hasMore = computed(() => displayedCount.value < totalCount.value)

const fetchReviewList = async () => {
  loading.value = true
  try {
    const data = await getReviewList()
    reviewList.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const formatVolume = (volume: number): string => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(0) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(0) + '万'
  }
  return volume.toString()
}

const getMarketStrengthTagType = (strength: string | undefined) => {
  const typeMap: Record<string, string> = {
    '极强': 'danger',
    '强': 'danger',
    '偏强': 'warning',
    '中性': 'info',
    '偏弱': 'success',
    '弱': 'success'
  }
  return typeMap[strength || ''] || 'info'
}

const handleSearch = () => {
  // 触发computed重新计算
  displayedCount.value = pageSize
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  searchQuery.value = ''
  marketStrengthFilter.value = ''
  dateRange.value = null
  displayedCount.value = pageSize
}

const editReview = (row: MarketReviewData) => {
  editForm.value = {
    id: row.id!,
    date: row.date,
    hot_sectors: [...row.hot_sectors],
    notes: row.notes
  }
  showEditDialog.value = true
}

const handleUpdate = async () => {
  submitLoading.value = true
  try {
    await updateReview(editForm.value.id, {
      hot_sectors: editForm.value.hot_sectors,
      notes: editForm.value.notes
    })
    ElMessage.success('更新成功')
    showEditDialog.value = false
    await fetchReviewList()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteReview(id)
    ElMessage.success('删除成功')
    await fetchReviewList()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

const viewDetail = (row: MarketReviewData) => {
  currentReview.value = row
  showDetailDialog.value = true
}

const goToCollection = () => {
  router.push('/stock/collection')
}

const loadMore = async () => {
  loadingMore.value = true
  // Simulate loading delay for better UX
  await new Promise(resolve => setTimeout(resolve, 500))
  displayedCount.value = Math.min(displayedCount.value + pageSize, totalCount.value)
  loadingMore.value = false
}

onMounted(() => {
  fetchReviewList()
})

// Watch filter changes to reset pagination
watch([searchQuery, marketStrengthFilter, dateRange], () => {
  displayedCount.value = pageSize
})
</script>

<style scoped lang="scss">
.review-records {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.page-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

.filters-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.table-section {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  padding: var(--spacing-lg);
}

.text-red {
  color: #cf1322;
}

.text-green {
  color: #3f8600;
}

.text-blue {
  color: #1890ff;
}

.text-orange {
  color: #fa8c16;
}

.font-medium {
  font-weight: 500;
}

.sectors-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
}

.stocks-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.stock-item-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.stock-item-inline .stock-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.more-hint {
  color: var(--color-text-secondary);
  font-size: 13px;
  padding-left: 4px;
}

.empty-hint {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.notes-cell {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
  padding: 6px 0;

  &:hover {
    color: var(--color-primary);
  }
}

.detail-wrapper {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  margin: 0 0 16px 0;
  font-size: 15px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #1890ff;
}

.sectors-box {
  padding: 16px;
  background: #fafafa;
  border-radius: 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 60px;
}

.notes-box {
  padding: 20px;
  background: #fafafa;
  border-radius: 2px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.8;
  min-height: 100px;
  color: #595959;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg) 0;
  margin-top: var(--spacing-lg);
}

.load-more-btn {
  min-width: 200px;
}

.no-more-tag {
  font-size: 0.875rem;
}

/* 移动端卡片样式 */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.volume {
  font-size: 15px;
  font-weight: 600;
  color: #1890ff;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f7f8fa;
  border-radius: 8px;
}

.metric-label {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.card-collapse {
  margin: 12px 0;
  border: none;
}

.advanced-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.advanced-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.adv-label {
  font-size: 14px;
  color: #86909c;
}

.adv-value {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.adv-label-full {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
}

.stocks-section,
.sectors-section {
  margin-top: 8px;
}

.stocks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff7e6;
  border-radius: 6px;
}

.stock-name {
  font-weight: 500;
  color: #1d2129;
}

.sectors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;

  .el-button {
    flex: 1;
  }
}

/* 移动端响应式优化 */
@media (max-width: 768px) {
  /* 页面容器优化 */
  .review-records {
    padding: 12px;
  }

  /* 移动端筛选区域优化 */
  .filters-section {
    padding: 12px;

    /* 强制el-row变成垂直布局 */
    :deep(.el-row) {
      flex-direction: column !important;
      display: flex !important;
      gap: 12px !important;
    }

    /* 强制所有el-col占满宽度 */
    :deep(.el-col) {
      width: 100% !important;
      flex: 0 0 100% !important;
      max-width: 100% !important;
      margin-bottom: 12px;
    }

    /* 搜索框全宽 */
    :deep(.el-input) {
      width: 100% !important;
    }

    :deep(.el-input__wrapper) {
      width: 100% !important;
    }

    /* 选择器全宽 */
    :deep(.el-select) {
      width: 100% !important;
    }

    :deep(.el-select__wrapper) {
      width: 100% !important;
    }

    /* 日期选择器全宽 */
    :deep(.el-date-editor) {
      width: 100% !important;
    }

    /* 按钮组优化 */
    :deep(.el-col:last-child) {
      display: flex !important;
      gap: 8px !important;

      .el-button {
        flex: 1;
        min-height: 44px;
        font-size: 16px;
      }
    }
  }

  .card-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  /* 移动端卡片按钮优化 */
  .card-actions {
    .el-button {
      min-height: 44px;
      font-size: 16px;
    }
  }

  /* 移动端折叠面板按钮优化 */
  .el-collapse-item__header {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
