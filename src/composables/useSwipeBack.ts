import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export function useSwipeBack() {
  const router = useRouter()
  const route = useRoute()

  const touchStartX = ref(0)
  const touchStartY = ref(0)
  const touchEndX = ref(0)
  const touchEndY = ref(0)

  // 最小滑动距离（像素）
  const MIN_SWIPE_DISTANCE = 50

  // 处理触摸开始
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.changedTouches[0].screenX
    touchStartY.value = e.changedTouches[0].screenY
  }

  // 处理触摸结束
  const handleTouchEnd = (e: TouchEvent) => {
    touchEndX.value = e.changedTouches[0].screenX
    touchEndY.value = e.changedTouches[0].screenY

    handleSwipeGesture()
  }

  // 处理滑动手势
  const handleSwipeGesture = () => {
    const deltaX = touchEndX.value - touchStartX.value
    const deltaY = touchEndY.value - touchStartY.value

    // 判断是否是水平滑动（水平移动距离大于垂直移动距离）
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)

    if (isHorizontalSwipe && Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
      // 左滑：向左滑动，deltaX < 0
      if (deltaX < 0) {
        handleSwipeLeft()
      }
    }
  }

  // 处理左滑动作
  const handleSwipeLeft = () => {
    // 在移动端底部Tab主导航页面，左滑不做任何事
    const showMainNav = route.query['show-main-nav'] === 'true'
    if (showMainNav || route.path === '/') {
      return
    }

    // 登录页面不允许滑动返回
    if (route.path === '/login') {
      return
    }

    // 获取当前路径
    const currentPath = route.path

    // 判断当前是否在某个模块的入口页面
    const mainPaths = ['/tools/json', '/stock/overview', '/accounting', '/blog/list', '/knowledge/list']

    if (mainPaths.includes(currentPath)) {
      // 在模块入口页面，返回到主导航
      router.push('/?show-main-nav=true')
      return
    }

    // 股票模块子页面
    if (currentPath.startsWith('/stock') && currentPath !== '/stock/overview') {
      router.push('/stock/overview')
      return
    }

    // 博客模块子页面
    if (currentPath.startsWith('/blog') && currentPath !== '/blog/list') {
      router.push('/blog/list')
      return
    }

    // 知识库模块子页面
    if (currentPath.startsWith('/knowledge') && currentPath !== '/knowledge/list') {
      router.push('/knowledge/list')
      return
    }

    // 工具模块子页面
    if (currentPath.startsWith('/tools') && currentPath !== '/tools/json') {
      router.push('/tools/json')
      return
    }

    // 其他情况使用浏览器的后退
    router.back()
  }

  // 启用滑动手势
  const enableSwipeBack = () => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  // 禁用滑动手势
  const disableSwipeBack = () => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  onMounted(() => {
    // 只在移动端启用
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      enableSwipeBack()
    }
  })

  onUnmounted(() => {
    disableSwipeBack()
  })

  return {
    enableSwipeBack,
    disableSwipeBack
  }
}
