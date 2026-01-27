<template>
  <div class="data-collection">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">数据采集</h1>
        <p class="page-subtitle">从东方财富采集实时市场数据</p>
      </div>
      <div class="header-actions">
        <el-button @click="goToOverview">
          <el-icon><ArrowLeft /></el-icon>
          返回概览
        </el-button>
      </div>
    </div>

    <!-- Collection Card -->
    <div class="collection-card">
      <el-card shadow="never">
        <!-- Step Progress Indicator -->
        <div class="step-progress">
          <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <div class="step-number">1</div>
            <div class="step-label">选择日期</div>
          </div>
          <div class="step-line" :class="{ active: currentStep > 1 }"></div>
          <div class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <div class="step-number">2</div>
            <div class="step-label">采集数据</div>
          </div>
          <div class="step-line" :class="{ active: currentStep > 2 }"></div>
          <div class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
            <div class="step-number">3</div>
            <div class="step-label">填写信息</div>
          </div>
        </div>

        <!-- Step 1: Select Date -->
        <div class="step-section">
          <div class="step-header">
            <el-icon class="step-icon"><Calendar /></el-icon>
            <h3 class="step-title">步骤 1：选择日期</h3>
          </div>
          <div class="step-content">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择要采集的日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
              size="large"
              style="width: 300px"
            />
            <el-alert
              title="提示"
              type="info"
              :closable="false"
              style="margin-top: 16px; max-width: 600px"
            >
              只能选择历史日期，系统将从东方财富网采集该日期的市场数据
            </el-alert>
          </div>
        </div>

        <el-divider />

        <!-- Step 2: Collect Data -->
        <div class="step-section">
          <div class="step-header">
            <el-icon class="step-icon"><Download /></el-icon>
            <h3 class="step-title">步骤 2：采集数据</h3>
          </div>
          <div class="step-content">
            <el-button
              type="success"
              size="large"
              :loading="collectLoading"
              :disabled="!selectedDate"
              @click="handleCollect"
            >
              <el-icon><Refresh /></el-icon>
              {{ collectLoading ? '采集中...' : '开始采集数据' }}
            </el-button>

            <!-- Progress -->
            <div v-if="collectLoading" style="margin-top: 24px; max-width: 600px">
              <el-progress
                :percentage="collectProgress"
                :indeterminate="true"
                status="success"
              >
                <span class="progress-text">正在采集市场数据，请稍候...</span>
              </el-progress>
            </div>

            <!-- Real-time Logs -->
            <el-collapse v-if="logMessages.length > 0" style="margin-top: 24px; max-width: 800px">
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

            <!-- Success Message -->
            <el-alert
              v-if="collectedData && !collectLoading"
              title="数据采集成功！"
              type="success"
              :closable="false"
              style="margin-top: 16px; max-width: 600px"
              show-icon
            >
              已成功采集 {{ selectedDate }} 的市场数据，请填写下方信息后保存
            </el-alert>
          </div>
        </div>

        <el-divider />

        <!-- Step 3: Fill Info -->
        <div class="step-section">
          <div class="step-header">
            <el-icon class="step-icon"><Edit /></el-icon>
            <h3 class="step-title">步骤 3：填写信息</h3>
          </div>
          <div class="step-content">
            <el-form
              ref="formRef"
              :model="createForm"
              label-width="140px"
              label-position="left"
              style="max-width: 900px"
              :disabled="!collectedData"
            >
              <!-- 基础信息 -->
              <el-divider content-position="left">
                <span class="section-title">基础信息</span>
              </el-divider>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="复盘日期">
                    <el-input v-model="createForm.date" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="成交额（元）">
                    <el-input-number
                      v-model="createForm.volume"
                      :min="0"
                      :step="100000000"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
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
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="红盘数">
                    <el-input-number
                      v-model="createForm.red_count"
                      :min="0"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="绿盘数">
                    <el-input-number
                      v-model="createForm.green_count"
                      :min="0"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 涨跌停数据 -->
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
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="跌停数">
                    <el-input-number
                      v-model="createForm.limit_down_count"
                      :min="0"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="炸板数">
                    <el-input-number
                      v-model="createForm.zt_count"
                      :min="0"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
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
                      disabled
                      controls-position="right"
                      style="width: 100%"
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
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 连板数据 -->
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
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="2板数">
                    <el-input-number
                      v-model="createForm.two_board_count"
                      :min="0"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="3板数">
                    <el-input-number
                      v-model="createForm.three_board_count"
                      :min="0"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
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
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="连板高度（天）">
                    <el-input-number
                      v-model="createForm.max_continuous_days"
                      :min="0"
                      :precision="0"
                      disabled
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 用户输入部分 -->
              <el-divider content-position="left">
                <span class="section-title">填写信息</span>
              </el-divider>

              <el-form-item label="热门板块" required>
                <el-select
                  v-model="createForm.hot_sectors"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或输入板块名称"
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

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  @click="handleSave"
                  :loading="submitLoading"
                  :disabled="!collectedData"
                >
                  <el-icon><Check /></el-icon>
                  保存复盘记录
                </el-button>
                <el-button size="large" @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, Download, Edit, Refresh, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getMarketReview,
  createReview,
  type CreateReviewRequest
} from '@/api/market'

