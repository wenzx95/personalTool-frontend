<template>
  <div class="menu-crud-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>菜单管理</h2>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加菜单
          </el-button>
        </div>
      </template>

      <!-- 菜单列表 -->
      <el-table
        :data="menuTree"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        default-expand-all
      >
        <el-table-column prop="name" label="菜单名称" width="200" />
        <el-table-column prop="path" label="路由路径" width="200" />
        <el-table-column prop="component" label="组件路径" />
        <el-table-column prop="icon" label="图标" width="120" />
        <el-table-column label="设备类型" width="280">
          <template #default="{ row }">
            <el-tag
              v-for="type in row.deviceTypes"
              :key="type"
              :type="getDeviceTypeColor(type)"
              size="small"
              style="margin-right: 5px"
            >
              {{ getDeviceTypeLabel(type) }}
            </el-tag>
            <span v-if="!row.deviceTypes || row.deviceTypes.length === 0" class="text-muted">
              全部设备
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑/添加对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="父菜单" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="menuTreeForSelect"
            :props="{ label: 'name', value: 'id' }"
            placeholder="选择父菜单（不选则为根菜单）"
            check-strictly
            clearable
          />
        </el-form-item>

        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入菜单名称" />
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="formData.path" placeholder="请输入路由路径，如 /user" />
        </el-form-item>

        <el-form-item label="组件路径">
          <el-input
            v-model="formData.component"
            placeholder="请输入组件路径，如 views/user/index"
          />
        </el-form-item>

        <el-form-item label="菜单图标">
          <el-input v-model="formData.icon" placeholder="请输入图标名称" />
        </el-form-item>

        <el-form-item label="设备类型">
          <el-checkbox-group v-model="formData.deviceTypes">
            <el-checkbox
              v-for="option in DEVICE_TYPE_OPTIONS"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </el-checkbox>
          </el-checkbox-group>
          <div class="form-tip">
            不选择任何设备类型时，该菜单在所有设备显示
          </div>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            :max="9999"
            controls-position="right"
          />
          <div class="form-tip">数字越小越靠前</div>
        </el-form-item>

        <el-form-item label="是否公开">
          <el-switch v-model="formData.isPublic" :active-value="1" :inactive-value="0" />
          <div class="form-tip">公开菜单无需登录即可访问</div>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
          <div class="form-tip">禁用后菜单将不会显示</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMenuList, addMenu, updateMenu, deleteMenu, type MenuDTO } from '@/api/menu'
import { DEVICE_TYPE_OPTIONS, getDeviceTypeLabel, getDeviceTypeColor } from '@/constants/deviceTypes'

// 菜单树数据
const menuTree = ref<MenuDTO[]>([])

// 用于选择的菜单树（添加了根节点选项）
const menuTreeForSelect = computed(() => {
  return [
    { id: 0, name: '根菜单', children: menuTree.value }
  ]
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref()

// 表单数据
const formData = ref<MenuDTO>({
  parentId: 0,
  name: '',
  path: '',
  component: '',
  icon: '',
  deviceTypes: [],
  sort: 0,
  isPublic: 0,
  status: 1
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

// 获取菜单列表
const fetchMenuList = async () => {
  try {
    menuTree.value = await getMenuList()
  } catch (error) {
    ElMessage.error('获取菜单列表失败')
    console.error(error)
  }
}

// 添加菜单
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '添加菜单'
  formData.value = {
    parentId: 0,
    name: '',
    path: '',
    component: '',
    icon: '',
    deviceTypes: [],
    sort: 0,
    isPublic: 0,
    status: 1
  }
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = (row: MenuDTO) => {
  isEdit.value = true
  dialogTitle.value = '编辑菜单'
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除菜单
const handleDelete = async (row: MenuDTO) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单"${row.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (row.id) {
      await deleteMenu(row.id)
      ElMessage.success('删除成功')
      await fetchMenuList()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    if (isEdit.value) {
      await updateMenu(formData.value.id!, formData.value)
      ElMessage.success('更新成功')
    } else {
      await addMenu(formData.value)
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    await fetchMenuList()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 页面加载时获取菜单列表
onMounted(() => {
  fetchMenuList()
})
</script>

<style scoped lang="scss">
.menu-crud-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .text-muted {
    color: #909399;
    font-size: 13px;
  }

  .form-tip {
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
