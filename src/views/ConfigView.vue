<template>
  <div class="config-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">系统配置管理</h1>
        <p class="page-subtitle">System Configuration Management</p>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="handleRefreshAll" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新配置
        </el-button>
        <el-button type="success" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新增配置
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row" v-if="stats.total">
      <div class="stat-item">
        <div class="stat-label">总配置数</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Python服务</div>
        <div class="stat-value text-blue">{{ stats.byCategory.python_service || 0 }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">市场配置</div>
        <div class="stat-value text-green">{{ stats.byCategory.market || 0 }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">系统配置</div>
        <div class="stat-value text-orange">{{ stats.byCategory.system || 0 }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">缓存配置</div>
        <div class="stat-value text-purple">{{ stats.byCategory.cache || 0 }}</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select
        v-model="filterCategory"
        placeholder="选择分类"
        clearable
        style="width: 200px"
      >
        <el-option label="全部分类" value=""></el-option>
        <el-option label="Python服务" value="python_service"></el-option>
        <el-option label="市场" value="market"></el-option>
        <el-option label="系统" value="system"></el-option>
        <el-option label="缓存" value="cache"></el-option>
        <el-option label="日志" value="logging"></el-option>
        <el-option label="安全" value="security"></el-option>
      </el-select>

      <el-input
        v-model="searchText"
        placeholder="搜索配置键"
        clearable
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-checkbox v-model="showActiveOnly">只显示启用</el-checkbox>
    </div>

    <!-- 配置表格 -->
    <div class="table-wrapper">
      <el-table
        :data="filteredConfigs"
        stripe
        v-loading="loading"
        border
        class="data-table"
      >
        <el-table-column prop="configKey" label="配置键" width="220" fixed="left" />
        <el-table-column prop="configValue" label="配置值" min-width="200" show-overflow-tooltip />
        <el-table-column prop="configType" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getConfigTypeTagType(row.configType)" size="small">
              {{ row.configType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="150" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isActive" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180" align="center" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.isNew ? '新增配置' : '编辑配置'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="editForm" label-width="100px" :rules="formRules" ref="editFormRef">
        <el-form-item label="配置键" prop="configKey" v-if="editForm.isNew">
          <el-input v-model="editForm.configKey" placeholder="例如: python.service.url" />
        </el-form-item>
        <el-form-item label="配置键" v-else>
          <el-input v-model="editForm.configKey" disabled />
        </el-form-item>

        <el-form-item label="配置值" prop="configValue">
          <!-- 普通输入框 -->
          <el-input
            v-if="editForm.configType === 'string'"
            v-model="editForm.configValue"
            placeholder="请输入配置值"
          />
          <!-- 数字输入框 -->
          <el-input
            v-else-if="editForm.configType === 'number'"
            v-model.number="editForm.configValue"
            type="number"
            placeholder="请输入数字"
          />
          <!-- 布尔值 -->
          <el-switch
            v-else-if="editForm.configType === 'boolean'"
            v-model="editForm.configValueBool"
            active-text="启用"
            inactive-text="禁用"
          />
          <!-- JSON文本域 -->
          <el-input
            v-else-if="editForm.configType === 'json'"
            type="textarea"
            :rows="6"
            v-model="editForm.configValue"
            placeholder="请输入JSON格式的配置值"
          />
        </el-form-item>

        <template v-if="editForm.isNew">
          <el-form-item label="配置类型" prop="configType">
            <el-select v-model="editForm.configType" placeholder="选择配置类型">
              <el-option label="字符串" value="string"></el-option>
              <el-option label="数字" value="number"></el-option>
              <el-option label="布尔值" value="boolean"></el-option>
              <el-option label="JSON" value="json"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="分类" prop="category">
            <el-select v-model="editForm.category" placeholder="选择分类">
              <el-option label="Python服务" value="python_service"></el-option>
              <el-option label="市场" value="market"></el-option>
              <el-option label="系统" value="system"></el-option>
              <el-option label="缓存" value="cache"></el-option>
              <el-option label="日志" value="logging"></el-option>
              <el-option label="安全" value="security"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="描述" prop="description">
            <el-input
              type="textarea"
              :rows="2"
              v-model="editForm.description"
              placeholder="请输入配置描述"
            />
          </el-form-item>

          <el-form-item label="状态">
            <el-switch v-model="editForm.isActive" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="配置类型">
            <el-tag :type="getConfigTypeTagType(editForm.configType)">
              {{ editForm.configType }}
            </el-tag>
          </el-form-item>

          <el-form-item label="分类">
            <el-tag>{{ getCategoryLabel(editForm.category) }}</el-tag>
          </el-form-item>

          <el-form-item label="描述" v-if="editForm.description">
            <span>{{ editForm.description }}</span>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  getConfigList,
  updateConfig,
  refreshConfig,
  getConfigStats,
  type SystemConfig,
  type ConfigStats
} from '@/api/config'

// ============ 响应式数据 ============
const loading = ref(false)
const refreshing = ref(false)
const saving = ref(false)
const configList = ref<SystemConfig[]>([])
const stats = ref<ConfigStats>({ total: 0, byCategory: {} })

// 筛选条件
const filterCategory = ref<string>('')
const searchText = ref<string>('')
const showActiveOnly = ref<boolean>(false)

// 编辑对话框
const editDialogVisible = ref<boolean>(false)
const editFormRef = ref<FormInstance>()
const editForm = ref<any>({
  configKey: '',
  configValue: '',
  configValueBool: false,
  configType: 'string',
  category: '',
  description: '',
  isActive: true,
  isNew: false
})

// 表单验证规则
const formRules = {
  configKey: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  configType: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

// ============ 计算属性 ============
const filteredConfigs = computed(() => {
  let result = configList.value

  // 按分类筛选
  if (filterCategory.value) {
    result = result.filter(config => config.category === filterCategory.value)
  }

  // 按搜索文本筛选
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    result = result.filter(config =>
      config.configKey.toLowerCase().includes(searchLower) ||
      config.description?.toLowerCase().includes(searchLower)
    )
  }

  // 只显示启用
  if (showActiveOnly.value) {
    result = result.filter(config => config.isActive)
  }

  return result
})

// ============ 方法 ============

/**
 * 加载配置列表
 */
const loadConfigs = async () => {
  try {
    loading.value = true
    const [configsData, statsData] = await Promise.all([
      getConfigList(),
      getConfigStats()
    ])
    configList.value = configsData
    stats.value = statsData
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

/**
 * 刷新所有配置到Environment
 */
const handleRefreshAll = async () => {
  try {
    refreshing.value = true
    await refreshConfig()
    ElMessage.success('配置刷新成功')
    await loadConfigs()
  } catch (error) {
    console.error('刷新配置失败:', error)
    ElMessage.error('刷新配置失败')
  } finally {
    refreshing.value = false
  }
}

/**
 * 编辑配置
 */
const handleEdit = (row: SystemConfig) => {
  editForm.value = {
    configKey: row.configKey,
    configValue: row.configValue,
    configValueBool: row.configValue === 'true',
    configType: row.configType,
    category: row.category,
    description: row.description,
    isActive: row.isActive,
    isNew: false
  }
  editDialogVisible.value = true
}

/**
 * 新增配置
 */
const showAddDialog = () => {
  editForm.value = {
    configKey: '',
    configValue: '',
    configValueBool: false,
    configType: 'string',
    category: '',
    description: '',
    isActive: true,
    isNew: true
  }
  editDialogVisible.value = true
}

/**
 * 保存配置
 */
const handleSave = async () => {
  try {
    // 表单验证
    const valid = await editFormRef.value?.validate()
    if (!valid) return

    saving.value = true

    // 处理布尔值
    let finalValue = editForm.value.configValue
    if (editForm.value.configType === 'boolean') {
      finalValue = editForm.value.configValueBool ? 'true' : 'false'
    }

    // 调用API更新配置
    await updateConfig(editForm.value.configKey, finalValue)

    // 刷新配置到Environment
    await refreshConfig()

    ElMessage.success('配置保存成功，已刷新到Environment')

    // 关闭对话框
    editDialogVisible.value = false

    // 重新加载配置列表
    await loadConfigs()
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  } finally {
    saving.value = false
  }
}

/**
 * 删除配置
 */
const handleDelete = (row: SystemConfig) => {
  ElMessageBox.confirm(
    `确定要删除配置 "${row.configKey}" 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      // TODO: 调用删除API（后端暂未实现）
      ElMessage.warning('删除功能暂未实现')
    })
    .catch(() => {
      // 用户取消
    })
}

/**
 * 对话框关闭处理
 */
const handleDialogClose = () => {
  editFormRef.value?.resetFields()
}

/**
 * 获取配置类型标签颜色
 */
const getConfigTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    string: '',
    number: 'success',
    boolean: 'warning',
    json: 'danger'
  }
  return typeMap[type] || ''
}

/**
 * 获取分类标签
 */
const getCategoryLabel = (category: string) => {
  const categoryMap: Record<string, string> = {
    python_service: 'Python服务',
    market: '市场',
    system: '系统',
    cache: '缓存',
    logging: '日志',
    security: '安全'
  }
  return categoryMap[category] || category
}

// ============ 生命周期 ============
onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.config-view {
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

.action-buttons {
  display: flex;
  gap: 12px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-value.text-blue {
  color: #409eff;
}

.stat-value.text-green {
  color: #67c23a;
}

.stat-value.text-orange {
  color: #e6a23c;
}

.stat-value.text-purple {
  color: #909399;
}

.filter-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.data-table {
  width: 100%;
}

.data-table :deep(.el-table__header) {
  background-color: #f5f7fa;
}

.data-table :deep(.el-table__body tr:hover > td) {
  background-color: #f5f7fa;
}
</style>
