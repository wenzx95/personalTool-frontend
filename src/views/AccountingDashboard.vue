<template>
  <div class="accounting-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">记账</h1>
        <p class="page-subtitle">个人财务管理与分析</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="addTransaction">
          添加记录
        </el-button>
        <el-button :icon="Download" @click="exportReport">
          导出报表
        </el-button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card income">
        <div class="card-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">本月收入</div>
          <div class="card-value">¥ 15,800.00</div>
          <div class="card-trend positive">+12.5%</div>
        </div>
      </div>

      <div class="summary-card expense">
        <div class="card-icon">
          <el-icon><ShoppingCart /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">本月支出</div>
          <div class="card-value">¥ 8,350.00</div>
          <div class="card-trend negative">-5.2%</div>
        </div>
      </div>

      <div class="summary-card balance">
        <div class="card-icon">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">结余</div>
          <div class="card-value">¥ 7,450.00</div>
          <div class="card-trend positive">+47.1%</div>
        </div>
      </div>

      <div class="summary-card savings">
        <div class="card-icon">
          <el-icon><WalletFilled /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-label">本月储蓄</div>
          <div class="card-value">¥ 5,000.00</div>
          <div class="card-trend">目标: ¥6,000</div>
        </div>
      </div>
    </div>

    <!-- Charts and Details Grid -->
    <div class="dashboard-grid">
      <!-- Expense Chart -->
      <div class="dashboard-card chart-card">
        <div class="card-header">
          <h3 class="card-title">支出趋势</h3>
          <el-radio-group v-model="expensePeriod" size="small">
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
            <el-radio-button label="year">年</el-radio-button>
          </el-radio-group>
        </div>
        <div class="card-body">
          <v-chart class="chart" :option="expenseChartOption" autoresize />
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="dashboard-card">
        <div class="card-header">
          <h3 class="card-title">分类统计</h3>
        </div>
        <div class="card-body">
          <v-chart class="chart" :option="categoryChartOption" autoresize />
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="dashboard-card transaction-card">
        <div class="card-header">
          <h3 class="card-title">最近记录</h3>
          <el-button text type="primary">查看全部</el-button>
        </div>
        <div class="card-body">
          <div class="transaction-list">
            <div
              v-for="transaction in recentTransactions"
              :key="transaction.id"
              class="transaction-item"
            >
              <div class="transaction-icon" :style="{ background: transaction.color }">
                <component :is="transaction.icon" />
              </div>
              <div class="transaction-info">
                <div class="transaction-title">{{ transaction.title }}</div>
                <div class="transaction-meta">
                  <span class="transaction-category">{{ transaction.category }}</span>
                  <span class="transaction-date">{{ transaction.date }}</span>
                </div>
              </div>
              <div :class="['transaction-amount', transaction.type]">
                {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Progress -->
      <div class="dashboard-card budget-card">
        <div class="card-header">
          <h3 class="card-title">预算进度</h3>
        </div>
        <div class="card-body">
          <div class="budget-list">
            <div
              v-for="budget in budgets"
              :key="budget.category"
              class="budget-item"
            >
              <div class="budget-header">
                <span class="budget-category">{{ budget.category }}</span>
                <span class="budget-amount">¥{{ budget.spent }} / ¥{{ budget.total }}</span>
              </div>
              <el-progress
                :percentage="budget.percentage"
                :color="getProgressColor(budget.percentage)"
                :stroke-width="8"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Plus,
  Download,
  TrendCharts,
  ShoppingCart,
  Wallet,
  WalletFilled,
  Operation as FoodIcon,
  ShoppingBag,
  House,
  Van as Car
} from '@element-plus/icons-vue'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const expensePeriod = ref('month')

