<template>
  <div class="market-overview">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">市场概览</h1>
        <p class="page-subtitle">最新市场数据与关键指标</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="goToCollection">
          <el-icon><Download /></el-icon>
          采集数据
        </el-button>
        <el-button @click="goToRecords">
          <el-icon><List /></el-icon>
          查看记录
        </el-button>
      </div>
    </div>

    <!-- Latest Date Badge -->
    <div v-if="latestReview" class="latest-date-badge">
      <el-tag size="large" type="primary">最新数据：{{ latestReview.date }}</el-tag>
    </div>

    <!-- Empty State -->
    <el-empty
      v-if="!latestReview"
      description="暂无数据，请先采集市场数据"
    >
      <el-button type="primary" @click="goToCollection">开始采集</el-button>
    </el-empty>

    <!-- Bento Grid Layout -->
    <div v-else class="bento-grid">
      <!-- Market Overview Card - Large -->
      <div class="bento-card bento-card-large market-overview-card">
        <div class="card-header">
          <h3 class="card-title">市场概览</h3>
          <el-tag :type="getMarketStrengthTagType(latestReview.market_strength)" size="small">
            {{ latestReview.market_strength }}
          </el-tag>
        </div>
        <div class="card-body">
          <div class="market-stats">
            <div class="stat-item">
              <div class="stat-label">成交额</div>
              <div class="stat-value">{{ formatVolume(latestReview.volume) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">上涨/下跌</div>
              <div class="stat-value">
                <span class="stat-up">{{ latestReview.red_count }}</span>
                <span class="stat-divider">/</span>
                <span class="stat-down">{{ latestReview.green_count }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">涨停/跌停</div>
              <div class="stat-value">
                <span class="stat-up">{{ latestReview.limit_up_count }}</span>
                <span class="stat-divider">/</span>
                <span class="stat-down">{{ latestReview.limit_down_count }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">连板高度</div>
              <div class="stat-value text-orange">{{ latestReview.max_continuous_days }}天</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">炸板率</div>
              <div class="stat-value">{{ latestReview.zt_rate }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">红盘率</div>
              <div class="stat-value">{{ latestReview.red_rate }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Continuous Limit Up Stats -->
      <div class="bento-card">
        <div class="card-header">
          <h3 class="card-title">连板统计</h3>
        </div>
        <div class="card-body">
          <div class="continuous-stats">
            <div class="continuous-item">
              <div class="continuous-label">总连板</div>
              <div class="continuous-value">{{ latestReview.total_continuous_limit }}</div>
            </div>
            <div class="continuous-item">
              <div class="continuous-label">连板率</div>
              <div class="continuous-value">{{ latestReview.continuous_limit_rate }}%</div>
            </div>
            <div class="continuous-item">
              <div class="continuous-label">首板</div>
              <div class="continuous-value">{{ latestReview.first_board_count }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4+ Stocks -->
      <div class="bento-card" v-if="latestReview.four_plus_stocks_with_sector?.length > 0">
        <div class="card-header">
          <h3 class="card-title">4板+个股</h3>
          <el-tag size="small" type="info">{{ latestReview.four_plus_count }}只</el-tag>
        </div>
        <div class="card-body">
          <div class="stock-list">
            <div
              v-for="stock in latestReview.four_plus_stocks_with_sector"
              :key="stock.name"
              class="stock-item"
            >
              <div class="stock-name">{{ stock.name }}</div>
              <el-tag size="small" type="warning">{{ stock.sector }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Hot Sectors -->
      <div class="bento-card" v-if="latestReview.hot_sectors?.length > 0">
        <div class="card-header">
          <h3 class="card-title">热门板块</h3>
          <el-tag size="small" type="info">{{ latestReview.hot_sectors.length }}个</el-tag>
        </div>
        <div class="card-body">
          <div class="sectors-grid">
            <el-tag
              v-for="(sector, index) in latestReview.hot_sectors.slice(0, 8)"
              :key="index"
              type="primary"
              size="small"
              class="sector-tag"
            >
              {{ sector }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bento-card">
        <div class="card-header">
          <h3 class="card-title">快捷操作</h3>
        </div>
        <div class="card-body">
          <div class="quick-actions">
            <el-button type="primary" class="action-btn" @click="goToCollection">
              <el-icon><Download /></el-icon>
              <span>采集新数据</span>
            </el-button>
            <el-button class="action-btn" @click="goToRecords">
              <el-icon><List /></el-icon>
              <span>查看记录</span>
            </el-button>
            <el-button class="action-btn" @click="goToAnalytics">
              <el-icon><TrendCharts /></el-icon>
              <span>统计分析</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Download, List, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getReviewList, type MarketReviewData } from '@/api/market'

const router = useRouter()
const loading = ref(false)
const reviewList = ref<MarketReviewData[]>([])

const latestReview = computed(() => {
  return reviewList.value.length > 0 ? reviewList.value[0] : null
})

const fetchReviewList = async () => {
  loading.value = true
  try {
    const data = await getReviewList()
    reviewList.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const formatVolume = (volume: number): string => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(0) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(0) + '万'
  }
  return volume.toString()
}

const getMarketStrengthTagType = (strength: string | undefined) => {
  const typeMap: Record<string, string> = {
    '极强': 'danger',
    '强': 'danger',
    '偏强': 'warning',
    '中性': 'info',
    '偏弱': 'success',
    '弱': 'success'
  }
  return typeMap[strength || ''] || 'info'
}

const goToCollection = () => {
  router.push('/stock/collection')
}

const goToRecords = () => {
  router.push('/stock/records')
}

const goToAnalytics = () => {
  router.push('/stock/analytics')
}

onMounted(() => {
  fetchReviewList()
})
</script>

<style scoped lang="scss">
.market-overview {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
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

.latest-date-badge {
  margin-bottom: var(--spacing-lg);
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.bento-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
}

.bento-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.bento-card-large {
  grid-column: span 2;
  grid-row: span 2;
}

.card-header {
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
  flex: 1;
}

.market-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
}

.stat-divider {
  margin: 0 4px;
  color: var(--color-text-tertiary);
}

.stat-up {
  color: var(--color-financial-up);
}

.stat-down {
  color: var(--color-financial-down);
}

.text-orange {
  color: #fa8c16;
}

.continuous-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.continuous-item {
  text-align: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.continuous-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.continuous-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.stock-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.sectors-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
}

.sector-tag {
  justify-content: center;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.action-btn .el-icon {
  margin-right: 0;
}

@media (max-width: 1200px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .bento-card-large {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  /* 页面容器优化 */
  .market-overview {
    padding: 12px;
  }

  .bento-grid {
    grid-template-columns: 1fr;
  }

  .bento-card-large {
    grid-column: span 1;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .market-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
