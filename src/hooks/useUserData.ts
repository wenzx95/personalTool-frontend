import { ref } from 'vue'
import type { UserData, UserDataRequest } from '@/api/userData'
import {
  getUserDataList,
  saveUserData,
  updateUserData,
  deleteUserData
} from '@/api/userData'
import { ElMessage } from 'element-plus'

export const useUserData = (moduleCode: string) => {
  const dataList = ref<UserData[]>([])
  const loading = ref(false)
  const selectedData = ref<UserData | null>(null)

  // 加载数据列表
  const loadDataList = async () => {
    loading.value = true
    try {
      const response = await getUserDataList(moduleCode)
      dataList.value = response
    } catch (error: any) {
      ElMessage.error(error.message || '加载数据失败')
    } finally {
      loading.value = false
    }
  }

  // 保存数据
  const saveData = async (request: UserDataRequest): Promise<UserData | null> => {
    try {
      const response = await saveUserData({
        ...request,
        status: request.status ?? 1
      })
      dataList.value.push(response)
      ElMessage.success('保存成功')
      return response
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
      return null
    }
  }

  // 更新数据
  const updateData = async (id: number, request: Partial<UserDataRequest>): Promise<UserData | null> => {
    try {
      const response = await updateUserData(id, request)
      const index = dataList.value.findIndex(item => item.id === id)
      if (index !== -1) {
        dataList.value[index] = response
      }
      ElMessage.success('更新成功')
      return response
    } catch (error: any) {
      ElMessage.error(error.message || '更新失败')
      return null
    }
  }

  // 删除数据
  const deleteData = async (id: number): Promise<boolean> => {
    try {
      await deleteUserData(id)
      const index = dataList.value.findIndex(item => item.id === id)
      if (index !== -1) {
        dataList.value.splice(index, 1)
        if (selectedData.value?.id === id) {
          selectedData.value = null
        }
      }
      ElMessage.success('删除成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
      return false
    }
  }

  // 选择数据
  const selectData = (data: UserData) => {
    selectedData.value = data
  }

  return {
    dataList,
    loading,
    selectedData,
    loadDataList,
    saveData,
    updateData,
    deleteData,
    selectData
  }
}
