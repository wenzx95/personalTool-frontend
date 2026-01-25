import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 如果后端返回的是Result格式，提取data字段
    const { data } = response
    if (data && typeof data === 'object' && 'code' in data) {
      // 成功响应(code=200)，返回data字段
      if (data.code === 200) {
        return data.data
      }
      // 错误响应，显示错误消息
      const errorMsg = data.message || '请求失败'
      ElMessage.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }
    // 直接返回响应数据（用于非Result格式响应）
    return data
  },
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.log('[Request] Token expired or invalid, redirecting to login')
      // Clear token and user data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Show message
      ElMessage.error('登录已过期，请重新登录')
      // Redirect to login page
      router.push('/login')
      return Promise.reject(error)
    }

    // Handle 500 errors
    if (error.response?.status === 500) {
      ElMessage.error('服务器错误，请稍后重试')
      return Promise.reject(error)
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      ElMessage.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    // Show error message for other errors
    const errorMsg = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(errorMsg)
    return Promise.reject(error)
  }
)

export default request

