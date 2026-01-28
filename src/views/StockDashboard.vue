<template>
  <div class="stock-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">A股复盘</h1>
        <p class="page-subtitle">市场数据分析与投资复盘</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          新增复盘
        </el-button>
      </div>
    </div>

    <!-- Bento Grid Layout -->
    <div class="bento-grid">
      <!-- Market Overview Card - Large -->
      <div class="bento-card bento-card-large market-overview" v-if="latestReview">
        <div class="card-header">
          <h3 class="card-title">最新市场概览 ({{ latestReview.date }})</h3>
          <el-tag :type="getMarketStrengthTagType(latestReview.market_strength)" size="small">
            {{ latestReview.market_strength }}
          </el-tag>
        </div>
        <div class="card-body">
          <div class="market-stats">
            <div class="stat-item">
              <div class="stat-label">成交额</div>
              <div class="stat-value">{{ formatVolume(latestReview.volume) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">上涨/下跌</div>
              <div class="stat-value">
                <span class="stat-up">{{ latestReview.red_count }}</span>
                <span class="stat-divider">/</span>
                <span class="stat-down">{{ latestReview.green_count }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">涨停/跌停</div>
              <div class="stat-value">
                <span class="stat-up">{{ latestReview.limit_up_count }}</span>
                <span class="stat-divider">/</span>
                <span class="stat-down">{{ latestReview.limit_down_count }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">连板高度</div>
              <div class="stat-value text-orange">{{ latestReview.max_continuous_days }}天</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">炸板率</div>
              <div class="stat-value">{{ latestReview.zt_rate }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">红盘率</div>
              <div class="stat-value">{{ latestReview.red_rate }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Continuous Limit Up Stats -->
      <div class="bento-card" v-if="latestReview">
        <div class="card-header">
          <h3 class="card-title">连板统计</h3>
        </div>
        <div class="card-body">
          <div class="continuous-stats">
            <div class="continuous-item">
              <div class="continuous-label">总连板</div>
              <div class="continuous-value">{{ latestReview.total_continuous_limit }}</div>
            </div>
            <div class="continuous-item">
              <div class="continuous-label">连板率</div>
              <div class="continuous-value">{{ latestReview.continuous_limit_rate }}%</div>
            </div>
            <div class="continuous-item">
              <div class="continuous-label">首板</div>
              <div class="continuous-value">{{ latestReview.first_board_count }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4+ Stocks -->
      <div class="bento-card" v-if="latestReview && latestReview.four_plus_stocks_with_sector?.length > 0">
        <div class="card-header">
          <h3 class="card-title">4板+个股</h3>
        </div>
        <div class="card-body">
          <div class="stock-list">
            <div
              v-for="stock in latestReview.four_plus_stocks_with_sector"
              :key="stock.name"
              class="stock-item"
            >
              <div class="stock-name">{{ stock.name }}</div>
              <el-tag size="small" type="warning">{{ stock.sector }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Hot Sectors -->
      <div class="bento-card" v-if="latestReview && latestReview.hot_sectors?.length > 0">
        <div class="card-header">
          <h3 class="card-title">热门板块</h3>
        </div>
        <div class="card-body">
          <div class="sectors-grid">
            <el-tag
              v-for="(sector, index) in latestReview.hot_sectors.slice(0, 6)"
              :key="index"
              type="primary"
              size="small"
              class="sector-tag"
            >
              {{ sector }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- Recent Reviews List -->
      <div class="bento-card bento-card-wide reviews-list">
        <div class="card-header">
          <h3 class="card-title">历史复盘</h3>
          <el-button text type="primary" size="small" @click="scrollToTable">查看全部</el-button>
        </div>
        <div class="card-body">
          <div class="reviews-timeline">
            <div
              v-for="review in reviewList.slice(0, 5)"
              :key="review.id"
              class="timeline-item"
              @click="viewDetail(review)"
            >
              <div class="timeline-date">{{ review.date }}</div>
              <div class="timeline-stats">
                <span class="stat-badge">{{ review.red_count }}涨</span>
                <span class="stat-badge">{{ review.green_count }}跌</span>
                <span class="stat-badge highlight">{{ review.limit_up_count }}涨停</span>
              </div>
              <div class="timeline-notes">{{ review.notes || '暂无笔记' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bento-card">
        <div class="card-header">
          <h3 class="card-title">快捷操作</h3>
        </div>
        <div class="card-body">
          <div class="quick-actions">
            <el-button type="primary" class="action-btn" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              <span>新建复盘</span>
            </el-button>
            <el-button class="action-btn" @click="scrollToTable">
              <el-icon><List /></el-icon>
              <span>查看列表</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reviews Table Section -->
    <div id="reviews-table-section" class="table-section">
      <div class="section-header">
        <h2 class="section-title">全部复盘记录</h2>
        <el-input
          v-model="searchQuery"
          placeholder="搜索日期、板块、笔记..."
          :prefix-icon="Search"
          style="width: 300px"
          clearable
        />
      </div>

      <el-table
        :data="filteredReviewList"
        stripe
        v-loading="loading"
        border
        class="reviews-table"
      >
        <el-table-column prop="date" label="日期" width="120" sortable align="center" fixed="left" />
        <el-table-column label="成交额" width="130" align="center" fixed="left">
          <template #default="{ row }">
            <span class="font-medium text-blue">{{ formatVolume(row.volume) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="red_count" label="红盘" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="text-red font-medium">{{ row.red_count }}</span>
          </template>
        </el-table-column>
        <el-table-column label="红盘率" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.red_rate }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="市场强弱" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMarketStrengthTagType(row.market_strength)" size="small">
              {{ row.market_strength || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="green_count" label="绿盘" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="text-green font-medium">{{ row.green_count }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="limit_up_count" label="涨停" width="100" sortable align="center" />
        <el-table-column prop="limit_down_count" label="跌停" width="100" sortable align="center" />
        <el-table-column prop="zt_count" label="炸板" width="100" sortable align="center" />
        <el-table-column label="炸板率" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.zt_rate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="max_continuous_days" label="连板高度" width="100" align="center">
          <template #default="{ row }">
            <span class="text-orange">{{ row.max_continuous_days }}天</span>
          </template>
        </el-table-column>
        <el-table-column label="热门板块" min-width="240">
          <template #default="{ row }">
            <div class="sectors-wrap">
              <el-tag
                v-for="(sector, index) in row.hot_sectors.slice(0, 3)"
                :key="index"
                size="small"
                type="primary"
                plain
              >
                {{ sector }}
              </el-tag>
              <span v-if="row.hot_sectors.length > 3" class="more-hint">
                +{{ row.hot_sectors.length - 3 }}
              </span>
              <span v-if="row.hot_sectors.length === 0" class="empty-hint">暂无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="复盘笔记" min-width="200">
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
        <el-button type="primary" @click="showCreateDialog = true">创建第一条复盘</el-button>
      </el-empty>
    </div>

    <!-- 新增复盘对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新增复盘记录"
      width="1000px"
      :close-on-click-modal="false"
      class="review-dialog"
    >
      <div class="dialog-header-actions">
        <div style="display: flex; gap: 12px; align-items: center; flex: 1;">
          <el-button
            type="success"
            :loading="collectLoading"
            :disabled="!createForm.date"
            @click="handleCollectForCreate"
          >
            <el-icon><Refresh /></el-icon>
            {{ collectLoading ? '采集中...' : '获取实时数据' }}
          </el-button>
          <el-tag v-if="collectedData" type="success" size="small">
            <el-icon><Check /></el-icon>
            数据已采集
          </el-tag>
        </div>
      </div>

      <el-progress
        v-if="collectLoading"
        :percentage="collectProgress"
        :indeterminate="true"
        status="success"
        style="margin-bottom: 24px;"
      >
        <span class="progress-text">正在采集市场数据，请稍候...</span>
      </el-progress>

      <!-- 实时日志显示 -->
      <el-collapse v-if="logMessages.length > 0" style="margin-bottom: 24px;">
        <el-collapse-item title="实时日志" name="1">
          <div class="log-container">
            <div
              v-for="(log, index) in logMessages"
              :key="index"
              class="log-item"
            >
              {{ log }}
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <el-scrollbar max-height="60vh">
        <el-form :model="createForm" label-width="120px" label-position="right">
          <el-divider content-position="left">
            <span class="section-title">基础信息</span>
          </el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="复盘日期">
                <el-date-picker
                  v-model="createForm.date"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disabledDate"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成交额（元）">
                <el-input-number
                  v-model="createForm.volume"
                  :min="0"
                  :step="100000000"
                  :precision="0"
                  placeholder="请输入成交额"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="总家数">
                <el-input-number
                  v-model="createForm.total_stocks"
                  :min="0"
                  :precision="0"
                  placeholder="总家数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="红盘数">
                <el-input-number
                  v-model="createForm.red_count"
                  :min="0"
                  :precision="0"
                  placeholder="红盘数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="绿盘数">
                <el-input-number
                  v-model="createForm.green_count"
                  :min="0"
                  :precision="0"
                  placeholder="绿盘数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">
            <span class="section-title">涨跌停数据</span>
          </el-divider>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="涨停数">
                <el-input-number
                  v-model="createForm.limit_up_count"
                  :min="0"
                  :precision="0"
                  placeholder="涨停数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="跌停数">
                <el-input-number
                  v-model="createForm.limit_down_count"
                  :min="0"
                  :precision="0"
                  placeholder="跌停数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="炸板数">
                <el-input-number
                  v-model="createForm.zt_count"
                  :min="0"
                  :precision="0"
                  placeholder="炸板数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="炸板率（%）">
                <el-input-number
                  v-model="createForm.zt_rate"
                  :min="0"
                  :max="100"
                  :precision="2"
                  :step="0.01"
                  placeholder="炸板率"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="连板率（%）">
                <el-input-number
                  v-model="createForm.continuous_limit_rate"
                  :min="0"
                  :max="100"
                  :precision="2"
                  :step="0.01"
                  placeholder="连板率"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="热门板块">
            <el-select
              v-model="createForm.hot_sectors"
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
              v-model="createForm.notes"
              type="textarea"
              :rows="8"
              placeholder="记录市场表现、热点分析、投资策略..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-scrollbar>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelCreate">取消</el-button>
          <el-button type="primary" @click="handleCreate" :loading="submitLoading">
            确认创建
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑复盘对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑复盘记录"
      width="600px"
      :close-on-click-modal="false"
      class="review-dialog"
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
      class="detail-dialog"
    >
      <div v-if="currentReview" class="detail-wrapper">
        <!-- 基础数据 -->
        <div class="detail-section">
          <h3 class="section-header">基础数据</h3>
          <el-descriptions :column="4" border class="info-table">
            <el-descriptions-item label="日期" label-align="center" align="center">
              {{ currentReview.date }}
            </el-descriptions-item>
            <el-descriptions-item label="成交额" label-align="center" align="center">
              <span class="text-blue font-medium">{{ formatVolume(currentReview.volume) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="总家数" label-align="center" align="center">
              {{ currentReview.total_stocks }}
            </el-descriptions-item>
            <el-descriptions-item label="红盘" label-align="center" align="center">
              <span class="text-red font-medium">{{ currentReview.red_count }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="绿盘" label-align="center" align="center">
              <span class="text-green font-medium">{{ currentReview.green_count }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="涨停" label-align="center" align="center">
              {{ currentReview.limit_up_count }}
            </el-descriptions-item>
            <el-descriptions-item label="跌停" label-align="center" align="center">
              {{ currentReview.limit_down_count }}
            </el-descriptions-item>
            <el-descriptions-item label="炸板" label-align="center" align="center">
              {{ currentReview.zt_count }}
            </el-descriptions-item>
            <el-descriptions-item label="市场强弱" label-align="center" align="center">
              <el-tag :type="getMarketStrengthTagType(currentReview.market_strength)" size="small">
                {{ currentReview.market_strength || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="连板高度" label-align="center" align="center">
              <span class="text-orange font-bold">{{ currentReview.max_continuous_days }}天</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 热门板块 -->
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
            <div v-if="currentReview.hot_sectors.length === 0" class="empty-tip">暂无热门板块</div>
          </div>
        </div>

        <!-- 复盘笔记 -->
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
import { ref, computed, onMounted } from 'vue'
import { Plus, Refresh, Check, Search, List } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getReviewList,
  getMarketReview,
  createReview as apiCreateReview,
  updateReview,
  deleteReview,
  type MarketReviewData,
  type CreateReviewRequest,
  type UpdateReviewRequest
} from '@/api/market'

const loading = ref(false)
const submitLoading = ref(false)
const collectLoading = ref(false)
const collectProgress = ref(0)
const reviewList = ref<MarketReviewData[]>([])
const collectedData = ref<MarketReviewData | null>(null)
const searchQuery = ref('')

// SSE 实时日志
const logMessages = ref<string[]>([])
let eventSource: EventSource | null = null
let currentSessionId: string | null = null

// 生成唯一会话ID
const generateSessionId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9)
}

// 连接 SSE
const connectSSE = (sessionId: string) => {
  logMessages.value = []
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/sse/events/${sessionId}`
  eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    logMessages.value.push(event.data)
  }

  eventSource.onerror = (error) => {
    console.error('SSE 连接错误:', error)
    if (eventSource?.readyState === EventSource.CLOSED) {
      console.log('SSE 连接已关闭')
    }
  }

  eventSource.onopen = () => {
    console.log('SSE 连接已建立')
  }
}

// 关闭 SSE 连接
const closeSSE = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

// 最新复盘记录
const latestReview = computed(() => {
  return reviewList.value.length > 0 ? reviewList.value[0] : null
})

// 过滤后的列表
const filteredReviewList = computed(() => {
  if (!searchQuery.value) {
    return reviewList.value
  }
  const query = searchQuery.value.toLowerCase()
  return reviewList.value.filter(review =>
    review.date.includes(query) ||
    review.hot_sectors.some(s => s.toLowerCase().includes(query)) ||
    (review.notes && review.notes.toLowerCase().includes(query))
  )
})

// 新增对话框
const showCreateDialog = ref(false)
const createForm = ref<MarketReviewData & CreateReviewRequest>({
  date: '',
  volume: 0,
  red_count: 0,
  green_count: 0,
  limit_up_count: 0,
  limit_down_count: 0,
  zt_count: 0,
  zt_rate: 0,
  total_continuous_limit: 0,
  continuous_limit_rate: 0,
  four_plus_count: 0,
  four_plus_stocks: [],
  red_rate: 0,
  market_strength: '',
  max_continuous_days: 0,
  first_board_count: 0,
  three_board_stocks_with_sector: [],
  four_plus_stocks_with_sector: [],
  two_board_count: 0,
  three_board_count: 0,
  three_board_stocks: [],
  total_stocks: 0,
  hot_sectors: [],
  notes: ''
})

// 编辑对话框
const showEditDialog = ref(false)
const editForm = ref<UpdateReviewRequest & { id: number; date: string }>({
  id: 0,
  date: '',
  hot_sectors: [],
  notes: ''
})

// 详情对话框
const showDetailDialog = ref(false)
const currentReview = ref<MarketReviewData | null>(null)

// 常见板块
const commonSectors = ref([
  '人工智能', '软件开发', '新能源', '芯片半导体', '医药医疗',
  '军工', '白酒', '机器人', '数据中心', '汽车零部件',
  '传媒', '通信', '金属', '电池', '电力',
  '房地产', '银行', '券商', '保险', '建筑工程'
])

// 格式化成交量
const formatVolume = (volume: number): string => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(0) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(0) + '万'
  }
  return volume.toString()
}

// 获取市场强弱Tag类型
const getMarketStrengthTagType = (strength: string | undefined) => {
  const typeMap: Record<string, string> = {
    '极强': 'danger',
    '强': 'danger',
    '偏强': 'warning',
    '中性': 'info',
    '偏弱': 'success',
    '弱': 'success'
  }
  if (!strength) {
    return 'info'
  }
  return typeMap[strength] || 'info'
}

// 禁用未来日期
const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}

// 获取复盘列表
const fetchReviewList = async () => {
  loading.value = true
  try {
    const data = await getReviewList()
    reviewList.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '获取复盘列表失败')
  } finally {
    loading.value = false
  }
}

// 触发数据采集
const handleCollectForCreate = async () => {
  if (!createForm.value.date) {
    ElMessage.warning('请先选择日期')
    return
  }

  collectLoading.value = true
  collectProgress.value = 0
  logMessages.value = []

  // 生成会话ID并连接SSE
  currentSessionId = generateSessionId()
  connectSSE(currentSessionId)

  try {
    ElMessage.info('正在采集实时市场数据，请稍候...')
    // 将 YYYY-MM-DD 格式转换为 YYYYMMDD 格式
    const tradeDate = createForm.value.date.replace(/-/g, '')

    // 模拟进度
    const progressInterval = setInterval(() => {
      if (collectProgress.value < 90) {
        collectProgress.value += 10
      }
    }, 1000)

    const data = await getMarketReview(tradeDate)

    clearInterval(progressInterval)
    collectProgress.value = 100

    // 自动填充表单字段
    createForm.value = {
      ...createForm.value,
      volume: data.volume,
      red_count: data.red_count,
      green_count: data.green_count,
      limit_up_count: data.limit_up_count,
      limit_down_count: data.limit_down_count,
      zt_count: data.zt_count,
      zt_rate: data.zt_rate,
      total_continuous_limit: data.total_continuous_limit,
      continuous_limit_rate: data.continuous_limit_rate,
      four_plus_count: data.four_plus_count,
      four_plus_stocks: data.four_plus_stocks,
      two_board_count: data.two_board_count,
      three_board_count: data.three_board_count,
      three_board_stocks: data.three_board_stocks,
      total_stocks: data.total_stocks
    }

    collectedData.value = data
    ElMessage.success('数据采集成功！已自动填充到表单')
  } catch (error: any) {
    ElMessage.error(error.message || '数据采集失败')
    collectedData.value = null
  } finally {
    collectLoading.value = false
    collectProgress.value = 0
    closeSSE()
  }
}

// 创建复盘
const handleCreate = async () => {
  if (!createForm.value.date) {
    ElMessage.warning('请选择日期')
    return
  }

  submitLoading.value = true
  logMessages.value = []

  // 生成会话ID并连接SSE
  currentSessionId = generateSessionId()
  connectSSE(currentSessionId)

  try {
    // 只发送后端需要的字段
    const createData: CreateReviewRequest = {
      date: createForm.value.date,
      hot_sectors: createForm.value.hot_sectors,
      notes: createForm.value.notes
    }

    await apiCreateReview(createData, currentSessionId)
    ElMessage.success('复盘记录创建成功')
    showCreateDialog.value = false
    resetCreateForm()
    await fetchReviewList()
  } catch (error: any) {
    ElMessage.error(error.message || '创建失败')
  } finally {
    submitLoading.value = false
    closeSSE()
  }
}

// 重置创建表单
const resetCreateForm = () => {
  createForm.value = {
    date: '',
    volume: 0,
    red_count: 0,
    green_count: 0,
    limit_up_count: 0,
    limit_down_count: 0,
    zt_count: 0,
    zt_rate: 0,
    total_continuous_limit: 0,
    continuous_limit_rate: 0,
    four_plus_count: 0,
    four_plus_stocks: [],
    two_board_count: 0,
    three_board_count: 0,
    three_board_stocks: [],
    total_stocks: 0,
    hot_sectors: [],
    notes: '',
    red_rate: 0,
    market_strength: '',
    max_continuous_days: 0,
    first_board_count: 0,
    three_board_stocks_with_sector: [],
    four_plus_stocks_with_sector: []
  }
  collectedData.value = null
}

// 取消创建
const handleCancelCreate = () => {
  showCreateDialog.value = false
  resetCreateForm()
}

// 编辑复盘
const editReview = (row: MarketReviewData) => {
  editForm.value = {
    id: row.id!,
    date: row.date,
    hot_sectors: [...row.hot_sectors],
    notes: row.notes
  }
  showEditDialog.value = true
}

// 更新复盘
const handleUpdate = async () => {
  submitLoading.value = true
  try {
    await updateReview(editForm.value.id, {
      hot_sectors: editForm.value.hot_sectors,
      notes: editForm.value.notes
    })
    ElMessage.success('复盘记录更新成功')
    showEditDialog.value = false
    await fetchReviewList()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

// 删除复盘
const handleDelete = async (id: number) => {
  try {
    await deleteReview(id)
    ElMessage.success('删除成功')
    await fetchReviewList()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

// 查看详情
const viewDetail = (row: MarketReviewData) => {
  currentReview.value = row
  showDetailDialog.value = true
}

// 滚动到表格
const scrollToTable = () => {
  document.getElementById('reviews-table-section')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  fetchReviewList()
})
</script>

<style scoped lang="scss">
.stock-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
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

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.bento-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bento-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.bento-card-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-card-wide {
  grid-column: span 2;
  grid-row: span 1;
}

/* Card Content */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Market Overview */
.market-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
}

.stat-divider {
  margin: 0 4px;
  color: var(--color-text-tertiary);
}

.stat-up {
  color: var(--color-financial-up);
}

.stat-down {
  color: var(--color-financial-down);
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

.font-bold {
  font-weight: 600;
}

/* Continuous Stats */
.continuous-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.continuous-item {
  text-align: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.continuous-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.continuous-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
}

/* Stock List */
.stock-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.stock-name {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Sectors */
.sectors-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
}

.sector-tag {
  justify-content: center;
}

/* Reviews Timeline */
.reviews-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.timeline-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.timeline-item:hover {
  background: var(--color-bg-tertiary);
  transform: translateX(4px);
}

.timeline-date {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.timeline-stats {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.stat-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
}

.stat-badge.highlight {
  background: var(--color-primary-lighter);
  color: var(--color-primary);
}

.timeline-notes {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-btn {
  width: 100%;
  justify-content: flex-start;
}

/* Table Section */
.table-section {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.reviews-table {
  width: 100%;
}

.sectors-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
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

/* Dialog Styles */
.review-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px 20px;
    border-top: 1px solid #f0f0f0;
  }
}

.dialog-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.progress-text {
  font-size: 13px;
  color: #595959;
  font-weight: 500;
}

/* Log Container */
.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 4px;
  padding: 12px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
}

.log-item {
  color: #d4d4d4;
  margin-bottom: 4px;
  padding: 2px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Detail Dialog */
.detail-dialog {
  :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
    padding: 24px;
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
  color: #1a1a1a;
  padding-bottom: 10px;
  border-bottom: 2px solid #1890ff;
}

.info-table {
  :deep(.el-descriptions__label) {
    font-weight: 500;
    background: #fafafa !important;
  }

  :deep(.el-descriptions__content) {
    color: #595959;
  }
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

.empty-tip {
  padding: 20px;
  text-align: center;
  color: #bfbfbf;
  font-size: 14px;
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
  font-size: 14px;
}

/* Responsive */
@media (max-width: 1200px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .bento-card-large {
    grid-column: span 2;
  }
}

/* ============================================================
   移动端优化 - 平板和手机
   ============================================================ */
@media (max-width: 768px) {
  /* 页面容器优化 */
  .stock-dashboard {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  /* 页面头部优化 */
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;

    .header-content {
      .page-title {
        font-size: 24px;
      }

      .page-subtitle {
        font-size: 14px;
      }
    }

    .header-actions {
      width: 100%;
      display: flex;
      gap: 12px;

      .el-button {
        flex: 1;
        height: 48px;
        font-size: 16px;
        border-radius: 12px;
      }
    }
  }

  /* Bento网格优化 */
  .bento-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .bento-card-large {
    grid-column: span 1;
  }

  /* Bento卡片优化 */
  .bento-card {
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s;

    &:active {
      transform: scale(0.99);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      margin-bottom: 12px;

      .card-title {
        font-size: 16px;
      }
    }
  }

  /* 市场统计优化 */
  .market-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .stat-item {
      padding: 12px;
      border-radius: 8px;

      .stat-label {
        font-size: 12px;
      }

      .stat-value {
        font-size: 18px;
      }

      .stat-change {
        font-size: 12px;
      }
    }
  }

  /* 流入板块优化 */
  .sectors-box {
    padding: 12px;
    border-radius: 8px;

    .el-tag {
      font-size: 12px;
      padding: 4px 10px;
      min-height: 28px;
      line-height: 20px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
    }
  }

  /* 复盘笔记优化 */
  .notes-box {
    padding: 16px;
    border-radius: 8px;
    font-size: 14px;
  }

  /* ECharts图表优化 */
  .chart {
    :deep(.echarts-tooltip) {
      font-size: 13px !important;
    }

    :deep(.echarts-legend) {
      font-size: 12px !important;
    }

    :deep(.echarts-xaxis .echarts-axis-label) {
      font-size: 11px !important;
    }

    :deep(.echarts-yaxis .echarts-axis-label) {
      font-size: 11px !important;
    }
  }

  /* Loading状态优化 */
  :deep(.el-loading-mask) {
    border-radius: 12px;
  }

  /* 空状态优化 */
  :deep(.el-empty) {
    padding: 40px 16px;

    .el-empty__description {
      font-size: 14px !important;
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .stock-dashboard {
    padding: 12px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
  }

  .page-header {
    margin-bottom: 12px;
    gap: 10px;

    .header-content {
      .page-title {
        font-size: 22px;
      }

      .page-subtitle {
        font-size: 13px;
      }
    }

    .header-actions {
      gap: 10px;

      .el-button {
        height: 48px;
        font-size: 15px;
      }
    }
  }

  .bento-grid {
    gap: 10px;
  }

  .bento-card {
    padding: 14px;
    border-radius: 10px;

    .card-header {
      margin-bottom: 10px;

      .card-title {
        font-size: 15px;
      }
    }
  }

  .market-stats {
    gap: 10px;

    .stat-item {
      padding: 10px;
      border-radius: 6px;

      .stat-label {
        font-size: 11px;
      }

      .stat-value {
        font-size: 16px;
      }

      .stat-change {
        font-size: 11px;
      }
    }
  }

  .sectors-box {
    padding: 10px;

    .el-tag {
      font-size: 11px;
      padding: 4px 8px;
      min-height: 26px;
      border-radius: 4px;
    }
  }

  .notes-box {
    padding: 12px;
    border-radius: 6px;
    font-size: 13px;
  }

  .chart {
    :deep(.echarts-tooltip) {
      font-size: 12px !important;
    }

    :deep(.echarts-legend) {
      font-size: 11px !important;
    }

    :deep(.echarts-xaxis .echarts-axis-label) {
      font-size: 10px !important;
    }

    :deep(.echarts-yaxis .echarts-axis-label) {
      font-size: 10px !important;
    }
  }

  :deep(.el-empty) {
    padding: 32px 12px;

    .el-empty__description {
      font-size: 13px !important;
    }
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .stock-dashboard {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    }
  }
}
</style>
