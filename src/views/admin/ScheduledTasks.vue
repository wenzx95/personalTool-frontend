<template>
  <div class="scheduled-tasks">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">定时任务管理</h1>
        <p class="page-subtitle">管理系统定时任务，包括AI保活、数据采集等</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="任务总数" :value="stats.totalTasks">
            <template #suffix>
              <span style="font-size: 14px">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="运行中" :value="stats.enabledTasks">
            <template #suffix>
              <span style="font-size: 14px">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日执行" :value="stats.todayTotal">
            <template #suffix>
              <span style="font-size: 14px">次</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="成功率" :value="stats.successRate">
            <template #suffix>
              <span style="font-size: 14px">%</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="任务类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="AI保活" value="keepalive" />
            <el-option label="数据采集" value="data_collection" />
            <el-option label="系统任务" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="已启用" value="enabled" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="全部" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="智谱AI" value="zhipu" />
            <el-option label="豆包AI" value="doubao" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <div class="task-list">
      <el-card
        v-for="task in filteredTasks"
        :key="task.taskCode"
        class="task-card"
        shadow="hover"
        :class="{ 'task-disabled': task.enabled === 0 }"
      >
        <!-- 任务头部 -->
        <template #header>
          <div class="task-header">
            <div class="task-info">
              <el-icon class="task-icon" :color="getTaskColor(task)">
                <component :is="getTaskIcon(task)" />
              </el-icon>
              <div class="task-meta">
                <div class="task-name">{{ task.taskName }}</div>
                <div class="task-description">{{ task.description }}</div>
              </div>
            </div>
            <div class="task-actions">
              <el-switch
                :model-value="task.enabled === 1"
                @change="(val: boolean) => handleToggleTask(task, val)"
                active-text="已启用"
                inactive-text="已禁用"
              />
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, task)">
                <el-button text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑配置
                    </el-dropdown-item>
                    <el-dropdown-item command="trigger" :disabled="task.enabled === 0">
                      <el-icon><VideoPlay /></el-icon>
                      立即执行
                    </el-dropdown-item>
                    <el-dropdown-item command="logs" divided>
                      <el-icon><Document /></el-icon>
                      查看日志
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>

        <!-- 任务内容 -->
        <div class="task-content">
          <!-- 基本信息 -->
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="任务类型">
              <el-tag :type="getTypeTagType(task.taskType)">{{ getTypeLabel(task.taskType) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行频率">
              <span style="font-family: monospace">{{ task.cronExpression }}</span>
              <el-text type="info" size="small">({{ getCronDescription(task.cronExpression) }})</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="执行统计">
              <span>总计：{{ task.totalExecutions }}次</span>
              <el-divider direction="vertical" />
              <span style="color: #67c23a">成功：{{ task.successExecutions }}</span>
              <el-divider direction="vertical" />
              <span style="color: #f56c6c">失败：{{ task.failedExecutions }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="最近执行">
              <span v-if="task.lastExecutionTime">{{ formatTime(task.lastExecutionTime) }}</span>
              <el-text v-else type="info">未执行</el-text>
            </el-descriptions-item>
          </el-descriptions>

          <!-- 快速配置 -->
          <div v-if="task.taskType === 'keepalive'" class="quick-config">
            <el-divider content-position="left">快速配置</el-divider>
            <el-form label-width="100px" size="small">
              <el-form-item :label="`${getPlatformLabel(task.platformCode)} API Keys`">
                <el-input
                  v-model="apiKeysCache[task.platformCode!]"
                  type="textarea"
                  :rows="2"
                  placeholder='["key1", "key2"] (JSON数组格式)'
                  @blur="handleUpdateKeys(task)"
                />
                <div class="hint">支持多个Key，系统会轮换使用</div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建定时任务"
      width="600px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="createForm.taskName" placeholder="例如：智谱AI保活" />
        </el-form-item>
        <el-form-item label="任务类型" prop="taskType">
          <el-select v-model="createForm.taskType" placeholder="选择任务类型" style="width: 100%">
            <el-option label="AI保活" value="keepalive" />
            <el-option label="数据采集" value="data_collection" />
            <el-option label="系统任务" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联平台" prop="platformCode" v-if="createForm.taskType === 'keepalive'">
          <el-select v-model="createForm.platformCode" placeholder="选择AI平台" style="width: 100%">
            <el-option label="智谱AI" value="zhipu" />
            <el-option label="豆包AI" value="doubao" />
          </el-select>
        </el-form-item>
        <el-form-item label="Cron表达式" prop="cronExpression">
          <el-input v-model="createForm.cronExpression" placeholder="0 */10 * * * *" />
          <div class="hint">每10分钟执行一次：0 */10 * * * *</div>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="描述这个任务的作用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTask" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑任务对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑任务配置"
      width="600px"
      @close="resetEditForm"
    >
      <el-form :model="editForm" label-width="100px" :rules="editRules" ref="editFormRef">
        <el-form-item label="任务代码">
          <el-input v-model="editForm.taskCode" disabled />
          <div class="hint">任务代码唯一标识，不可修改</div>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-tag :type="getTypeTagType(editForm.taskType)">{{ getTypeLabel(editForm.taskType) }}</el-tag>
          <div class="hint">任务类型不可修改</div>
        </el-form-item>
        <el-form-item label="关联平台" v-if="editForm.platformCode">
          <el-tag v-if="editForm.platformCode === 'zhipu'" type="primary">智谱AI</el-tag>
          <el-tag v-else-if="editForm.platformCode === 'doubao'" type="success">豆包AI</el-tag>
          <div class="hint">关联平台不可修改</div>
        </el-form-item>
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="editForm.taskName" placeholder="例如：智谱AI保活" />
        </el-form-item>
        <el-form-item label="Cron表达式" prop="cronExpression">
          <el-input v-model="editForm.cronExpression" placeholder="0 */10 * * * *" />
          <div class="hint">
            常用表达式：
            <el-link type="primary" @click="editForm.cronExpression = '0 */10 * * * *'">每10分钟</el-link>
            <el-link type="primary" @click="editForm.cronExpression = '0 */5 * * * *'">每5分钟</el-link>
            <el-link type="primary" @click="editForm.cronExpression = '0 0 * * * *'">每小时</el-link>
            <el-link type="primary" @click="editForm.cronExpression = '0 0 0 * * *'">每天0点</el-link>
          </div>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="描述这个任务的作用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditTask" :loading="editing">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  RefreshLeft,
  VideoPlay,
  Edit,
  Document,
  MoreFilled,
  TrendCharts,
  DataLine,
  Setting
} from '@element-plus/icons-vue'
import {
  getAllTasks,
  getTaskStats,
  toggleTask as toggleTaskApi,
  triggerTask,
  updateTask as updateTaskApi,
  createTask as createTaskApi,
  type ScheduledTask
} from '@/api/scheduledTasks'
import { getAIConfigs, updateApiKeys as updateApiKeysApi } from '@/api/keepalive'
import type { SystemConfig } from '@/api/keepalive'
import type { TaskStats } from '@/api/scheduledTasks'

// ============ 响应式数据 ============
const allTasks = ref<ScheduledTask[]>([])
const stats = ref<TaskStats>({
  totalTasks: 0,
  enabledTasks: 0,
  todayTotal: 0,
  successRate: '0',
  totalSuccess: 0,
  totalFailed: 0,
  byType: {}
})

const filters = ref({
  type: '',
  status: '',
  platform: ''
})

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const creating = ref(false)
const editing = ref(false)
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

const createForm = ref({
  taskName: '',
  taskType: '',
  platformCode: '',
  cronExpression: '0 */10 * * * *',
  description: ''
})

const createRules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  platformCode: [{ required: true, message: '请选择关联平台', trigger: 'change' }],
  cronExpression: [{ required: true, message: '请输入Cron表达式', trigger: 'blur' }],
  description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }]
}

