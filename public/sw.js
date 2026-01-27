// Service Worker for PersonalTool PWA
// Cache Strategy: Cache First for static assets, Network First for API

const CACHE_NAME = 'personal-tool-v1'
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
]

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell')
        return cache.addAll(URLS_TO_CACHE)
      })
      .then(() => {
        console.log('[SW] Installation complete')
        // 强制激活新的Service Worker
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error)
      })
  )
})

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // 删除旧版本的缓存
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Activation complete')
        // 立即控制所有页面
        return self.clients.claim()
      })
  )
})

// 拦截网络请求
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // 对于API请求，使用网络优先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 如果网络请求成功，克隆响应并缓存
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // 网络失败时尝试从缓存读取
          return caches.match(request)
        })
    )
    return
  }

  // 对于静态资源，使用缓存优先策略
  event.respondWith(
    caches.match(request)
      .then(response => {
        // 缓存命中，直接返回
        if (response) {
          console.log('[SW] Cache hit:', request.url)
          return response
        }

        // 缓存未命中，发起网络请求
        return fetch(request)
          .then(response => {
            // 检查是否为有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // 克隆响应并缓存
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache)
            })

            return response
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error)
            // 可以在这里返回自定义的离线页面
            // return caches.match('/offline.html')
          })
      })
  )
})

// 消息处理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
