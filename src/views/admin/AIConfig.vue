<template>
  <div class="ai-config">
    <div class="page-header">
      <h1 class="page-title">定时任务管理</h1>
      <p class="page-subtitle">管理系统定时任务，包括AI保活、数据采集等</p>
    </div>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日总执行" :value="stats.todayTotal" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="成功次数" :value="stats.todaySuccess">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em">
                <SuccessFilled />
              </el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="失败次数" :value="stats.todayFailed">
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
          <el-statistic title="启用平台" :value="enabledPlatformsCount">
            <template #suffix>
              <span style="font-size: 14px">/ 2</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 平台配置卡片 -->
    <div class="platform-cards">
      <el-card v-for="platform in platforms" :key="platform.code" class="platform-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="platform-info">
              <el-icon class="platform-icon" :color="platform.color">
                <component :is="platform.icon" />
              </el-icon>
              <span class="platform-name">{{ platform.name }}</span>
            </div>
            <el-switch
              v-model="platform.taskEnabled"
              @change="handleToggleTask(platform)"
              active-text="已启用"
              inactive-text="已禁用"
            />
          </div>
        </template>

        <div class="config-form">
          <!-- API Keys 配置 -->
          <el-form-item label="API Keys">
            <el-input
              v-model="platform.keys"
              type="textarea"
              :rows="2"
              placeholder='["key1", "key2"] (JSON数组格式)'
              @blur="handleUpdateKeys(platform)"
            />
            <div class="hint">支持多个API Key，系统会轮换使用</div>
          </el-form-item>

          <!-- API URL -->
          <el-form-item label="API URL">
            <el-input v-model="platform.url" disabled />
          </el-form-item>

          <!-- 模型名称 -->
          <el-form-item label="模型">
            <el-input v-model="platform.model" disabled />
          </el-form-item>

          <!-- 最大token数 -->
          <el-form-item label="最大Token">
            <el-input-number v-model="platform.maxTokens" :min="1" :max="1000" />
            <el-button @click="handleUpdateConfig(platform, 'maxTokens')" text>更新</el-button>
          </el-form-item>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button type="primary" @click="handleTrigger(platform)" :loading="platform.triggering">
              <el-icon><VideoPlay /></el-icon>
              立即执行
            </el-button>
            <el-button @click="handleRefresh(platform)">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <!-- 今日执行统计 -->
          <div class="execution-stats">
            <span class="stats-label">今日执行：</span>
            <span class="stats-value">{{ platform.todayCount }} 次</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOverview,
  getStats,
  updateApiKeys,
  updatePlatformConfig,
  updateTaskEnabled,
  triggerKeepAlive
} from '@/api/keepalive'
import type { KeepAliveStats } from '@/api/keepalive'

// 统计信息
const stats = reactive<KeepAliveStats>({
  todayTotal: 0,
  todaySuccess: 0,
  todayFailed: 0,
  zhipu: { count: 0, enabled: false },
  doubao: { count: 0, enabled: false }
})

// 平台配置
const platforms = reactive<any[]>([
  {
    code: 'zhipu',
    name: '智谱AI',
    icon: 'ChatDotRound',
    color: '#409eff',
    keys: '[]',
    url: '',
    model: '',
    maxTokens: 10,
    temperature: '0.10',
    taskEnabled: false,
    hasKeys: false,
    todayCount: 0,
    triggering: false
  },
  {
    code: 'doubao',
    name: '豆包AI',
    icon: 'ChatLineRound',
    color: '#67c23a',
    keys: '[]',
    url: '',
    model: '',
    maxTokens: 10,
    temperature: '0.10',
    taskEnabled: false,
    hasKeys: false,
    todayCount: 0,
    triggering: false
  }
])

// 计算启用平台数量
const enabledPlatformsCount = computed(() => {
  return platforms.filter(p => p.taskEnabled).length
})

// 加载数据
const loadData = async () => {
  try {
    const [overviewData, statsData] = await Promise.all([
      getOverview(),
      getStats()
    ])

    // 更新统计信息
    Object.assign(stats, statsData)

    // 更新平台配置
    platforms.forEach(platform => {
      const config = overviewData[platform.code]
      if (config) {
        Object.assign(platform, config)
        const platformStats = (stats as any)[platform.code]
        platform.taskEnabled = platformStats.enabled
      }
    })
  } catch (error) {
    console.error('加载数据失败', error)
    ElMessage.error('加载数据失败')
  }
}

// 切换任务启用状态
const handleToggleTask = async (platform: any) => {
  try {
    const result = await updateTaskEnabled(platform.code, platform.taskEnabled)
    if (result.code === 200) {
      ElMessage.success(`${platform.name}保活任务已${platform.taskEnabled ? '启用' : '禁用'}`)
      await loadData()
    } else {
      ElMessage.error(result.message || '操作失败')
      platform.taskEnabled = !platform.taskEnabled // 回滚状态
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
    platform.taskEnabled = !platform.taskEnabled // 回滚状态
  }
}

// 更新API Keys
const handleUpdateKeys = async (platform: any) => {
  try {
    // 验证JSON格式
    if (platform.keys && platform.keys.trim() !== '[]') {
      JSON.parse(platform.keys)
    }

    const result = await updateApiKeys(platform.code, platform.keys)
    if (result.code === 200) {
      ElMessage.success('API Keys更新成功')
      await loadData()
    } else {
      ElMessage.error(result.message || 'API Keys更新失败')
    }
  } catch (error: any) {
    ElMessage.error('API Keys格式错误，请使用JSON数组格式')
  }
}

// 更新配置
const handleUpdateConfig = async (platform: any, field: string) => {
  try {
    const result = await updatePlatformConfig(platform.code, { [field]: platform[field] })
    if (result.code === 200) {
      ElMessage.success('配置更新成功')
      await loadData()
    } else {
      ElMessage.error(result.message || '配置更新失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '配置更新失败')
  }
}

// 手动触发保活任务
const handleTrigger = async (platform: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要立即执行${platform.name}保活任务吗？`,
      '确认操作',
      { type: 'warning' }
    )

    platform.triggering = true
    const result = await triggerKeepAlive(platform.code)

    ElMessage.success(`${platform.name}保活任务执行完成：${result.logTitle}`)
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('执行失败')
    }
  } finally {
    platform.triggering = false
  }
}

// 刷新单个平台数据
const handleRefresh = async (platform: any) => {
  try {
    const overview = await getOverview()
    const config = overview[platform.code]
    if (config) {
      Object.assign(platform, config)
    }
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.ai-config {
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

.stats-section {
  margin-bottom: 20px;
}

.platform-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.platform-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .platform-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .platform-icon {
        font-size: 24px;
      }

      .platform-name {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }

  .config-form {
    .el-form-item {
      margin-bottom: 16px;
    }

    .hint {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
    }

    .execution-stats {
      margin-top: 16px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      font-size: 14px;

      .stats-label {
        color: #606266;
      }

      .stats-value {
        color: #409eff;
        font-weight: 600;
        margin-left: 8px;
      }
    }
  }
}
</style>
