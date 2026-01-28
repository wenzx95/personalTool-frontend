<template>
  <div class="loan-calculator">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">提前还贷计算器</h1>
        <p class="page-subtitle">计算提前还款的利息节省和还款方案</p>
      </div>
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
    </div>

    <div class="calculator-layout">
      <!-- Input Form -->
      <div class="input-section">
        <el-card shadow="never">
          <template #header>
            <div class="card-header-content">
              <span>贷款信息</span>
            </div>
          </template>

          <el-form :model="loanForm" label-width="120px" label-position="left">
            <el-form-item label="贷款总额">
              <el-input-number
                v-model="loanForm.totalAmount"
                :min="0"
                :max="10000000"
                :step="10000"
                :precision="0"
                controls-position="right"
                class="full-width"
              />
              <span class="unit-label">万元</span>
            </el-form-item>

            <el-form-item label="贷款期限">
              <el-input-number
                v-model="loanForm.years"
                :min="1"
                :max="30"
                :step="1"
                controls-position="right"
                class="full-width"
              />
              <span class="unit-label">年</span>
            </el-form-item>

            <el-form-item label="年利率">
              <el-input-number
                v-model="loanForm.interestRate"
                :min="0.1"
                :max="10"
                :step="0.01"
                :precision="2"
                controls-position="right"
                class="full-width"
              />
              <span class="unit-label">%</span>
            </el-form-item>

            <el-form-item label="还款方式">
              <el-radio-group v-model="loanForm.paymentMethod">
                <el-radio label="equal-principal">等额本金</el-radio>
                <el-radio label="equal-payment">等额本息</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-divider>提前还款信息</el-divider>

            <el-form-item label="已还期数">
              <el-input-number
                v-model="loanForm.paidMonths"
                :min="0"
                :max="loanForm.years * 12"
                :step="1"
                controls-position="right"
                class="full-width"
              />
              <span class="unit-label">期</span>
            </el-form-item>

            <el-form-item label="提前还款金额">
              <el-input-number
                v-model="loanForm.prepaymentAmount"
                :min="0"
                :max="loanForm.totalAmount * 10000"
                :step="10000"
                :precision="0"
                controls-position="right"
                class="full-width"
              />
              <span class="unit-label">元</span>
            </el-form-item>

            <el-form-item label="还款后选项">
              <el-radio-group v-model="loanForm.prepaymentOption">
                <el-radio label="reduce-term">缩短还款年限，月供不变</el-radio>
                <el-radio label="reduce-payment">减少月供，还款年限不变</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="calculate" :icon="Calculator" size="large">
                计算
              </el-button>
              <el-button @click="reset" :icon="Refresh" size="large">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- Results Section -->
      <div class="results-section">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <el-card shadow="hover" class="summary-card">
            <div class="summary-label">原总利息</div>
            <div class="summary-value">¥ {{ formatNumber(originalTotalInterest) }}</div>
          </el-card>

          <el-card shadow="hover" class="summary-card highlight">
            <div class="summary-label">节省利息</div>
            <div class="summary-value success">¥ {{ formatNumber(savedInterest) }}</div>
          </el-card>

          <el-card shadow="hover" class="summary-card">
            <div class="summary-label">新总利息</div>
            <div class="summary-value">¥ {{ formatNumber(newTotalInterest) }}</div>
          </el-card>
        </div>

        <!-- Payment Comparison -->
        <el-card shadow="never" class="comparison-card">
          <template #header>
            <div class="card-header-content">
              <span>还款对比</span>
            </div>
          </template>

          <div class="comparison-table">
            <div class="comparison-row">
              <div class="comparison-label">原月供</div>
              <div class="comparison-value">¥ {{ formatNumber(originalMonthlyPayment) }}</div>
            </div>

            <div class="comparison-row">
              <div class="comparison-label">新月供</div>
              <div class="comparison-value highlight">¥ {{ formatNumber(newMonthlyPayment) }}</div>
            </div>

            <div class="comparison-row">
              <div class="comparison-label">原还款期数</div>
              <div class="comparison-value">{{ loanForm.years * 12 }}期</div>
            </div>

            <div class="comparison-row">
              <div class="comparison-label">新还款期数</div>
              <div class="comparison-value highlight">{{ newTotalMonths }}期</div>
            </div>

            <el-divider />

            <div class="comparison-row total">
              <div class="comparison-label">利息节省率</div>
              <div class="comparison-value success">{{ interestSavedRate }}%</div>
            </div>
          </div>
        </el-card>

        <!-- Chart -->
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header-content">
              <span>利息对比图</span>
            </div>
          </template>

          <v-chart class="chart" :option="chartOption" autoresize />
        </el-card>

        <!-- Tips -->
        <el-card shadow="never" class="tips-card">
          <template #header>
            <div class="card-header-content">
              <el-icon><InfoFilled /></el-icon>
              <span>还款建议</span>
            </div>
          </template>

          <div class="tips-list">
            <div class="tip-item">
              <el-icon color="#10B981"><Check /></el-icon>
              <span>提前还款可以节省 {{ interestSavedRate }}% 的利息支出</span>
            </div>
            <div class="tip-item">
              <el-icon color="#3B82F6"><Check /></el-icon>
              <span>建议优先使用公积金或闲置资金还款</span>
            </div>
            <div class="tip-item">
              <el-icon color="#F59E0B"><Warning /></el-icon>
              <span>注意保留3-6个月的应急资金</span>
            </div>
            <div class="tip-item">
              <el-icon color="#3B82F6"><Check /></el-icon>
              <span>选择缩短年限可以节省更多利息</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  ArrowLeft,
  Management as Calculator,
  Refresh,
  InfoFilled,
  Check,
  Warning
} from '@element-plus/icons-vue'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

