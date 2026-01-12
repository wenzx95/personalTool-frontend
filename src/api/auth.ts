import request from './request'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    nickname: string
    avatar?: string
    email?: string
    phone?: string
    gender?: number
    status: number
    sort?: number
    remark?: string
    createdAt: string
    updatedAt: string
  }
}

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  gender?: number
  status: number
  sort?: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  gender?: number
  status: number
  sort?: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface UserCreateRequest {
  username: string
  password: string
  nickname: string
  email?: string
  phone?: string
  gender?: number
  status?: number
  sort?: number
  remark?: string
}

export interface UserUpdateRequest {
  nickname?: string
  email?: string
  phone?: string
  gender?: number
  status?: number
  sort?: number
  remark?: string
}

/**
 * User login
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await request.post<LoginResponse>('/auth/login', {
    username,
    password
  })
  return response as LoginResponse
}

/**
 * Get current user info
 */
export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await request.get<UserInfo>('/auth/profile')
  return response.data
}

/**
 * User logout
 */
export const logout = async (): Promise<void> => {
  await request.post('/auth/logout')
}

/**
 * Get user list
 */
export const getUserList = async (params?: { page?: number; size?: number; search?: string }): Promise<any> => {
  console.log('[API] 获取用户列表，参数:', params)
  const response = await request.get('/auth/users', { params })
  console.log('[API] 获取用户列表成功，响应:', response)
  console.log('[API] 响应类型:', typeof response)
  console.log('[API] 是否为数组:', Array.isArray(response))
  if (Array.isArray(response)) {
    console.log('[API] 数组长度:', response.length)
    response.forEach((user, index) => {
      console.log(`[API] 用户[${index}]:`, user)
    })
  }
  return response
}

/**
 * Create user
 */
export const createUser = async (data: UserCreateRequest): Promise<User> => {
  console.log('[API] 创建用户，请求数据:', data)
  const response = await request.post<User>('/auth/users', data)
  console.log('[API] 创建用户成功，响应:', response)
  return response
}

/**
 * Update user
 */
export const updateUser = async (id: string, data: UserUpdateRequest): Promise<User> => {
  return request.put(`/auth/users/${id}`, data)
}

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<void> => {
  return request.delete(`/auth/users/${id}`)
}

/**
 * Reset user password
 */
export const resetPassword = async (id: string, newPassword: string): Promise<void> => {
  return request.put(`/auth/users/${id}/reset-password`, {}, { params: { newPassword } })
}