const recentTransactions = ref([
  {
    id: 1,
    title: '超市购物',
    category: '餐饮',
    date: '今天',
    amount: '258.00',
    type: 'expense',
    icon: FoodIcon,
    color: '#F97316'
  },
  {
    id: 2,
    title: '工资',
    category: '收入',
    date: '昨天',
    amount: '15,800.00',
    type: 'income',
    icon: TrendCharts,
    color: '#10B981'
  },
  {
    id: 3,
    title: '淘宝',
    category: '购物',
    date: '3天前',
    amount: '499.00',
    type: 'expense',
    icon: ShoppingBag,
    color: '#3B82F6'
  },
  {
    id: 4,
    title: '房租',
    category: '居住',
    date: '1周前',
    amount: '2,500.00',
    type: 'expense',
    icon: House,
    color: '#8B5CF6'
  },
  {
    id: 5,
    title: '地铁充值',
    category: '交通',
    date: '1周前',
    amount: '100.00',
    type: 'expense',
    icon: Car,
    color: '#EF4444'
  }
])

const budgets = ref([
  { category: '餐饮', total: 2000, spent: 1580, percentage: 79 },
  { category: '购物', total: 1500, spent: 890, percentage: 59 },
  { category: '交通', total: 500, spent: 320, percentage: 64 },
  { category: '娱乐', total: 800, spent: 650, percentage: 81 }
])

const expenseChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  legend: {
    data: ['收入', '支出']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '收入',
      type: 'line',
      data: [12000, 15000, 14000, 16000, 15500, 15800],
      smooth: true,
      itemStyle: { color: '#10B981' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
          ]
        }
      }
    },
    {
      name: '支出',
      type: 'line',
      data: [8000, 9500, 8800, 9200, 8700, 8350],
      smooth: true,
      itemStyle: { color: '#EF4444' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0)' }
          ]
        }
      }
    }
  ]
}))

const categoryChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: '10%',
    top: 'center'
  },
  series: [
    {
      name: '支出分类',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 1580, name: '餐饮', itemStyle: { color: '#F97316' } },
        { value: 890, name: '购物', itemStyle: { color: '#3B82F6' } },
        { value: 2500, name: '居住', itemStyle: { color: '#8B5CF6' } },
        { value: 320, name: '交通', itemStyle: { color: '#EF4444' } },
        { value: 650, name: '娱乐', itemStyle: { color: '#10B981' } },
        { value: 2410, name: '其他', itemStyle: { color: '#64748B' } }
      ]
    }
  ]
}))

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#EF4444'
  if (percentage >= 70) return '#F97316'
  return '#10B981'
}

const addTransaction = () => {
  console.log('Add transaction')
}

const exportReport = () => {
  console.log('Export report')
}
</script>

<style scoped>
.accounting-dashboard {
  max-width: 1400px;
  margin: 0 auto;
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

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.summary-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.summary-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  font-size: 1.5rem;
  color: white;
}

