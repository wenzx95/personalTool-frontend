/**
 * 菜单管理API
 */
import request from './request'

export interface MenuDTO {
  id?: number
  parentId: number
  name: string
  path?: string
  component?: string
  icon?: string
  deviceTypes?: string[]  // 设备类型列表
  sort: number
  isPublic?: number
  status?: number
  children?: MenuDTO[]
}

/**
 * 获取菜单列表（树形结构）
 */
export const getMenuList = (): Promise<MenuDTO[]> => {
  return request.get('/menus')
}

/**
 * 获取用户菜单（支持设备类型过滤）
 *
 * @param deviceType 设备类型（可选，不传时后端自动识别）
 */
export const getUserMenus = async (deviceType?: string): Promise<MenuDTO[]> => {
  const params = deviceType ? { deviceType } : {}
  return request.get('/menus/user', { params })
}

/**
 * 添加菜单
 */
export const addMenu = (data: MenuDTO): Promise<void> => {
  return request.post('/menus', data)
}

/**
 * 更新菜单
 */
export const updateMenu = (id: number, data: MenuDTO): Promise<void> => {
  return request.put(`/menus/${id}`, data)
}

/**
 * 删除菜单
 */
export const deleteMenu = (id: number): Promise<void> => {
  return request.delete(`/menus/${id}`)
}
