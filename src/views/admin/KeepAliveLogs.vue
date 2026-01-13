<template>
  <div class="keepalive-logs">
    <div class="page-header">
      <h1 class="page-title">日志管理</h1>
      <p class="page-subtitle">查看系统日志，包括定时任务、API访问、用户操作等</p>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="全部平台" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="智谱AI" value="zhipu" />
            <el-option label="豆包AI" value="doubao" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="createdAt" label="执行时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="platformCode" label="平台" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.platformCode === 'zhipu'" type="primary">智谱</el-tag>
            <el-tag v-else-if="row.platformCode === 'doubao'" type="success">豆包</el-tag>
            <el-tag v-else type="info">{{ row.platformCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="logTitle" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="Token消耗" width="120">
          <template #default="{ row }">
            <span v-if="row.status === 'success'">{{ getTokenUsage(row.logContent) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            {{ row.duration }}ms
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'success'" type="success">成功</el-tag>
            <el-tag v-else-if="row.status === 'failed'" type="danger">失败</el-tag>
            <el-tag v-else type="info">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="日志详情" width="800px">
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行时间">
            {{ formatTime(selectedLog.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="平台">
            {{ getPlatformName(selectedLog.platformCode) }}
          </el-descriptions-item>
          <el-descriptions-item label="任务代码">
            {{ selectedLog.taskCode }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="selectedLog.status === 'success'" type="success" size="small">成功</el-tag>
            <el-tag v-else-if="selectedLog.status === 'failed'" type="danger" size="small">失败</el-tag>
            <el-tag v-else type="info" size="small">{{ selectedLog.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">
            {{ selectedLog.duration }}ms
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">
            {{ selectedLog.logTitle }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 日志内容 -->
        <div class="log-content-section">
          <h3>日志内容</h3>
          <pre class="log-content">{{ formatLogContent(selectedLog.logContent) }}</pre>
        </div>

        <!-- 错误信息 -->
        <div v-if="selectedLog.status === 'failed' && selectedLog.errorMessage" class="error-section">
          <h3>错误信息</h3>
          <pre class="error-message">{{ selectedLog.errorMessage }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getLogs } from '@/api/keepalive'
import type { SystemLog } from '@/api/keepalive'

// 日志数据
const logs = ref<SystemLog[]>([])
const loading = ref(false)

// 筛选器
const filters = reactive({
  platform: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const selectedLog = ref<SystemLog | null>(null)

// 加载日志
const loadLogs = async () => {
  loading.value = true
  try {
    const offset = (pagination.page - 1) * pagination.pageSize
    const platform = filters.platform || undefined
    const data = await getLogs(pagination.pageSize, offset, platform)

    // 根据状态筛选
    let filteredLogs = data
    if (filters.status) {
      filteredLogs = data.filter(log => log.status === filters.status)
    }

    logs.value = filteredLogs
    pagination.total = filteredLogs.length
  } catch (error) {
    console.error('加载日志失败', error)
    ElMessage.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取平台名称
const getPlatformName = (code: string) => {
  const map: Record<string, string> = {
    zhipu: '智谱AI',
    doubao: '豆包AI'
  }
  return map[code] || code
}

// 获取Token消耗
const getTokenUsage = (content: string) => {
  try {
    const data = JSON.parse(content)
    return data.totalTokens || 0
  } catch {
    return '-'
  }
}

// 格式化日志内容
const formatLogContent = (content: string) => {
  try {
    const data = JSON.parse(content)
    return JSON.stringify(data, null, 2)
  } catch {
    return content
  }
}

// 筛选
const handleFilter = () => {
  pagination.page = 1
  loadLogs()
}

// 刷新
const handleRefresh = () => {
  loadLogs()
}

// 分页大小变化
const handleSizeChange = () => {
  pagination.page = 1
  loadLogs()
}

// 页码变化
const handlePageChange = () => {
  loadLogs()
}

// 查看详情
const handleViewDetail = (log: SystemLog) => {
  selectedLog.value = log
  detailDialogVisible.value = true
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped lang="scss">
.keepalive-logs {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}

.log-detail {
  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 20px 0 10px 0;
  }

  .log-content-section {
    .log-content {
      background: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      max-height: 400px;
      overflow-y: auto;
    }
  }

  .error-section {
    .error-message {
      background: #fef0f0;
      padding: 12px;
      border-radius: 4px;
      color: #f56c6c;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
    }
  }
}
</style>
