/**
 * 设备类型定义
 */

export interface DeviceTypeOption {
  value: string
  label: string
  color: string  // 用于显示不同颜色的标签
}

/**
 * 设备类型选项
 */
export const DEVICE_TYPE_OPTIONS: DeviceTypeOption[] = [
  { value: 'web', label: '网页端', color: 'primary' },
  { value: 'app', label: '移动应用', color: 'success' },
  { value: 'miniprogram', label: '小程序', color: 'warning' },
  { value: 'safari-webapp', label: 'Safari主屏幕', color: 'info' }
]

/**
 * 根据设备类型获取显示标签
 */
export function getDeviceTypeLabel(code: string): string {
  const option = DEVICE_TYPE_OPTIONS.find(opt => opt.value === code)
  return option?.label || code
}

/**
 * 根据设备类型获取颜色
 */
export function getDeviceTypeColor(code: string): string {
  const option = DEVICE_TYPE_OPTIONS.find(opt => opt.value === code)
  return option?.color || 'default'
}
