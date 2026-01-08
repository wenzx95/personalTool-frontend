import axios from 'axios'
import { ElMessage } from 'element-plus'

// AI API请求实例
const aiRequest = axios.create({
  baseURL: '/api',
  timeout: 120000 // AI分析可能需要较长时间
})

// 请求拦截器
aiRequest.interceptors.request.use(
  (config) => {
    console.log('[AI API Request]', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('[AI API Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
aiRequest.interceptors.response.use(
  (response) => {
    console.log('[AI API Response]', response.config.url, 'status:', response.status)
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else {
      console.error('[AI API Error]', res.message)
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    console.error('[AI API Network Error]', error.config?.url, error.message)
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

/**
 * AI分析市场数据
 * @param tradeDate 交易日期，格式：YYYYMMDD
 */
export const analyzeMarket = (tradeDate: string): Promise<string> => {
  return aiRequest({
    url: '/v1/market/ai/analyze',
    method: 'POST',
    params: { tradeDate }
  })
}

/**
 * 生成市场总结
 * @param tradeDate 交易日期，格式：YYYYMMDD
 */
export const summarizeMarket = (tradeDate: string): Promise<string> => {
  return aiRequest({
    url: '/v1/market/ai/summarize',
    method: 'POST',
    params: { tradeDate }
  })
}

/**
 * 预测次日走势
 * @param tradeDate 交易日期，格式：YYYYMMDD
 */
export const predictNextDay = (tradeDate: string): Promise<string> => {
  return aiRequest({
    url: '/v1/market/ai/predict',
    method: 'POST',
    params: { tradeDate }
  })
}
