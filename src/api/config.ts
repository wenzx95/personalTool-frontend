import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建配置管理API请求实例
const configRequest = axios.create({
  baseURL: '/api/v1',
  timeout: 30000 // 30秒超时
})

// 请求拦截器
configRequest.interceptors.request.use(
  (config) => {
    // Add token if exists
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('[Config API Request]', config.method?.toUpperCase(), config.url, config.params || config.data)
    return config
  },
  (error) => {
    console.error('[Config API Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
configRequest.interceptors.response.use(
  (response) => {
    console.log('[Config API Response]', response.config.url, 'status:', response.status, 'data:', response.data)
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else {
      console.error('[Config API Error]', res.message)
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    console.error('[Config API Network Error]', error.config?.url, error.message, error)

    // Handle 404 errors - 页面或API不存在
    if (error.response?.status === 404) {
      ElMessage.error('系统配置功能暂不可用，请联系管理员')
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      ElMessage.error('请先登录')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const currentPath = router.currentRoute.value.path
      if (currentPath !== '/login' && !currentPath.startsWith('/tools')) {
        router.push({
          path: '/login',
          query: { redirect: currentPath }
        })
      }
      return Promise.reject(error)
    }

    // Handle 500 errors
    if (error.response?.status === 500) {
      ElMessage.error('服务器错误，请稍后重试')
      return Promise.reject(error)
    }

    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

// ============ 类型定义 ============

/**
 * 系统配置
 */
export interface SystemConfig {
  id: number
  configKey: string
  configValue: string
  configType: 'string' | 'number' | 'boolean' | 'json'
  category: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 配置统计信息
 */
export interface ConfigStats {
  total: number
  byCategory: Record<string, number>
}

/**
 * 配置更新响应
 */
export interface ConfigUpdateResponse {
  configKey: string
  configValue: string
  message: string
}

// ============ API接口 ============

/**
 * 获取所有配置
 */
export const getConfigList = (): Promise<SystemConfig[]> => {
  return configRequest.get('/system/config')
}

/**
 * 按分类获取配置
 */
export const getConfigsByCategory = (category: string): Promise<SystemConfig[]> => {
  return configRequest.get(`/system/config/category/${category}`)
}

/**
 * 获取单个配置值
 */
export const getConfigValue = (configKey: string): Promise<string> => {
  return configRequest.get(`/system/config/${configKey}`)
}

/**
 * 更新配置值
 */
export const updateConfig = (configKey: string, configValue: string): Promise<ConfigUpdateResponse> => {
  return configRequest.put(`/system/config/${configKey}`, { configValue })
}

/**
 * 刷新配置到Environment
 */
export const refreshConfig = (): Promise<{ message: string; note?: string }> => {
  return configRequest.post('/system/config/refresh')
}

/**
 * 获取配置统计信息
 */
export const getConfigStats = (): Promise<ConfigStats> => {
  return configRequest.get('/system/config/stats')
}

/**
 * 查看Environment中的配置值
 */
export const getEnvProperty = (key: string): Promise<string> => {
  return configRequest.get(`/system/config/env/${key}`)
}