const router = useRouter()
const selectedDate = ref('')
const collectLoading = ref(false)
const collectProgress = ref(0)
const submitLoading = ref(false)
const collectedData = ref<any>(null)
const logMessages = ref<string[]>([])
const currentStep = ref(1)

let eventSource: EventSource | null = null
let currentSessionId: string | null = null

const generateSessionId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9)
}

const connectSSE = (sessionId: string) => {
  logMessages.value = []
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/sse/events/${sessionId}`
  eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    logMessages.value.push(event.data)
  }

  eventSource.onerror = (error) => {
    console.error('SSE error:', error)
  }
}

const closeSSE = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

const commonSectors = [
  '人工智能', '软件开发', '新能源', '芯片半导体', '医药医疗',
  '军工', '白酒', '机器人', '数据中心', '汽车零部件',
  '传媒', '通信', '金属', '电池', '电力',
  '房地产', '银行', '券商', '保险', '建筑工程'
]

const createForm = ref<{
  date: string
  volume: number
  total_stocks: number
  red_count: number
  green_count: number
  limit_up_count: number
  limit_down_count: number
  zt_count: number
  zt_rate: number
  total_continuous_limit: number
  continuous_limit_rate: number
  two_board_count: number
  three_board_count: number
  four_plus_count: number
  max_continuous_days: number
  hot_sectors: string[]
  notes: string
}>({
  date: '',
  volume: 0,
  total_stocks: 0,
  red_count: 0,
  green_count: 0,
  limit_up_count: 0,
  limit_down_count: 0,
  zt_count: 0,
  zt_rate: 0,
  total_continuous_limit: 0,
  continuous_limit_rate: 0,
  two_board_count: 0,
  three_board_count: 0,
  four_plus_count: 0,
  max_continuous_days: 0,
  hot_sectors: [],
  notes: ''
})

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}

const handleCollect = async () => {
  if (!selectedDate.value) {
    ElMessage.warning('请先选择日期')
    return
  }

  collectLoading.value = true
  collectProgress.value = 0
  logMessages.value = []
  collectedData.value = null
  currentStep.value = 2

  currentSessionId = generateSessionId()
  connectSSE(currentSessionId)

  try {
    ElMessage.info('正在采集实时市场数据，请稍候...')
    const tradeDate = selectedDate.value.replace(/-/g, '')

    const progressInterval = setInterval(() => {
      if (collectProgress.value < 90) {
        collectProgress.value += 10
      }
    }, 1000)

    const data = await getMarketReview(tradeDate)

    clearInterval(progressInterval)
    collectProgress.value = 100

    createForm.value = {
      date: selectedDate.value,
      volume: data.volume,
      total_stocks: data.total_stocks,
      red_count: data.red_count,
      green_count: data.green_count,
      limit_up_count: data.limit_up_count,
      limit_down_count: data.limit_down_count,
      zt_count: data.zt_count,
      zt_rate: data.zt_rate,
      total_continuous_limit: data.total_continuous_limit,
      continuous_limit_rate: data.continuous_limit_rate,
      two_board_count: data.two_board_count,
      three_board_count: data.three_board_count,
      four_plus_count: data.four_plus_count,
      max_continuous_days: data.max_continuous_days,
      hot_sectors: [],
      notes: ''
    }

    collectedData.value = data
    currentStep.value = 3
    ElMessage.success('数据采集成功！请填写信息后保存')
  } catch (error: any) {
    ElMessage.error(error.message || '数据采集失败')
    currentStep.value = 1
  } finally {
    collectLoading.value = false
    collectProgress.value = 0
    closeSSE()
  }
}

const handleSave = async () => {
  if (!createForm.value.hot_sectors || createForm.value.hot_sectors.length === 0) {
    ElMessage.warning('请至少选择一个热门板块')
    return
  }

  submitLoading.value = true
  logMessages.value = []

  currentSessionId = generateSessionId()
  connectSSE(currentSessionId)

  try {
    const saveData: CreateReviewRequest = {
      date: createForm.value.date,
      hot_sectors: createForm.value.hot_sectors,
      notes: createForm.value.notes
    }

    await createReview(saveData, currentSessionId)
    ElMessage.success('复盘记录创建成功！')
    handleReset()
    router.push('/stock/records')
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    submitLoading.value = false
    closeSSE()
  }
}

const handleReset = () => {
  selectedDate.value = ''
  collectedData.value = null
  currentStep.value = 1
  createForm.value = {
    date: '',
    volume: 0,
    total_stocks: 0,
    red_count: 0,
    green_count: 0,
    limit_up_count: 0,
    limit_down_count: 0,
    zt_count: 0,
    zt_rate: 0,
    total_continuous_limit: 0,
    continuous_limit_rate: 0,
    two_board_count: 0,
    three_board_count: 0,
    four_plus_count: 0,
    max_continuous_days: 0,
    hot_sectors: [],
    notes: ''
  }
  logMessages.value = []
}

const goToOverview = () => {
  router.push('/stock')
}

onUnmounted(() => {
  closeSSE()
})

// Watch for date selection to auto-advance to step 2
watch(selectedDate, (newValue) => {
  if (newValue && currentStep.value === 1) {
    currentStep.value = 2
  } else if (!newValue && currentStep.value > 1) {
    currentStep.value = 1
  }
})
</script>

<style scoped lang="scss">
.data-collection {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
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

.collection-card {
  margin-bottom: var(--spacing-xl);
}

/* Step Progress Indicator */
.step-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 32px 0;
  margin-bottom: var(--spacing-xl);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  transition: all 300ms ease;
}

.step-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  transition: all 300ms ease;
}

.step-item.active .step-number {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.1);
}

.step-item.active .step-label {
  color: var(--color-primary);
  font-weight: 600;
}

.step-item.completed .step-number {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.step-item.completed .step-label {
  color: var(--color-success);
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--color-border-light);
  min-width: 80px;
  max-width: 120px;
  transition: all 300ms ease;
}

.step-line.active {
  background: var(--color-primary);
}

.step-section {
  padding: var(--spacing-lg) 0;

  &:first-child {
    padding-top: 0;
  }
}

.step-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.step-icon {
  font-size: 24px;
  color: var(--color-primary);
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.step-content {
  padding-left: 40px;
}

.progress-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

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

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 移动端优化 */
@media (max-width: 768px) {
  /* 页面容器优化 */
  .data-collection {
    padding: 12px;
  }
}
</style>
