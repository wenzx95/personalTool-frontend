import request from './request'

// 通用用户数据接口
export interface UserData {
  id: number
  name: string
  data: any
  remarks?: string
  sort?: number
  status?: number
  createTime: string
  updateTime: string
}

// 查询参数
export interface UserDataQuery {
  moduleCode: string
  page?: number
  size?: number
}

// 新增/更新请求参数
export interface UserDataRequest {
  name: string
  data: any
  remarks?: string
  sort?: number
  status?: number
}

// 获取模块下的数据列表
export const getUserDataList = (moduleCode: string): Promise<UserData[]> => {
  return request.get(`/user-data/list/${moduleCode}`)
}

// 获取单个数据详情
export const getUserDataById = (id: number): Promise<UserData> => {
  return request.get(`/user-data/${id}`)
}

// 保存数据
export const saveUserData = (data: UserDataRequest): Promise<UserData> => {
  return request.post('/user-data', data)
}

// 更新数据
export const updateUserData = (id: number, data: Partial<UserDataRequest>): Promise<UserData> => {
  return request.put(`/user-data/${id}`, data)
}

// 删除数据
export const deleteUserData = (id: number): Promise<void> => {
  return request.delete(`/user-data/${id}`)
}