.summary-card.income .card-icon {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

.summary-card.expense .card-icon {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
}

.summary-card.balance .card-icon {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
}

.summary-card.savings .card-icon {
  background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.card-trend {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.card-trend.positive {
  color: var(--color-success);
}

.card-trend.negative {
  color: var(--color-error);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.dashboard-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.dashboard-card:hover {
  box-shadow: var(--shadow-md);
}

.chart-card {
  grid-column: span 2;
}

.dashboard-card .card-header {
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
  height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* Transaction List */
.transaction-card {
  grid-column: span 1;
  grid-row: span 2;
}

.transaction-card .card-body {
  height: auto;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
  transition: all var(--transition-fast);
}

.transaction-item:hover {
  background: var(--color-bg-tertiary);
}

.transaction-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: white;
  flex-shrink: 0;
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.transaction-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.transaction-amount {
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.transaction-amount.income {
  color: var(--color-financial-up);
}

.transaction-amount.expense {
  color: var(--color-financial-down);
}

/* Budget Progress */
.budget-card {
  grid-column: span 1;
}

.budget-card .card-body {
  height: auto;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.budget-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.budget-category {
  font-weight: 500;
  color: var(--color-text-primary);
}

.budget-amount {
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-card {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  /* 页面容器优化 */
  .accounting-dashboard {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  .summary-cards {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .chart-card {
    grid-column: span 1;
  }

  /* 页面头部优化 */
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 26px;
    margin-bottom: 4px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .header-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .el-button {
      width: 100%;
      height: 50px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      .el-icon {
        font-size: 18px;
      }
    }
  }

  /* 汇总卡片优化 */
  .summary-card {
    padding: 16px;
    border-radius: 12px;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s;

    &:active {
      transform: scale(0.99);
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
    border-radius: 12px;
  }

  .card-label {
    font-size: 13px;
  }

  .card-value {
    font-size: 22px;
    line-height: 1.2;
  }

  .card-trend {
    font-size: 13px;
  }

  /* 仪表板卡片优化 */
  .dashboard-card {
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .card-header {
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
  }

  .card-body {
    height: 240px;
  }

  /* 图表卡片特殊优化 */
  .chart-card .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .el-radio-group {
      width: 100%;
      display: flex;

      :deep(.el-radio-button) {
        flex: 1;

        .el-radio-button__inner {
          width: 100%;
          height: 40px;
          font-size: 14px;
          border-radius: 8px;
        }
      }
    }
  }

  .chart {
    height: 100%;
  }

  /* 交易列表优化 */
  .transaction-card .card-header {
    .el-button {
      font-size: 14px;
      padding: 4px 8px;
      height: auto;
    }
  }

  .transaction-list {
    gap: 10px;
  }

  .transaction-item {
    padding: 12px;
    border-radius: 10px;
    min-height: 60px;

    &:active {
      background: #f7f8fa;
    }
  }

  .transaction-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    font-size: 16px;
  }

  .transaction-info {
    flex: 1;
    min-width: 0;
  }

  .transaction-title {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .transaction-meta {
    gap: 8px;
    font-size: 12px;
  }

  .transaction-amount {
    font-size: 15px;
  }

  /* 预算进度优化 */
  .budget-list {
    gap: 14px;
  }

  .budget-item {
    gap: 8px;
  }

  .budget-header {
    font-size: 13px;
  }

  :deep(.el-progress) {
    .el-progress__text {
      font-size: 12px !important;
    }

    .el-progress__bar {
      height: 8px !important;
    }

    .el-progress__outer {
      height: 8px !important;
    }
  }
}

/* ============================================================
   小屏手机进一步优化（430px）
   ============================================================ */
@media (max-width: 430px) {
  .accounting-dashboard {
    padding: 12px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
  }

  .page-header {
    margin-bottom: 20px;
    gap: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .header-actions .el-button {
    height: 48px;
    font-size: 15px;

    .el-icon {
      font-size: 17px;
    }
  }

  .summary-cards {
    gap: 10px;
    margin-bottom: 16px;
  }

  .summary-card {
    padding: 14px;
    border-radius: 10px;
    gap: 10px;
  }

  .card-icon {
    width: 44px;
    height: 44px;
    font-size: 18px;
    border-radius: 10px;
  }

  .card-value {
    font-size: 20px;
  }

  .dashboard-card {
    padding: 14px;
    border-radius: 10px;
  }

  .card-title {
    font-size: 15px;
  }

  .card-body {
    height: 220px;
  }

  .chart-card .card-header {
    gap: 10px;

    .el-radio-group :deep(.el-radio-button__inner) {
      height: 38px;
      font-size: 13px;
    }
  }

  .transaction-item {
    padding: 10px;
    border-radius: 8px;
    min-height: 56px;
  }

  .transaction-icon {
    width: 36px;
    height: 36px;
    font-size: 15px;
  }

  .transaction-title {
    font-size: 13px;
  }

  .transaction-amount {
    font-size: 14px;
  }

  .budget-list {
    gap: 12px;
  }

  .budget-header {
    font-size: 12px;
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 640px) {
    .accounting-dashboard {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
    }
  }
}
</style>
