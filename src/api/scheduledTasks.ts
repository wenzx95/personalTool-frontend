import request from './request'

/**
 * 定时任务定义
 */
export interface ScheduledTask {
  id: number
  taskCode: string
  taskName: string
  taskType: string
  description: string
  cronExpression: string
  enabled: number
  executorClass?: string
  executorMethod?: string
  executorParams?: string
  configCategory?: string
  platformCode?: string
  totalExecutions: number
  successExecutions: number
  failedExecutions: number
  lastExecutionTime?: string
  lastExecutionStatus?: string
  createdAt: string
  updatedAt: string
}

/**
 * 任务统计信息
 */
export interface TaskStats {
  totalTasks: number
  enabledTasks: number
  todayTotal: number
  successRate: string
  totalSuccess: number
  totalFailed: number
  byType: Record<string, number>
}

/**
 * 获取所有任务列表
 */
export const getAllTasks = (): Promise<ScheduledTask[]> => {
  return request.get('/scheduled-tasks').then((res: any) => {
    // 后端返回: {code: 200, message: "success", data: [...]}
    // 响应拦截器返回: response.data
    return res?.data || []
  })
}

/**
 * 获取任务统计信息
 */
export const getTaskStats = (): Promise<TaskStats> => {
  return request.get('/scheduled-tasks/stats').then((res: any) => {
    // 后端返回: {code: 200, message: "success", data: {...}}
    // 响应拦截器返回: response.data
    return res?.data || {
      totalTasks: 0,
      enabledTasks: 0,
      todayTotal: 0,
      successRate: '0',
      totalSuccess: 0,
      totalFailed: 0,
      byType: {}
    }
  })
}

/**
 * 根据任务代码获取任务详情
 */
export const getTaskByCode = (taskCode: string): Promise<ScheduledTask> => {
  return request.get(`/scheduled-tasks/${taskCode}`) as unknown as Promise<ScheduledTask>
}

/**
 * 根据任务类型获取任务列表
 */
export const getTasksByType = (taskType: string): Promise<ScheduledTask[]> => {
  return request.get(`/scheduled-tasks/type/${taskType}`) as unknown as Promise<ScheduledTask[]>
}

/**
 * 根据平台代码获取任务列表
 */
export const getTasksByPlatform = (platformCode: string): Promise<ScheduledTask[]> => {
  return request.get(`/scheduled-tasks/platform/${platformCode}`) as unknown as Promise<ScheduledTask[]>
}

/**
 * 切换任务启用状态
 */
export const toggleTask = (taskCode: string, enabled: boolean): Promise<void> => {
  return request.put(`/scheduled-tasks/${taskCode}/toggle`, { enabled }) as unknown as Promise<void>
}

/**
 * 手动触发任务执行
 */
export const triggerTask = (taskCode: string): Promise<{
  code: number
  message: string
  data?: {
    taskCode: string
    platformCode: string
    status: string
    logTitle: string
    duration: number
  }
}> => {
  return request.post(`/scheduled-tasks/${taskCode}/trigger`).then((res: any) => res.data)
}

/**
 * 更新任务配置
 */
export const updateTask = (taskCode: string, task: Partial<ScheduledTask>): Promise<{
  code: number
  message: string
  data?: ScheduledTask
}> => {
  return request.put(`/scheduled-tasks/${taskCode}`, task).then((res: any) => res.data)
}

/**
 * 创建新任务
 */
export const createTask = (task: Partial<ScheduledTask>): Promise<{
  code: number
  message: string
  data?: ScheduledTask
}> => {
  return request.post('/scheduled-tasks', task).then((res: any) => res.data)
}

/**
 * 删除任务
 */
export const deleteTask = (taskCode: string): Promise<{
  code: number
  message: string
  data?: { taskCode: string }
}> => {
  return request.delete(`/scheduled-tasks/${taskCode}`).then((res: any) => res.data)
}