const editForm = ref({
  taskCode: '',
  taskName: '',
  taskType: '',
  platformCode: '',
  cronExpression: '',
  description: ''
})

const editRules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  cronExpression: [{ required: true, message: '请输入Cron表达式', trigger: 'blur' }],
  description: [{ required: true, message: '请输入任务描述', trigger: 'blur' }]
}

// API Keys 缓存
const apiKeysCache = reactive<Record<string, string>>({
  zhipu: '[]',
  doubao: '[]'
})

// ============ 计算属性 ============
const filteredTasks = computed(() => {
  let result = allTasks.value

  if (filters.value.type) {
    result = result.filter(t => t.taskType === filters.value.type)
  }

  if (filters.value.status === 'enabled') {
    result = result.filter(t => t.enabled === 1)
  } else if (filters.value.status === 'disabled') {
    result = result.filter(t => t.enabled === 0)
  }

  if (filters.value.platform) {
    result = result.filter(t => t.platformCode === filters.value.platform)
  }

  return result
})

// ============ 方法 ============
const loadData = async () => {
  try {
    const [tasksData, statsData] = await Promise.all([
      getAllTasks(),
      getTaskStats()
    ])

    // 确保数据是数组
    allTasks.value = Array.isArray(tasksData) ? tasksData : []

    // 确保统计数据是对象且有默认值
    stats.value = {
      totalTasks: statsData?.totalTasks ?? 0,
      enabledTasks: statsData?.enabledTasks ?? 0,
      todayTotal: statsData?.todayTotal ?? 0,
      successRate: statsData?.successRate ?? '0',
      totalSuccess: statsData?.totalSuccess ?? 0,
      totalFailed: statsData?.totalFailed ?? 0,
      byType: statsData?.byType ?? {}
    }

    // 加载 API Keys 配置
    await loadApiKeys()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载失败')
    // 出错时设置默认值
    allTasks.value = []
    stats.value = {
      totalTasks: 0,
      enabledTasks: 0,
      todayTotal: 0,
      successRate: '0',
      totalSuccess: 0,
      totalFailed: 0,
      byType: {}
    }
  }
}

