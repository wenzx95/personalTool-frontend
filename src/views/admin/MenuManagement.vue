<template>
  <div class="admin-container">
    <div class="page-header">
      <h1 class="page-title">菜单权限管理</h1>
      <p class="page-subtitle">管理用户的菜单访问权限</p>
    </div>

    <el-row :gutter="20">
      <!-- 用户选择 -->
      <el-col :span="6">
        <div class="user-select-panel">
          <h3>选择用户</h3>
          <el-input
            v-model="userSearchQuery"
            placeholder="搜索用户名或姓名"
            clearable
            style="margin-bottom: 16px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-tree
            :data="userTreeData"
            :props="userTreeProps"
            :default-expand-all="true"
            :filter-node-method="filterUserNode"
            :highlight-current="true"
            @node-click="handleUserSelect"
            ref="userTreeRef"
          >
            <template #default="{ node, data }">
              <el-tag
                :type="data.status === 'active' ? 'success' : 'info'"
                size="small"
                style="margin-right: 8px"
              >
                {{ data.status === 'active' ? '激活' : '禁用' }}
              </el-tag>
              <span>{{ node.label }}</span>
            </template>
          </el-tree>
        </div>
      </el-col>

      <!-- 菜单权限配置 -->
      <el-col :span="18">
        <div class="menu-config-panel">
          <h3>菜单权限配置 - {{ selectedUser?.name || '请选择用户' }}</h3>

          <el-input
            v-model="menuSearchQuery"
            placeholder="搜索菜单"
            clearable
            style="margin-bottom: 16px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-tree
            :data="menuTreeData"
            :props="menuTreeProps"
            :default-expand-all="true"
            :filter-node-method="filterMenuNode"
            :default-checked-keys="selectedMenuKeys"
            node-key="key"
            show-checkbox
            @check="handleMenuCheck"
            ref="menuTreeRef"
          >
            <template #default="{ node, data }">
              <el-icon :class="data.icon">{{ getIconComponent(data.icon) }}</el-icon>
              <span>{{ node.label }}</span>
            </template>
          </el-tree>

          <div class="action-buttons">
            <el-button @click="handleReset">
              重置
            </el-button>
            <el-button type="primary" @click="handleSave" :loading="saving">
              保存配置
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 提示信息 -->
    <el-alert
      title="提示"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 20px"
    >
      <template #default>
        <p>• 未选中用户时，菜单权限配置区域为禁用状态</p>
        <p>• 勾选的菜单表示用户有权限访问该菜单</p>
        <p>• 管理员用户（admin）拥有所有菜单的访问权限</p>
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import {
  TrendCharts,
  Money,
  Tools,
  Management,
  Setting,
  DataLine
} from '@element-plus/icons-vue'
import {
  getUserList,
  getMenuList,
  getUserMenuPermissions,
  setUserMenuPermissions,
  type User,
  type MenuItem
} from '@/api/auth'

// 用户搜索
const userSearchQuery = ref('')
const menuSearchQuery = ref('')

// 加载状态
const loading = ref(false)
const saving = ref(false)

// 选中的用户和菜单
const selectedUser = ref<User | null>(null)
const selectedMenuKeys = ref<string[]>([])

// 原始菜单权限（用于重置）
const originalMenuKeys = ref<string[]>([])

// 用户列表和菜单数据
const users = ref<User[]>([])
const menuList = ref<MenuItem[]>([])

// 用户树属性配置
const userTreeProps = {
  label: 'name',
  children: []
}

// 菜单树属性配置
const menuTreeProps = {
  label: 'name',
  children: 'children'
}

// 用户树数据（转换为树形结构）
const userTreeData = computed(() => {
  return users.value.map(user => ({
    ...user,
    children: []
  }))
})