interface LoanForm {
  totalAmount: number
  years: number
  interestRate: number
  paymentMethod: 'equal-principal' | 'equal-payment'
  paidMonths: number
  prepaymentAmount: number
  prepaymentOption: 'reduce-term' | 'reduce-payment'
}

const loanForm = ref<LoanForm>({
  totalAmount: 100,
  years: 30,
  interestRate: 4.2,
  paymentMethod: 'equal-payment',
  paidMonths: 36,
  prepaymentAmount: 100000,
  prepaymentOption: 'reduce-term'
})

const originalTotalInterest = ref(0)
const originalMonthlyPayment = ref(0)
const newTotalInterest = ref(0)
const newMonthlyPayment = ref(0)
const newTotalMonths = ref(0)

const savedInterest = computed(() => {
  return originalTotalInterest.value - newTotalInterest.value
})

const interestSavedRate = computed(() => {
  if (originalTotalInterest.value === 0) return 0
  return ((savedInterest.value / originalTotalInterest.value) * 100).toFixed(2)
})

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {
    data: ['原方案', '提前还款后']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['总利息']
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '¥{value}'
    }
  },
  series: [
    {
      name: '原方案',
      type: 'bar',
      data: [originalTotalInterest.value],
      itemStyle: {
        color: '#EF4444',
        borderRadius: [8, 8, 0, 0]
      }
    },
    {
      name: '提前还款后',
      type: 'bar',
      data: [newTotalInterest.value],
      itemStyle: {
        color: '#10B981',
        borderRadius: [8, 8, 0, 0]
      }
    }
  ]
}))

