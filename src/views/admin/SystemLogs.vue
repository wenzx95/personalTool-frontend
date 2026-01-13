<template>
  <div class="system-logs">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">日志管理</h1>
        <p class="page-subtitle">查看系统日志，包括定时任务、API访问、用户操作等</p>
      </div>
      <div class="header-actions">
        <el-button @click="loadLogs">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="exportLogs">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日日志" :value="stats.todayTotal">
            <template #suffix>
              <span style="font-size: 14px">条</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="成功" :value="stats.todaySuccess">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em; color: #67c23a">
                <SuccessFilled />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="失败" :value="stats.todayFailed">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em; color: #f56c6c">
                <CircleCloseFilled />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="成功率" :value="successRate">
            <template #suffix>
              <span style="font-size: 14px">%</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" @submit.prevent="handleFilter">
        <el-form-item label="日志类型">
          <el-select v-model="filters.logType" placeholder="全部" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="保活任务" value="keepalive" />
            <el-option label="API访问" value="api_access" />
            <el-option label="任务执行" value="task_execution" />
            <el-option label="用户操作" value="user_action" />
            <el-option label="系统事件" value="system_event" />
          </el-select>
        </el-form-item>
        <el-form-item label="日志分类">
          <el-select v-model="filters.logCategory" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="AI" value="ai" />
            <el-option label="任务" value="task" />
            <el-option label="系统" value="system" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platformCode" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="智谱AI" value="zhipu" />
            <el-option label="豆包AI" value="doubao" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="进行中" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题、内容..."
            style="width: 200px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="logs"
        v-loading="loading"
        stripe
        @row-click="showLogDetail"
        style="cursor: pointer"
      >
        <el-table-column prop="createdAt" label="时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="logType" label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getLogTypeTagType(row.logType)" size="small">
              {{ getLogTypeLabel(row.logType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="logCategory" label="分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.logCategory }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="platformCode" label="平台" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.platformCode" type="info" size="small">
              {{ getPlatformLabel(row.platformCode) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="logTitle" label="标题" min-width="200" show-overflow-tooltip />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="duration" label="耗时" width="100" align="center" sortable>
          <template #default="{ row }">
            <span v-if="row.duration">{{ row.duration }}ms</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click.stop="showLogDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="日志详情"
      width="800px"
      @close="closeDetail"
    >
      <div v-if="currentLog" class="log-detail">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">{{ formatTime(currentLog.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getLogTypeTagType(currentLog.logType)">
              {{ getLogTypeLabel(currentLog.logType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentLog.logCategory }}</el-descriptions-item>
          <el-descriptions-item label="平台">
            {{ currentLog.platformCode ? getPlatformLabel(currentLog.platformCode) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentLog.status)">
              {{ getStatusLabel(currentLog.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">
            {{ currentLog.duration ? `${currentLog.duration}ms` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ currentLog.logTitle }}</el-descriptions-item>
        </el-descriptions>

        <!-- 日志内容 -->
        <el-divider content-position="left">日志内容</el-divider>
        <pre class="log-content">{{ formatLogContent(currentLog.logContent) }}</pre>

        <!-- 错误信息 -->
        <div v-if="currentLog.errorMessage">
          <el-divider content-position="left">错误信息</el-divider>
          <el-alert type="error" :closable="false">
            {{ currentLog.errorMessage }}
          </el-alert>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Download,
  Search,
  SuccessFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { getLogs, getStats } from '@/api/keepalive'
import type { SystemLog } from '@/api/keepalive'

// ============ 响应式数据 ============
const logs = ref<SystemLog[]>([])
const loading = ref(false)
const showDetailDialog = ref(false)
const currentLog = ref<SystemLog | null>(null)

const stats = ref({
  todayTotal: 0,
  todaySuccess: 0,
  todayFailed: 0
})

const filters = ref({
  logType: '',
  logCategory: '',
  platformCode: '',
  status: '',
  keyword: ''
})

const pagination = ref({
  page: 1,
  pageSize: 50,
  total: 0
})

// ============ 计算属性 ============
const successRate = computed(() => {
  if (stats.value.todayTotal === 0) return 0
  return ((stats.value.todaySuccess / stats.value.todayTotal) * 100).toFixed(1)
})

// ============ 方法 ============
const loadLogs = async () => {
  try {
    loading.value = true
    const { logType, logCategory, platformCode, status, keyword } = filters.value

    const data = await getLogs(
      pagination.value.pageSize,
      (pagination.value.page - 1) * pagination.value.pageSize,
      platformCode || undefined
    )

    // 客户端筛选
    let result = data
    if (logType) result = result.filter(log => log.logType === logType)
    if (logCategory) result = result.filter(log => log.logCategory === logCategory)
    if (status) result = result.filter(log => log.status === status)
    if (keyword) {
      result = result.filter(log =>
        log.logTitle?.includes(keyword) ||
        log.logContent?.includes(keyword)
      )
    }

    logs.value = result
    pagination.value.total = result.length
  } catch (error) {
    console.error('加载日志失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const data = await getStats()
    stats.value = {
      todayTotal: data.todayTotal,
      todaySuccess: data.todaySuccess,
      todayFailed: data.todayFailed
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const handleFilter = () => {
  pagination.value.page = 1
  loadLogs()
}

const resetFilters = () => {
  filters.value = {
    logType: '',
    logCategory: '',
    platformCode: '',
    status: '',
    keyword: ''
  }
  handleFilter()
}

const handlePageChange = () => {
  loadLogs()
}

const handleSizeChange = () => {
  pagination.value.page = 1
  loadLogs()
}

const showLogDetail = (log: SystemLog) => {
  currentLog.value = log
  showDetailDialog.value = true
}

const closeDetail = () => {
  currentLog.value = null
  showDetailDialog.value = false
}

const exportLogs = () => {
  ElMessage.info('导出功能开发中...')
}

// 格式化方法
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatLogContent = (content: string) => {
  if (!content) return '-'
  try {
    const obj = JSON.parse(content)
    return JSON.stringify(obj, null, 2)
  } catch {
    return content
  }
}

const getLogTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    keepalive: '保活任务',
    api_access: 'API访问',
    task_execution: '任务执行',
    user_action: '用户操作',
    system_event: '系统事件'
  }
  return map[type] || type
}

const getLogTypeTagType = (type: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    keepalive: 'success',
    api_access: 'info',
    task_execution: 'warning',
    user_action: '',
    system_event: 'danger'
  }
  return map[type] || ''
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    success: '成功',
    failed: '失败',
    pending: '进行中'
  }
  return map[status] || status
}

const getStatusTagType = (status: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    success: 'success',
    failed: 'danger',
    pending: 'warning'
  }
  return map[status] || ''
}

const getPlatformLabel = (code: string) => {
  const map: Record<string, string> = {
    zhipu: '智谱AI',
    doubao: '豆包AI'
  }
  return map[code] || code
}

// ============ 生命周期 ============
onMounted(() => {
  loadLogs()
  loadStats()
})
</script>

<style scoped>
.system-logs {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e4e7ed;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.stats-section {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.log-detail {
  padding: 10px 0;
}

.log-content {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
