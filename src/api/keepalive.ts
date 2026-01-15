import request from './request'

// ============ 类型定义 ============

/**
 * 系统配置
 */
export interface SystemConfig {
  id: number
  configKey: string
  configValue: string
  configType: string
  category: string
  description: string
  isActive: number
  createdAt: string
  updatedAt: string
}

/**
 * 系统日志
 */
export interface SystemLog {
  id: number
  logType: string
  logCategory: string
  logTitle: string
  logContent: string
  platformCode: string
  taskCode: string
  status: string
  errorMessage: string
  duration: number
  createdAt: string
}

/**
 * 平台配置
 */
export interface PlatformConfig {
  url: string
  model: string
  maxTokens: number
  temperature: string
  taskEnabled: boolean
  hasKeys: boolean
  todayCount: number
}

/**
 * 平台概览
 */
export interface PlatformOverview {
  [platformCode: string]: PlatformConfig
}

/**
 * 统计信息
 */
export interface KeepAliveStats {
  todayTotal: number
  todaySuccess: number
  todayFailed: number
  zhipu: {
    count: number
    enabled: boolean
  }
  doubao: {
    count: number
    enabled: boolean
  }
}

// ============ API接口 ============

/**
 * 获取AI平台配置列表
 */
export const getAIConfigs = (): Promise<SystemConfig[]> => {
  return request.get('/keepalive/configs').then((res: any) => {
    return res?.data || []
  })
}

/**
 * 获取指定平台的配置
 */
export const getPlatformConfig = (platform: string): Promise<PlatformConfig> => {
  return request.get(`/keepalive/config/${platform}`).then((res: any) => {
    return res?.data || {}
  })
}

/**
 * 更新平台配置
 */
export const updatePlatformConfig = (platform: string, updates: Record<string, any>): Promise<{
  code: number
  message: string
}> => {
  return request.put(`/keepalive/config/${platform}`, updates).then((res: any) => res.data)
}

/**
 * 更新API Keys
 */
export const updateApiKeys = (platform: string, keys: string): Promise<{
  code: number
  message: string
}> => {
  return request.put(`/keepalive/config/${platform}/keys`, { keys }).then((res: any) => res.data)
}

/**
 * 获取任务配置列表
 */
export const getTaskConfigs = (): Promise<SystemConfig[]> => {
  return request.get('/keepalive/tasks').then((res: any) => {
    return res?.data || []
  })
}

/**
 * 更新任务启用状态
 */
export const updateTaskEnabled = (platform: string, enabled: boolean): Promise<{
  code: number
  message: string
}> => {
  return request.put(`/keepalive/task/${platform}/enabled`, { enabled }).then((res: any) => res.data)
}

/**
 * 手动触发保活任务
 */
export const triggerKeepAlive = (platform: string): Promise<{
  status: string
  logTitle: string
  duration: number
}> => {
  return request.post(`/keepalive/trigger/${platform}`).then((res: any) => {
    // 后端返回格式: {code: 200, message: "...", data: {status, logTitle, duration}}
    return res?.data || {}
  })
}

/**
 * 获取保活日志列表
 */
export const getLogs = (limit = 100, offset = 0, platform?: string): Promise<SystemLog[]> => {
  const params: any = { limit, offset }
  if (platform) {
    params.platform = platform
  }
  return request.get('/keepalive/logs', { params }).then((res: any) => {
    // 后端返回格式: {code: 200, message: "success", data: [...]}
    // 响应拦截器返回整个response对象，所以这里需要访问res.data
    return res?.data || []
  })
}

/**
 * 获取统计信息
 */
export const getStats = (): Promise<KeepAliveStats> => {
  return request.get('/keepalive/stats').then((res: any) => {
    // 后端返回格式: {code: 200, message: "success", data: {...}}
    return res?.data || {}
  })
}

/**
 * 获取平台状态概览
 */
export const getOverview = (): Promise<PlatformOverview> => {
  return request.get('/keepalive/overview').then((res: any) => {
    // 后端返回格式: {code: 200, message: "success", data: {...}}
    return res?.data || {}
  })
}
