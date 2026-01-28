<template>
  <div class="analytics">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">统计分析</h1>
        <p class="page-subtitle">市场数据趋势与洞察</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" v-loading="loading" style="min-height: 400px"></div>

    <!-- Content -->
    <div v-else-if="reviewList.length > 0">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-label">复盘记录</div>
          <div class="card-value">{{ reviewList.length }}条</div>
        </div>
        <div class="summary-card">
          <div class="card-label">平均红盘率</div>
          <div class="card-value text-red">{{ averageRedRate }}%</div>
        </div>
        <div class="summary-card">
          <div class="card-label">最高连板</div>
          <div class="card-value text-orange">{{ maxContinuousDays }}天</div>
        </div>
        <div class="summary-card">
          <div class="card-label">总成交额</div>
          <div class="card-value text-blue">{{ formatVolumeCompact(totalVolume) }}</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Trend Chart -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">红盘率趋势</h3>
          </div>
          <div class="card-body">
            <v-chart class="chart" :option="redRateTrendOption" autoresize />
          </div>
        </div>

        <!-- Volume Chart -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">成交量变化</h3>
          </div>
          <div class="card-body">
            <v-chart class="chart" :option="volumeTrendOption" autoresize />
          </div>
        </div>

        <!-- Continuous Days Chart -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">连板高度分布</h3>
          </div>
          <div class="card-body">
            <v-chart class="chart" :option="continuousDaysOption" autoresize />
          </div>
        </div>

        <!-- Sector Frequency Chart -->
        <div class="chart-card chart-card-wide">
          <div class="card-header">
            <h3 class="card-title">热门板块频次统计（前10）</h3>
          </div>
          <div class="card-body">
            <v-chart class="chart" :option="sectorFrequencyOption" autoresize />
          </div>
        </div>
      </div>

      <!-- Market Strength Distribution -->
      <div class="chart-card">
        <div class="card-header">
          <h3 class="card-title">市场强弱分布</h3>
        </div>
        <div class="card-body">
          <v-chart class="chart" :option="marketStrengthOption" autoresize />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <el-empty
      v-else
      description="暂无数据，请先采集市场数据"
    >
      <el-button type="primary" @click="goToCollection">开始采集</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { getReviewList, type MarketReviewData } from '@/api/market'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const loading = ref(false)
const reviewList = ref<MarketReviewData[]>([])

const averageRedRate = computed(() => {
  if (reviewList.value.length === 0) return 0
  const total = reviewList.value.reduce((sum, r) => sum + r.red_rate, 0)
  return (total / reviewList.value.length).toFixed(1)
})

const maxContinuousDays = computed(() => {
  return Math.max(...reviewList.value.map(r => r.max_continuous_days || 0))
})

const totalVolume = computed(() => {
  return reviewList.value.reduce((sum, r) => sum + r.volume, 0)
})

const formatVolumeCompact = (volume: number): string => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(1) + '亿'
  }
  if (volume >= 10000) {
    return (volume / 10000).toFixed(1) + '万'
  }
  return volume.toString()
}

// Red Rate Trend Chart
const redRateTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: reviewList.value.map(r => r.date).reverse(),
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}%'
    }
  },
  series: [{
    data: reviewList.value.map(r => r.red_rate).reverse(),
    type: 'line',
    smooth: true,
    itemStyle: {
      color: '#cf1322'
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(207, 19, 34, 0.3)' },
          { offset: 1, color: 'rgba(207, 19, 34, 0.05)' }
        ]
      }
    }
  }]
}))

// Volume Trend Chart
const volumeTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: reviewList.value.map(r => r.date).reverse(),
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => (value / 100000000).toFixed(0) + '亿'
    }
  },
  series: [{
    data: reviewList.value.map(r => (r.volume / 100000000).toFixed(2)).reverse(),
    type: 'bar',
    itemStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: '#1890ff' },
          { offset: 1, color: '#69c0ff' }
        ]
      }
    }
  }]
}))

// Continuous Days Distribution
const continuousDaysOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: reviewList.value.map(r => r.date).reverse(),
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: {
    type: 'value',
    name: '天'
  },
  series: [{
    data: reviewList.value.map(r => r.max_continuous_days || 0).reverse(),
    type: 'bar',
    itemStyle: {
      color: '#fa8c16'
    }
  }]
}))

// Sector Frequency
const sectorFrequencyOption = computed(() => {
  const sectorMap = new Map<string, number>()
  reviewList.value.forEach(review => {
    review.hot_sectors.forEach(sector => {
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + 1)
    })
  })

  const sortedSectors = Array.from(sectorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: sortedSectors.map(s => s[0]).reverse()
    },
    grid: {
      left: '15%'
    },
    series: [{
      type: 'bar',
      data: sortedSectors.map(s => s[1]).reverse(),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#52c41a' }
          ]
        }
      }
    }]
  }
})