const calculate = () => {
  const principal = loanForm.value.totalAmount * 10000
  const monthlyRate = loanForm.value.interestRate / 100 / 12
  const totalMonths = loanForm.value.years * 12

  // Calculate original payment
  if (loanForm.value.paymentMethod === 'equal-payment') {
    // 等额本息
    originalMonthlyPayment.value =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    originalTotalInterest.value = originalMonthlyPayment.value * totalMonths - principal
  } else {
    // 等额本金
    const monthlyPrincipal = principal / totalMonths
    let totalInterest = 0
    for (let i = 0; i < totalMonths; i++) {
      totalInterest += (principal - monthlyPrincipal * i) * monthlyRate
    }
    originalTotalInterest.value = totalInterest
    originalMonthlyPayment.value =
      monthlyPrincipal + (principal - monthlyPrincipal * 0) * monthlyRate
  }

  // Calculate new payment after prepayment
  const newPrincipal = principal - loanForm.value.prepaymentAmount
  const remainingMonths = totalMonths - loanForm.value.paidMonths

  if (loanForm.value.prepaymentOption === 'reduce-term') {
    // 缩短年限，月供不变
    const newMonthlyPaymentAmount = originalMonthlyPayment.value
    const newTotalMonthsCalc = Math.log(
      newMonthlyPaymentAmount / (newMonthlyPaymentAmount - newPrincipal * monthlyRate)
    ) / Math.log(1 + monthlyRate)

    newTotalMonths.value = Math.ceil(newTotalMonthsCalc)
    newMonthlyPayment.value = newMonthlyPaymentAmount
    newTotalInterest.value = newMonthlyPaymentAmount * newTotalMonths.value - newPrincipal
  } else {
    // 减少月供，年限不变
    newTotalMonths.value = remainingMonths

    if (loanForm.value.paymentMethod === 'equal-payment') {
      newMonthlyPayment.value =
        (newPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
        (Math.pow(1 + monthlyRate, remainingMonths) - 1)
      newTotalInterest.value = newMonthlyPayment.value * remainingMonths - newPrincipal
    } else {
      const monthlyPrincipal = newPrincipal / remainingMonths
      let totalInterest = 0
      for (let i = 0; i < remainingMonths; i++) {
        totalInterest += (newPrincipal - monthlyPrincipal * i) * monthlyRate
      }
      newTotalInterest.value = totalInterest
      newMonthlyPayment.value =
        monthlyPrincipal + (newPrincipal - monthlyPrincipal * 0) * monthlyRate
    }
  }
}

const reset = () => {
  loanForm.value = {
    totalAmount: 100,
    years: 30,
    interestRate: 4.2,
    paymentMethod: 'equal-payment',
    paidMonths: 36,
    prepaymentAmount: 100000,
    prepaymentOption: 'reduce-term'
  }
  originalTotalInterest.value = 0
  originalMonthlyPayment.value = 0
  newTotalInterest.value = 0
  newMonthlyPayment.value = 0
  newTotalMonths.value = 0
}

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Initial calculation
calculate()
</script>

<style scoped>
.loan-calculator {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
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

/* Layout */
.calculator-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--spacing-xl);
}

/* Input Section */
.input-section {
  position: sticky;
  top: var(--spacing-lg);
  height: fit-content;
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
}

:deep(.el-form-item__label) {
  color: var(--color-text-primary);
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}

.unit-label {
  margin-left: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Results Section */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.summary-card {
  text-align: center;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
}

.summary-value.success {
  color: var(--color-success);
}

.summary-card.highlight {
  border-color: var(--color-success);
  box-shadow: 0 0 0 2px var(--color-success-light);
}

/* Comparison Card */
.comparison-card {
  margin-bottom: var(--spacing-lg);
}

.comparison-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.comparison-row.total {
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--color-border-light);
}

.comparison-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.comparison-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.comparison-value.highlight {
  color: var(--color-primary);
  font-size: 1.125rem;
}

.comparison-value.success {
  color: var(--color-success);
  font-size: 1.25rem;
}

/* Chart Card */
.chart-card {
  margin-bottom: var(--spacing-lg);
}

.chart {
  width: 100%;
  height: 300px;
}

/* Tips Card */
.tips-card :deep(.el-card__header) {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 1024px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }

  .input-section {
    position: static;
  }
}

/* ============================================================
   移动端优化 - 平板和手机
   ============================================================ */
