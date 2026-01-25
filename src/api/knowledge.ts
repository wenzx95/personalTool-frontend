import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建知识库API请求实例
const knowledgeRequest = axios.create({
  baseURL: '/api',
  timeout: 30000 // 30秒超时
})

// 请求拦截器 - 添加 token
knowledgeRequest.interceptors.request.use(
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
knowledgeRequest.interceptors.response.use(
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

/**
 * 知识库
 */
export interface KnowledgeBase {
  id?: number
  title: string
  description?: string
  coverImage?: string
  category?: string
  tags: string[]
  isPublic: number
  authorId?: number
  authorName?: string
  totalChapters?: number
  totalWords?: number
  viewCount?: number
  sortOrder?: number
  createTime?: string
  updateTime?: string
  chapters?: ChapterTree[]
}

/**
 * 创建知识库请求
 */
export interface KnowledgeBaseCreateRequest {
  title: string
  description?: string
  coverImage?: string
  category?: string
  tags?: string[]
  isPublic?: number
  sortOrder?: number
}

/**
 * 更新知识库请求
 */
export interface KnowledgeBaseUpdateRequest {
  title?: string
  description?: string
  coverImage?: string
  category?: string
  tags?: string[]
  isPublic?: number
  sortOrder?: number
}

/**
 * 查询知识库参数
 */
export interface KnowledgeBaseQueryParams {
  keyword?: string
  category?: string
  tag?: string
  isPublic?: number
  sortBy?: 'createTime' | 'updateTime' | 'viewCount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

/**
 * 章节树节点
 */
export interface ChapterTree {
  id: number
  parentId: number
  title: string
  content?: string
  contentType?: 'markdown' | 'reference'
  blogId?: number
  blogTitle?: string
  sortOrder: number
  level: number
  wordCount?: number
  children?: ChapterTree[]
  hasChildren?: boolean
}

/**
 * 章节
 */
export interface Chapter {
  id?: number
  kbId?: number
  parentId?: number
  title: string
  content?: string
  contentType?: 'markdown' | 'reference'
  blogId?: number
  blogTitle?: string
  sortOrder?: number
  level?: number
  path?: string
  wordCount?: number
  createTime?: string
  updateTime?: string
}

/**
 * 创建章节请求
 */
export interface ChapterCreateRequest {
  parentId?: number
  title: string
  content?: string
  contentType?: 'markdown' | 'reference'
  blogId?: number
  sortOrder?: number
}

/**
 * 更新章节请求
 */
export interface ChapterUpdateRequest {
  title?: string
  content?: string
  contentType?: 'markdown' | 'reference'
  blogId?: number
  sortOrder?: number
}

/**
 * 移动章节请求
 */
export interface MoveChapterRequest {
  newParentId: number
  newOrder: number
}

/**
 * 移动章节请求（后端字段名）
 */
export interface MoveChapterRequestBackend {
  newParentId: number
  newOrder: number
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// ==================== 知识库 API 接口 ====================

/**
 * 创建知识库
 */
export const createKnowledgeBase = (data: KnowledgeBaseCreateRequest): Promise<KnowledgeBase> => {
  return knowledgeRequest({
    url: '/knowledge-base',
    method: 'POST',
    data
  })
}

/**
 * 更新知识库
 */
export const updateKnowledgeBase = (id: number, data: KnowledgeBaseUpdateRequest): Promise<KnowledgeBase> => {
  return knowledgeRequest({
    url: `/knowledge-base/${id}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除知识库
 */
export const deleteKnowledgeBase = (id: number): Promise<void> => {
  return knowledgeRequest({
    url: `/knowledge-base/${id}`,
    method: 'DELETE'
  })
}

/**
 * 获取知识库详情
 */
export const getKnowledgeBaseDetail = (id: number): Promise<KnowledgeBase> => {
  return knowledgeRequest({
    url: `/knowledge-base/${id}`,
    method: 'GET'
  })
}

/**
 * 查询公开知识库列表
 */
export const getKnowledgeBaseList = (params: KnowledgeBaseQueryParams): Promise<PageResult<KnowledgeBase>> => {
  return knowledgeRequest({
    url: '/knowledge-base/list',
    method: 'GET',
    params
  })
}

/**
 * 查询我的知识库列表
 */
export const getMyKnowledgeBases = (params: KnowledgeBaseQueryParams): Promise<PageResult<KnowledgeBase>> => {
  return knowledgeRequest({
    url: '/knowledge-base/my',
    method: 'GET',
    params
  })
}

/**
 * 切换公开/私有状态
 */
export const toggleKnowledgeBasePublic = (id: number): Promise<void> => {
  return knowledgeRequest({
    url: `/knowledge-base/${id}/toggle-public`,
    method: 'POST'
  })
}

// ==================== 章节 API 接口 ====================

/**
 * 创建章节
 */
export const createChapter = (kbId: number, data: ChapterCreateRequest): Promise<Chapter> => {
  return knowledgeRequest({
    url: `/knowledge-base/${kbId}/chapters`,
    method: 'POST',
    data
  })
}

/**
 * 更新章节
 */
export const updateChapter = (kbId: number, chapterId: number, data: ChapterUpdateRequest): Promise<Chapter> => {
  return knowledgeRequest({
    url: `/knowledge-base/${kbId}/chapters/${chapterId}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除章节
 */
export const deleteChapter = (kbId: number, chapterId: number): Promise<void> => {
  return knowledgeRequest({
    url: `/knowledge-base/${kbId}/chapters/${chapterId}`,
    method: 'DELETE'
  })
}

/**
 * 获取章节详情
 */
export const getChapterDetail = (kbId: number, chapterId: number): Promise<Chapter> => {
  return knowledgeRequest({
    url: `/knowledge-base/${kbId}/chapters/${chapterId}`,
    method: 'GET'
  })
}

/**
 * 获取章节树
 */
export const getChapterTree = (kbId: number): Promise<ChapterTree[]> => {
  return knowledgeRequest({
    url: `/knowledge-base/${kbId}/chapters/tree`,
    method: 'GET'
  })
}

/**
 * 获取章节路径（面包屑）
 */
export const getChapterPath = (kbId: number, chapterId: number): Promise<Chapter[]> => {
  return knowledgeRequest({
    url: `/knowledge-base/${kbId}/chapters/${chapterId}/path`,
    method: 'GET'
  })
}

/**
 * 移动章节（拖拽排序）
 */
export const moveChapter = (kbId: number, chapterId: number, data: MoveChapterRequestBackend): Promise<void> => {
  return knowledgeRequest({
    url: `/knowledge-base/${kbId}/chapters/${chapterId}/move`,
    method: 'POST',
    data
  })
}

// ==================== 导入 API 接口 ====================

/**
 * 导入结果
 */
export interface ImportResult {
  kbId: number
  kbTitle: string
  successCount: number
  failureCount: number
  failedFiles?: string[]
  duration: number
}

/**
 * 从ZIP文件导入知识库
 */
export const importFromZip = (data: {
  file: File
  kbId?: number
  newKbTitle?: string
  newKbDescription?: string
  category?: string
  tags?: string
}): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', data.file)
  if (data.kbId) formData.append('kbId', data.kbId.toString())
  if (data.newKbTitle) formData.append('newKbTitle', data.newKbTitle)
  if (data.newKbDescription) formData.append('newKbDescription', data.newKbDescription)
  if (data.category) formData.append('category', data.category)
  if (data.tags) formData.append('tags', data.tags)

  return knowledgeRequest({
    url: '/knowledge-base/import/zip',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 300000 // 5分钟超时
  })
}

/**
 * 从Markdown文件导入知识库
 */
export const importFromMarkdown = (data: {
  file: File
  kbId?: number
  newKbTitle?: string
  content?: string
}): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', data.file)
  if (data.kbId) formData.append('kbId', data.kbId.toString())
  if (data.newKbTitle) formData.append('newKbTitle', data.newKbTitle)
  if (data.content) formData.append('content', data.content)

  return knowledgeRequest({
    url: '/knowledge-base/import/markdown',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000
  })
}

/**
 * 从语雀URL导入知识库
 */
export const importFromUrl = (data: {
  url: string
  kbId?: number
  newKbTitle?: string
}): Promise<ImportResult> => {
  return knowledgeRequest({
    url: '/knowledge-base/import/url',
    method: 'POST',
    data,
    timeout: 60000
  })
}
