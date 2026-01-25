/**
 * 设备类型识别工具
 */

/**
 * 识别当前设备类型
 *
 * @returns 设备类型代码 (web|app|miniprogram|safari-webapp)
 */
export function detectDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase()

  // 微信小程序
  if (ua.includes('miniprogram') || ua.includes('micromessenger')) {
    return 'miniprogram'
  }

  // iOS Safari主屏幕（standalone模式）
  if ((window as any).navigator.standalone === true) {
    return 'safari-webapp'
  }

  // App（通过自定义标识）
  if (ua.includes('personaltool-app') || ua.includes('app')) {
    return 'app'
  }

  // 默认网页端
  return 'web'
}
