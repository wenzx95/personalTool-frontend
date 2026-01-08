import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建专门的市场API请求实例
const marketRequest = axios.create({
  baseURL: '/api',
  timeout: 120000 // 市场数据采集需要较长时间，设置为2分钟
})

// 请求拦截器 - 添加日志
marketRequest.interceptors.request.use(
  (config) => {
    console.log('[API Request]', config.method?.toUpperCase(), config.url, config.params || config.data)
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 添加日志
marketRequest.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.config.url, 'status:', response.status, 'data:', response.data)
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else {
      console.error('[API Error]', res.message)
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    console.error('[API Network Error]', error.config?.url, error.message, error)
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export interface MarketReviewData {
  id?: number
  date: string
  volume: number
  red_count: number
  green_count: number
  limit_up_count: number
  limit_down_count: number
  zt_count: number
  zt_rate: number
  total_continuous_limit: number
  continuous_limit_rate: number
  four_plus_count: number
  four_plus_stocks: Array<{ code: string; name: string }>
  two_board_count: number
  three_board_count: number
  three_board_stocks: Array<{ code: string; name: string }>
  total_stocks: number
  hot_sectors: string[]
  notes: string
  created_at?: string
  updated_at?: string
  // 新增情绪监控字段
  red_rate: number
  market_strength: string
  max_continuous_days: number
  first_board_count: number
  three_board_stocks_with_sector: Array<{ name: string; sector: string }>
  four_plus_stocks_with_sector: Array<{ name: string; sector: string }>
}

export interface CreateReviewRequest {
  date: string // YYYY-MM-DD格式
  hot_sectors?: string[]
  notes?: string
}

export interface UpdateReviewRequest {
  hot_sectors?: string[]
  notes?: string
}

// 获取实时市场数据（不保存）
export const getMarketReview = (tradeDate?: string, sessionId?: string): Promise<MarketReviewData> => {
  const params: any = {}
  if (tradeDate) {
    params.tradeDate = tradeDate
  }
  if (sessionId) {
    params.sessionId = sessionId
  }
  return marketRequest({
    url: '/v1/market/review',
    method: 'GET',
    params
  })
}

// 获取复盘记录列表
export const getReviewList = (limit = 100, offset = 0): Promise<MarketReviewData[]> => {
  return marketRequest({
    url: '/v1/market/review/list',
    method: 'GET',
    params: { limit, offset }
  })
}

// 获取指定日期的复盘记录
export const getReviewDetail = (date: string): Promise<MarketReviewData> => {
  return marketRequest({
    url: `/v1/market/review/detail/${date}`,
    method: 'GET'
  })
}

// 创建复盘记录
export const createReview = (data: CreateReviewRequest, sessionId?: string): Promise<MarketReviewData> => {
  const params = sessionId ? { sessionId } : {}
  return marketRequest({
    url: '/v1/market/review/create',
    method: 'POST',
    params,
    data
  })
}

// 更新复盘记录
export const updateReview = (reviewId: number, data: UpdateReviewRequest): Promise<MarketReviewData> => {
  return marketRequest({
    url: `/v1/market/review/update/${reviewId}`,
    method: 'PUT',
    data
  })
}

// 删除复盘记录
export const deleteReview = (reviewId: number): Promise<void> => {
  return marketRequest({
    url: `/v1/market/review/delete/${reviewId}`,
    method: 'DELETE'
  })
}
