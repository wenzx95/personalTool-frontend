<template>
  <div class="stock-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">板块复盘系统</h1>
        <p class="page-subtitle">Professional Market Review System</p>
      </div>
      <el-button type="primary" class="action-btn" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增复盘
      </el-button>
    </div>

    <!-- 统计概览 -->
    <div class="stats-row" v-if="reviewList.length > 0">
      <div class="stat-item">
        <div class="stat-label">复盘记录</div>
        <div class="stat-value">{{ reviewList.length }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">市场强弱</div>
        <div class="stat-value" :class="getMarketStrengthClass(latestReview?.market_strength)">
          {{ latestReview?.market_strength || '-' }}
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">连板高度</div>
        <div class="stat-value text-orange">{{ latestReview?.max_continuous_days || 0 }}天</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">首板</div>
        <div class="stat-value">{{ latestReview?.first_board_count || 0 }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">成交额</div>
        <div class="stat-value text-blue">{{ formatVolumeCompact(latestReview?.volume || 0) }}</div>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-wrapper">
      <el-table
        :data="filteredReviewList"
        stripe
        v-loading="loading"
        border
        class="data-table"
      >
        <el-table-column prop="date" label="日期" width="120" sortable align="center" fixed="left" />
        <el-table-column label="成交额" width="130" align="center" fixed="left">
          <template #default="{ row, $index }">
            <span
              class="font-medium"
              :class="getVolumeCellClass(row, $index)"
            >{{ formatVolume(row.volume) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="red_count" label="红盘" width="100" sortable align="center">
          <template #default="{ row }">
            <span class="font-medium">{{ row.red_count }}</span>
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
            <span class="font-medium">{{ row.green_count }}</span>
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
        <el-table-column prop="total_continuous_limit" label="总连板" width="110" sortable align="center" />
        <el-table-column label="连板率" width="100" align="center">
          <template #default="{ row }">
            {{ row.continuous_limit_rate }}%
          </template>
        </el-table-column>
        <el-table-column prop="max_continuous_days" label="连板高度" width="100" align="center">
          <template #default="{ row }">
            <span class="text-orange">{{ row.max_continuous_days }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="first_board_count" label="首板" width="90" align="center" />
        <el-table-column prop="four_plus_count" label="四板+" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.four_plus_count > 0" class="text-orange font-bold">{{ row.four_plus_count }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="two_board_count" label="二板" width="90" align="center" />
        <el-table-column prop="three_board_count" label="三板" width="90" align="center" />
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

          <el-divider content-position="left">
            <span class="section-title">连板数据</span>
          </el-divider>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="总连板数">
                <el-input-number
                  v-model="createForm.total_continuous_limit"
                  :min="0"
                  :precision="0"
                  placeholder="总连板数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="2板数">
                <el-input-number
                  v-model="createForm.two_board_count"
                  :min="0"
                  :precision="0"
                  placeholder="2板数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="3板数">
                <el-input-number
                  v-model="createForm.three_board_count"
                  :min="0"
                  :precision="0"
                  placeholder="3板数"
                  style="width: 100%"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="4板及以上">
                <el-input-number
                  v-model="createForm.four_plus_count"
                  :min="0"
                  :precision="0"
                  placeholder="4板及以上"
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
            <el-descriptions-item label="炸板率" label-align="center" align="center">
              <span :class="getZtRateClass(currentReview.zt_rate)">
                {{ currentReview.zt_rate }}%
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="总连板" label-align="center" align="center">
              {{ currentReview.total_continuous_limit }}
            </el-descriptions-item>
            <el-descriptions-item label="连板率" label-align="center" align="center">
              {{ currentReview.continuous_limit_rate }}%
            </el-descriptions-item>
            <el-descriptions-item label="二板" label-align="center" align="center">
              {{ currentReview.two_board_count }}
            </el-descriptions-item>
            <el-descriptions-item label="三板" label-align="center" align="center">
              {{ currentReview.three_board_count }}
            </el-descriptions-item>
            <el-descriptions-item label="四板+" label-align="center" align="center">
              <span class="text-orange font-bold">{{ currentReview.four_plus_count }}</span>
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

        <!-- 四板及以上个股 -->
        <div class="detail-section">
          <h3 class="section-header">四板及以上个股</h3>
          <el-table
            :data="currentReview.four_plus_stocks_with_sector"
            size="small"
            border
            class="stock-table"
          >
            <el-table-column prop="name" label="名称" width="150" align="center" />
            <el-table-column prop="sector" label="板块" align="center" />
          </el-table>
          <div v-if="currentReview.four_plus_stocks_with_sector.length === 0" class="empty-tip">暂无数据</div>
        </div>

        <!-- 三板个股 -->
        <div class="detail-section">
          <h3 class="section-header">三板个股</h3>
          <el-table
            :data="currentReview.three_board_stocks_with_sector"
            size="small"
            border
            class="stock-table"
          >
            <el-table-column prop="name" label="名称" width="150" align="center" />
            <el-table-column prop="sector" label="板块" align="center" />
          </el-table>
          <div v-if="currentReview.three_board_stocks_with_sector.length === 0" class="empty-tip">暂无数据</div>
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
import { Plus, Refresh, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getReviewList,
  getMarketReview,
  createReview,
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
  return reviewList.value
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

// 紧凑格式化成交量
const formatVolumeCompact = (volume: number): string => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(1) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(1) + '万'
  }
  return volume.toString()
}

// 获取炸板率样式
const getZtRateClass = (rate: number) => {
  if (rate >= 50) return 'text-red'
  if (rate >= 30) return 'text-orange'
  return 'text-green'
}

// 获取成交额单元格样式类
const getVolumeCellClass = (_row: MarketReviewData, index: number) => {
  const list = filteredReviewList.value
  console.log('getVolumeCellClass called, index:', index, 'list length:', list.length)

  // 与下一行对比（因为数据是倒序排列，下一行就是上一日）
  if (index < list.length - 1) {
    const currentVolume = list[index].volume
    const prevVolume = list[index + 1].volume
    console.log(`Row ${index}: current=${currentVolume}, prev=${prevVolume}`)

    if (currentVolume > prevVolume) {
      console.log('Returning volume-up-cell')
      return 'volume-up-cell'
    } else if (currentVolume < prevVolume) {
      console.log('Returning volume-down-cell')
      return 'volume-down-cell'
    }
  }
  console.log('Returning empty string')
  return ''
}

// 获取市场强弱样式类
const getMarketStrengthClass = (strength: string | undefined) => {
  const classMap: Record<string, string> = {
    '极强': 'text-red font-bold',
    '强': 'text-red',
    '偏强': 'text-orange',
    '中性': 'text-blue',
    '偏弱': 'text-green',
    '弱': 'text-green'
  }
  if (!strength) {
    return ''
  }
  return classMap[strength] || ''
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

// 在创建对话框中触发数据采集
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

    await createReview(createData, currentSessionId)
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

onMounted(() => {
  fetchReviewList()
})
</script>

<style scoped lang="scss">
.stock-view {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 120px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 32px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-content {
  flex: 1;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.5px;
}

.page-subtitle {
  margin: 0;
  font-size: 12px;
  color: #8c8c8c;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.action-btn {
  padding: 10px 24px;
  font-size: 14px;
  background: #1890ff;
  border-color: #1890ff;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);

  &:hover {
    background: #40a9ff;
    border-color: #40a9ff;
  }
}

/* 统计栏 */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  padding: 16px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  border-top: 3px solid #1890ff;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .stat-label {
    font-size: 13px;
    color: #8c8c8c;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1;
  }
}

/* 表格区域 */
.table-wrapper {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch; /* 启用iOS/Mac平滑滚动 */
}

.data-table {
  width: 100%;
  /* 确保触控板滚动正常工作 */
  touch-action: pan-y;

  /* 成交额单元格背景色 - 应用到 span 元素 */
  :deep(.volume-up-cell) {
    display: block;
    width: 100%;
    height: 100%;
    background-color: #ffcccc !important;
    padding: 12px 0;
    box-sizing: border-box;
  }

  :deep(.volume-down-cell) {
    display: block;
    width: 100%;
    height: 100%;
    background-color: #90ee90 !important;
    padding: 12px 0;
    box-sizing: border-box;
  }

  :deep(.el-table__header-wrapper) {
    th {
      background: #fafafa;
      color: #1a1a1a;
      font-weight: 600;
      font-size: 13px;
      border-bottom: 2px solid #e8e8e8;
    }
  }

  :deep(.el-table__body-wrapper) {
    /* 确保表格主体可以滚动 */
    overflow-y: auto !important;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.el-table__body) {
    tr {
      &:hover {
        background-color: #f5f8ff;
      }
    }

    td {
      border-bottom: 1px solid #f0f0f0;
    }
  }
}

/* 文本样式 */
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

.text-muted {
  color: #bfbfbf;
}

.font-medium {
  font-weight: 500;
}

.font-bold {
  font-weight: 600;
}

/* 板块标签 */
.sectors-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
}

.more-hint {
  color: #8c8c8c;
  font-size: 13px;
  padding-left: 4px;
}

.empty-hint {
  color: #bfbfbf;
  font-size: 13px;
}

/* 笔记单元格 */
.notes-cell {
  font-size: 13px;
  color: #595959;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
  padding: 6px 0;

  &:hover {
    color: #1890ff;
  }
}

/* 对话框 */
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

/* 实时日志样式 */
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

/* 移除阻止滚动的规则，允许Mac触控板正常滚动 */
:deep(.el-scrollbar__wrap) {
  /* overflow-x: hidden;  <-- 这行会阻止Mac触控板滚动，已移除 */
}

:deep(.el-divider) {
  margin: 20px 0;
}

:deep(.el-divider__text) {
  background-color: transparent;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 详情对话框 */
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

.stock-table {
  :deep(.el-table__header th) {
    background: #fafafa;
    font-weight: 500;
  }
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

/* 空状态 */
:deep(.el-empty) {
  padding: 60px 0;
}

/* 滚动条 */
:deep(.el-dialog__body)::-webkit-scrollbar {
  width: 6px;
}

:deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;

  &:hover {
    background: #bfbfbf;
  }
}
</style>
