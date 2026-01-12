<template>
  <div class="admin-dashboard">
    <div class="page-header">
      <h1 class="page-title">后台管理系统</h1>
      <p class="page-subtitle">系统管理与配置中心</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon class="stat-icon" style="color: #409eff">
              <User />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ userCount }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
          <div class="stat-trend">
            <el-icon class="trend-icon" style="color: #67c23a">
              <ArrowUp />
            </el-icon>
            <span class="trend-value">5%</span>
            <span class="trend-label">较上周</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon class="stat-icon" style="color: #67c23a">
              <User />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ activeUserCount }}</div>
              <div class="stat-label">激活用户</div>
            </div>
          </div>
          <div class="stat-trend">
            <el-icon class="trend-icon" style="color: #67c23a">
              <ArrowUp />
            </el-icon>
            <span class="trend-value">12%</span>
            <span class="trend-label">较上周</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon class="stat-icon" style="color: #f56c6c">
              <Warning />
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ inactiveUserCount }}</div>
              <div class="stat-label">禁用用户</div>
            </div>
          </div>
          <div class="stat-trend">
            <el-icon class="trend-icon" style="color: #f56c6c">
              <ArrowUp />
            </el-icon>
            <span class="trend-value">8%</span>
            <span class="trend-label">较上周</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 管理功能卡片 -->
    <div class="management-section">
      <h2 class="section-title">管理功能</h2>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card
            class="management-card"
            shadow="hover"
            @click="handleCardClick('users')"
            style="cursor: pointer"
          >
            <div class="card-content">
              <el-icon class="card-icon" style="color: #409eff">
                <UserFilled />
              </el-icon>
              <div class="card-info">
                <div class="card-title">用户管理</div>
                <div class="card-description">添加、删除、编辑用户，重置密码</div>
              </div>
              <el-icon class="card-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card
            class="management-card"
            shadow="hover"
            @click="handleCardClick('menus')"
            style="cursor: pointer"
          >
            <div class="card-content">
              <el-icon class="card-icon" style="color: #67c23a">
                <Menu />
              </el-icon>
              <div class="card-info">
                <div class="card-title">菜单权限管理</div>
                <div class="card-description">配置用户的菜单访问权限</div>
              </div>
              <el-icon class="card-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card
            class="management-card"
            shadow="hover"
            @click="handleCardClick('settings')"
            style="cursor: pointer"
          >
            <div class="card-content">
              <el-icon class="card-icon" style="color: #e6a23c">
                <Setting />
              </el-icon>
              <div class="card-info">
                <div class="card-title">系统配置</div>
                <div class="card-description">系统参数和配置管理</div>
              </div>
              <el-icon class="card-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card
            class="management-card"
            shadow="hover"
            @click="handleCardClick('logs')"
            style="cursor: pointer"
          >
            <div class="card-content">
              <el-icon class="card-icon" style="color: #f56c6c">
                <Document />
              </el-icon>
              <div class="card-info">
                <div class="card-title">系统日志</div>
                <div class="card-description">操作日志和系统日志查看</div>
              </div>
              <el-icon class="card-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近活动 -->
    <div class="activity-section">
      <h2 class="section-title">最近活动</h2>
      <el-table
        :data="recentActivity"
        style="width: 100%"
        size="small"
      >
        <el-table-column prop="time" label="时间" width="180">
          <template #default="{ row }">
            <el-tag size="small">{{ formatTime(row.time) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user" label="用户" width="150">
          <template #default="{ row }">
            <el-tag :type="getUserTagType(row.user)">{{ row.user }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  UserFilled,
  Setting,
  Document,
  Warning,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from '@element-plus/icons-vue'
import { getUserList } from '@/api/auth'

const router = useRouter()

// 统计数据
const userCount = ref(0)
const activeUserCount = ref(0)
const inactiveUserCount = ref(0)

// 最近活动
const recentActivity = ref([
  {
    id: 1,
    time: new Date(Date.now() - 300000).toISOString(),
    user: 'admin',
    action: '登录系统',
    description: '管理员登录后台管理系统',
    status: 'success'
  },
  {
    id: 2,
    time: new Date(Date.now() - 600000).toISOString(),
    user: 'testuser',
    action: '新增用户',
    description: '新增用户：test@example.com',
    status: 'success'
  },
  {
    id: 3,
    time: new Date(Date.now() - 1800000).toISOString(),
    user: 'admin',
    action: '重置密码',
    description: '为用户 testuser 重置密码',
    status: 'success'
  },
  {
    id: 4,
    time: new Date(Date.now() - 3600000).toISOString(),
    user: 'system',
    action: '系统维护',
    description: '系统自动备份完成',
    status: 'success'
  },
  {
    id: 5,
    time: new Date(Date.now() - 7200000).toISOString(),
    user: 'admin',
    action: '配置菜单权限',
    description: '为用户 user1 配置菜单权限',
    status: 'success'
  }
])

// 格式化时间
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 获取用户标签类型
const getUserTagType = (username: string) => {
  return username === 'admin' ? 'danger' : 'primary'
}

// 处理卡片点击
const handleCardClick = (type: string) => {
  switch (type) {
    case 'users':
      router.push('/admin/users')
      break
    case 'menus':
      router.push('/admin/menus')
      break
    case 'settings':
      router.push('/config')
      break
    case 'logs':
      ElMessage.info('系统日志功能开发中')
      break
    default:
      ElMessage.warning('功能未实现')
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const userData = await getUserList({ size: 1000 })

    // API 返回数组，不是 {items, total} 格式
    const users = Array.isArray(userData) ? userData : []
    userCount.value = users.length
    activeUserCount.value = users.filter(user => user.status === 1).length
    inactiveUserCount.value = users.filter(user => user.status === 0).length
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

// 初始化
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
  padding: 20px 0;
  border-bottom: 2px solid #e4e7ed;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-subtitle {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.stat-icon {
  font-size: 24px;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-trend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.trend-icon {
  font-size: 12px;
  margin-right: 4px;
}

.trend-value {
  font-size: 14px;
  font-weight: 600;
  margin-right: 4px;
}

.trend-label {
  font-size: 12px;
  color: #909399;
}

.management-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}

.management-card {
  height: 100%;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.management-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  font-size: 28px;
  margin-right: 16px;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.card-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.card-arrow {
  color: #c0c4cc;
  transition: color 0.3s;
}

.management-card:hover .card-arrow {
  color: #409eff;
}

.activity-section {
  margin-bottom: 30px;
}

.el-table {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.el-table :deep(.el-table__header) {
  background-color: #f5f7fa;
}

.el-table :deep(.el-table__body tr:hover > td) {
  background-color: #f5f7fa;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 10px;
  }

  .page-title {
    font-size: 20px;
  }

  .stat-value {
    font-size: 24px;
  }

  .card-title {
    font-size: 14px;
  }
}
</style>