const loadApiKeys = async () => {
  try {
    const configs = await getAIConfigs()
    configs.forEach((config: SystemConfig) => {
      if (config.configKey === 'ai.zhipu.keys') {
        apiKeysCache.zhipu = config.configValue
      } else if (config.configKey === 'ai.doubao.keys') {
        apiKeysCache.doubao = config.configValue
      }
    })
  } catch (error) {
    console.error('加载API Keys配置失败，将不显示API Keys输入框')
    // 不显示错误提示，因为API Keys不是必需的
  }
}

const applyFilters = () => {
  // 筛选逻辑由 computed 属性自动处理，这个方法保留用于手动触发
}

// 查询按钮
const handleQuery = () => {
  applyFilters()
  ElMessage.success('查询已执行')
}

// 重置按钮
const handleReset = () => {
  filters.value = {
    type: '',
    status: '',
    platform: ''
  }
  applyFilters()
  ElMessage.info('筛选条件已重置')
}

const handleToggleTask = async (task: ScheduledTask, enabled: boolean) => {
  try {
    await toggleTaskApi(task.taskCode, enabled)
    ElMessage.success(`${task.taskName} 已${enabled ? '启用' : '禁用'}`)
    await loadData()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleUpdateKeys = async (task: ScheduledTask) => {
  if (!task.platformCode) return

  try {
    // 验证JSON格式
    const keys = apiKeysCache[task.platformCode]
    if (keys && keys.trim() !== '[]') {
      JSON.parse(keys)
    }

    const result = await updateApiKeysApi(task.platformCode, keys)
    if (result.code === 200) {
      ElMessage.success('API Keys 更新成功')
    } else {
      ElMessage.error(result.message || 'API Keys 更新失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || 'JSON格式错误或更新失败')
  }
}

const handleCommand = async (command: string, task: ScheduledTask) => {
  switch (command) {
    case 'edit':
      await handleOpenEditDialog(task)
      break
    case 'trigger':
      await handleTriggerTask(task)
      break
    case 'logs':
      // 跳转到日志页面并筛选
      window.location.href = `/admin/system-logs?platform=${task.platformCode}`
      break
  }
}

const handleOpenEditDialog = (task: ScheduledTask) => {
  editForm.value = {
    taskCode: task.taskCode,
    taskName: task.taskName,
    taskType: task.taskType,
    platformCode: task.platformCode || '',
    cronExpression: task.cronExpression,
    description: task.description
  }
  showEditDialog.value = true
}

const handleEditTask = async () => {
  try {
    await editFormRef.value?.validate()
    editing.value = true

    const result = await updateTaskApi(editForm.value.taskCode, {
      taskName: editForm.value.taskName,
      cronExpression: editForm.value.cronExpression,
      description: editForm.value.description,
      executorParams: editForm.value.platformCode ? JSON.stringify({ platform: editForm.value.platformCode }) : undefined
    })

    if (result.code === 200) {
      ElMessage.success('任务配置已更新')
      showEditDialog.value = false
      await loadData()
    } else {
      ElMessage.error(result.message || '更新失败')
    }
  } catch (error: any) {
    if (error !== false) { // 表单验证失败时 error 为 false
      console.error('更新任务失败:', error)
      ElMessage.error(error?.message || '更新失败')
    }
  } finally {
    editing.value = false
  }
}

const resetEditForm = () => {
  editForm.value = {
    taskCode: '',
    taskName: '',
    taskType: '',
    platformCode: '',
    cronExpression: '',
    description: ''
  }
  editFormRef.value?.resetFields()
}

const handleTriggerTask = async (task: ScheduledTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要立即执行 "${task.taskName}" 吗？`,
      '立即执行',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    const result = await triggerTask(task.taskCode)

    // 检查后端返回的code
    if (result.code === 200) {
      ElMessage({
        message: result.message || '任务执行成功',
        type: 'success',
        duration: 3000,
        showClose: true
      })
      await loadData()
    } else {
      // 失败时使用更大的对话框显示详细错误
      ElMessageBox.alert(
        result.message || '任务执行失败，请查看后端日志',
        '执行失败',
        {
          confirmButtonText: '确定',
          type: 'error',
          dangerouslyUseHTMLString: true,
          customClass: 'trigger-error-message'
        }
      )
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessageBox.alert(
        error?.message || '执行失败，请查看后端日志',
        '执行失败',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      )
    }
  }
}

const handleCreateTask = async () => {
  try {
    await createFormRef.value?.validate()
    creating.value = true

    // 自动生成任务代码
    const taskCode = `${createForm.value.platformCode || 'custom'}_keepalive_${Date.now()}`

    const result = await createTaskApi({
      taskCode,
      taskName: createForm.value.taskName,
      taskType: createForm.value.taskType,
      platformCode: createForm.value.platformCode,
      cronExpression: createForm.value.cronExpression,
      description: createForm.value.description,
      enabled: 0, // 默认禁用
      executorClass: 'keepAliveSchedulerService',
      executorMethod: 'manualTrigger',
      executorParams: JSON.stringify({ platform: createForm.value.platformCode })
    })

    if (result.code === 200) {
      ElMessage.success('任务创建成功')
      showCreateDialog.value = false
      await loadData()
    } else {
      ElMessage.error(result.message || '创建失败')
    }
  } catch (error: any) {
    if (error !== false) { // 表单验证失败时 error 为 false
      console.error('创建任务失败:', error)
      ElMessage.error(error?.message || '创建失败')
    }
  } finally {
    creating.value = false
  }
}

const resetCreateForm = () => {
  createForm.value = {
    taskName: '',
    taskType: '',
    platformCode: '',
    cronExpression: '0 */10 * * * *',
    description: ''
  }
  createFormRef.value?.resetFields()
}

// 工具函数
const getTaskIcon = (task: ScheduledTask) => {
  switch (task.taskType) {
    case 'keepalive':
      return TrendCharts
    case 'data_collection':
      return DataLine
    default:
      return Setting
  }
}

const getTaskColor = (task: ScheduledTask) => {
  if (task.platformCode === 'zhipu') return '#409EFF'
  if (task.platformCode === 'doubao') return '#67C23A'
  return '#909399'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    keepalive: 'AI保活',
    data_collection: '数据采集',
    cleanup: '清理任务',
    backup: '备份任务',
    system: '系统任务'
  }
  return labels[type] || type
}

const getTypeTagType = (type: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    keepalive: 'success',
    data_collection: 'warning',
    cleanup: 'info',
    backup: 'info',
    system: ''
  }
  return types[type] || ''
}

const getPlatformLabel = (platform?: string) => {
  if (!platform) return ''
  const labels: Record<string, string> = {
    zhipu: '智谱AI',
    doubao: '豆包AI'
  }
  return labels[platform] || platform
}

const getCronDescription = (cron: string) => {
  // 简单的 Cron 表达式解析
  if (cron === '0 */10 * * * *') return '每10分钟'
  if (cron === '0 */5 * * * *') return '每5分钟'
  if (cron === '0 0 * * * *') return '每小时'
  if (cron === '0 0 0 * * *') return '每天0点'
  return cron
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleString('zh-CN')
}

// ============ 生命周期 ============
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.scheduled-tasks {
  padding: 20px;
  max-width: 1400px;
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

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  transition: all 0.3s;
}

.task-card.task-disabled {
  opacity: 0.6;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-icon {
  width: 32px;
  height: 32px;
  font-size: 24px;
}

.task-meta {
  flex: 1;
}

.task-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.task-description {
  font-size: 13px;
  color: #909399;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-content {
  margin-top: 16px;
}

.quick-config {
  margin-top: 16px;
}

.hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .scheduled-tasks {
    padding: 12px;
  }
}
</style>