// 菜单树数据（转换为树形结构）
const menuTreeData = computed(() => {
  return menuList.value.map(menu => ({
    ...menu,
    children: menu.children || []
  }))
})

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    const [userData, menuData] = await Promise.all([
      getUserList({ size: 1000 }), // 获取所有用户
      getMenuList() // 获取所有菜单
    ])
    users.value = userData.items
    menuList.value = menuData
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索用户节点
const filterUserNode = (value: string, data: User) => {
  if (!value) return true
  return (
    data.username.toLowerCase().includes(value.toLowerCase()) ||
    data.name.toLowerCase().includes(value.toLowerCase()) ||
    (data.email && data.email.toLowerCase().includes(value.toLowerCase()))
  )
}

// 搜索菜单节点
const filterMenuNode = (value: string, data: MenuItem) => {
  if (!value) return true
  return data.name.toLowerCase().includes(value.toLowerCase())
}

// 点击用户节点
const handleUserSelect = async (node: any) => {
  selectedUser.value = node.data
  try {
    // 获取用户的菜单权限
    const menuKeys = await getUserMenuPermissions(node.data.id)
    selectedMenuKeys.value = menuKeys
    originalMenuKeys.value = [...menuKeys] // 保存原始权限用于重置

    // 确保树组件更新
    await nextTick()
    const menuTreeRef = (window as any).$refs?.menuTreeRef
    if (menuTreeRef) {
      menuTreeRef.setCheckedKeys(menuKeys)
    }
  } catch (error) {
    console.error('获取用户菜单权限失败:', error)
    ElMessage.error('获取用户菜单权限失败')
  }
}

// 菜单选择变化
const handleMenuCheck = (_data: any, info: any) => {
  selectedMenuKeys.value = info.checkedKeys as string[]
}

// 重置为原始状态
const handleReset = () => {
  selectedMenuKeys.value = [...originalMenuKeys.value]
  const menuTreeRef = (window as any).$refs?.menuTreeRef
  if (menuTreeRef) {
    menuTreeRef.setCheckedKeys(originalMenuKeys.value)
  }
}

// 保存菜单权限
const handleSave = async () => {
  if (!selectedUser.value) {
    ElMessage.warning('请先选择用户')
    return
  }

  try {
    await setUserMenuPermissions(selectedUser.value.id, selectedMenuKeys.value)
    ElMessage.success('菜单权限配置保存成功')
    originalMenuKeys.value = [...selectedMenuKeys.value]
  } catch (error) {
    console.error('保存菜单权限失败:', error)
    ElMessage.error('保存菜单权限失败')
  }
}

// 获取菜单图标组件
const getIconComponent = (iconName?: string) => {
  // 这里可以根据图标名称返回对应的组件
  // 由于是动态菜单，可能需要一个图标映射表
  const iconMap: Record<string, any> = {
    'TrendCharts': TrendCharts,
    'Money': Money,
    'Tools': Tools,
    'Management': Management,
    'Setting': Setting,
    'Document': Document,
    'DataLine': DataLine
  }

  return iconMap[iconName || ''] || 'Menu'
}

// 监听搜索查询
watch([userSearchQuery, menuSearchQuery], async () => {
  await nextTick()
  const userTreeRef = (window as any).$refs?.userTreeRef
  if (userTreeRef) {
    userTreeRef.filter(userSearchQuery.value)
  }

  const menuTreeRef = (window as any).$refs?.menuTreeRef
  if (menuTreeRef) {
    menuTreeRef.filter(menuSearchQuery.value)
  }
})

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e4e7ed;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #909399;
  margin: 0;
}

.user-select-panel,
.menu-config-panel {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  height: 100%;
  min-height: 500px;
}

.user-select-panel h3,
.menu-config-panel h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.el-tree {
  height: calc(100% - 100px);
  overflow-y: auto;
}

.el-alert {
  margin-top: 20px;
}

::v-deep .el-tree-node__content {
  padding: 0 16px !important;
  height: 40px !important;
  line-height: 40px !important;
}

::v-deep .el-tree-node__expand-icon {
  margin-right: 8px;
}

::v-deep .el-icon {
  margin-right: 8px;
}
</style>
