<template>
  <div class="tools-index">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">工具集</h1>
        <p class="page-subtitle">实用工具，提升效率</p>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索工具..."
          :prefix-icon="Search"
          class="search-input"
          clearable
        />
      </div>
    </div>

    <!-- Categories Filter -->
    <div class="categories-filter">
      <el-button
        :type="selectedCategory === 'all' ? 'primary' : 'default'"
        @click="selectedCategory = 'all'"
      >
        全部
      </el-button>
      <el-button
        v-for="category in categories"
        :key="category.key"
        :type="selectedCategory === category.key ? 'primary' : 'default'"
        @click="selectedCategory = category.key"
      >
        {{ category.label }}
      </el-button>
    </div>

    <!-- Tools Grid -->
    <div class="tools-grid">
      <div
        v-for="tool in filteredTools"
        :key="tool.id"
        class="tool-card"
        @click="openTool(tool)"
      >
        <div class="tool-icon" :style="{ background: tool.color }">
          <component :is="tool.icon" />
        </div>
        <div class="tool-content">
          <div class="tool-header">
            <h3 class="tool-title">{{ tool.title }}</h3>
            <el-tag :type="tool.status === 'stable' ? 'success' : 'warning'" size="small">
              {{ tool.status === 'stable' ? '稳定' : 'Beta' }}
            </el-tag>
          </div>
          <p class="tool-description">{{ tool.description }}</p>
          <div class="tool-meta">
            <span class="tool-category">{{ tool.category }}</span>
            <span class="tool-usage">{{ tool.usage }}</span>
          </div>
        </div>
        <div class="tool-action">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- Coming Soon Section -->
    <div v-if="comingSoonTools.length > 0" class="coming-soon-section">
      <h2 class="section-title">即将推出</h2>
      <div class="tools-grid">
        <div
          v-for="tool in comingSoonTools"
          :key="tool.id"
          class="tool-card tool-card-disabled"
        >
          <div class="tool-icon" :style="{ background: tool.color }">
            <component :is="tool.icon" />
          </div>
          <div class="tool-content">
            <div class="tool-header">
              <h3 class="tool-title">{{ tool.title }}</h3>
              <el-tag type="info" size="small">开发中</el-tag>
            </div>
            <p class="tool-description">{{ tool.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  ArrowRight,
  DocumentCopy,
  Management as Calculator,
  TrendCharts,
  CreditCard,
  Notebook,
  Grid as Bowling,
  Tools,
  Calendar,
  DataLine,
  Timer,
  Wallet
} from '@element-plus/icons-vue'

const router = useRouter()

interface Tool {
  id: string
  title: string
  description: string
  icon: any
  category: string
  route: string
  status: 'stable' | 'beta'
  color: string
  usage?: string
}

const searchQuery = ref('')
const selectedCategory = ref('all')

const categories = [
  { key: 'formatter', label: '格式化工具' },
  { key: 'calculator', label: '计算器' },
  { key: 'tracker', label: '记录工具' },
  { key: 'game', label: '娱乐工具' }
]

const tools = ref<Tool[]>([
  {
    id: 'json-tools',
    title: 'JSON工具集',
    description: 'JSON格式化、校验、比对，支持大纲和完整两种比对模式',
    icon: DocumentCopy,
    category: 'formatter',
    route: '/tools/json',
    status: 'stable',
    color: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    usage: '1.5k次'
  },
  {
    id: 'loan-calculator',
    title: '提前还贷计算器',
    description: '计算提前还款的利息节省和还款方案',
    icon: Calculator,
    category: 'calculator',
    route: '/tools/loan-calculator',
    status: 'stable',
    color: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    usage: '856次'
  },
  {
    id: 'weight-tracker',
    title: '体重曲线',
    description: '记录和追踪体重变化趋势',
    icon: TrendCharts,
    category: 'tracker',
    route: '/tools/weight-tracker',
    status: 'beta',
    color: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    usage: '234次'
  },
  {
    id: 'card-score',
    title: '打牌记分',
    description: '扑克牌、麻将等游戏的记分工具',
    icon: Bowling,
    category: 'game',
    route: '/tools/card-score',
    status: 'beta',
    color: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    usage: '567次'
  },
  {
    id: 'mahjong-score',
    title: '麻将记分',
    description: '专门为麻将设计的记分工具',
    icon: Notebook,
    category: 'game',
    route: '/tools/mahjong-score',
    status: 'stable',
    color: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    usage: '1.5k次'
  },
  {
    id: 'expense-splitter',
    title: 'AA记账',
    description: '群体消费的AA制账单分摊',
    icon: CreditCard,
    category: 'tracker',
    route: '/tools/expense-splitter',
    status: 'beta',
    color: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    usage: '423次'
  },
  {
    id: 'unit-converter',
    title: '单位转换',
    description: '长度、重量、温度等单位转换工具',
    icon: Tools,
    category: 'calculator',
    route: '/tools/unit-converter',
    status: 'stable',
    color: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
    usage: '689次'
  },
  {
    id: 'pomodoro',
    title: '番茄钟',
    description: '番茄工作法时间管理工具',
    icon: Timer,
    category: 'tracker',
    route: '/tools/pomodoro',
    status: 'beta',
    color: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    usage: '345次'
  }
])

const comingSoonTools = ref<Tool[]>([
  {
    id: 'budget-planner',
    title: '预算规划',
    description: '月度预算规划和支出分析',
    icon: Wallet,
    category: 'tracker',
    route: '/tools/budget-planner',
    status: 'beta',
    color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  },
  {
    id: 'investment-tracker',
    title: '投资追踪',
    description: '股票、基金等投资收益追踪',
    icon: DataLine,
    category: 'tracker',
    route: '/tools/investment-tracker',
    status: 'beta',
    color: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
  },
  {
    id: 'price-compare',
    title: '价格比较',
    description: '商品价格历史和比价工具',
    icon: DocumentCopy,
    category: 'calculator',
    route: '/tools/price-compare',
    status: 'beta',
    color: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)'
  },
  {
    id: 'habit-tracker',
    title: '习惯养成',
    description: '每日习惯打卡和追踪',
    icon: Calendar,
    category: 'tracker',
    route: '/tools/habit-tracker',
    status: 'beta',
    color: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)'
  }
])

const filteredTools = computed(() => {
  let result = tools.value

  // Filter by category
  if (selectedCategory.value !== 'all') {
    result = result.filter(tool => tool.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(tool =>
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query)
    )
  }

  return result
})

const openTool = (tool: Tool) => {
  router.push(tool.route)
}
</script>

<style scoped>
.tools-index {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
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
  margin: var(--spacing-xs) 0 var(--spacing-md) 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.search-input {
  width: 300px;
}

/* Categories Filter */
.categories-filter {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.tool-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.tool-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  opacity: 0;
  transition: opacity var(--transition-base);
}

.tool-card:hover::before {
  opacity: 1;
}

.tool-card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-card-disabled:hover {
  transform: none;
  box-shadow: var(--shadow-sm);
}

.tool-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tool-content {
  flex: 1;
  min-width: 0;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.tool-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.tool-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tool-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.tool-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.tool-card:hover .tool-action {
  background: var(--color-primary);
  color: white;
  transform: translateX(4px);
}

/* Coming Soon Section */
.coming-soon-section {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-2xl);
  border-top: 1px solid var(--color-border-light);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    width: 100%;
  }

  .categories-filter {
    gap: var(--spacing-xs);
  }
}
</style>
