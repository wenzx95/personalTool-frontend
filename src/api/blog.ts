import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建博客API请求实例
const blogRequest = axios.create({
  baseURL: '/api',
  timeout: 30000 // 30秒超时
})

// 请求拦截器 - 添加 token
blogRequest.interceptors.request.use(
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

// 响应拦截器 - 处理 Result 格式
blogRequest.interceptors.response.use(
  (response) => {
    const res = response.data
    // 处理 Result 格式: {code, message, data}
    if (res.code === 200) {
      return res.data
    } else {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      ElMessage.error('请先登录')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const currentPath = router.currentRoute.value.path
      if (currentPath !== '/login') {
        router.push({
          path: '/login',
          query: { redirect: currentPath }
        })
      }
      return Promise.reject(error)
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      ElMessage.error('访问被拒绝，请先登录')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const currentPath = router.currentRoute.value.path
      if (currentPath !== '/login') {
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

// ==================== 类型定义 ====================

export interface Blog {
  id?: number
  title: string
  content: string
  summary?: string
  coverImage?: string
  category?: string
  tags: string[]
  status: 'draft' | 'published'
  authorId?: number
  authorName?: string
  viewCount?: number
  isTop?: number
  isRecommended?: number
  createTime?: string
  updateTime?: string
  publishTime?: string
}

export interface BlogCreateRequest {
  title: string
  content: string
  summary?: string
  coverImage?: string
  category?: string
  tags?: string[]
  isTop?: number
  isRecommended?: number
}

export interface BlogUpdateRequest {
  title?: string
  content?: string
  summary?: string
  coverImage?: string
  category?: string
  tags?: string[]
  status?: 'draft' | 'published'
  isTop?: number
  isRecommended?: number
}

export interface BlogQueryParams {
  keyword?: string
  category?: string
  tag?: string
  status?: string
  isTop?: number
  isRecommended?: number
  pageNum?: number
  pageSize?: number
  orderBy?: 'createTime' | 'viewCount' | 'publishTime'
  orderDirection?: 'asc' | 'desc'
}

export interface PageResult<T> {
  items: T[]
  total: number
  pageNum: number
  pageSize: number
  totalPages: number
}

// ==================== API接口 ====================

/**
 * 创建博客
 */
export const createBlog = (data: BlogCreateRequest): Promise<Blog> => {
  return blogRequest({
    url: '/blog',
    method: 'POST',
    data
  })
}

/**
 * 更新博客
 */
export const updateBlog = (id: number, data: BlogUpdateRequest): Promise<Blog> => {
  return blogRequest({
    url: `/blog/${id}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除博客
 */
export const deleteBlog = (id: number): Promise<void> => {
  return blogRequest({
    url: `/blog/${id}`,
    method: 'DELETE'
  })
}

/**
 * 获取博客详情
 */
export const getBlogDetail = (id: number): Promise<Blog> => {
  return blogRequest({
    url: `/blog/${id}`,
    method: 'GET'
  })
}

/**
 * 查询公开博客列表
 */
export const getBlogList = (params: BlogQueryParams): Promise<PageResult<Blog>> => {
  return blogRequest({
    url: '/blog/list',
    method: 'GET',
    params
  })
}

/**
 * 查询我的博客列表
 */
export const getMyBlogs = (params: BlogQueryParams): Promise<PageResult<Blog>> => {
  return blogRequest({
    url: '/blog/my',
    method: 'GET',
    params
  })
}

/**
 * 发布博客
 */
export const publishBlog = (id: number): Promise<void> => {
  return blogRequest({
    url: `/blog/${id}/publish`,
    method: 'POST'
  })
}

/**
 * 取消发布
 */
export const unpublishBlog = (id: number): Promise<void> => {
  return blogRequest({
    url: `/blog/${id}/unpublish`,
    method: 'POST'
  })
}