@media (max-width: 768px) {
  /* 页面容器优化 */
  .loan-calculator {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  /* 页面头部优化 */
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;

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

  /* 计算器布局优化 */
  .calculator-layout {
    gap: 16px;
  }

  /* 输入区域优化 */
  .input-section {
    border-radius: 12px;
    padding: 16px;

    .section-title {
      font-size: 18px;
      margin-bottom: 16px;
    }
  }

  /* 表单优化 */
  .el-form {
    .el-form-item {
      margin-bottom: 16px;

      .el-form-item__label {
        font-size: 14px;
        height: auto;
        line-height: normal;
        margin-bottom: 8px;
      }
    }

    /* 输入框优化 */
    :deep(.el-input__wrapper) {
      height: 48px !important;
      font-size: 16px !important;
      border-radius: 10px;
    }

    /* 选择器优化 */
    :deep(.el-select__wrapper) {
      height: 48px !important;
      font-size: 16px !important;
      border-radius: 10px;
    }

    /* 单选按钮组优化 */
    :deep(.el-radio-group) {
      display: flex;
      width: 100%;

      .el-radio-button {
        flex: 1;

        .el-radio-button__inner {
          width: 100%;
          height: 44px;
          line-height: 44px;
          font-size: 15px;
          border-radius: 8px;
        }
      }
    }

    /* 表单按钮优化 */
    .el-button {
      width: 100%;
      height: 50px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      margin-top: 8px;
    }
  }

  /* 汇总卡片优化 */
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .summary-card {
    padding: 16px;
    border-radius: 12px;
    transition: all 0.2s;

    &:active {
      transform: scale(0.99);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .card-label {
      font-size: 13px;
    }

    .card-value {
      font-size: 20px;
    }
  }

  /* 对比卡片优化 */
  .comparison-card {
    border-radius: 12px;

    :deep(.el-card__header) {
      padding: 16px;

      .card-title {
        font-size: 16px;
      }
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    .comparison-table {
      font-size: 14px;

      .comparison-row {
        padding: 10px 0;
      }

      .comparison-label {
        font-size: 14px;
      }

      .comparison-value {
        font-size: 14px;
      }
    }
  }

  /* 图表卡片优化 */
  .chart-card {
    border-radius: 12px;
    margin-bottom: 16px;

    :deep(.el-card__header) {
      padding: 16px;

      .card-title {
        font-size: 16px;
      }
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    .chart {
      height: 260px;
    }
  }

  /* Tips卡片优化 */
  .tips-card {
    border-radius: 12px;

    :deep(.el-card__header) {
      padding: 16px;
      font-size: 16px;
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    .tips-list {
      gap: 10px;
    }

    .tip-item {
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }
  }

  /* ECharts图表优化 */
  .chart {
    :deep(.echarts-tooltip) {
      font-size: 13px !important;
    }

    :deep(.echarts-legend) {
      font-size: 12px !important;
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .loan-calculator {
    padding: 12px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
  }

  .page-header {
    margin-bottom: 16px;
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

  .calculator-layout {
    gap: 12px;
  }

  .input-section {
    border-radius: 10px;
    padding: 14px;

    .section-title {
      font-size: 17px;
      margin-bottom: 14px;
    }
  }

  .el-form {
    .el-form-item {
      margin-bottom: 14px;

      .el-form-item__label {
        font-size: 13px;
      }
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      height: 48px !important;
      font-size: 16px !important;
      border-radius: 8px;
    }

    :deep(.el-radio-button) {
      .el-radio-button__inner {
        height: 42px;
        line-height: 42px;
        font-size: 14px;
        border-radius: 6px;
      }
    }

    .el-button {
      height: 50px;
      font-size: 15px;
    }
  }

  .summary-cards {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }

  .summary-card {
    padding: 14px;
    border-radius: 10px;

    .card-label {
      font-size: 12px;
    }

    .card-value {
      font-size: 18px;
    }
  }

  .comparison-card,
  .chart-card,
  .tips-card {
    border-radius: 10px;

    :deep(.el-card__header) {
      padding: 14px;

      .card-title {
        font-size: 15px;
      }
    }

    :deep(.el-card__body) {
      padding: 14px;
    }
  }

  .comparison-table {
    font-size: 13px;

    .comparison-row {
      padding: 8px 0;
    }

    .comparison-label,
    .comparison-value {
      font-size: 13px;
    }
  }

  .chart {
    height: 220px;

    :deep(.echarts-tooltip) {
      font-size: 12px !important;
    }

    :deep(.echarts-legend) {
      font-size: 11px !important;
    }
  }

  .tips-list {
    gap: 8px;
  }

  .tip-item {
    padding: 10px;
    border-radius: 6px;
    font-size: 13px;
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .loan-calculator {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    }
  }
}
</style>