// Market Strength Distribution
const marketStrengthOption = computed(() => {
  const strengthMap = new Map<string, number>()
  reviewList.value.forEach(review => {
    if (review.market_strength) {
      strengthMap.set(review.market_strength, (strengthMap.get(review.market_strength) || 0) + 1)
    }
  })

  const data = Array.from(strengthMap.entries()).map(([name, value]) => ({ name, value }))

  return {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      type: 'pie',
      radius: '50%',
      data: data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
})

const fetchReviewList = async () => {
  loading.value = true
  try {
    const data = await getReviewList()
    reviewList.value = data
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

const goToCollection = () => {
  router.push('/stock/collection')
}

onMounted(() => {
  fetchReviewList()
})
</script>

<style scoped lang="scss">
.analytics {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.summary-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  transition: all var(--transition-base);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .card-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }

  .card-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }
}

.text-red {
  color: #cf1322;
}

.text-blue {
  color: #1890ff;
}

.text-orange {
  color: #fa8c16;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.chart-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  transition: all var(--transition-base);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &.chart-card-wide {
    grid-column: span 2;
  }
}

.card-header {
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

@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card-wide {
    grid-column: span 1;
  }
}

/* ============================================================
   移动端优化 - 平板和手机
   ============================================================ */
@media (max-width: 768px) {
  /* 页面容器优化 */
  .analytics {
    padding: 16px 12px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  /* 页面头部优化 */
  .page-header {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 26px;
    margin-bottom: 4px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  /* 汇总卡片优化 */
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .summary-card {
    padding: 16px 12px;
    border-radius: 12px;
    text-align: center;
    transition: all 0.2s;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .card-label {
      font-size: 12px;
      margin-bottom: 8px;
      color: #86909c;
    }

    .card-value {
      font-size: 20px;
      font-weight: 700;
    }
  }

  /* 图表网格优化 */
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  /* 图表卡片优化 */
  .chart-card {
    padding: 16px;
    border-radius: 12px;
    transition: all 0.2s;

    &:active {
      transform: scale(0.99);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    &.chart-card-wide {
      grid-column: span 1;
    }
  }

  /* 卡片头部优化 */
  .card-header {
    margin-bottom: 12px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
  }

  /* 卡片主体优化 - 调整图表高度 */
  .card-body {
    height: 260px;
  }

  /* Loading状态优化 */
  :deep(.el-loading-mask) {
    border-radius: 12px;
  }

  /* 空状态优化 */
  :deep(.el-empty) {
    padding: 60px 20px;

    .el-empty__description {
      font-size: 15px !important;
      margin: 16px 0;
    }

    .el-button {
      width: 100%;
      max-width: 200px;
      height: 48px;
      font-size: 16px;
      border-radius: 12px;
    }
  }

  /* ECharts图表优化 - 移动端字体大小 */
  .chart {
    :deep(.echarts-tooltip) {
      font-size: 13px !important;
    }

    /* X轴标签优化 */
    :deep(.echarts-xaxis .echarts-axis-label) {
      font-size: 11px !important;
    }

    /* Y轴标签优化 */
    :deep(.echarts-yaxis .echarts-axis-label) {
      font-size: 11px !important;
    }

    /* 图例优化 */
    :deep(.echarts-legend) {
      font-size: 12px !important;
    }
  }
}

/* ============================================================
   小屏手机进一步优化
   ============================================================ */
@media (max-width: 430px) {
  .analytics {
    padding: 12px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
  }

  .page-header {
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  /* 汇总卡片 - 保持2列但缩小尺寸 */
  .summary-cards {
    gap: 10px;
    margin-bottom: 16px;
  }

  .summary-card {
    padding: 14px 10px;
    border-radius: 10px;

    .card-label {
      font-size: 11px;
      margin-bottom: 6px;
    }

    .card-value {
      font-size: 18px;
    }
  }

  /* 图表卡片 */
  .charts-grid {
    gap: 12px;
  }

  .chart-card {
    padding: 14px;
    border-radius: 10px;
  }

  .card-header {
    margin-bottom: 10px;
  }

  .card-title {
    font-size: 15px;
  }

  /* 更小的图表高度 */
  .card-body {
    height: 220px;
  }

  /* 空状态 */
  :deep(.el-empty) {
    padding: 48px 16px;

    .el-empty__description {
      font-size: 14px !important;
    }

    .el-button {
      height: 48px;
      font-size: 15px;
    }
  }

  /* ECharts图表进一步优化 */
  .chart {
    :deep(.echarts-tooltip) {
      font-size: 12px !important;
    }

    :deep(.echarts-xaxis .echarts-axis-label) {
      font-size: 10px !important;
    }

    :deep(.echarts-yaxis .echarts-axis-label) {
      font-size: 10px !important;
    }

    :deep(.echarts-legend) {
      font-size: 11px !important;
    }
  }
}

/* ============================================================
   PWA Standalone模式特殊优化
   ============================================================ */
html.standalone-mode {
  @media (max-width: 768px) {
    .analytics {
      padding-top: calc(20px + env(safe-area-inset-top, 0px));
      padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    }
  }
}
</style>
