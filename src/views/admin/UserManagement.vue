<template>
  <div class="admin-container">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <p class="page-subtitle">管理系统用户和权限</p>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户名或昵称"
        clearable
        style="width: 300px"
        @clear="handleSearch"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-button type="primary" @click="handleAddUser">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
    </div>

    <!-- 用户列表 -->
    <el-table
      :data="filteredUsers"
      stripe
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" label="用户名" width="150">
        <template #default="{ row }">
          <el-tag v-if="row.username === 'admin'" type="danger">
            {{ row.username }}
          </el-tag>
          <span v-else>{{ row.username }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" width="150" />
      <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
      <el-table-column prop="phone" label="手机号" min-width="150" show-overflow-tooltip />
      <el-table-column prop="gender" label="性别" width="100">
        <template #default="{ row }">
          {{ getGenderText(row.gender) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button size="small" link @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button size="small" link @click="handleResetPassword(row)" v-if="row.username !== 'admin'">
            重置密码
          </el-button>
          <el-button
            size="small"
            link
            type="danger"
            @click="handleDelete(row)"
            v-if="row.username !== 'admin'"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingUser ? '编辑用户' : '新增用户'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        :model="form"
        :rules="formRules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username" v-if="!editingUser">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editingUser">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="100" placeholder="请输入排序" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordVisible"
      title="重置密码"
      width="400px"
    >
      <el-form
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        ref="resetPasswordFormRef"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPasswordForm.password" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" placeholder="请再次输入密码" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPasswordSubmit" :loading="resetPasswordLoading">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  type User,
  type UserCreateRequest,
  type UserUpdateRequest
} from '@/api/auth'

// 搜索和筛选
const searchQuery = ref('')
const loading = ref(false)
const saving = ref(false)
const resetPasswordLoading = ref(false)

// 表单引用
const formRef = ref<FormInstance>()
const resetPasswordFormRef = ref<FormInstance>()

// 用户列表数据
const users = ref<User[]>([])

// 分页
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 对话框状态
const dialogVisible = ref(false)
const resetPasswordVisible = ref(false)
const editingUser = ref<User | null>(null)

// 表单数据
const form = ref({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  gender: 0,
  status: 1,
  sort: 0,
  remark: '',
  password: ''
})

const resetPasswordForm = ref({
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const formRules = ref<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
})

const resetPasswordRules = ref<FormRules>({
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: (_rule, value, callback) => {
      if (value !== resetPasswordForm.value.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
})

// 获取性别文本
const getGenderText = (gender: number) => {
  const genderMap: { [key: number]: string } = {
    0: '未知',
    1: '男',
    2: '女'
  }
  return genderMap[gender] || '未知'
}

// 过滤后的用户列表
const filteredUsers = computed(() => {
  console.log('[UserManagement] filteredUsers计算属性被调用')
  console.log('[UserManagement] searchQuery.value:', searchQuery.value)
  console.log('[UserManagement] users.value:', users.value)
  console.log('[UserManagement] users.value 类型:', typeof users.value)
  console.log('[UserManagement] users.value 是否为数组:', Array.isArray(users.value))
  console.log('[UserManagement] users.value 长度:', users.value.length)

  if (!searchQuery.value) {
    console.log('[UserManagement] 没有搜索条件，返回所有用户:', users.value)
    return users.value
  }

  const query = searchQuery.value.toLowerCase()
  const filtered = users.value.filter(user =>
    user.username.toLowerCase().includes(query) ||
    user.nickname.toLowerCase().includes(query) ||
    (user.email && user.email.toLowerCase().includes(query)) ||
    (user.phone && user.phone.includes(query))
  )
  console.log('[UserManagement] 搜索后的用户列表:', filtered)
  return filtered
})

// 加载用户列表
const loadUsers = async () => {
  try {
    loading.value = true
    console.log('[UserManagement] 开始加载用户列表，参数:', {
      page: pagination.value.page,
      size: pagination.value.pageSize,
      search: searchQuery.value
    })

    const response = await getUserList({
      page: pagination.value.page,
      size: pagination.value.pageSize,
      search: searchQuery.value
    })

    console.log('[UserManagement] API 响应:', response)

    // API 返回数组，不是 {items, total} 格式
    const userList = Array.isArray(response) ? response : []
    console.log('[UserManagement] 解析后的用户列表:', userList)
    users.value = userList
    pagination.value.total = userList.length
    console.log('[UserManagement] 用户列表加载完成，共', userList.length, '个用户')
  } catch (error) {
    console.error('[UserManagement] 加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  loadUsers()
}

// 分页
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadUsers()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadUsers()
}

// 打开新增用户对话框
const handleAddUser = () => {
  editingUser.value = null
  form.value = {
    username: '',
    nickname: '',
    email: '',
    phone: '',
    gender: 0,
    status: 1,
    sort: 0,
    remark: '',
    password: ''
  }
  // 清空搜索条件，确保新创建的用户能够显示
  searchQuery.value = ''
  dialogVisible.value = true
}

// 打开编辑用户对话框
const handleEdit = (row: User) => {
  editingUser.value = row
  form.value = {
    username: row.username,
    nickname: row.nickname,
    email: row.email || '',
    phone: row.phone || '',
    gender: row.gender || 0,
    status: row.status || 1,
    sort: row.sort || 0,
    remark: row.remark || '',
    password: ''
  }
  dialogVisible.value = true
}

// 保存用户
const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    saving.value = true
    console.log('[UserManagement] 开始保存用户...', { editingUser: editingUser.value })

    if (editingUser.value) {
      // 编辑用户
      const updateData: UserUpdateRequest = {
        nickname: form.value.nickname,
        email: form.value.email,
        phone: form.value.phone,
        gender: form.value.gender,
        status: form.value.status,
        sort: form.value.sort,
        remark: form.value.remark
      }
      console.log('[UserManagement] 更新用户:', updateData)
      await updateUser(editingUser.value.id, updateData)
      ElMessage.success('用户更新成功')
    } else {
      // 新增用户
      const createData: UserCreateRequest = {
        username: form.value.username,
        password: form.value.password,
        nickname: form.value.nickname,
        email: form.value.email,
        phone: form.value.phone,
        gender: form.value.gender,
        status: form.value.status,
        sort: form.value.sort,
        remark: form.value.remark
      }
      console.log('[UserManagement] 创建用户:', createData)
      await createUser(createData)
      ElMessage.success('用户创建成功')
    }

    dialogVisible.value = false
    console.log('[UserManagement] 用户保存成功，开始刷新用户列表')
    await loadUsers()
    console.log('[UserManagement] 用户列表刷新完成，当前用户数:', users.value.length)
  } catch (error: any) {
    console.error('[UserManagement] 保存用户失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '保存用户失败'
    ElMessage.error(errorMessage)
  } finally {
    saving.value = false
  }
}

// 删除用户
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？此操作不可恢复。`,
      '删除用户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteUser(row.id)
    ElMessage.success('用户删除成功')
    loadUsers()
  } catch (error) {
    // 用户取消删除
  }
}

// 重置密码
const handleResetPassword = (row: User) => {
  resetPasswordForm.value = {
    password: '',
    confirmPassword: ''
  }
  editingUser.value = row
  resetPasswordVisible.value = true
}

const handleResetPasswordSubmit = async () => {
  if (!resetPasswordFormRef.value) return

  try {
    await resetPasswordFormRef.value.validate()

    resetPasswordLoading.value = true
    await resetPassword(editingUser.value!.id, resetPasswordForm.value.password)
    ElMessage.success('密码重置成功')
    resetPasswordVisible.value = false
  } catch (error) {
    console.error('重置密码失败:', error)
  } finally {
    resetPasswordLoading.value = false
  }
}

// 状态变更
const handleStatusChange = async (row: User) => {
  try {
    await updateUser(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 恢复原来的状态
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetPasswordFormRef.value?.resetFields()
}

// 选择变更
const handleSelectionChange = (selection: User[]) => {
  console.log('Selected users:', selection)
}

// 初始化
onMounted(() => {
  loadUsers()
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

.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
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
</style>
